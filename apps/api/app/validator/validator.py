import re
from typing import List, Optional, Tuple, Dict, Any

BANNED_WORDS = [
    r"\bmust\b",
    r"\bshould\b",
    r"\bneed\s+to\b",
    r"\bhave\s+to\b",
    r"\boverdue\b",
    r"\bbehind\b",
    r"\blate\b",
    r"\bfailed\b",
    r"\blazy\b",
    r"\bjust\b",
    r"\bsimply\b",
    r"\beasy\b",
    r"\byou\s+missed\b",
    r"\bstreak\b",
    r"\bpoints\b",
]

STEP_COUNT_PATTERNS = [
    r"\bstep\s*\d+\b",
    r"\b\d+\s+of\s+~?\d+\s+steps?\b",
    r"^\s*\d+[\.\-\)]\s*",
    r"^\s*[\*\-]\s*",
]


def clean_step_text(text: str) -> str:
    """Removes any accidental step numbering, bullet points, or step prefixes."""
    if not text:
        return ""
    cleaned = text.strip()
    # Remove leading numbering like "1. ", "Step 1: ", "Step 2 - ", "- "
    cleaned = re.sub(r"^(step\s*\d+(\s*[:\-\.]|\b)|\d+[\.\-\)]|\-|\*)\s*", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"^[:\-\.]\s*", "", cleaned).strip()
    # Remove any internal "step X of Y"
    cleaned = re.sub(r"\(\s*\d+\s+of\s+~?\d+\s+steps?\s*\)", "", cleaned, flags=re.IGNORECASE).strip()
    return cleaned



def validate_tone(text: str) -> Tuple[bool, Optional[str]]:
    """Checks whether the text contains any prohibited or pressuring words."""
    if not text:
        return True, None
    lower_text = text.lower()
    for pattern in BANNED_WORDS:
        match = re.search(pattern, lower_text)
        if match:
            return False, f"Contains banned word pattern: {match.group(0)}"
    return True, None


def validate_step(step: str, max_words: int = 20) -> Tuple[bool, Optional[str]]:
    """Validates that a step is a single action, within word limit, and free of banned words."""
    if not step or not step.strip():
        return False, "Step is empty"

    cleaned = clean_step_text(step)
    words = cleaned.split()
    if len(words) > max_words:
        return False, f"Step exceeds {max_words} words ({len(words)} words)"

    ok, reason = validate_tone(cleaned)
    if not ok:
        return False, reason

    # Check for remaining step count phrases
    for pattern in STEP_COUNT_PATTERNS:
        if re.search(pattern, cleaned, flags=re.IGNORECASE):
            return False, f"Contains forbidden step count pattern: {pattern}"

    return True, None


def validate_explanation(explanation: str, max_words: int = 30) -> Tuple[bool, Optional[str]]:
    """Validates an explanation (for Confused) within word limit and calm tone."""
    if not explanation or not explanation.strip():
        return False, "Explanation is empty"

    words = explanation.split()
    if len(words) > max_words:
        return False, f"Explanation exceeds {max_words} words ({len(words)} words)"

    ok, reason = validate_tone(explanation)
    if not ok:
        return False, reason

    return True, None


def validate_and_sanitize_steps(
    steps: List[str],
    matched_row: Dict[str, Any],
    max_words_per_step: int = 20,
) -> List[str]:
    """Validates step list, enforces step[0] == first_tiny_action, sanitizes numbering,

    and replaces any invalid step with a calm fallback.
    """
    if not steps:
        return [matched_row.get("first_tiny_action", "Open the application and take a calm first look.")]

    sanitized: List[str] = []

    # Rule: step[0] must strictly be the matched row's first_tiny_action
    first_step = matched_row.get("first_tiny_action")
    if first_step:
        sanitized.append(clean_step_text(first_step))
    else:
        sanitized.append(clean_step_text(steps[0]))

    # Process remaining steps
    for s in steps[1:]:
        clean_s = clean_step_text(s)
        ok, _ = validate_step(clean_s, max_words=max_words_per_step)
        if ok:
            sanitized.append(clean_s)

    # Ensure at least 1 step
    if not sanitized:
        sanitized = [matched_row.get("first_tiny_action", "Open the application and take a calm first look.")]

    return sanitized
