import re
from typing import List


def split_tasks(raw_input: str) -> List[str]:
    """Splits a multi-task brain-dump into discrete, ordered tasks.

    Handles:
    - Newlines / multiline inputs
    - Numbered lists (1. ..., 2. ...)
    - Bullet points (- ..., * ...)
    - Semicolons (;)
    - Sequential conjunctions (', then ', ' then ', ', and then ', ' and then ', ' after that ')
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

    # 4. Check for sequential conjunctions: 'then', 'and then', 'after that'
    conjunction_pattern = r"(?:,\s*(?:and\s+)?then\s+|\s+and\s+then\s+|\s+then\s+|,\s*after\s+that\s+|\s+after\s+that\s+)"
    parts = [p.strip() for p in re.split(conjunction_pattern, text, flags=re.IGNORECASE) if p.strip()]
    if len(parts) > 1 and all(len(p.split()) >= 2 for p in parts):
        return parts

    return [text]
