# 17. CRM ↔ Messenger Bridge — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §62 (CRM→Messenger), §63 (Messenger→CRM), §64 (context), §65 (history).

## 1. CRM → Messenger (§62)

In chat, open **client card**: Company / Deal / Amount / Stage / Manager / Tasks / Last activity (read from Canonical via `/:id/mappings` or dedicated read API).

## 2. Messenger → CRM (§63)

From chat, the user can: create Deal / Task, update client, change stage, add Note, tag, open CRM. Writes go via `Connector` (sub-doc 03) → provider.

## 3. Conversation context (§64)

```text
External Contact → Mess&Anger Contact → Conversation → Messages
```

Store `source`, `external_id`, `direction`, `author`, `timestamp`, `content`, `attachments`.

## 4. History import (§65)

Separate module. MVP entities: contacts / companies / deals / tasks / comments / statuses. Full message history later.
