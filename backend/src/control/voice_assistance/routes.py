def route_after_stt(state: dict) -> str:

    if not state.get("service_type"):
        return "service_intent"

    if state.get("service_type") == "booking":
        if not state.get("confirmation_done"):
            return "identity_confirmation"
        return "clarify"

    if state.get("service_type") == "cancellation":
        return "cancel_appointment"

    return "service_intent"


def route_after_identity_confirmation(state: dict) -> str:
    
    if not state.get("confirmation_done"):
        return "tts"
    if not state.get("confirmed_user"):
        return "tts"
    if state.get("speak_final"):
        return "tts"
    return "clarify"


def route_after_service_intent(state: dict) -> str:

    service = state.get("service_type")

    if service == "booking":
        return "identity_confirmation"

    if service == "cancellation":
        return "cancel_appointment"

    return "tts"


def route_after_clarify(state: dict) -> str:
    
    if state.get("emergency"):
        return "tts"
    if not state.get("clarify_done"):
        return "tts"
    return "mapping"


def route_after_doctor_selection(state: dict) -> str:
    
    if state.get("confirmed_doctor_id"):
        return "slot_selection"
    return "tts"

def route_after_slot_selection(state: dict) -> str:
    
    if state.get("slot_stage") == "ready_to_book":
        return "book_appointment"
    return "tts"

