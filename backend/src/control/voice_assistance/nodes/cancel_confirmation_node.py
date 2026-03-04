from fastapi_mail import FastMail, MessageSchema
from src.control.voice_assistance.config import conf


async def _send_cancellation_email(to_email: str, body: str) -> None:
    message = MessageSchema(
        subject="Your Appointment has been Cancelled",
        recipients=[to_email],
        body=body,
        subtype="plain",
    )
    fm = FastMail(conf)
    await fm.send_message(message)


def _build_cancellation_email_body(state: dict) -> str:
    appointment = state.get("appointment_to_cancel", {})

    patient_name   = state.get("user_name", "Patient")
    appointment_type = appointment.get("type_name", "your appointment")
    date           = appointment.get("date", "N/A")
    start_time     = appointment.get("start_time", "N/A")
    end_time       = appointment.get("end_time", "N/A")
    reason         = appointment.get("reason", None)

    lines = [
        f"Dear {patient_name},",
        "",
        "Your appointment has been successfully cancelled.",
        "",
        f"  Appointment Type : {appointment_type}",
        f"  Date             : {date}",
        f"  Time             : {start_time} to {end_time}",
    ]

    if reason and reason != "Not specified":
        lines.append(f"  Reason           : {reason}")

    lines += [
        "",
        "If this was a mistake or you wish to rebook, please contact us.",
        "",
        "Best regards,",
        "The Appointments Team",
    ]

    return "\n".join(lines)


async def cancel_confirmation_node(state: dict) -> dict:

    print("[cancel_confirmation_node] -----------------------------")

    # Only run after a successful cancellation
    if not state.get("cancellation_complete"):
        print("[cancel_confirmation_node] Cancellation not complete, skipping email")
        return state

    # Don't send email if appointment wasn't actually cancelled (user said NO)
    appointment = state.get("appointment_to_cancel")
    if not appointment:
        print("[cancel_confirmation_node] No appointment_to_cancel in state, skipping email")
        return state

    to_email = state.get("user_email")

    if not to_email:
        print(f"[cancel_confirmation_node] No email found in state, skipping")
        return state

    try:
        body = _build_cancellation_email_body(state)
        await _send_cancellation_email(to_email, body)
        print(f"[cancel_confirmation_node] Cancellation email sent to {to_email}")

    except Exception as e:
        print(f"[cancel_confirmation_node] Failed to send cancellation email: {e}")

    return state




    