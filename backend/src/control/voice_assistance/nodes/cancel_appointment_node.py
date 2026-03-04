from datetime import datetime, timezone, date as date_type
from sqlalchemy import select, and_
from src.data.clients.postgres_client import AsyncSessionLocal
from src.data.models.postgres.appointment import Appointment
from src.data.models.postgres.appointment_type import AppointmentType
from src.data.models.postgres.ENUM import AppointmentStatus
from src.control.voice_assistance.models import get_llama1
from src.data.repositories.generic_crud import update_instance


PARSE_DATE_PROMPT = """
You are a medical voice assistant.

Today's date is: {today}

The user said: "{user_text}"

Extract the appointment date they are referring to.
Reply ONLY with the date in YYYY-MM-DD format.
If you cannot determine a valid date, reply: UNKNOWN
"""

SELECT_SLOT_PROMPT = """
You are a medical voice assistant.

The user has the following appointments on {date}:
{slots_list}

The user said: "{user_text}"

Match what the user said to one of the time slots above (by start time, end time, or appointment type).
Reply ONLY with the exact slot index number (e.g. 1, 2, 3...) from the list above.
If you cannot match, reply: UNKNOWN
"""

CONFIRM_PROMPT = """
You are a medical voice assistant.

The user wants to cancel this appointment:
Type   : {appointment_type}
Date   : {date}
Time   : {start_time} to {end_time}
Reason : {reason}

The user said: "{user_text}"

If the user clearly agrees to cancel, reply: YES
If the user declines or is unsure, reply: NO
Reply ONLY YES or NO.
"""


async def cancel_appointment_node(state: dict) -> dict:

    print("[cancel_appointment_node] -----------------------------")

    user_id = state.get("patient_id")
    user_text = state.get("user_text")
    stage = state.get("cancellation_stage")

    print(f"[cancel_appointment_node] user_id={user_id}, stage={stage}, user_text={user_text}")

    # -------------------------------------------
    # STAGE 1 → Ask the user which date
    # -------------------------------------------
    if stage is None:
        print("[cancel_appointment_node] STAGE 1 - asking for date")
        return {
            **state,
            "cancellation_stage": "ask_date",
            "ai_text": "Sure, I can help you cancel an appointment. Which date is the appointment on?",
        }

    # -------------------------------------------
    # STAGE 2 → Parse date, fetch slots on that date
    # -------------------------------------------
    if stage == "ask_date":
        print("[cancel_appointment_node] STAGE 2 - parsing date from user input")

        if not user_text:
            return {
                **state,
                "ai_text": "Please tell me the date of the appointment you want to cancel.",
            }

        try:
            model = get_llama1()
            response = await model.ainvoke([
                ("system", PARSE_DATE_PROMPT.format(
                    today=str(date_type.today()),
                    user_text=user_text,
                )),
                ("human", user_text),
            ])
            parsed_date = response.content.strip()
            print(f"[cancel_appointment_node] Parsed date: '{parsed_date}'")

        except Exception as e:
            print(f"[cancel_appointment_node] LLM ERROR: {type(e).__name__}: {e}")
            return {
                **state,
                "ai_text": "Something went wrong. Please try again.",
                "cancellation_complete": True,
            }

        if parsed_date == "UNKNOWN":
            return {
                **state,
                "ai_text": "I couldn't understand that date. Could you please say it again? For example: March 10th or next Monday.",
            }

        # Validate date format
        try:
            parsed_date_obj = datetime.strptime(parsed_date, "%Y-%m-%d").date()
        except ValueError:
            return {
                **state,
                "ai_text": "I couldn't understand that date. Please say it again.",
            }

        # Fetch appointments on that date
        try:
            async with AsyncSessionLocal() as session:
                stmt = (
                    select(Appointment, AppointmentType.name.label("type_name"))
                    .join(AppointmentType, Appointment.appointment_type_id == AppointmentType.id)
                    .where(
                        and_(
                            Appointment.patient_id == user_id,
                            Appointment.status == AppointmentStatus.SCHEDULED,
                            Appointment.is_active == True,
                            Appointment.scheduled_date == parsed_date_obj,
                        )
                    )
                    .order_by(Appointment.scheduled_start_time.asc())
                )
                result = await session.execute(stmt)
                rows = result.all()
                print(f"[cancel_appointment_node] Appointments on {parsed_date}: {len(rows)}")

        except Exception as e:
            print(f"[cancel_appointment_node] DB ERROR: {type(e).__name__}: {e}")
            return {
                **state,
                "ai_text": "Something went wrong while fetching your appointments. Please try again.",
                "cancellation_complete": True,
            }

        if not rows:
            return {
                **state,
                "ai_text": f"You don't have any scheduled appointments on {parsed_date}. Please try a different date.",
                "cancellation_stage": "ask_date",
            }

        appointments_list = []
        for appointment, type_name in rows:
            appointments_list.append({
                "id": appointment.id,
                "date": str(appointment.scheduled_date),
                "start_time": str(appointment.scheduled_start_time),
                "end_time": str(appointment.scheduled_end_time),
                "reason": appointment.reason_for_visit or "Not specified",
                "type_name": type_name,
            })

        # Only one slot on that date → skip slot selection
        if len(appointments_list) == 1:
            chosen = appointments_list[0]
            reason_line = (
                f"The reason you booked this was: {chosen['reason']}. "
                if chosen["reason"] != "Not specified"
                else ""
            )
            return {
                **state,
                "appointments_list": appointments_list,
                "appointment_to_cancel": chosen,
                "cancellation_stage": "ask_confirm",
                "ai_text": (
                    f"I found your {chosen['type_name']} appointment on {chosen['date']} "
                    f"from {chosen['start_time']} to {chosen['end_time']}. "
                    f"{reason_line}"
                    f"Are you sure you want to cancel this appointment?"
                ),
            }

        # Multiple slots → ask which slot
        spoken_slots = ", ".join([
            f"{i+1}. {a['type_name']} from {a['start_time']} to {a['end_time']}"
            for i, a in enumerate(appointments_list)
        ])

        return {
            **state,
            "appointments_list": appointments_list,
            "selected_date": parsed_date,
            "cancellation_stage": "ask_slot",
            "ai_text": (
                f"You have {len(appointments_list)} appointments on {parsed_date}. "
                f"{spoken_slots}. "
                f"Which time slot would you like to cancel?"
            ),
        }

    # -------------------------------------------
    # STAGE 3 → Match user's chosen slot
    # -------------------------------------------
    if stage == "ask_slot":
        print("[cancel_appointment_node] STAGE 3 - matching slot from user input")

        appointments_list = state.get("appointments_list", [])
        selected_date = state.get("selected_date", "")

        if not user_text:
            return {
                **state,
                "ai_text": "Please say which time slot you would like to cancel.",
            }

        try:
            model = get_llama1()

            slots_text = "\n".join([
                f"{i+1}. {a['type_name']} from {a['start_time']} to {a['end_time']}"
                for i, a in enumerate(appointments_list)
            ])

            response = await model.ainvoke([
                ("system", SELECT_SLOT_PROMPT.format(
                    date=selected_date,
                    slots_list=slots_text,
                    user_text=user_text,
                )),
                ("human", user_text),
            ])

            matched_index = response.content.strip()
            print(f"[cancel_appointment_node] LLM matched slot index: '{matched_index}'")

        except Exception as e:
            print(f"[cancel_appointment_node] LLM ERROR: {type(e).__name__}: {e}")
            return {
                **state,
                "ai_text": "Something went wrong. Please try again.",
                "cancellation_complete": True,
            }

        if matched_index == "UNKNOWN":
            spoken_slots = ", ".join([
                f"{i+1}. {a['start_time']} to {a['end_time']}"
                for i, a in enumerate(appointments_list)
            ])
            return {
                **state,
                "ai_text": f"I could not understand. Please say one of these slots: {spoken_slots}.",
            }

        try:
            slot_num = int(matched_index)
            chosen = appointments_list[slot_num - 1]
        except (ValueError, IndexError):
            return {
                **state,
                "ai_text": "I could not find that slot. Please say the time or number of the appointment you want to cancel.",
            }

        reason_line = (
            f"The reason you booked this was: {chosen['reason']}. "
            if chosen["reason"] != "Not specified"
            else ""
        )

        return {
            **state,
            "appointment_to_cancel": chosen,
            "cancellation_stage": "ask_confirm",
            "ai_text": (
                f"You selected the {chosen['type_name']} appointment "
                f"from {chosen['start_time']} to {chosen['end_time']} on {chosen['date']}. "
                f"{reason_line}"
                f"Are you sure you want to cancel this appointment?"
            ),
        }

    # -------------------------------------------
    # STAGE 4 → Confirm & Cancel
    # -------------------------------------------
    if stage == "ask_confirm":
        print("[cancel_appointment_node] STAGE 4 - confirming cancellation")

        appointment_data = state.get("appointment_to_cancel")

        if not user_text:
            return {
                **state,
                "ai_text": "Please confirm. Do you want to cancel this appointment?",
            }

        try:
            model = get_llama1()
            response = await model.ainvoke([
                ("system", CONFIRM_PROMPT.format(
                    date=appointment_data["date"],
                    start_time=appointment_data["start_time"],
                    end_time=appointment_data["end_time"],
                    appointment_type=appointment_data["type_name"],
                    reason=appointment_data["reason"],
                    user_text=user_text,
                )),
                ("human", user_text),
            ])

            decision = response.content.strip().upper()
            print(f"[cancel_appointment_node] Decision: '{decision}'")

        except Exception as e:
            print(f"[cancel_appointment_node] LLM ERROR: {type(e).__name__}: {e}")
            return {
                **state,
                "ai_text": "Something went wrong. Please try again.",
                "cancellation_complete": True,
            }

        if decision == "YES":
            try:
                async with AsyncSessionLocal() as session:
                    await update_instance(
                        id=appointment_data["id"],
                        model=Appointment,
                        db=session,
                        status=AppointmentStatus.CANCELLED,
                        cancelled_at=datetime.now(timezone.utc),
                        cancellation_reason="Cancelled via voice assistant",
                        is_active=False,
                    )
                print("[cancel_appointment_node] Appointment cancelled in DB")

            except Exception as e:
                print(f"[cancel_appointment_node] DB ERROR: {type(e).__name__}: {e}")
                return {
                    **state,
                    "ai_text": "Something went wrong while cancelling. Please try again.",
                    "cancellation_complete": True,
                }

            return {
                **state,
                "ai_text": (
                    f"Your {appointment_data['type_name']} appointment on {appointment_data['date']} "
                    f"from {appointment_data['start_time']} to {appointment_data['end_time']} "
                    f"has been successfully cancelled."
                ),
                "cancellation_stage": "done",
                "cancellation_complete": True,
            }

        else:
            return {
                **state,
                "ai_text": "Okay, your appointment remains scheduled. Is there anything else I can help you with?",
                "cancellation_stage": "done",
                "cancellation_complete": True,
            }

    print(f"[cancel_appointment_node] WARNING: Unhandled stage='{stage}'")