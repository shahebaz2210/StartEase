import pytest
from app.safety.crisis import is_crisis, is_overwhelmed, CRISIS_RESPONSE_TEXT


def test_crisis_detection_positive_cases():
    crisis_cases = [
        "I want to end my life",
        "I don't want to be alive anymore",
        "I want to hurt myself",
        "I want to hurt someone",
        "I'm going to take my own life",
        "Wish I were dead",
        "I cut myself today",
    ]
    for text in crisis_cases:
        assert is_crisis(text) is True, f"Failed to detect crisis in: {text}"


def test_overwhelm_not_treated_as_crisis():
    overwhelm_cases = [
        "I can't start my report and I feel useless",
        "I'm so overwhelmed by my assignment I could cry",
        "I have a presentation tomorrow and I feel stuck and useless",
        "Too hard to start my research paper",
    ]
    for text in overwhelm_cases:
        assert is_crisis(text) is False, f"Incorrectly flagged overwhelm as crisis: {text}"
        assert is_overwhelmed(text) is True, f"Failed to detect overwhelm in: {text}"


def test_normal_tasks_not_crisis():
    normal_tasks = [
        "Design a college event poster",
        "Create an ATS-friendly placement resume",
        "Write a research paper in LaTeX",
        "Analyze customer feedback survey responses",
    ]
    for task in normal_tasks:
        assert is_crisis(task) is False
        assert is_overwhelmed(task) is False


def test_crisis_response_contains_required_helplines():
    assert "112" in CRISIS_RESPONSE_TEXT
    assert "14416" in CRISIS_RESPONSE_TEXT
    assert "1800-599-0019" in CRISIS_RESPONSE_TEXT
    assert "Tele-MANAS" in CRISIS_RESPONSE_TEXT
    assert "KIRAN" in CRISIS_RESPONSE_TEXT
