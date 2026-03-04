from src.control.voice_assistance.utils import (
    build_conversation_string,
    build_symptoms_text,
    generate_next_response,
    is_emergency,
)
from src.control.voice_assistance.models import ainvoke_llm, get_llama1
from src.control.voice_assistance.prompts.clarify_node_prompt import (
    EMERGENCY_SYSTEM_PROMPT,
    CLARIFY_SYSTEM_PROMPT,
    COVERAGE_CHECK_SYSTEM_PROMPT,
)

TOPICS = [
    "main symptom or problem",
    "when it started",
    "patient age in years (must be a number)",
    "any major medical conditions or allergies",
]

async def get_covered_topics(conversation: str, topics: list[str]) -> list[str]:

    topics_numbered = "\n".join(f"{i+1}. {t}" for i, t in enumerate(topics))
    
    prompt = f"""Conversation:
        {conversation}

        Topics to check:
        {topics_numbered}

        Reply with ONLY the numbers of topics that have been clearly answered, comma-separated.
        If none are answered, reply with: NONE
        Example: 1,3,4"""

    try:
        model = get_llama1()

        response = await model.ainvoke([
            ("system", COVERAGE_CHECK_SYSTEM_PROMPT),
            ("human", prompt),
        ])

        raw = response.content.strip()

        raw_upper = raw.upper()
        if raw_upper == "NONE" or not raw_upper:
            return []

        covered = []
        for part in raw_upper.split(","):
            part = part.strip()
            if part.isdigit():
                idx = int(part) - 1
                if 0 <= idx < len(topics):
                    covered.append(topics[idx])

        return covered

    except Exception as exc:

        print("Message:", str(exc))
        return []


async def clarify_node(state: dict) -> dict:
    
    print("[clarify_node] -----------------------------")
    try:
        conversation_history: list[dict] = list(state.get("conversation_history") or [])
        user_text: str | None = state.get("user_text")
        covered: list[str] = list(state.get("covered_topics") or [])
        user_name: str | None = state.get("user_name")

        print("user_response:", user_text)

        is_first_turn = len(conversation_history) == 0

        if user_text:

            conversation_history.append({"role": "patient", "text": user_text.strip()})

            emergency_flag = await is_emergency(
                user_text,
                get_llama=get_llama1,
                system_prompt=EMERGENCY_SYSTEM_PROMPT
            )

            if emergency_flag:
                return {
                    **state,
                    "ai_text": (
                        "This sounds like a medical emergency. "
                        "Please stay on the line while I connect you to our emergency support team."
                    ),
                    "emergency": True,
                    "clarify_done": True,
                    "conversation_history": conversation_history,
                    "covered_topics": covered,
                }

            unchecked = [t for t in TOPICS if t not in covered]

            if unchecked:
                conversation = build_conversation_string(conversation_history)

                newly_covered = await get_covered_topics(conversation, unchecked)

                covered = covered + [t for t in newly_covered if t not in covered]


        uncovered = [t for t in TOPICS if t not in covered]

        if not uncovered:

            symptoms_text = build_symptoms_text(conversation_history, TOPICS)

            return {
                **state,
                "symptoms_text": symptoms_text,
                "conversation_history": conversation_history,
                "covered_topics": covered,
                "clarify_done": True,
                "ai_text": None,
            }

        conversation = build_conversation_string(conversation_history)

        response = await generate_next_response(
            conversation,
            uncovered,
            model=ainvoke_llm,
            system_prompt=CLARIFY_SYSTEM_PROMPT
        )

        print(" [ ai_response ]:", response)

        if is_first_turn:
            name_part = f", {user_name}" if user_name else ""
            greeting = (
                f"Thank you for confirming your name and phone number{name_part}. "
                f"We'll get you sorted right away. "
            )
            response = greeting + response

        conversation_history.append({"role": "agent", "text": response})

        return {
            **state,
            "ai_text": response,
            "conversation_history": conversation_history,
            "covered_topics": covered,
            "clarify_done": False,
        }

    except Exception as exc:

        print("Message:", str(exc))

        return {
            **state,
            "ai_text": "Sorry, something went wrong while processing your request.",
            "clarify_done": True,
            "error": str(exc),
        }