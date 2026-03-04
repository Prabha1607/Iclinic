import json
from src.control.voice_assistance.prompts.book_appointment_node_prompt import EXTRACT_CONTEXT_PROMPT, DEFAULT_CONTEXT
from src.data.clients.postgres_client import AsyncSessionLocal
from src.data.repositories.generic_crud import insert_instance
from src.data.models.postgres.appointment import Appointment
from src.data.models.postgres.ENUM import AppointmentStatus, BookingChannel
from src.control.voice_assistance.models import get_llama1
from src.control.voice_assistance.utils import clear_markdown, update_state


def _build_history_text(conversation_history: list | str) -> str:
    if not isinstance(conversation_history, list):
        return str(conversation_history)

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
    return "\n".join(lines)


async def extract_appointment_context(conversation_history: list | str) -> dict:
    history_text = _build_history_text(conversation_history)

    llm = get_llama1()
    response = await llm.ainvoke([
        ("system", EXTRACT_CONTEXT_PROMPT),
        ("human",  f"Conversation:\n{history_text}"),
    ])

    try:
        return json.loads(clear_markdown(response.content.strip()))
    except Exception:
        return DEFAULT_CONTEXT


async def book_appointment_node(state: dict) -> dict:
    print("[book_appointment_node] -----------------------------")

    if state.get("slot_stage") != "ready_to_book":
        return state

    matched     = state.get("selected_slot")
    doctor_id   = state.get("confirmed_doctor_id")
    doctor_name = state.get("confirmed_doctor_name", "the doctor")

    patient_id          = state.get("patient_id")
    appointment_type_id = state.get("appointment_type_id")

    conversation_history = list(state.get("conversation_history") or [])

    context = await extract_appointment_context(conversation_history)
    print("[extracted_context]:", context)

    reason_for_visit = context.get("reason_for_visit")
    notes            = context.get("notes")
    instructions     = context.get("instructions")

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

    conversation_history.append({"role": "assistant", "content": confirmation_text})

    return update_state(
        state,
        booked_slot_id=matched["id"],
        booked_slot_display=matched["full_display"],
        slot_stage="done",
        selected_slot=None,
        reason_for_visit=reason_for_visit,
        notes=notes,
        instructions=instructions,
        conversation_history=conversation_history,
        ai_text=confirmation_text,
    )