# 14. CSV / XLSX Import — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §56 (CSV), §57 (XLSX), §40 (checkpoint), §17 (transforms).

## 1. CSV pipeline (§56)

```text
Upload → File Parser → Encoding Detection (UTF-8 / Windows-1251)
  → Header Detection → Preview → Mapping (04) → Validation → Import Queue (05)
```

Delimiters: `,` `;` TAB.

## 2. XLSX pipeline (§57)

```text
Upload → Workbook Parser → Sheet Selection → Header Detection
  → Preview → Mapping (04) → Validation → Import
```

## 3. Encoding

Auto-detect BOM + charset; Windows-1251 → UTF-8. Bad rows → job item `FAILED` (§23).

## 4. Mapping

Reuse `MappingEngine` (sub-doc 04). Unknown columns → `customFields`.

## 5. Large files

Stream rows → enqueue pages (checkpoint §40). Never load whole file into memory.

## 6. Custom REST (§58)

User-supplied Base URL / Auth / Headers / Endpoints / Pagination / data-id-updated-at paths; same mapping flow.
