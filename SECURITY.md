# பாதுகாப்புக் கொள்கை · Security Policy

## பாதிப்பைத் தெரிவிக்க · Reporting a vulnerability

பொது issue-வில் பாதுகாப்புக் குறைபாட்டை எழுத வேண்டாம். Please do not report security problems in a public issue or pull request.

Use GitHub's private reporting instead: open the **Security** tab of this repository and choose **Report a vulnerability**
(<https://github.com/yazhi-lem/open-sangam/security/advisories/new>).

Please include what you found, the steps to reproduce it, and which part is affected (frontend, Firebase functions, Avai API, data pipeline).

## நாங்கள் செய்வது · What to expect

- We aim to acknowledge a report within 7 days and to tell you what we plan to do about it.
- Please give us reasonable time to fix a problem before you share it publicly.
- This is a small volunteer-run project; there is no bug bounty.

## எல்லை · Scope

In scope:

- `frontend/` (the web app)
- `backend/functions/` (Firebase Cloud Functions)
- `agents/avai/` (the Avai Ask API)
- `firestore.rules`
- CI/CD workflows in `.github/workflows/`

Out of scope: problems in third-party services we depend on (report those to the vendor), and issues that need physical access to a device.

## ரகசியங்கள் · Secrets

If you find an API key, token or other secret committed to this repository, report it privately as above. Do not use it.
