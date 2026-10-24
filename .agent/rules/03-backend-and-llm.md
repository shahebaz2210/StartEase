# Backend and LLM
- FastAPI. Follow docs/openapi.yaml exactly. Responses never include counts, indexes or lists of steps.
- Use the prompts in docs/prompts.md. Ask Gemini for JSON and validate every reply.
- The app and step 1 come from the matched catalogue row. The model cannot invent an app.
- Check for crisis language before retrieval (docs/safety.md).
- Every Gemini call has a timeout, one retry, a short backoff on 429, and a safe fallback (the matched row's first_tiny_action).
- Cache repeated inputs. Respect SESSION_CALL_LIMIT and DAILY_CALL_LIMIT.
- The Gemini key is in environment variables on the server only.
- Never log task text or step text.
