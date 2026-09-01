# 07. Deduplication — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §12 (external ids), §28 (priority), §29 (score), §30 (merge), §72 (consistency).

## 1. Identity store (01 §2.3)

`integration_external_ids`: `(integration_id, entity_type, external_id)` → `internal_id`. Authoritative mapping.

## 2. Match priority (§28)

```text
external_id → exact phone → exact email → INN → provider id → composite
```

**Never** auto-merge on name only (§88).

## 3. Duplicate score (§29)

```text
phone +50, email +40, INN +50, company +10, name +10
≥90   → AUTO (link)
70–89 → REVIEW (queue manual)
<70   → NEW
```

## 4. Merge (§30)

`MergeService.merge(local, external, strategy)`: field-level, prefer non-empty; per-field source of truth (§33) wins.

## 5. Flow

On create:
1. compute matches by priority;
2. score;
3. `NEW` → insert + write external id;
4. `AUTO` → link to existing internal_id;
5. `REVIEW` → open conflict record (§31 / sub-doc 10).

## 6. Consistency (§72)

External id written **before** canonical committed.
