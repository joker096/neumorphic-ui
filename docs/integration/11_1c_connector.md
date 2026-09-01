# 11. 1C Connector — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §55 (priority), §59 (transport), §60 (entities), §61 (Agent).

## 1. Position

1C is a priority provider (§55) and the most complex (on-prem ERP, no native webhooks).

## 2. Transport modes (§59)

`HTTP API` / `OData` / `Web Service` / `External Processing` / `Extension` / `Integration Agent`.

## 3. Integration Agent (§61) — recommended

```text
local 1C → Agent (Windows service) → outbound encrypted TLS → Hub
```

No inbound from internet; Agent handles firewall/NAT. Default mode.

## 4. Entities (§60)

Контрагенты, Организации, Контактные лица, Товары, Заказы, Счета, Ответственные, Статусы.

## 5. Capabilities

- read (contacts/companies/deals/orders), incremental sync via OData `$filter` on `ДатаИзменения`.
- webhooks = Agent polling → push to Hub `/webhooks/1c/:integrationId` (§54).

## 6. Adapter

`1CAdapter`: 1C types → Canonical (sub-doc 02 / §8). `ДатаВремя` → ISO; enum refs → canonical enums (`mapEnum`, §17).

## 7. Default mapping

Контрагент → Company, КонтактноеЛицо → Contact, Сделка → Deal, Товар → Product, Счет → Invoice.
