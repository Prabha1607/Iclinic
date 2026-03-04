import json
from src.data.clients.postgres_client import AsyncSessionLocal
from src.data.repositories.generic_crud import bulk_get_instance
from src.data.models.postgres.user import User, ProviderProfile
from src.control.voice_assistance.models import get_llama1
from src.control.voice_assistance.utils import clear_markdown

NO_DOCTORS_RESPONSE = "I'm sorry, no doctors are currently available. Please try again later."

DOCTOR_MATCH_SYSTEM_PROMPT = (
    "You are a medical scheduling assistant. "
    "Match the user's response to the correct doctor from the list. "
    'Reply ONLY with valid JSON: {"doctor_id": <int>, "doctor_name": "<string>"} '
    "If unclear, pick the doctor whose specialization best fits the patient intent."
)


async def fetch_doctors(appointment_type_id: int) -> list[dict]:
    async with AsyncSessionLocal() as db:
        users = await bulk_get_instance(User, db, role_id=2, is_active=True, appointment_type_id=appointment_type_id)

        doctor_ids = [u.id for u in users]
        all_profiles = await bulk_get_instance(ProviderProfile, db)
        profile_map = {p.user_id: p for p in all_profiles if p.user_id in doctor_ids}

        return [
            {
                "id": u.id,
                "name": f"Dr. {u.first_name} {u.last_name}",
                "specialization": profile_map[u.id].specialization if u.id in profile_map else "N/A",
                "qualification": profile_map[u.id].qualification if u.id in profile_map else "N/A",
                "experience": profile_map[u.id].experience if u.id in profile_map else 0,
                "bio": profile_map[u.id].bio if u.id in profile_map else "",
            }
            for u in users
        ]


def _build_doctor_list_lines(doctors: list[dict]) -> str:
    return "\n".join(
        f"{i+1}. {d['name']} — {d['specialization']}, {d['experience']} years experience, {d['qualification']}"
        for i, d in enumerate(doctors)
    )


def _build_doctors_context(doctors: list[dict]) -> str:
    return "\n".join(
        f"{i+1}. id={d['id']} name={d['name']} specialization={d['specialization']} experience={d['experience']}yrs"
        for i, d in enumerate(doctors)
    )


def _auto_select_state(state: dict, doctor: dict) -> dict:
    return {
        **state,
        "doctor_confirmed_id": doctor["id"],
        "doctor_confirmed_name": doctor["name"],
        "doctor_selection_pending": False,
        "doctor_selection_completed": True,
        "speech_ai_text": (
            f"You'll be seeing {doctor['name']}, {doctor['specialization']} "
            f"with {doctor['experience']} years of experience. "
            "Let me now finalize your appointment."
        ),
    }


def _present_doctors_state(state: dict, doctors: list[dict], intent: str) -> dict:
    doctor_list_lines = _build_doctor_list_lines(doctors)
    return {
        **state,
        "doctor_selection_pending": True,
        "doctor_selection_completed": False,
        "doctor_list": doctors,
        "speech_ai_text": (
            f"Based on your {intent.replace('_', ' ')} concern, here are our available doctors:\n"
            f"{doctor_list_lines}\n"
            "Which doctor would you prefer? You can say their name or number."
        ),
    }


def _confirmed_doctor_state(state: dict, doctor_id: int, doctor_name: str) -> dict:
    return {
        **state,
        "doctor_confirmed_id": doctor_id,
        "doctor_confirmed_name": doctor_name,
        "doctor_selection_completed": True,
        "doctor_selection_pending": False,
        "speech_ai_text": (
            f"Great! I've noted {doctor_name} as your doctor. "
            "Let me now finalize your appointment."
        ),
    }


async def _match_doctor_from_response(
    user_text: str, intent: str, doctors: list[dict]
) -> tuple[int, str]:
    doctors_context = _build_doctors_context(doctors)

    llm = get_llama1()
    response = await llm.ainvoke([
        ("system", DOCTOR_MATCH_SYSTEM_PROMPT),
        ("human", f"Doctors:\n{doctors_context}\n\nPatient intent: {intent}\nPatient said: {user_text}\n\nPick the best match."),
    ])

    try:
        parsed = json.loads(clear_markdown(response.content.strip()))
        return int(parsed["doctor_id"]), str(parsed["doctor_name"])
    except Exception:
        return doctors[0]["id"], doctors[0]["name"]


async def doctor_selection_node(state: dict) -> dict:
    print("[doctor_selection_node] -----------------------------")

    if state.get("doctor_confirmed_id"):
        return {**state, "doctor_selection_completed": True}

    doctors = await fetch_doctors(state.get("mapping_appointment_type_id") or -1)

    if not doctors:
        return {
            **state,
            "doctor_selection_completed": True,
            "speech_ai_text": NO_DOCTORS_RESPONSE,
        }

    intent = state.get("mapping_intent", "general checkup")

    if len(doctors) == 1:
        return _auto_select_state(state, doctors[0])

    if state.get("doctor_selection_pending") is None:
        return _present_doctors_state(state, doctors, intent)

    user_text: str = (state.get("speech_user_text") or "").strip()
    doctor_id, doctor_name = await _match_doctor_from_response(user_text, intent, doctors)

    print(f"[doctor_selection_node] selected doctor: id={doctor_id}, name={doctor_name}")

    return _confirmed_doctor_state(state, doctor_id, doctor_name)


