#!/usr/bin/env node
// Создаёт демо-виджет встраиваемого чата ("demo") в БД мессенджера.
//   npm run embed:seed
// Повторный запуск идемпотентен (INSERT OR IGNORE по id).
import { getDb } from "../server/db.ts";

const db = getDb();

const insert = db.prepare(`
  INSERT OR IGNORE INTO embed_widgets (
    id, name, website_domains, title, subtitle, position, theme, locale,
    require_prechat_form, offline_form_enabled, file_upload, emoji,
    rating_enabled, operators_online, enabled, created_at
  ) VALUES (
    'demo', 'Демо-виджет', 'localhost, demo.example.com', 'Чат поддержки',
    'Мы на связи с 9:00 до 18:00', 'bottom-right',
    '{"primaryColor":"#2563eb","bubbleColor":"#2563eb"}', 'ru',
    1, 1, 1, 1, 1, 1, 1, datetime('now')
  )
`);

insert.run();
console.log('[embed:seed] демо-виджет "demo" готов (INSERT OR IGNORE).');
console.log('[embed:seed] откройте /demo.html (или ?widgetId=demo на любом сайте из allowlist).');
