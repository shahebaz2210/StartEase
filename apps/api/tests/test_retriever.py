import json
import os
from pathlib import Path
import pytest
from app.retrieval.retriever import retriever
from app.config import settings


def test_catalogue_rows_count():
    assert len(retriever.rows) == 50
    for row in retriever.rows:
        assert row.task
        assert row.task_category
        assert row.desired_output
        assert row.recommended_app
        assert row.reason
        assert row.first_tiny_action.startswith("Open ")


def test_retrieval_evaluation_set():
    eval_path = settings.DATA_DIR / "eval" / "retrieval.json"
    assert eval_path.exists(), f"Evaluation file not found at {eval_path}"

    with open(eval_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    cases = data.get("cases", [])
    assert len(cases) > 0

    hits = 0
    total = len(cases)
    failures = []

    for case in cases:
        query = case["input"]
        expected_id = case["expected_task_id"]
        matches, score = retriever.retrieve(query, top_k=3)
        retrieved_ids = [m["task_id"] for m in matches]

        if expected_id in retrieved_ids:
            hits += 1
        else:
            failures.append({
                "query": query,
                "expected_id": expected_id,
                "retrieved_ids": retrieved_ids,
                "top_score": score,
            })

    hit_rate = hits / total
    print(f"\nRetrieval Evaluation: {hits}/{total} ({hit_rate:.1%}) Top-3 Hits")
    if failures:
        print(f"Top failures (first 5): {failures[:5]}")

    # Acceptance Criteria E item 29: at least 85% top-3
    assert hit_rate >= 0.85, f"Retrieval hit rate {hit_rate:.1%} fell below target 85%"


def test_out_of_scope_evaluation_set():
    eval_path = settings.DATA_DIR / "eval" / "out_of_scope.json"
    assert eval_path.exists(), f"Evaluation file not found at {eval_path}"

    with open(eval_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    cases = data.get("cases", [])
    for case in cases:
        query = case["input"]
        # All inputs in out_of_scope.json should result in no match per user decision 1
        matches, score = retriever.retrieve(query, top_k=3)
        # Should either have no matches or score below threshold
        assert len(matches) == 0, f"Out of scope query was falsely matched: {query} -> {[m['task'] for m in matches]}"
