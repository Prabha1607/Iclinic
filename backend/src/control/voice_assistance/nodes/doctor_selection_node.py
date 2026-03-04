# nodes/doctor_selection_node.py

import json
from src.data.clients.postgres_client import AsyncSessionLocal
from src.data.repositories.generic_crud import bulk_get_instance,get_instance_by_id
from src.data.models.postgres.user import User, ProviderProfile
from src.data.models.postgres.appointment_type import AppointmentType
from src.control.voice_assistance.models import get_llama1
from src.control.voice_assistance.utils import clear_markdown


async def fetch_doctors(appointment_type_id) -> list[dict]:

    async with AsyncSessionLocal() as db:

        users = await bulk_get_instance(User, db, role_id = 2, is_active=True,appointment_type_id  = appointment_type_id)
        
        doctor_ids = [u.id for u in users]

        all_profiles = await bulk_get_instance(ProviderProfile, db)
        profile_map = {p.user_id: p for p in all_profiles if p.user_id in doctor_ids}

        return [
            {
                "id": u.id,
                "name": f"Dr. {u.first_name} {u.last_name}",
                "specialization": profile_map[u.id].specialization if u.id in profile_map else "N/A",
                "qualification":  profile_map[u.id].qualification  if u.id in profile_map else "N/A",
                "experience":     profile_map[u.id].experience     if u.id in profile_map else 0,
                "bio":            profile_map[u.id].bio            if u.id in profile_map else "",
            }
            for u in users
        ]


async def doctor_selection_node(state: dict) -> dict:

    print("i came here [doctor_selection_node] -----------------------------")

    if state.get("confirmed_doctor_id"):
        return state

    doctors = await fetch_doctors(state.get("appointment_type_id") or -1)

    if not doctors:
        return {
            **state,
            "ai_text": "I'm sorry, no doctors are currently available. Please try again later.",
        }

    intent = state.get("intent", "general checkup")

    # ── Only one doctor — auto-select, no need to ask ─────────────────────────
    if len(doctors) == 1:
        d = doctors[0]
        return {
            **state,
            "confirmed_doctor_id":    d["id"],
            "confirmed_doctor_name":  d["name"],
            "doctor_selection_pending": False,
            "ai_text": (
                f"You'll be seeing {d['name']}, {d['specialization']} "
                f"with {d['experience']} years of experience. "
                "Let me now finalize your appointment."
            ),
        }

    # ── Multiple doctors — first pass: present list ────────────────────────────
    doctor_list_lines = "\n".join(
        f"{i+1}. {d['name']} — {d['specialization']}, {d['experience']} years experience, {d['qualification']}"
        for i, d in enumerate(doctors)
    )

    if state.get("doctor_selection_pending") is None:
        return {
            **state,
            "doctor_selection_pending": True,
            "doctors_list": doctors,
            "ai_text": (
                f"Based on your {intent.replace('_', ' ')} concern, here are our available doctors:\n"
                f"{doctor_list_lines}\n"
                "Which doctor would you prefer? You can say their name or number."
            ),
        }

    # ── Multiple doctors — second pass: user responded, LLM matches ───────────
    user_text: str = state.get("user_text", "").strip()

    doctors_context = "\n".join(
        f"{i+1}. id={d['id']} name={d['name']} specialization={d['specialization']} experience={d['experience']}yrs"
        for i, d in enumerate(doctors)
    )

    llm = get_llama1()
    response = await llm.ainvoke([
        (
            "system",
            (
                "You are a medical scheduling assistant. "
                "Match the user's response to the correct doctor from the list. "
                'Reply ONLY with valid JSON: {"doctor_id": <int>, "doctor_name": "<string>"} '
                "If unclear, pick the doctor whose specialization best fits the patient intent."
            ),
        ),
        (
            "human",
            f"Doctors:\n{doctors_context}\n\nPatient intent: {intent}\nPatient said: {user_text}\n\nPick the best match.",
        ),
    ])

    try:
        parsed = json.loads(clear_markdown(response.content.strip()))
        doctor_id   = int(parsed["doctor_id"])
        doctor_name = str(parsed["doctor_name"])
    except Exception:
        doctor_id   = doctors[0]["id"]
        doctor_name = doctors[0]["name"]

    print(f"Doctor selected by LLM: id={doctor_id}, name={doctor_name}")

    return {
        **state,
        "confirmed_doctor_id":    doctor_id,
        "confirmed_doctor_name":  doctor_name,
        "doctor_selection_pending": False,
        "ai_text": (
            f"Great! I've noted {doctor_name} as your doctor. "
            "Let me now finalize your appointment."
        ),
    }