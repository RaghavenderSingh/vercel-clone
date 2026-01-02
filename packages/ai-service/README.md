# AI Service

The **AI Service** is a specialized module providing intelligence to the Titan platform. Its primary function is the "Auto-Fixer," which analyzes failed build logs and suggests code corrections.

## Features

### Error Analysis
1.  Receives build error logs from the Build Worker.
2.  Uses LLMs (Large Language Models) to understand the context.
3.  Returns a structured `FixSuggestion` object containing:
    *   Explanations
    *   Code Diff
    *   Confidence Score

### Provider Abstraction
Designed to be model-agnostic. Currently supports:
*   **Google Gemini** (via `GoogleGenerativeAI`)
*   **Anthropic Claude** (Architecture ready, pending implementation)

## Integration

The AI Service is invoked by the `Build Worker` when a `Deployment` enters the `ERROR` state. It is not exposed directly to the public internet.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_AI_API_KEY` | Key for Gemini API |
| `AI_PROVIDER` | `gemini` or `claude` |

## Development

Testing the service in isolation:

```bash
bun test
```
