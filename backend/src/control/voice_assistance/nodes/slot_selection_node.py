import json
from datetime import time, date
from src.data.clients.postgres_client import AsyncSessionLocal
from src.data.repositories.generic_crud import bulk_get_instance
from src.data.models.postgres.available_slot import AvailableSlot
from src.data.models.postgres.appointment import Appointment
from src.data.models.postgres.ENUM import SlotStatus
from src.control.voice_assistance.models import get_llama1
from src.control.voice_assistance.utils import clear_markdown


# ── Period boundaries ─────────────────────────────────────────────────────────
MORNING_START   = time(6, 0)
MORNING_END     = time(12, 0)
AFTERNOON_START = time(12, 0)
AFTERNOON_END   = time(17, 0)
EVENING_START   = time(17, 0)
EVENING_END     = time(21, 0)


def classify_period(t: time) -> str:
    if MORNING_START <= t < MORNING_END:
        return "morning"
    elif AFTERNOON_START <= t < AFTERNOON_END:
        return "afternoon"
    elif EVENING_START <= t < EVENING_END:
        return "evening"
    return "night"


def fmt_time(t: time) -> str:
    return t.strftime("%I:%M %p").lstrip("0")


def fmt_date(d: date) -> str:
    return d.strftime("%A, %b %d")


# ── DB helpers ────────────────────────────────────────────────────────────────
async def fetch_all_slots(doctor_id: int) -> list[dict]:
    async with AsyncSessionLocal() as db:
        today = date.today()

        all_slots = await bulk_get_instance(
            AvailableSlot, db,
            provider_id=doctor_id,
            is_active=True,
        )

        future_available = [
            s for s in all_slots
            if s.availability_date >= today
            and s.status == SlotStatus.AVAILABLE
        ]

        all_appointments = await bulk_get_instance(
            Appointment, db,
            provider_id=doctor_id,
            is_active=True,
        )
        booked_slot_ids = {
            a.availability_slot_id for a in all_appointments
            if str(a.status.value).upper() in ("SCHEDULED", "CONFIRMED")
        }

        return [
            {
                "id":           s.id,
                "date":         s.availability_date,
                "start_time":   s.start_time,
                "end_time":     s.end_time,
                "period":       classify_period(s.start_time),
                "display":      f"{fmt_time(s.start_time)} → {fmt_time(s.end_time)}",
                "full_display": f"{fmt_time(s.start_time)} → {fmt_time(s.end_time)} on {fmt_date(s.availability_date)}",
            }
            for s in future_available
            if s.id not in booked_slot_ids
        ]


def slots_for_date(all_slots: list[dict], target: date) -> list[dict]:
    return [s for s in all_slots if s["date"] == target]


def alternate_dates(all_slots: list[dict], exclude: date, limit: int = 3) -> list[date]:
    seen = []
    for s in sorted(all_slots, key=lambda x: x["date"]):
        if s["date"] != exclude and s["date"] not in seen:
            seen.append(s["date"])
        if len(seen) >= limit:
            break
    return seen


def periods_on_date(slots: list[dict]) -> dict[str, list]:
    periods: dict[str, list] = {}
    for s in slots:
        periods.setdefault(s["period"], []).append(s)
    return periods


async def llm_extract(system: str, human: str) -> dict:
    llm = get_llama1()
    response = await llm.ainvoke([("system", system), ("human", human)])
    try:
        return json.loads(clear_markdown(response.content.strip()))
    except Exception:
        return {}


async def slot_selection_node(state: dict) -> dict:

    print("i came here [slot_selection_node] -----------------------------")

    if state.get("booked_slot_id"):
        return state

    doctor_id   = state.get("confirmed_doctor_id")
    doctor_name = state.get("confirmed_doctor_name", "the doctor")
    user_text: str = (state.get("user_text") or "").strip()
    slot_stage: str = state.get("slot_stage")

    all_slots: list[dict] = await fetch_all_slots(doctor_id)

    if not all_slots:
        return {
            **state,
            "ai_text": (
                f"I'm sorry, {doctor_name} has no available slots right now. "
                "Please try again later."
            ),
        }

    available_dates = sorted({s["date"] for s in all_slots})

    # ══════════════════════════════════════════════════════════════════════════
    # STAGE 1 — Ask user which date they prefer
    # ══════════════════════════════════════════════════════════════════════════
    if slot_stage is None:
        date_lines = "\n".join(f"  - {fmt_date(d)}" for d in available_dates[:5])
        return {
            **state,
            "slot_stage": "ask_date",
            "ai_text": (
                f"{doctor_name} is available on the following dates:\n{date_lines}\n"
                "Which date would you prefer?"
            ),
        }

    # ══════════════════════════════════════════════════════════════════════════
    # STAGE 2 — User replied with a date; extract and validate
    # ══════════════════════════════════════════════════════════════════════════
    if slot_stage == "ask_date":
        today = date.today()
        date_options = "\n".join(
            f"{fmt_date(d)} -> {d.isoformat()}" for d in available_dates[:5]
        )

        parsed = await llm_extract(
            system=(
                "Extract the date the user wants from their message. "
                f"Today is {today.isoformat()}. "
                f"Available dates:\n{date_options}\n"
                'Reply ONLY with JSON: {"date": "YYYY-MM-DD"} '
                'or {"date": null} if unclear.'
            ),
            human=user_text,
        )

        chosen_date_str = parsed.get("date")
        try:
            chosen_date = date.fromisoformat(chosen_date_str) if chosen_date_str else None
        except Exception:
            chosen_date = None

        date_slots = slots_for_date(all_slots, chosen_date) if chosen_date else []

        if not date_slots:
            alts = alternate_dates(all_slots, chosen_date or today)
            alt_lines = "\n".join(f"  - {fmt_date(d)}" for d in alts)
            return {
                **state,
                "slot_stage": "ask_alternate_date",
                "ai_text": (
                    f"I'm sorry, {doctor_name} is not available"
                    f"{' on ' + fmt_date(chosen_date) if chosen_date else ' on that date'}. "
                    f"The next available dates are:\n{alt_lines}\n"
                    "Would any of these work for you?"
                ),
            }

        return await _proceed_to_period(state, doctor_name, chosen_date, date_slots)

    # ══════════════════════════════════════════════════════════════════════════
    # STAGE 2b — User replied to alternate date suggestion
    # ══════════════════════════════════════════════════════════════════════════
    if slot_stage == "ask_alternate_date":
        today = date.today()
        date_options = "\n".join(
            f"{fmt_date(d)} -> {d.isoformat()}" for d in available_dates[:5]
        )

        parsed = await llm_extract(
            system=(
                "Extract the date the user accepted from their message. "
                f"Today is {today.isoformat()}. "
                f"Available dates:\n{date_options}\n"
                'Reply ONLY with JSON: {"date": "YYYY-MM-DD"} '
                'or {"date": null} if they rejected all options.'
            ),
            human=user_text,
        )

        chosen_date_str = parsed.get("date")
        try:
            chosen_date = date.fromisoformat(chosen_date_str) if chosen_date_str else None
        except Exception:
            chosen_date = None

        date_slots = slots_for_date(all_slots, chosen_date) if chosen_date else []

        if not date_slots:
            all_date_lines = "\n".join(f"  - {fmt_date(d)}" for d in available_dates)
            return {
                **state,
                "slot_stage": "ask_alternate_date",
                "ai_text": (
                    f"No problem. Here are all available dates for {doctor_name}:\n"
                    f"{all_date_lines}\n"
                    "Please choose one that suits you."
                ),
            }

        return await _proceed_to_period(state, doctor_name, chosen_date, date_slots)

    # ══════════════════════════════════════════════════════════════════════════
    # STAGE 3 — User replied with a period
    # ══════════════════════════════════════════════════════════════════════════
    if slot_stage == "ask_period":
        chosen_date: date = state.get("chosen_date")
        date_slots = slots_for_date(all_slots, chosen_date)
        periods = periods_on_date(date_slots)
        available_periods = list(periods.keys())

        parsed = await llm_extract(
            system=(
                "Extract the time period the user chose. "
                f"Available periods: {available_periods}. "
                'Reply ONLY with JSON: {"period": "<morning|afternoon|evening|night>"} '
                'or {"period": null} if unclear.'
            ),
            human=user_text,
        )

        chosen_period = (parsed.get("period") or "").lower()

        if chosen_period not in periods:
            period_lines = "\n".join(f"  - {p}" for p in available_periods)
            return {
                **state,
                "slot_stage": "ask_period",
                "ai_text": (
                    f"I'm sorry, {doctor_name} is not available in the {chosen_period or 'selected'} "
                    f"on {fmt_date(chosen_date)}. "
                    f"Available periods are:\n{period_lines}\n"
                    "Which would you prefer?"
                ),
            }

        period_slots = periods[chosen_period]
        slot_lines   = "\n".join(f"  - {s['display']}" for s in period_slots)

        return {
            **state,
            "slot_stage":           "ask_slot",
            "chosen_period":        chosen_period,
            "available_slots_list": period_slots,
            "ai_text": (
                f"Here are the available {chosen_period} slots on {fmt_date(chosen_date)} "
                f"for {doctor_name}:\n{slot_lines}\n"
                "Which time works best for you?"
            ),
        }

    # ══════════════════════════════════════════════════════════════════════════
    # STAGE 4 — User replied with a time slot
    # ══════════════════════════════════════════════════════════════════════════
    if slot_stage == "ask_slot":
        period_slots: list = state.get("available_slots_list", [])
        slots_context = "\n".join(f"id={s['id']} time={s['display']}" for s in period_slots)

        parsed = await llm_extract(
            system=(
                "Match the user's response to the correct appointment slot. "
                f"Available slots:\n{slots_context}\n"
                'Reply ONLY with JSON: {"slot_id": <int>} '
                'or {"slot_id": null} if user rejected all slots or wants alternatives.'
            ),
            human=user_text,
        )

        slot_id = parsed.get("slot_id")

        if not slot_id:
            chosen_date: date = state.get("chosen_date")
            other_slots = [s for s in all_slots if s["date"] != chosen_date]

            if not other_slots:
                return {
                    **state,
                    "slot_stage": "ask_slot",
                    "ai_text": (
                        f"I'm sorry, there are no other slots available for {doctor_name}. "
                        f"The available times on {fmt_date(chosen_date)} are:\n"
                        + "\n".join(f"  - {s['display']}" for s in period_slots)
                        + "\nWould any of these work?"
                    ),
                }

            alt_date = other_slots[0]["date"]
            alt_date_slots = slots_for_date(all_slots, alt_date)
            alt_lines = "\n".join(f"  - {s['full_display']}" for s in alt_date_slots[:5])

            return {
                **state,
                "slot_stage":           "ask_alternate_slot",
                "available_slots_list": alt_date_slots[:5],
                "ai_text": (
                    f"No problem! Here are some alternative slots for {doctor_name}:\n"
                    f"{alt_lines}\n"
                    "Would any of these work for you?"
                ),
            }

        # ── Slot matched — signal ready to book ───────────────────────────────
        matched = next((s for s in period_slots if s["id"] == int(slot_id)), period_slots[0])
        return {
            **state,
            "slot_stage":         "ready_to_book",
            "selected_slot":      matched,
        }

    # ══════════════════════════════════════════════════════════════════════════
    # STAGE 4b — User replied to alternate slot suggestion
    # ══════════════════════════════════════════════════════════════════════════
    if slot_stage == "ask_alternate_slot":
        period_slots: list = state.get("available_slots_list", [])
        slots_context = "\n".join(f"id={s['id']} time={s['full_display']}" for s in period_slots)

        parsed = await llm_extract(
            system=(
                "Match the user's response to the correct appointment slot. "
                f"Available slots:\n{slots_context}\n"
                'Reply ONLY with JSON: {"slot_id": <int>} '
                'or {"slot_id": null} if user rejected all.'
            ),
            human=user_text,
        )

        slot_id = parsed.get("slot_id")

        if not slot_id:
            date_lines = "\n".join(f"  - {fmt_date(d)}" for d in available_dates[:5])
            return {
                **state,
                "slot_stage":           "ask_date",
                "chosen_date":          None,
                "chosen_period":        None,
                "available_slots_list": None,
                "ai_text": (
                    f"Let's start over. {doctor_name} is available on:\n{date_lines}\n"
                    "Which date would you like?"
                ),
            }

        matched = next((s for s in period_slots if s["id"] == int(slot_id)), period_slots[0])
        return {
            **state,
            "slot_stage":    "ready_to_book",
            "selected_slot": matched,
        }

    return state


# ── Helpers ───────────────────────────────────────────────────────────────────
async def _proceed_to_period(state: dict, doctor_name: str, chosen_date: date, date_slots: list) -> dict:
    periods = periods_on_date(date_slots)
    available_periods = list(periods.keys())

    if len(available_periods) == 1:
        chosen_period = available_periods[0]
        period_slots  = periods[chosen_period]
        slot_lines    = "\n".join(f"  - {s['display']}" for s in period_slots)
        return {
            **state,
            "slot_stage":           "ask_slot",
            "chosen_date":          chosen_date,
            "chosen_period":        chosen_period,
            "available_slots_list": period_slots,
            "ai_text": (
                f"{doctor_name} is only available in the {chosen_period} on {fmt_date(chosen_date)}. "
                f"Here are the open slots:\n{slot_lines}\n"
                "Which time works best for you?"
            ),
        }

    period_lines = "\n".join(f"  - {p}" for p in available_periods)
    return {
        **state,
        "slot_stage":  "ask_period",
        "chosen_date": chosen_date,
        "ai_text": (
            f"{doctor_name} is available in the {', '.join(available_periods)} "
            f"on {fmt_date(chosen_date)}.\n{period_lines}\n"
            "Which period would you prefer?"
        ),
    }