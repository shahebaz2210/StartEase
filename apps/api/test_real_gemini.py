import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.config import settings
from app.retrieval.retriever import retriever
from app.llm.gemini_client import gemini_client
from app.safety.crisis import is_crisis, CRISIS_RESPONSE_TEXT
from app.validator.validator import validate_step, validate_explanation, validate_tone

print("=" * 70)
print(f"RUNNING LIVE GEMINI TEST (Model: {settings.GEMINI_MODEL})")
print("=" * 70)

# 1. Normal task
task = "Design a college event poster"
matches, score = retriever.retrieve(task, top_k=3)
print(f"\n1. Normal Task: '{task}' (Top score: {score:.4f}, App: {matches[0]['recommended_app']})")
matched_id, app, steps = gemini_client.generate_task_steps(task, matches)
print(f"   Matched Row ID: {matched_id}")
print(f"   Recommended App: {app}")
print(f"   Generated Steps ({len(steps)} total):")
for idx, s in enumerate(steps):
    ok_step, reason = validate_step(s)
    print(f"     Step {idx+1}: {s} [Valid: {ok_step}]")

step1 = steps[0]

# 2. Confused
print(f"\n2. Confused on Step: '{step1}'")
explanation = gemini_client.explain_step_confused(step1, task, app)
ok_exp, exp_reason = validate_explanation(explanation)
print(f"   Explanation: '{explanation}' [Valid: {ok_exp}, Words: {len(explanation.split())}]")

# 3. Too Big
print(f"\n3. Too Big on Step: '{step1}'")
smaller_steps = gemini_client.decompose_step_too_big(step1, task, app)
print(f"   Smaller Steps ({len(smaller_steps)} steps):")
for idx, s in enumerate(smaller_steps):
    ok_s, s_reason = validate_step(s)
    print(f"     Micro-step {idx+1}: {s} [Valid: {ok_s}, Words: {len(s.split())}]")

# 4. I can't use this app
print(f"\n4. Can't Use This App: '{app}' for task '{task}'")
new_app, new_first_step = gemini_client.substitute_app(task, app, matches)
print(f"   Alternative App: {new_app}")
print(f"   Alternative First Step: '{new_first_step}'")

# 5. Out of scope input
oos_task = "what's the weather today"
print(f"\n5. Out-of-Scope Input: '{oos_task}'")
oos_matches, oos_score = retriever.retrieve(oos_task, top_k=3)
print(f"   Matches returned: {len(oos_matches)} (Score: {oos_score:.4f})")
if len(oos_matches) == 0:
    print("   Output: Gentle No-Match Response ('I can't find a good match for that yet...')")

# 6. Crisis input
crisis_text = "I want to end my life"
print(f"\n6. Crisis Input: '{crisis_text}'")
crisis_detected = is_crisis(crisis_text)
print(f"   Crisis Flag: {crisis_detected}")
if crisis_detected:
    print(f"   Output (Exact text from docs/safety.md, Zero Gemini steps):\n{CRISIS_RESPONSE_TEXT}")

print("\n" + "=" * 70)
print("LIVE GEMINI TEST COMPLETE")
print("=" * 70)
