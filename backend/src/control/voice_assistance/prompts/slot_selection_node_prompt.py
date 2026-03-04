NO_SLOTS_RESPONSE = "I'm sorry, {doctor_name} has no available slots right now. Please try again later."

LLM_DATE_SYSTEM = (
    "Extract the date the user wants from their message. "
    "Today is {today}. "
    "Available dates:\n{date_options}\n"
    "Always match to the closest available date if the user mentions a day or month. "
    'Reply ONLY with JSON: {{"date": "YYYY-MM-DD"}} '
    'or {{"date": null}} if unclear.'
)

LLM_ALTERNATE_DATE_SYSTEM = (
    "Extract the date the user accepted from their message. "
    "Today is {today}. "
    "Available dates:\n{date_options}\n"
    "If the user said no, rejected, or did not pick a date, reply: "
    '{{"date": null}}. '
    'Reply ONLY with JSON: {{"date": "YYYY-MM-DD"}} or {{"date": null}}.'
)

LLM_PERIOD_SYSTEM = (
    "Extract the time period the user chose. "
    "Available periods: {available_periods}. "
    'Reply ONLY with JSON: {{"period": "<morning|afternoon|evening|night>"}} '
    'or {{"period": null}} if unclear.'
)

LLM_SLOT_SYSTEM = (
    "Match the user's response to the correct appointment slot. "
    "Available slots:\n{slots_context}\n"
    'Reply ONLY with JSON: {{"slot_id": <int>}} '
    'or {{"slot_id": null}} if user rejected all slots or wants alternatives.'
)

LLM_ALTERNATE_SLOT_SYSTEM = (
    "Match the user's response to the correct appointment slot. "
    "Available slots:\n{slots_context}\n"
    'Reply ONLY with JSON: {{"slot_id": <int>}} '
    'or {{"slot_id": null}} if user rejected all.'
)