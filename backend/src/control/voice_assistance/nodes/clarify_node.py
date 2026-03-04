from src.control.voice_assistance.utils import (
    build_conversation_string,
    build_symptoms_text,
    generate_next_response,
    is_emergency,
    update_state,
)
from src.control.voice_assistance.models import ainvoke_llm, get_llama1
from src.control.voice_assistance.prompts.clarify_node_prompt import (
    EMERGENCY_SYSTEM_PROMPT,
    CLARIFY_SYSTEM_PROMPT,
    COVERAGE_CHECK_SYSTEM_PROMPT,
    EMERGENCY_RESPONSE,
    FALLBACK_RESPONSE,
    TOPICS,
)


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

        raw = response.content.strip().upper()

        if not raw or raw == "NONE":
            return []

        return [
            topics[int(part.strip()) - 1]
            for part in raw.split(",")
            if part.strip().isdigit() and 0 <= int(part.strip()) - 1 < len(topics)
        ]

    except Exception as exc:
        print("get_covered_topics error:", str(exc))
        return []


def _build_greeting(user_name: str | None) -> str:
    name_part = f", {user_name}" if user_name else ""
    return (
        f"Thank you for confirming your name and phone number{name_part}. "
        f"We'll get you sorted right away. "
    )


async def _update_covered_topics(conversation_history: list, covered: list[str]) -> list[str]:
    unchecked = [t for t in TOPICS if t not in covered]
    if not unchecked:
        return covered

    conversation = build_conversation_string(conversation_history)
    newly_covered = await get_covered_topics(conversation, unchecked)
    return covered + [t for t in newly_covered if t not in covered]


async def clarify_node(state: dict) -> dict:
    print("[clarify_node] -----------------------------")
    try:
        conversation_history: list[dict] = list(state.get("conversation_history") or [])
        user_text: str | None = state.get("user_text")
        covered: list[str] = list(state.get("covered_topics") or [])
        user_name: str | None = state.get("user_name")

        is_first_turn = len(conversation_history) == 0

        if user_text:
            conversation_history.append({"role": "patient", "text": user_text.strip()})
            print("[user_response]:", user_text)

            if await is_emergency(user_text, get_llama=get_llama1, system_prompt=EMERGENCY_SYSTEM_PROMPT):
                return update_state(
                    state,
                    ai_text=EMERGENCY_RESPONSE,
                    emergency=True,
                    clarify_done=True,
                    conversation_history=conversation_history,
                    covered_topics=covered,
                )

            covered = await _update_covered_topics(conversation_history, covered)

        uncovered = [t for t in TOPICS if t not in covered]

        if not uncovered:
            return update_state(
                state,
                symptoms_text=build_symptoms_text(conversation_history, TOPICS),
                conversation_history=conversation_history,
                covered_topics=covered,
                clarify_done=True,
                ai_text=None,
            )

        conversation = build_conversation_string(conversation_history)
        response = await generate_next_response(
            conversation,
            uncovered,
            model=ainvoke_llm,
            system_prompt=CLARIFY_SYSTEM_PROMPT,
        )
        print("[ai_response]:", response)

        if is_first_turn:
            response = _build_greeting(user_name) + response

        conversation_history.append({"role": "agent", "text": response})

        return update_state(
            state,
            ai_text=response,
            conversation_history=conversation_history,
            covered_topics=covered,
            clarify_done=False,
        )

    except Exception as exc:
        print("clarify_node error:", str(exc))
        return update_state(
            state,
            ai_text=FALLBACK_RESPONSE,
            clarify_done=True,
            error=str(exc),
        )