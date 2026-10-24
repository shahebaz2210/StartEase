import pytest
from app.validator.validator import (
    validate_tone,
    validate_step,
    validate_explanation,
    validate_and_sanitize_steps,
    clean_step_text,
)


def test_banned_words_rejection():
    banned_samples = [
        "You must finish this now",
        "You should open Canva",
        "You need to type your name",
        "You have to start here",
        "This is overdue and behind",
        "Don't be lazy, just do it",
        "This is simply easy to do",
        "You failed to submit",
        "Keep your streak going for points",
    ]
    for text in banned_samples:
        ok, reason = validate_tone(text)
        assert ok is False, f"Banned text passed validation: {text}"
        assert reason is not None


def test_clean_step_text():
    assert clean_step_text("Step 1: Open Canva.") == "Open Canva."
    assert clean_step_text("1. Open Word and create document.") == "Open Word and create document."
    assert clean_step_text("- Open Figma and start new file.") == "Open Figma and start new file."
    assert clean_step_text("Open Canva (1 of ~4 steps)") == "Open Canva"
    assert clean_step_text("Step 2 - Type your title") == "Type your title"


def test_validate_step_length():
    short_step = "Open Canva and search for poster templates."
    ok, _ = validate_step(short_step, max_words=20)
    assert ok is True

    long_step = "Open Canva and look through all of the available templates and pick the one that you think looks best for the upcoming college event celebration."
    ok, reason = validate_step(long_step, max_words=20)
    assert ok is False
    assert "exceeds" in reason


def test_validate_explanation_length():
    good_explanation = "Open the app and find the search bar. That is all for this step."
    ok, _ = validate_explanation(good_explanation, max_words=30)
    assert ok is True

    long_explanation = " ".join(["word"] * 35)
    ok, reason = validate_explanation(long_explanation, max_words=30)
    assert ok is False


def test_validate_and_sanitize_enforces_first_tiny_action():
    matched_row = {
        "task_id": 13,
        "first_tiny_action": "Open Canva and search for poster templates.",
        "recommended_app": "Canva",
    }
    raw_steps = [
        "Invented first step by LLM",
        "Pick any template you like.",
        "Replace title with your event name.",
    ]
    sanitized = validate_and_sanitize_steps(raw_steps, matched_row)
    assert sanitized[0] == "Open Canva and search for poster templates."
    assert len(sanitized) == 3
