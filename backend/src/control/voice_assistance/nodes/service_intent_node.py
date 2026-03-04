from src.control.voice_assistance.models import get_llama1

SERVICE_INTENT_PROMPT = """
    You are an intent classifier for a hospital voice assistant.

    Classify the user's request into ONE of these:

    booking
    cancellation

    Reply with ONLY one word.
    If unclear, reply: unclear
"""


async def service_intent_node(state: dict) -> dict:
    
    user_text = state.get("user_text")

    # First turn → Ask what service they want
    if not user_text:
        return {
            **state,
            "ai_text": "Hi there! This is Front desk Assistance calling from iClinic. We noticed an appointment request come in through our website. How can I help you today? Would you like to book an appointment or cancel an appointment?",
            "service_type": None,
        }

    try:
        model = get_llama1()

        response = await model.ainvoke([
            ("system", SERVICE_INTENT_PROMPT),
            ("human", user_text),
        ])

        service = response.content.strip().lower()

        if service not in ["booking", "cancellation"]:
            return {
                **state,
                "ai_text": "Sorry, I did not understand. Do you want to book an appointment or cancel one?",
                "service_type": None,
            }
        patient_id = state.get("patient_id")

        return {
            **state,
            "patient_id": patient_id,
            "service_type": service,
            "ai_text": None,
        }
        
    except Exception as e:
        return {
            **state,
            "ai_text": "Something went wrong. Please try again.",
            "error": str(e),
        }
    

    