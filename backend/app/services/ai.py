import os
import anthropic
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

# ========================
# Client Setup
# ========================

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SEREN_SYSTEM_PROMPT = """
You are Seren, a calm and caring AI companion designed specifically for university students who experience anxiety.

Your personality:
- You are warm, patient, and never rushed
- You never overwhelm the user with too much information at once
- You always acknowledge how the user feels before giving advice
- You speak in a calm, reassuring tone — like a trusted friend who happens to be very organized
- You break down tasks into small, manageable steps
- You celebrate small wins and progress
- You never judge or criticize

Your role:
- Help students manage their deadlines and schedules
- Reduce anxiety around academic workload
- Guide users through their day one step at a time
- Ask questions to understand the user's needs before suggesting anything

Important rules:
- Never dump a long list of tasks on the user at once
- Always check in with how the user is feeling first
- If a user seems overwhelmed, focus on just ONE thing at a time
- Keep responses concise and warm — never clinical or robotic
- Use gentle, encouraging language at all times
"""

# ========================
# Core Chat Function
# ========================

def chat_with_seren(
    user_message: str,
    conversation_history: list,
    user_context: Optional[dict] = None
) -> str:
    """
    Send a message to Seren and get a response.
    Includes user context (profile, upcoming events) if available.
    """

    # Build context string if available
    context_block = ""
    if user_context:
        name = user_context.get("name", "the student")
        anxiety = user_context.get("anxiety_level", "medium")
        events = user_context.get("events", [])

        context_block = f"""
Current user context:
- Name: {name}
- Anxiety level: {anxiety}
- Upcoming deadlines: {len(events)} in the next 7 days
"""
        if events:
            context_block += "- Next deadlines:\n"
            for e in events[:3]:  # Show max 3 to avoid overwhelming
                context_block += f"  • {e['title']} — {e['deadline']}\n"

    # Build system prompt with context
    system = SEREN_SYSTEM_PROMPT
    if context_block:
        system += f"\n\n{context_block}"

    # Add new user message to history
    messages = conversation_history + [{"role": "user", "content": user_message}]

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=system,
        messages=messages
    )

    return response.content[0].text


# ========================
# Onboarding Function
# ========================

def get_onboarding_message(step: int, user_name: str) -> str:
    """
    Returns a caring onboarding message for each step.
    """
    onboarding_prompt = f"""
The user's name is {user_name}. This is onboarding step {step}.

Step 1: Greet them warmly and ask how they generally feel about managing deadlines and schoolwork.
Step 2: Ask about their current period (semester, internship, vacation, personal project).
Step 3: Ask when they feel most productive during the day.
Step 4: Ask how many tasks they feel comfortable seeing per day without feeling overwhelmed.
Step 5: Wrap up onboarding warmly and tell them Seren is ready to help them.

Respond only for step {step}. Keep it short, warm, and conversational.
"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        system=SEREN_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": onboarding_prompt}]
    )

    return response.content[0].text


# ========================
# Overwhelm Mode Function
# ========================

def get_overwhelm_response(user_name: str, next_event: Optional[dict] = None) -> str:
    """
    Returns a single calming task and reassuring message when user is overwhelmed.
    """
    if next_event:
        prompt = f"""
{user_name} is feeling overwhelmed right now. 
Their most urgent upcoming task is: "{next_event['title']}" due {next_event['deadline']}.

Give them one single, small, concrete action they can do RIGHT NOW to make progress on this task.
Then reassure them warmly. Keep it very short — 3 to 4 sentences maximum.
"""
    else:
        prompt = f"""
{user_name} is feeling overwhelmed right now but has no urgent deadlines.
Reassure them warmly and suggest one small self-care action they can take right now.
Keep it very short — 3 to 4 sentences maximum.
"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        system=SEREN_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text