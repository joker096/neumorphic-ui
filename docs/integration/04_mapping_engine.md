# 04. Mapping Engine — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §16 (pipeline), §17 (transforms), §50 (mapping API), §72 (consistency). Table: `integration_mappings` (01).

## 1. Pipeline (§16)

```text
map → transform → normalize → validate → canonical
```

## 2. Transforms (§17) — pure & idempotent

- `normalizePhone` — E.164-ish, strip punctuation.
- `normalizeEmail` — lowercase, trim.
- `trim` — whitespace.
- `parseDate` — ISO / common locales → ISO `YYYY-MM-DD` (or timestamp).
- `parseNumber` — decimal/currency → number.
- `mapEnum` — provider value → canonical enum via mapping table.
- `defaultIfEmpty` — fallback value.
- `splitList` — comma/semicolon → array.

## 3. Mapping record (01 §2.4)

`integration_mappings`: `source_field`, `target_field`, `transform`, `default_value`, `required`, `enabled`.

## 4. Engine

```ts
interface MappingResult {
  canonical: Partial<CanonicalEntity>;
  customFields: Record<string, unknown>;  // unknown source fields (§1.3)
  errors: MappingError[];
  warnings: MappingWarning[];
}
class MappingEngine {
  apply(source: Record<string, unknown>, mappings: Mapping[]): MappingResult;
}
```

- For each **enabled** mapping: read `source[source_field]` → apply `transform` → coerce to canonical type → if `required` and empty → `VALIDATION` error.
- Unknown source fields → `customFields` (never provider-shaped core columns, §88).

## 5. Preview (§50 `POST /:id/mappings/preview`)

Runs `apply` without writing; returns mapped sample + per-row errors.

## 6. Validation (§72)

After mapping, canonical must satisfy the Canonical model (sub-doc 02 / §8). Invalid → job item `status=FAILED`, `error_code=VALIDATION`.

## 7. Auto-suggest

On `connect`: read a provider sample, infer mappings by field-name + type heuristic; user edits in the Import Wizard / Mapping UI (sub-doc 16).

## 8. Rules

- No provider field name stored in core tables (§88).
- Transforms are unit-tested (sub-doc 19).
