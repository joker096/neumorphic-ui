# 12. amoCRM Connector — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §55 (first CRM), §18 (interface), §19 (capabilities).

## 1. Position

First CRM connector (§55); reference implementation of the `Connector` interface (sub-doc 03).

## 2. Auth

OAuth2 (authorization_code) → `access_token` + `refresh_token`, stored in `integration_credentials.encrypted_value` (§14). Refresh before expiry.

## 3. Entities

`contacts`, `companies`, `leads`, `deals` (custom pipelines/stages), `tasks`, `users`.

## 4. Capabilities (§19)

read / create / update all; webhooks via amoCRM outgoing → Hub `/webhooks/amocrm/:integrationId` (§54); incremental sync via `updated_at`.

## 5. API base

`https://{subdomain}.amocrm.ru/api/v4/...`

## 6. Adapter

`AmoAdapter`: `_embedded` payload → Canonical. `lead` → Deal, `contact` → Contact, `company` → Company.

## 7. Tests (§78)

connect / auth / list (pagination) / create / update / rate-limit / webhook / error.
