import os
import json
import anthropic
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MODEL = "claude-sonnet-5"

SEREN_SYSTEM_PROMPT = """
You are Seren, a smart and caring study companion for university students.

Your personality:
- Warm and encouraging, but first and foremost HELPFUL and DIRECT
- You answer the question first, then add a human touch if appropriate — never the other way around
- You are concise. You never ask more than one follow-up question, and only when truly necessary
- You never psychoanalyze the user or assume they are anxious unless they explicitly say so
- You treat students as capable adults who know what they need

Your role:
- Answer academic questions clearly and thoroughly
- Help with any subject: science, math, history, literature, programming, etc.
- Help students manage deadlines and study plans
- Break down complex topics into understandable explanations

Rules:
- NEVER refuse to answer a general knowledge or academic question
- NEVER say you "can't" do visualizations or diagrams — Seren can generate interactive visuals
- NEVER start a response by asking how the user is feeling unless they brought it up first
- Keep responses focused and well-structured
- Use Markdown: **bold** for key terms, bullet lists for steps, tables for comparisons, `code` for technical terms
- If a topic is not study-related, still answer it helpfully — curiosity is always valid
"""

FLASHCARD_SYSTEM_PROMPT = """
You are Seren, a study companion. The user wants flashcards.

Return ONLY a valid JSON object, no text before or after, no markdown code fences. Format:
{
  "type": "flashcards",
  "topic": "topic name",
  "cards": [
    {"front": "Question or term", "back": "Answer or definition"},
    {"front": "Question or term", "back": "Answer or definition"}
  ]
}

Generate 5 to 8 flashcards. Make them clear, concise, and educational.
"""

QUIZ_SYSTEM_PROMPT = """
You are Seren, a study companion. The user wants a quiz.

Return ONLY a valid JSON object, no text before or after, no markdown code fences. Format:
{
  "type": "quiz",
  "topic": "topic name",
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0
    }
  ]
}

"correct" is the index (0-3) of the correct option in the options array.
Generate 4 to 6 questions. Make them challenging but fair.
"""

VISUAL_SYSTEM_PROMPT = """
You are Seren, a study companion. The user wants a visual explanation of a concept.

Generate a complete, self-contained HTML page that visualizes the concept clearly and interactively.

Rules:
- Use only vanilla HTML, CSS, and JavaScript
- You may use Chart.js from https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js for data charts
- For everything else (trees, graphs, algorithms, diagrams) use pure SVG and/or Canvas
- Make it interactive: hover effects, click to step through, animations
- IMPORTANT: Use a LIGHT background (#F6F6F4 or white) with dark text (#2C2C2A) so content is always visible
- Accent color: #5DCAA5 and #0F6E56 for highlights and interactive elements
- Typography: system-ui, sans-serif
- Add a clear title at the top in #04342C
- Label everything clearly — this is for learning
- The visualization must fill the available space properly and be immediately visible on load
- For algorithms: show step-by-step with Play/Pause/Reset controls
- For trees/graphs: draw nodes with clear labels and edges
- For data charts: use Chart.js with clean styling
- Return ONLY the raw HTML starting with <!DOCTYPE html> — nothing else
"""

MEMORY_SUMMARY_SYSTEM_PROMPT = """
You maintain a short, structured long-term memory of a student's study habits and preferences, derived from their conversations with Seren, their study companion.

Given the previous summary (if any) and a batch of new conversation excerpts, produce an updated summary.

Rules:
- Keep it under 150 words
- Focus on durable facts: preferred learning style (e.g. quizzes vs flashcards), recurring subjects or courses, difficulties they've mentioned, study habits, tone preferences
- Do NOT include one-off details from a single session (specific homework due dates, etc.)
- Merge new observations into the existing summary rather than replacing it wholesale, unless something is now contradicted
- Return ONLY the updated summary text, no preamble, no markdown headers
"""


def detect_message_type(message: str) -> str:
    msg = message.lower()
    if any(word in msg for word in ['flashcard', 'flash card', 'carte mémoire', 'fiche']):
        return 'flashcard'
    if any(word in msg for word in ['quiz me', 'quiz', 'test me', 'question me', 'interroge']):
        return 'quiz'
    if any(word in msg for word in [
        'graphe', 'graph', 'chart', 'diagram', 'schéma', 'schema',
        'visualise', 'visualize', 'montre', 'show me', 'arbre', 'tree',
        'algorithme', 'algorithm', 'animation', 'animate', 'illustre',
        'dessine', 'draw', 'représente', 'represent', 'visualisation',
        'show a', 'draw a', 'plot', 'display a'
    ]):
        return 'visual'
    return 'text'


def build_system_prompt(user_context: Optional[dict]) -> str:
    system = SEREN_SYSTEM_PROMPT

    if user_context and user_context.get("memory_summary"):
        system += f"\n\nWhat you remember about this student from past sessions:\n{user_context['memory_summary']}"

    if user_context:
        name = user_context.get("name", "the student")
        events = user_context.get("events", [])
        context_block = f"\nCurrent user context:\n- Name: {name}\n- Upcoming deadlines: {len(events)} in the next 7 days\n"
        if events:
            context_block += "- Next deadlines:\n"
            for e in events[:3]:
                context_block += f"  • {e['title']} — {e['deadline']}\n"
        system += f"\n{context_block}"

    if user_context and user_context.get("pdf_content"):
        pdf_block = f"\n\nThe user has uploaded a document called \"{user_context.get('pdf_filename', 'document.pdf')}\" in this conversation. Here is its content:\n\n{user_context['pdf_content']}\n\nThis document is available for this conversation. Use it to answer any question, even if the user doesn't explicitly mention the filename."
        system += pdf_block

    return system


def chat_with_seren(
    user_message: str,
    conversation_history: list,
    user_context: Optional[dict] = None
) -> dict:
    message_type = detect_message_type(user_message)

    if message_type == 'flashcard':
        response = client.messages.create(
            model=MODEL,
            max_tokens=1500,
            system=FLASHCARD_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}]
        )
        try:
            raw = response.content[0].text.strip()
            data = json.loads(raw)
            return {"type": "flashcards", "content": data}
        except Exception:
            return {"type": "text", "content": response.content[0].text}

    if message_type == 'quiz':
        response = client.messages.create(
            model=MODEL,
            max_tokens=1500,
            system=QUIZ_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}]
        )
        try:
            raw = response.content[0].text.strip()
            data = json.loads(raw)
            return {"type": "quiz", "content": data}
        except Exception:
            return {"type": "text", "content": response.content[0].text}

    if message_type == 'visual':
        response = client.messages.create(
            model=MODEL,
            max_tokens=4000,
            system=VISUAL_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}]
        )
        html = response.content[0].text.strip()
        if html.startswith("```"):
            html = html.split("\n", 1)[-1]
            html = html.rsplit("```", 1)[0].strip()
        return {"type": "visual", "content": html}

    system = build_system_prompt(user_context)
    messages = conversation_history + [{"role": "user", "content": user_message}]

    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=system,
        messages=messages
    )

    return {"type": "text", "content": response.content[0].text}


def stream_chat_with_seren(
    user_message: str,
    conversation_history: list,
    user_context: Optional[dict] = None
):
    message_type = detect_message_type(user_message)

    if message_type in ('flashcard', 'quiz', 'visual'):
        result = chat_with_seren(user_message, conversation_history, user_context)
        payload = json.dumps({"event": "complete", "type": result["type"], "data": result["content"]})
        yield f"data: {payload}\n\n"
        return

    system = build_system_prompt(user_context)
    messages = conversation_history + [{"role": "user", "content": user_message}]

    try:
        with client.messages.stream(
            model=MODEL,
            max_tokens=2048,
            system=system,
            messages=messages
        ) as stream:
            for text in stream.text_stream:
                payload = json.dumps({"event": "token", "text": text})
                yield f"data: {payload}\n\n"
    except Exception:
        payload = json.dumps({"event": "error", "message": "Something went wrong while generating the response."})
        yield f"data: {payload}\n\n"
        return

    yield f"data: {json.dumps({'event': 'done'})}\n\n"


def generate_memory_summary(previous_summary: Optional[str], new_messages_text: str) -> str:
    prompt = f"""
Previous summary:
{previous_summary or "(none yet — this is the first summary)"}

New conversation excerpts since then:
{new_messages_text}

Produce the updated summary now.
"""
    response = client.messages.create(
        model=MODEL,
        max_tokens=300,
        system=MEMORY_SUMMARY_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text.strip()


def get_onboarding_message(step: int, user_name: str) -> str:
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
        model=MODEL,
        max_tokens=300,
        system=SEREN_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": onboarding_prompt}]
    )
    return response.content[0].text


def get_overwhelm_response(user_name: str, next_event: Optional[dict] = None) -> str:
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
        model=MODEL,
        max_tokens=300,
        system=SEREN_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text