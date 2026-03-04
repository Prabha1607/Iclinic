async def stt_node(state: dict) -> dict:
    print("[stt_node] -----------------------------")

    user_text: str | None = state.get("user_text")

    if not user_text:
        return {**state, "user_text": None}

    # trim leading/trailing spaces
    cleaned = " ".join(user_text.split()).strip()

    # get existing history or initialize
    history = state.get("conversation_history") or []

    # append user message
    history.append({
        "role": "user",
        "content": cleaned
    })

    print("STT received",user_text)

    return {
        **state,
        "user_text": cleaned,
        "conversation_history": history
    }