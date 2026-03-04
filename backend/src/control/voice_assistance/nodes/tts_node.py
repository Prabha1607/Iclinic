async def tts_node(state: dict) -> dict:
    print("i came here [tts_node] -----------------------------")

    ai_text: str | None = state.get("ai_text")
    print("TTS received:", state.get("ai_text"))
    if not ai_text or not ai_text.strip():

        FALLBACK_TEXT = "I'm sorry, something went wrong. Please hold while I transfer you."
        ai_text = FALLBACK_TEXT

    # remove characters that confuse Twilio's TTS engine
    ai_text = ai_text.replace("*", "").replace("#", "").strip()

    return {**state, "ai_text": ai_text}
