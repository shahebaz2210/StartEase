import re
from typing import List


ACTION_VERBS = r"(?:build|create|make|write|prepare|design|edit|analyze|format|clean|code|test|run|manage|find|track|set\s*up|organize|conduct|draft|develop|solve|calculate|read|review|study|practice|submit|send|generate|draw|sketch|install|deploy)"
FILLER = r"(?:(?:i\s+)?(?:want|need|have|would\s+like)\s+to\s+|(?:also|next|later)\s+)*"


def split_tasks(raw_input: str) -> List[str]:
    """Splits a multi-task brain-dump into discrete, ordered tasks.

    Handles:
    - Newlines / multiline inputs
    - Numbered lists (1. ..., 2. ...)
    - Bullet points (- ..., * ...)
    - Semicolons (;)
    - Sequential conjunctions (then, and then, after that, next)
    - Action verb boundaries (, and <verb>, , <verb>, and <verb>, with optional fillers)
    """
    if not raw_input or not raw_input.strip():
        return []

    text = raw_input.strip()

    # 1. Check for multiline
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if len(lines) > 1:
        tasks = []
        for line in lines:
            cleaned = re.sub(r"^(\d+[\.\-\)]|\-|\*)\s*", "", line).strip()
            if cleaned and len(cleaned) >= 2:
                tasks.append(cleaned)
        if len(tasks) > 1:
            return tasks

    # 2. Check for semicolon separation
    if ";" in text:
        parts = [p.strip() for p in text.split(";") if p.strip()]
        if len(parts) > 1:
            return parts

    # 3. Check for numbered pattern on single line (e.g., '1. Task one 2. Task two')
    numbered_parts = [p.strip() for p in re.split(r"(?:^|\s+)\d+[\.\-\)]\s+", text) if p.strip()]
    if len(numbered_parts) > 1:
        return numbered_parts

    # 4. Sequential conjunctions or action-verb boundaries (accounting for conversational fillers)
    pattern = rf"(?:,\s*(?:and\s+)?(?:then|after\s+that|afterwards|next)\s+|\s+(?:and\s+)?(?:then|after\s+that|afterwards)\s+|,\s*(?:and\s+)?(?={FILLER}{ACTION_VERBS}\b)|\s+(?:and|plus)\s+(?={FILLER}{ACTION_VERBS}\b))"
    parts = [p.strip() for p in re.split(pattern, text, flags=re.IGNORECASE) if p.strip()]
    if len(parts) > 1:
        cleaned_parts = [
            re.sub(r"^(?:(?:i\s+)?(?:want|need|have|would\s+like)\s+to\s+|(?:also|next|later)\s+)+", "", p, flags=re.IGNORECASE).strip()
            for p in parts
        ]
        cleaned_parts = [p for p in cleaned_parts if len(p.split()) >= 2]
        if len(cleaned_parts) > 1:
            return cleaned_parts

    return [text]

