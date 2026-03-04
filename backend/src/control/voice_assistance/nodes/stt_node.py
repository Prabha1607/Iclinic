async def stt_node(state: dict) -> dict:
    
    print("[stt_node] -----------------------------")

    user_text: str | None = state.get("speech_user_text")

    if not user_text:
        return {**state, "speech_user_text": None}

    cleaned = " ".join(user_text.split()).strip()

    history = state.get("clarify_conversation_history") or []

    history.append({
        "role": "user",
        "content": cleaned
    })

    print("STT received", user_text)

    return {
        **state,
        "speech_user_text": cleaned,
        "clarify_conversation_history": history
    }