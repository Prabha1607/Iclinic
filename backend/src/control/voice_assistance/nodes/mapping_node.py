import json
from src.data.clients.postgres_client import AsyncSessionLocal
from src.core.services.appointment_type import get_appointment_types
from src.control.voice_assistance.utils import clear_markdown
from src.control.voice_assistance.prompts.mapping_node_prompt import SYSTEM_PROMPT
from src.control.voice_assistance.models import get_llama1

async def appointment_types_map():
    async with AsyncSessionLocal() as db:
        appointment_types = await get_appointment_types(db)

        return {
            at.id: [at.name, at.description]
            for at in appointment_types
        }


async def mapping_node(state: dict) -> dict:
    
    print("i came here [mapping_node] -----------------------------")
    
    APPOINTMENT_TYPES = await appointment_types_map()

    print("APPOINTMENT_TYPES:", APPOINTMENT_TYPES)

    def _normalise(text: str) -> str:
        return text.strip().lower().replace(" ", "_").replace("-", "_")

    async def _resolve_appointment_type_id(intent: str, appointment_types: dict) -> int | None:
        catalogue_lines = "\n".join(
            f"  id={type_id}, name={name}, description={description}"
            for type_id, (name, description) in appointment_types.items()
        )

        user_prompt = f"""Given the following appointment type catalogue:
{catalogue_lines}

The patient has been classified with intent: "{intent}"

Return ONLY a JSON object with the single key "appointment_type_id" containing the integer ID 
that best matches the intent. If nothing matches, use the ID for general check-up.

Example: {{"appointment_type_id": 3}}"""

        llm = get_llama1()
        response = await llm.ainvoke([
            ("system", "You are a medical appointment classifier. Always respond with valid JSON only."),
            ("human", user_prompt),
        ])

        clean_response = clear_markdown(response.content.strip())

        try:
            parsed = json.loads(clean_response)
            return int(parsed.get("appointment_type_id"))
        
        except (json.JSONDecodeError, TypeError, ValueError):
            for type_id, (name, _) in appointment_types.items():
                if "general" in name.lower():
                    return type_id
            return next(iter(appointment_types))

    # Emergency override
    if state.get("emergency"):
        return {
            **state,
            "intent": "emergency",
            "appointment_type_id": None,
            "ai_text": (
                "We are unable to book a standard appointment. "
                "Please contact emergency services or proceed to the nearest emergency facility immediately."
            ),
        }

    # Use unified conversation history
    conversation_history: list[dict] = list(
        state.get("conversation_history") or []
    )

    conversation_lines = []
    for turn in conversation_history:
        role = "Assistant" if turn.get("role") == "assistant" else "Patient"
        content = turn.get("content", "").strip()
        if content:
            conversation_lines.append(f"{role}: {content}")

    conversation_transcript = "\n".join(conversation_lines).strip()

    if not conversation_transcript:
        intent = "general_checkup"
        appointment_type_id = await _resolve_appointment_type_id(
            intent, APPOINTMENT_TYPES
        )

        return {
            **state,
            "intent": intent,
            "appointment_type_id": appointment_type_id,
            "ai_text": "I will go ahead and book a general check-up appointment for you.",
        }

    catalogue_lines = "\n".join(
        f"  id={type_id}, name={name}, description={description}"
        for type_id, (name, description) in APPOINTMENT_TYPES.items()
    )

    user_prompt = f"""Appointment type catalogue:
{catalogue_lines}

Full intake conversation:
{conversation_transcript}

Based on the full conversation above, classify the patient into the most appropriate appointment type.
Return JSON with key "intent" only."""

    llm = get_llama1()
    response = await llm.ainvoke([
        ("system", SYSTEM_PROMPT),
        ("human", user_prompt),
    ])

    raw_content: str = response.content.strip()
    clean_response = clear_markdown(raw_content)

    try:
        parsed = json.loads(clean_response)
        intent = str(parsed.get("intent", "general_checkup")).strip().lower()
    except (json.JSONDecodeError, AttributeError, KeyError):
        intent = "general_checkup"

    valid_intents = [
        _normalise(name)
        for _, (name, _) in APPOINTMENT_TYPES.items()
    ]

    if intent not in valid_intents:
        intent = "general_checkup"

    appointment_type_id = await _resolve_appointment_type_id(
        intent, APPOINTMENT_TYPES
    )

    print(f"[mapping_node] intent={intent!r} → appointment_type_id={appointment_type_id}")

    friendly_name = intent.replace("_", " ").title()

    return {
        **state,
        "intent": intent,
        "appointment_type_id": appointment_type_id,
        "appointment_types": APPOINTMENT_TYPES,
        "ai_text": (
            f"Based on what you've described, I'll book a {friendly_name} appointment for you. "
            f"You'll receive a confirmation shortly."
        ),
    }
