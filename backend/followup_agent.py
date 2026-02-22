"""
Isolated follow-up Q&A agent.

This module is completely separate from the primary ResearchAgent.
It handles contextual follow-up questions about a completed research report.
"""

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

FOLLOWUP_MODEL = "arcee-ai/trinity-large-preview:free"

SYSTEM_TEMPLATE = """You are a knowledgeable research assistant. The user has received a research report and is now asking follow-up questions about it.

Use the report below as your primary context to answer accurately and concisely. YOUR RESPONSE MUST NOT EXCEED 5 SENTENCES. If the user's question goes beyond the report content, you may provide general knowledge, but clearly indicate when you are doing so.

--- RESEARCH REPORT ---
{report}
--- END REPORT ---"""


def ask_follow_up(
    api_key: str,
    report: str,
    history: list[dict],
    question: str,
) -> str:
    """
    Answer a follow-up question in the context of a completed research report.

    Args:
        api_key: The user's OpenRouter API key.
        report: The completed research report text.
        history: Previous follow-up messages as list of {"role": ..., "content": ...}.
        question: The new user question.

    Returns:
        The assistant's response text.
    """
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key or os.getenv("OPENROUTER_API_KEY"),
        default_headers={
            "HTTP-Referer": "http://localhost:5176",
            "X-Title": "Research Agent Follow-Up",
        },
    )

    messages = [
        {"role": "system", "content": SYSTEM_TEMPLATE.format(report=report)},
    ]

    # Add conversation history
    for msg in history:
        role = "assistant" if msg["role"] == "agent" else "user"
        messages.append({"role": role, "content": msg["content"]})

    # Add the new question
    messages.append({"role": "user", "content": question})

    response = client.chat.completions.create(
        model=FOLLOWUP_MODEL,
        messages=messages,
        temperature=0.4,
        max_tokens=2048,
    )

    return response.choices[0].message.content or "I couldn't generate a response."
