from fastapi_mail import FastMail, MessageSchema
from src.control.voice_assistance.config import conf

async def _send_confirmation_email(to_email: str, body: str) -> None:
    message = MessageSchema(
        subject="Your Appointment is Confirmed",
        recipients=[to_email],
        body=body,
        subtype="plain",
    )
    fm = FastMail(conf)
    await fm.send_message(message)


def _build_email_body(state: dict) -> str:
    doctor_name  = state.get("confirmed_doctor_name", "your doctor")
    slot_display = state.get("booked_slot_display", "the scheduled time")

    reason       = state.get("reason_for_visit")
    instructions = state.get("instructions")
    patient_name = state.get("user_name", "Patient")
    
    lines = [
        f"Dear {patient_name},",
        "",
        f"Your appointment has been successfully booked.",
        "",
        f"  Doctor  : {doctor_name}",
        f"  Slot    : {slot_display}",
    ]
    if reason:
        lines.append(f"  Reason  : {reason}")
    if instructions:
        lines.append(f"  Instructions : {instructions}")

    lines += [
        "",
        "Please arrive 10 minutes before your scheduled time.",
        "If you need to cancel, contact us as soon as possible.",
        "",
        "Best regards,",
        "The Appointments Team",
    ]

    return "\n".join(lines)


async def booking_confirmation_node(state: dict) -> dict:

    print("[booking_confirmation_node] -----------------------------")

    # Only run after a successful booking
    if not state.get("booked_slot_id"):
        return state


    patient_id = state.get("patient_id")

    try:
        to_email = state.get("user_email")

        if not to_email:
            print(f"[booking_confirmation_node] No email found for patient_id={patient_id}")
            return state

        body = _build_email_body(state)
        await _send_confirmation_email(to_email, body)
        print(f"[booking_confirmation_node] Confirmation email sent to {to_email}")

    except Exception as e:
        # Don't fail the whole flow if email sending fails
        print(f"[booking_confirmation_node] Failed to send confirmation email: {e}")

    return state