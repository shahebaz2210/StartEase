import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.retrieval.retriever import retriever

client = TestClient(app)


def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_create_session_core_flow():
    # AC #2: "Design a college event poster", app Canva, step 1 equals first_tiny_action
    response = client.post("/v1/sessions", json={"task": "Design a college event poster"})
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "step"
    assert data["session_id"] is not None
    assert data["app"]["name"] == "Canva"
    assert data["step"] == "Open Canva and search for poster templates."
    assert data["variant"] == "normal"

    # AC #3: Assert NO step counts, remaining steps, or step lists exist
    assert "step_count" not in data
    assert "total_steps" not in data
    assert "remaining" not in data
    assert "steps" not in data
    assert "index" not in data


def test_respond_done_and_completion():
    # Start task
    create_res = client.post("/v1/sessions", json={"task": "Create a mind map"})
    assert create_res.status_code == 200
    session_id = create_res.json()["session_id"]

    # Step 1
    assert create_res.json()["status"] == "step"

    # Tap Done repeatedly until complete
    is_complete = False
    for _ in range(15):
        done_res = client.post(f"/v1/sessions/{session_id}/respond", json={"response": "done"})
        assert done_res.status_code == 200
        step_data = done_res.json()
        assert "step_count" not in step_data
        assert "total_steps" not in step_data

        if step_data["status"] == "complete":
            is_complete = True
            break
        else:
            assert step_data["status"] == "step"
            assert step_data["step"] is not None

    assert is_complete is True


def test_respond_confused():
    create_res = client.post("/v1/sessions", json={"task": "Write a research paper"})
    assert create_res.status_code == 200
    session_id = create_res.json()["session_id"]

    confused_res = client.post(f"/v1/sessions/{session_id}/respond", json={"response": "confused"})
    assert confused_res.status_code == 200
    data = confused_res.json()

    assert data["status"] == "step"
    assert data["variant"] == "explained"
    assert data["step"] is not None
    assert len(data["step"].split()) <= 30


def test_respond_too_big():
    create_res = client.post("/v1/sessions", json={"task": "Create an infographic"})
    assert create_res.status_code == 200
    session_id = create_res.json()["session_id"]

    too_big_res = client.post(f"/v1/sessions/{session_id}/respond", json={"response": "too_big"})
    assert too_big_res.status_code == 200
    data = too_big_res.json()

    assert data["status"] == "step"
    assert data["variant"] == "smaller"
    assert data["step"] is not None
    assert len(data["step"].split()) <= 20


def test_respond_not_now_and_resume():
    create_res = client.post("/v1/sessions", json={"task": "Prepare a formal project report"})
    assert create_res.status_code == 200
    session_id = create_res.json()["session_id"]
    current_step = create_res.json()["step"]

    # Tap Not now
    not_now_res = client.post(f"/v1/sessions/{session_id}/respond", json={"response": "not_now"})
    assert not_now_res.status_code == 200
    data = not_now_res.json()
    assert data["status"] == "rest"
    assert data["step"] == current_step

    # Resume same
    resume_same_res = client.post(f"/v1/sessions/{session_id}/resume", json={"mode": "same"})
    assert resume_same_res.status_code == 200
    assert resume_same_res.json()["status"] == "step"
    assert resume_same_res.json()["step"] == current_step

    # Pause again and resume smaller
    client.post(f"/v1/sessions/{session_id}/respond", json={"response": "not_now"})
    resume_smaller_res = client.post(f"/v1/sessions/{session_id}/resume", json={"mode": "smaller"})
    assert resume_smaller_res.status_code == 200
    smaller_data = resume_smaller_res.json()
    assert smaller_data["status"] == "step"
    assert smaller_data["variant"] == "smaller"


def test_respond_cant_use_app():
    create_res = client.post("/v1/sessions", json={"task": "Create a college event poster"})
    assert create_res.status_code == 200
    session_id = create_res.json()["session_id"]
    original_app = create_res.json()["app"]["name"]

    cant_use_res = client.post(f"/v1/sessions/{session_id}/respond", json={"response": "cant_use_app"})
    assert cant_use_res.status_code == 200
    data = cant_use_res.json()
    assert data["status"] == "step"
    assert data["step"] is not None


def test_delete_session():
    create_res = client.post("/v1/sessions", json={"task": "Design screens for my app"})
    assert create_res.status_code == 200
    session_id = create_res.json()["session_id"]

    # Delete session
    del_res = client.delete(f"/v1/sessions/{session_id}")
    assert del_res.status_code == 204

    # Subsequent respond returns 404
    followup_res = client.post(f"/v1/sessions/{session_id}/respond", json={"response": "done"})
    assert followup_res.status_code == 404
    assert followup_res.json()["error"] == "session_not_found"


def test_step_1_exactness_all_catalogue_tasks():
    # AC #30: Step 1 equals matched row's first_tiny_action for 100% of tested inputs
    sample_rows = retriever.rows[:10]
    for row in sample_rows:
        res = client.post("/v1/sessions", json={"task": row.task})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "step"
        assert data["step"] == row.first_tiny_action
        assert data["app"]["name"] == row.recommended_app
