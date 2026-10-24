import re
from typing import Optional

CRISIS_RESPONSE_TEXT = (
    "I'm really sorry you're going through this. You don't have to face it alone.\n\n"
    "If you might be in danger, please call your local emergency number now.\n"
    "In India, you can call 112.\n\n"
    "You can also talk to someone who is trained to listen:\n"
    "- Tele-MANAS (India, free, 24/7): 14416\n"
    "- KIRAN mental health helpline (India): 1800-599-0019\n\n"
    "If you are outside India, please look up a local helpline or contact a trusted person near you.\n\n"
    "I'm not able to help with this myself, but I am glad you told me."
)

# High-precision patterns for genuine crisis (suicide, self-harm, harming others)
CRISIS_PATTERNS = [
    r"\b(end\s+my\s+life|kill\s+myself|suicid(e|al))\b",
    r"\b(don'?t\s+want\s+to\s+(be\s+alive|live)\s+(any\s*more)?)\b",
    r"\b(want\s+to\s+die|wish\s+I\s+were\s+dead|better\s+off\s+dead)\b",
    r"\b(hurt\s+(myself|someone|others))\b",
    r"\b(cut\s+myself|harm\s+(myself|someone))\b",
    r"\b(take\s+my\s+own\s+life)\b",
]

# Overwhelm phrases that must NOT be flagged as crisis
OVERWHELM_PATTERNS = [
    r"\b(feel\s+useless|stuck\s+and\s+useless|overwhelmed|could\s+cry|can'?t\s+start)\b",
    r"\b(too\s+hard\s+to\s+start|struggling\s+with\s+my)\b",
]


def is_crisis(text: str) -> bool:
    """Detects crisis language requiring emergency helpline intervention.
    
    Overwhelm about a task (e.g. 'I feel useless') is NOT a crisis.
    Does not log user text.
    """
    if not text:
        return False

    normalized = text.lower().strip()

    # Direct crisis keyword match
    for pattern in CRISIS_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            return True

    return False


def is_overwhelmed(text: str) -> bool:
    """Checks if user expressed overwhelm about a task so we can provide gentle reassurance."""
    if not text:
        return False
    normalized = text.lower().strip()
    for pattern in OVERWHELM_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            return True
    return False
