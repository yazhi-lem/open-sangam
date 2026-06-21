# Data Governance & Ethics Policy

## 1. Cultural Content Handling

- All Sangam-era texts are in the public domain (composed c. 300 BCE – 300 CE).
- Source attributions must be preserved in every exported or shared dataset.
- Cultural annotations must accurately represent the scholarly consensus; contested interpretations must be labeled as such.

## 2. AI-Generated Content Transparency

- Every AI-generated translation (Urai or English) must be labeled with `"verified": false` until reviewed by a human scholar.
- The UI must display a visible indicator when a translation is AI-generated and unverified.
- Scholars may flag translations for revision via the community contribution layer.

## 3. Data Minimization

- No personally identifiable information is collected beyond what is required for authentication.
- Anonymous users may read all content; authentication is required only to submit contributions.

## 4. Licensing

- Verse data and translations produced by the project: **CC BY-SA 4.0**
- Contributors agree that their edits are released under CC BY-SA 4.0.
- Third-party fonts (Noto) and libraries remain under their respective open-source licenses.

## 5. Human-in-the-Loop Protocol

1. Gemini generates a draft translation.
2. A designated scholar reviews the draft in the Contribution UI.
3. On approval, `verified` is set to `true` and the reviewer's name is recorded.
4. Revisions are versioned; no history is deleted.

## 6. Prohibited Uses

- Do not use AI translations as authoritative academic citations without scholar verification.
- Do not scrape this platform's data for commercial AI training without explicit permission.
