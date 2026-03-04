from typing import Optional, List, Dict
from typing_extensions import TypedDict


class VoiceState(TypedDict):

    # ── Call metadata ──────────────────────────────────────────────────────────
    to_number:   Optional[str]
    call_sid:    Optional[str]
    user_token:  Optional[str]

    # ── Per-turn speech ────────────────────────────────────────────────────────
    user_text:   Optional[str]
    ai_text:     Optional[str]
    error:       Optional[str]

    # ── User identity ──────────────────────────────────────────────────────────
    user_name:   Optional[str]
    user_email:  Optional[str]
    user_phone:  Optional[str]
    patient_id:  Optional[int]

    # ── Confirmation stage ─────────────────────────────────────────────────────
    confirmation_done:  Optional[bool]
    confirmed_user:     Optional[bool]
    confirm_stage:      Optional[str]
    speak_final:        Optional[bool]
    phone_verified:     Optional[bool]

    # ── Clarify / intake stage ─────────────────────────────────────────────────
    clarify_step:     Optional[int]
    conversation_history: Optional[List[Dict[str, str]]] 
    covered_topics:   Optional[List[str]]
    clarify_done:     Optional[bool]
    symptoms_text:    Optional[str]

    # ── Mapping ────────────────────────────────────────────────────────────────
    intent:               Optional[str]
    emergency:            Optional[bool]
    appointment_type_id:  Optional[int]

    # ── Doctor selection ───────────────────────────────────────────────────────
    doctors_list:             Optional[List[Dict]]
    doctor_selection_pending: Optional[bool]
    confirmed_doctor_id:      Optional[int]
    confirmed_doctor_name:    Optional[str]

    # ── Slot selection ─────────────────────────────────────────────────────────
    slot_stage:            Optional[str]        # None | ask_date | ask_alternate_date | ask_period | ask_slot | ask_alternate_slot | ready_to_book | done
    chosen_date:           Optional[str]        # ISO string "YYYY-MM-DD"
    chosen_period:         Optional[str]        # morning | afternoon | evening | night
    available_slots_list:  Optional[List[Dict]]
    selected_slot:         Optional[Dict]       # matched slot dict passed from slot_selection → book_appointment
    booked_slot_id:        Optional[int]
    booked_slot_display:   Optional[str]

    # ── Appointment context (extracted by LLM in book_appointment_node) ────────
    reason_for_visit:  Optional[str]
    notes:             Optional[str]
    instructions:      Optional[str]

    service_type: Optional[str]  # "Booking" or "Cancellation"


    # ── Cancellation Flow ────────────────────────────────────────────────
    cancellation_stage: Optional[str]   # None | ask_confirm | done
    appointment_to_cancel: Optional[Dict]
    cancellation_complete: Optional[bool]

    appointments_list: Optional[List[Dict]]