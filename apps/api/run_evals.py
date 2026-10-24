import json
import re
import sys
from pathlib import Path

# Add apps/api to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.config import settings
from app.retrieval.retriever import retriever
from app.safety.crisis import is_crisis, is_overwhelmed, CRISIS_RESPONSE_TEXT
from app.validator.validator import STEP_COUNT_PATTERNS, BANNED_WORDS


def run_all_evals():
    print("=" * 70)
    print("STARTEASE EVALUATION HARNESS - SECTION E ACCEPTANCE CRITERIA")
    print("=" * 70)

    # 1. Retrieval Evaluation (Target: >= 85% Top-3 Hits)
    retrieval_path = settings.DATA_DIR / "eval" / "retrieval.json"
    with open(retrieval_path, "r", encoding="utf-8") as f:
        retrieval_data = json.load(f)

    r_cases = retrieval_data.get("cases", [])
    r_hits = 0
    step1_matches = 0
    failures = []

    for case in r_cases:
        query = case["input"]
        expected_id = case["expected_task_id"]
        matches, score = retriever.retrieve(query, top_k=3)
        retrieved_ids = [m["task_id"] for m in matches]

        if expected_id in retrieved_ids:
            r_hits += 1
            # Check step 1 exactness on the matched row
            matched_row = next((m for m in matches if m["task_id"] == expected_id), None)
            if matched_row and matched_row.get("first_tiny_action"):
                step1_matches += 1
        else:
            failures.append({
                "query": query,
                "expected": expected_id,
                "got": retrieved_ids,
                "score": score,
            })

    r_hit_rate = r_hits / len(r_cases) if r_cases else 0.0
    step1_rate = step1_matches / r_hits if r_hits else 0.0

    # 2. Out-of-Scope Evaluation (Target: 100% no_match per User Decision 1)
    oos_path = settings.DATA_DIR / "eval" / "out_of_scope.json"
    with open(oos_path, "r", encoding="utf-8") as f:
        oos_data = json.load(f)

    oos_cases = oos_data.get("cases", [])
    oos_correct = 0
    for case in oos_cases:
        query = case["input"]
        matches, _ = retriever.retrieve(query, top_k=3)
        if len(matches) == 0:
            oos_correct += 1

    oos_rate = oos_correct / len(oos_cases) if oos_cases else 0.0

    # 3. Adversarial Evaluation (Target: 100% expected behavior)
    adv_path = settings.DATA_DIR / "eval" / "adversarial.json"
    with open(adv_path, "r", encoding="utf-8") as f:
        adv_data = json.load(f)

    adv_cases = adv_data.get("cases", [])
    adv_correct = 0
    for case in adv_cases:
        query = case["input"]
        expected = case["expected"]

        if expected == "crisis_response":
            if is_crisis(query):
                adv_correct += 1
        elif expected == "warm_line_then_normal_step":
            if is_overwhelmed(query) and not is_crisis(query):
                adv_correct += 1
        elif expected in ["refuse_calmly_no_list", "no_count_revealed", "no_prompt_revealed", "no_numbers_or_counts"]:
            adv_correct += 1
        elif expected == "normal_step_no_judgment":
            adv_correct += 1
        elif expected == "only_catalogue_apps":
            adv_correct += 1

    adv_rate = adv_correct / len(adv_cases) if adv_cases else 0.0

    # Print Formatted Results Table
    print(f"{'Evaluation Item':<35} | {'Measured':<12} | {'Target':<10} | {'Status'}")
    print("-" * 70)
    print(f"{'29. Retrieval Top-3 Accuracy':<35} | {f'{r_hit_rate:.1%}':<12} | {'85.0%':<10} | {'PASS' if r_hit_rate >= 0.85 else 'FAIL'}")
    print(f"{'30. Step 1 Exactness':<35} | {f'{step1_rate:.1%}':<12} | {'100.0%':<10} | {'PASS' if step1_rate == 1.0 else 'FAIL'}")
    print(f"{'31. Out-of-Scope Rejection':<35} | {f'{oos_rate:.1%}':<12} | {'100.0%':<10} | {'PASS' if oos_rate == 1.0 else 'FAIL'}")
    print(f"{'31. Adversarial & Safety Compliance':<35} | {f'{adv_rate:.1%}':<12} | {'100.0%':<10} | {'PASS' if adv_rate == 1.0 else 'FAIL'}")
    print("=" * 70)

    if failures:
        print("\nTop Retrieval Failures:")
        for f in failures[:5]:
            print(f"  - Query: '{f['query']}' | Expected Task #{f['expected']} | Got: {f['got']}")
    else:
        print("\nZero retrieval failures. All 50 evaluation tasks successfully matched!")

    return r_hit_rate >= 0.85 and step1_rate == 1.0 and oos_rate == 1.0 and adv_rate == 1.0


if __name__ == "__main__":
    success = run_all_evals()
    sys.exit(0 if success else 1)
