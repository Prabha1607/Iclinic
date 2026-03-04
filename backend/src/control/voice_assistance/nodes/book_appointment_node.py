import json
from src.data.clients.postgres_client import AsyncSessionLocal
from src.data.repositories.generic_crud import insert_instance
from src.data.models.postgres.appointment import Appointment
from src.data.models.postgres.ENUM import AppointmentStatus, BookingChannel
from src.control.voice_assistance.models import get_llama1
from src.control.voice_assistance.utils import clear_markdown
from src.data.repositories.generic_crud import get_instance_by_any
from src.data.models.postgres.user import User





async def extract_appointment_context(conversation_history: list | str) -> dict:
    llm = get_llama1()

    if isinstance(conversation_history, list):
        lines = []
        for turn in conversation_history:
            if isinstance(turn, dict):
                role = turn.get("role", "unknown").capitalize()
                text = turn.get("content", "")
            elif isinstance(turn, (list, tuple)) and len(turn) == 2:
                role, text = turn[0].capitalize(), turn[1]
            else:
                continue
            lines.append(f"{role}: {text}")
        history_text = "\n".join(lines)
    else:
        history_text = str(conversation_history)

    system_prompt = """
You are a medical appointment assistant. Analyse the conversation below and extract:

1. reason_for_visit  — Why the patient is seeing the doctor (symptoms, concern, condition).
                        Be concise, 1–2 sentences. null if not mentioned.

2. notes             — Any additional clinical details the patient shared:
                        duration of symptoms, severity, medications, allergies, etc.
                        null if nothing relevant was said.

3. instructions      — Any specific instructions or requests made by the patient or
                        implied from context (e.g. "needs wheelchair access",
                        "prefers female doctor", "follow-up visit").
                        null if none.

Reply ONLY with valid JSON — no markdown, no extra text:
{
  "reason_for_visit": "<string or null>",
  "notes":            "<string or null>",
  "instructions":     "<string or null>"
}
""".strip()

    response = await llm.ainvoke([
        ("system", system_prompt),
        ("human",  f"Conversation:\n{history_text}"),
    ])

    try:
        return json.loads(clear_markdown(response.content.strip()))
    except Exception:
        return {"reason_for_visit": None, "notes": None, "instructions": None}


async def book_appointment_node(state: dict) -> dict:

    print("[book_appointment_node] -----------------------------")

    if state.get("slot_stage") != "ready_to_book":
        return state

    matched     = state.get("selected_slot")
    doctor_id   = state.get("confirmed_doctor_id")
    doctor_name = state.get("confirmed_doctor_name", "the doctor")

    patient_id          = state.get("patient_id")
    appointment_type_id = state.get("appointment_type_id")

    # ── Extract clinical context ONLY from conversation_history ───────────────
    conversation_history = list(state.get("conversation_history") or [])

    context = await extract_appointment_context(conversation_history)
    print(" [ extracted_context ]:", context)

    reason_for_visit = context.get("reason_for_visit")
    notes            = context.get("notes")
    instructions     = context.get("instructions")

    # ── Persist appointment ────────────────────────────────────────────────────
    async with AsyncSessionLocal() as db:
        await insert_instance(
            Appointment,
            db,
            patient_id=patient_id,
            provider_id=doctor_id,
            appointment_type_id=appointment_type_id,
            availability_slot_id=matched["id"],
            scheduled_date=matched["date"],
            scheduled_start_time=matched["start_time"],
            scheduled_end_time=matched["end_time"],
            status=AppointmentStatus.SCHEDULED,
            booking_channel=BookingChannel.VOICE,
            reason_for_visit=reason_for_visit,
            notes=notes,
            instructions=instructions,
            is_active=True,
        )

    confirmation_text = (
        f"Perfect! Your appointment with {doctor_name} is confirmed for "
        f"{matched['full_display']}. You'll receive a confirmation shortly."
    )

    # Append assistant confirmation to conversation_history
    conversation_history.append({
        "role": "assistant",
        "content": confirmation_text
    })

    return {
        **state,
        "booked_slot_id":      matched["id"],
        "booked_slot_display": matched["full_display"],
        "slot_stage":          "done",
        "selected_slot":       None,
        "reason_for_visit":    reason_for_visit,
        "notes":               notes,
        "instructions":        instructions,
        "conversation_history": conversation_history,
        "ai_text": confirmation_text,
    }
