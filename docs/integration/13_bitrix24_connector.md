# 13. Bitrix24 Connector — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §55, §18, §19.

## 1. Position

Second CRM (§55).

## 2. Auth

OAuth2 (server-side) per portal/user; token in `integration_credentials.encrypted_value` (§14).

## 3. Entities

CRM: `contact`, `company`, `lead`, `deal`, `product`, `task`, `quote`.

## 4. Capabilities (§19)

read / create / update; REST `crm.*.list` + `crm.*.add/update`; webhooks via `ONCRMINST` events → Hub (§54).

## 5. API base

`https://{portal}.bitrix24.ru/rest/{userId}/{token}/...`

## 6. Adapter

`B24Adapter`: contact/company/lead/deal → Canonical. Multi-field phones/emails → normalized array (§17).

## 7. Pagination & rate limit

`start` offset; default ~2 req/s → centralized limiter (§43).
