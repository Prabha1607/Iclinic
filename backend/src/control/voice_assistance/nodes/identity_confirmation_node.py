import json
from typing import Dict, Any
from src.control.voice_assistance.prompts.confirmation_node_prompt import CONVERSATION_PROMPT, VERIFIER_PROMPT
from src.control.voice_assistance.models import ainvoke_llm
from src.control.voice_assistance.utils import clear_markdown


async def identity_confirmation_node(state: Dict[str, Any]) -> Dict[str, Any]:

    print("[identity_confirmation_node] -----------------------------")

    patient_name: str = (state.get("user_name") or "").strip()
    phone_number: str = (state.get("user_phone") or "").strip()
    user_text: str = (state.get("user_text") or "").strip()

    if not patient_name:
        return state

    # Always use conversation_history
    conversation_history = list(state.get("conversation_history") or [])

    # Append latest user input if present
    if user_text:
        print("[user_response] :", user_text)
        conversation_history.append({
            "role": "user",
            "content": user_text
        })

    conv_messages = [
        {
            "role": "system",
            "content": CONVERSATION_PROMPT.format(
                name=patient_name,
                phone=phone_number
            )
        },
        {"role":"user", "content": user_text}
    ]

    # If no user message yet, force first turn
    if not any(m["role"] == "user" for m in conv_messages):
        conv_messages.append({"role": "user", "content": "start"})

    try:
        conv_response = await ainvoke_llm(conv_messages)
        sentence: str = conv_response.content.strip()
    except Exception:
        return state

    confirmed = False
    end_call = False
    corrected_name = None
    corrected_phone = None

    # Run verifier only if user responded
    if user_text:
        verify_messages = [
            {"role": "system", "content": VERIFIER_PROMPT},
            {
                "role": "user",
                "content": f"Conversation so far:\n{conv_messages}\n\nLatest user reply: {user_text}"
            }
        ]

        try:
            verify_response = await ainvoke_llm(verify_messages)
            raw = clear_markdown(verify_response.content.strip())
            data = json.loads(raw)

            confirmed = bool(data.get("confirmed", False))
            end_call = bool(data.get("end_call", False))
            corrected_name = data.get("corrected_name")
            corrected_phone = data.get("corrected_phone")

        except Exception as e:
            print("[VERIFIER ERROR]", e)

    # Apply corrections if any
    if corrected_name:
        state["user_name"] = corrected_name
    if corrected_phone:
        state["user_phone"] = corrected_phone

    # Append assistant reply
    conversation_history.append({
        "role": "assistant",
        "content": sentence
    })

    return {
        **state,
        "conversation_history": conversation_history,
        "confirmed_user": confirmed,
        "confirmation_done": confirmed or end_call,
        "ai_text": sentence,
    }