# பங்களிப்பு வழிகாட்டி · Contributing to Open Sangam

சங்கத் தமிழ் இலக்கியத்தை அனைவருக்கும் திறந்ததாக வைக்கும் இந்தத் திட்டத்துக்குப் பங்களிப்பதற்கு நன்றி.
Thank you for helping keep Classical Tamil literature open to everyone.

## எதில் உதவலாம் · Where you can help

- **பாடல் திருத்தம் · Verse corrections**: எழுத்துப்பிழை, வரி விடுபாடு, புலவர் பெயர், தலைப்பு. திருத்த வேண்டிய பாடலின் எண்ணையும் ஆதாரத்தையும் தாருங்கள். Use the "Verse correction" issue template and name your source.
- **உரை, மொழிபெயர்ப்பு · Urai and translations**: எல்லா உரையும் அறிஞர் சரிபார்க்கும் வரை `verified: false` ஆகவே இருக்கும். Everything stays `verified: false` until a scholar signs it off. Please do not flip that flag in a PR.
- **குறியீடு · Code**: `frontend/` (React + Vite), `backend/` (Python pipeline, Firebase functions), `agents/` (Avai).
- **ஆவணம் · Docs** and bug reports.

## தமிழ் முதன்மை · Tamil first

பயனர் பார்க்கும் எல்லா உரையும் தமிழில் முதலில் இருக்க வேண்டும்; ஆங்கிலம் அதற்குத் துணை. Tamil text must never be letter-spaced (no `tracking-*` on Tamil), and UI strings should read naturally in Tamil, not as a word-for-word translation.

## உரை மூலம், உரிமம் · Sources and licensing

- Add text to the corpus only if you can say where it came from and under what terms you may reuse it. If you are not sure, open an issue first instead of a PR.
- Do not paste text from sites or books you do not have permission to reuse.
- Do not add text drafted by a foreign-hosted AI model (Gemini, OpenAI and similar) to the corpus. This project keeps its AI work on models we can run ourselves.
- Code in this repository is under GPL-3.0 (see `LICENSE`). The licence for the corpus data is being sorted out; until that is settled, do not assume data files carry the code licence.
- Never copy code from private repositories into this one.

## Pull request வழிமுறை · Workflow

1. Fork, then branch from `main` as `fix/<short-name>` or `feat/<short-name>`.
2. Keep each PR small and about one thing.
3. Run what applies before you push:
   - Frontend: `cd frontend && npm ci && npm run lint && npm run build`
   - Firebase functions: `cd backend/functions && npm ci && npm test`
   - Python: `pip install -r backend/python/requirements.txt && pytest backend/python/tests agents/avai/tests`
4. Fill in the pull request template. Never commit secrets, `.env` files, or API keys.
5. Do not push to `main`; a maintainer merges after review.

## நடத்தை · Conduct

Be kind and assume good faith. Argue about the poems, not the people. Maintainers may close issues or PRs that are abusive or off-topic.

## பாதுகாப்புச் சிக்கல்கள் · Security

Please do not open a public issue for a security problem. See [SECURITY.md](./SECURITY.md).
