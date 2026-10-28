# Strict Single-Language Interface Policy

Open Sangam shows **one interface language at a time**. The language switch in
the navbar controls the whole app.

## Rules

1. **Never render both Tamil and English in one label.**
   - Do not show `தமிழ் · English` in buttons, chips, headings or badges.
   - Use the selected language only.
2. **Data stays bilingual; presentation is not.**
   - Corpus fields (`ta`, `en`, `urai`, `english`) may contain both languages.
   - Split or select at render time with the global language state.
3. **Technical identifiers may remain Latin.**
   - Record ids (`natrinai_001`), code, file names and graph ids are not UI
     language. They may appear in monospace where needed.
4. **Scholarly content keeps its own language layer.**
   - The English translation layer shows English when selected.
   - The Tamil original/urai layers show Tamil.
   - The reader must not silently mix translation languages in one layer.
5. **Tagged language pairs are hidden globally.**
   - `html[data-ui-language="ta"] [lang="en"]` is hidden.
   - `html[data-ui-language="en"] [lang="ta"]` is hidden.
   - Prefer splitting labels instead of relying on this CSS fallback.

## Implementation

- Global state: `frontend/src/store/useAppStore.js` → `language`.
- Switch: `frontend/src/components/ui/LanguageToggle.jsx`.
- Single-language render helper: `frontend/src/components/ui/LanguageText.jsx`.
- Label splitting: `splitLabel()` in `frontend/src/data/chipLabels.js`.
- Chips and badges use the selected language only.

## Review checklist

- [ ] No `Tamil · English` in primary UI.
- [ ] Tamil mode has no English UI copy.
- [ ] English mode has no Tamil UI copy except source quotations and proper names.
- [ ] Graph node labels show one language.
- [ ] Artifact reader labels show one language.
- [ ] Avai answers may contain source quotations, but UI chrome stays one language.
