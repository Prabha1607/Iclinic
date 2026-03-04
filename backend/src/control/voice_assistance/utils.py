def clear_markdown(raw: str) -> str:

    if raw.startswith("```"):
        return "\n".join(
            line for line in raw.splitlines()
            if "```" not in line
        ).strip()

    return raw.strip()



def parse_llm_response(raw: str) -> tuple[str, str]:
    
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = "\n".join(
            line for line in cleaned.splitlines()
            if not line.strip().startswith("```")
        ).strip()

    
    
async def is_emergency(text,get_llama, system_prompt) -> bool:
    try:
        model = get_llama()
        response = await model.ainvoke([
            ("system", system_prompt),
            ("human", text),
        ])
        verdict = response.content.strip().upper()

        return verdict == "EMERGENCY"
    except Exception as exc:

        return False



async def generate_next_response(conversation: str, uncovered_topics: list[str],model : any , system_prompt : str) -> str:

    topics_str = "\n".join(f"- {t}" for t in uncovered_topics) if uncovered_topics else "None — all covered."

    prompt = f"""Conversation so far:
{conversation if conversation.strip() else "(No conversation yet — warmly thank the patient for confirming their name and phone number, then ask about their main symptom.)"}

Topics still not covered:
{topics_str}

Generate your next response now."""

    try:
        response = await model([
            ("system", system_prompt),
            ("human", prompt),
        ])
        return response.content.strip().strip('"').strip("'")
    except Exception as exc:

        return "Could you tell me a bit more about what brings you in today?"


def build_conversation_string(history: list[dict]) -> str:

    lines = []
    for turn in history:
        role = "Agent" if turn.get("role") == "agent" else "Patient"
        lines.append(f"{role}: {turn.get('text', '')}")
    return "\n".join(lines)


def build_symptoms_text(history: list[dict],TOPICS : list) -> str:

    patient_turns = [t["text"] for t in history if t.get("role") == "patient"]
    pairs = []
    for i, topic in enumerate(TOPICS):
        answer = patient_turns[i] if i < len(patient_turns) else "Not provided"
        pairs.append(f"Q: {topic.capitalize()}\nA: {answer}")
    return "\n\n".join(pairs)

from twilio.twiml.voice_response import Gather, Say
from src.config.settings import settings

def say(parent, text: str) -> None:

    ssml = f'<speak><prosody rate="{settings.SPEAKING_RATE}">{text}</prosody></speak>'
    parent.append(Say(message=ssml, voice=settings.VOICE))


def make_gather() -> Gather:

    return Gather(
        input="speech",
        action="/api/v1/voice/voice-response",
        method="POST",
        speech_timeout=settings.SPEECH_TIMEOUT,
        timeout=settings.GATHER_TIMEOUT,
        action_on_empty_result=settings.ACTION_ON_EMPTY_RESULT,
        speech_model="phone_call",
        language=settings.LANGUAGE,
    )


def fresh_state(
    to_number=None,
    call_sid=None,
    user_name=None,
    user_email=None,
    user_phone=None,
) -> dict:

    return {
        "to_number":         to_number,
        "call_sid":          call_sid,
        "user_token":        None,       
        "user_text":         None,
        "ai_text":           None,
        "error":             None,
        "confirmation_done": False,
        "confirmed_user":    False,
        "confirm_stage":     None,
        "user_name":         user_name,
        "user_email":        user_email,
        "user_phone":        user_phone,
        "clarify_step":      0,
        "history":           [],
        "symptoms_text":     None,
        "clarify_done":      False,
        "intent":            None,
        "emergency":         False,
    }
