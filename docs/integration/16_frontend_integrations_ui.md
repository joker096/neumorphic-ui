# 16. Frontend Integrations UI — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §3 (structure), §4–§6 (UI), §16 (mapping editor).

> NOTE: current app is local-first P2P. This UI is greenfield (aspirational §3 `src/app/pages/integrations` + `features/integrations`).

## 1. Pages

- **Integrations list**: provider cards, connection status, health (§74).
- **Integration details** tabs: Overview / Entities / Mapping / Import / Sync / Conflicts / Logs.

## 2. Import Wizard (§4–§6, 10 steps)

```text
1 Select provider  2 Connect  3 Choose entities  4 Auto-map
5 Edit mapping     6 Preview  7 Dry run          8 Confirm
9 Progress (checkpoint)  10 Result
```

No skipping Preview for bulk (§85).

## 3. Mapping editor

Per-field source → target + transform picker (sub-doc 04).

## 4. Conflict center

List + resolve `MANUAL` (sub-doc 10).

## 5. Rules

UI never calls provider API directly — only `/api/v1/integrations` (§1.1). No secrets shown (§47).
