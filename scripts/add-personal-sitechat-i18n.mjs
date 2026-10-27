/**
 * One-off: add the personal site-chat i18n keys to all 8 locales.
 * Inserts keys after existing anchor lines (settings.companySubtitle,
 * company.siteChatSection) preserving indentation and formatting.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const localesDir = join(here, '..', 'src', 'locales');
const locales = ['en', 'ru', 'de', 'es', 'fr', 'ja', 'ko', 'zh'];

const T = {
  settingsSiteEmbed: {
    en: 'Website Embed', ru: 'Встраивание на сайт', de: 'Website-Einbettung',
    es: 'Incrustar en el sitio', fr: 'Intégration sur le site', ja: 'サイト埋め込み',
    ko: '사이트 임베드', zh: '网站嵌入',
  },
  settingsSiteEmbedSubtitle: {
    en: 'Embed chat on any site', ru: 'Код встраивания чата для любого сайта', de: 'Einbettungs-Snippet für jede Website',
    es: 'Consigue un fragmento para cualquier sitio', fr: 'Extrait d\'intégration pour n\'importe quel site', ja: '任意のサイト用の埋め込みコード',
    ko: '모든 사이트용 임베드 코드', zh: '获取任意网站的嵌入代码',
  },
  companyRelayOnline: {
    en: 'Online', ru: 'Онлайн', de: 'Online', es: 'En línea', fr: 'En ligne', ja: 'オンライン', ko: '온라인', zh: '在线',
  },
  companyRelayOffline: {
    en: 'Offline', ru: 'Оффлайн', de: 'Offline', es: 'Sin conexión', fr: 'Hors ligne', ja: 'オフライン', ko: '오프라인', zh: '离线',
  },
  companyRelayConnecting: {
    en: 'Connecting…', ru: 'Подключение…', de: 'Verbinde…', es: 'Conectando…', fr: 'Connexion…', ja: '接続中…', ko: '연결 중…', zh: '正在连接…',
  },
  companySiteConversations: {
    en: 'Conversation', ru: 'Переписка', de: 'Unterhaltung', es: 'Conversación', fr: 'Conversation', ja: '会話', ko: '대화', zh: '对话',
  },
  companySiteConversationEmpty: {
    en: 'No messages yet — visitors appear here in real time.',
    ru: 'Пока нет сообщений — посетители появятся здесь в реальном времени.',
    de: 'Noch keine Nachrichten — Besucher erscheinen hier in Echtzeit.',
    es: 'Aún no hay mensajes — los visitantes aparecen aquí en tiempo real.',
    fr: 'Pas encore de messages — les visiteurs apparaissent ici en temps réel.',
    ja: 'メッセージはまだありません。訪問者はリアルタイムでここに表示されます。',
    ko: '아직 메시지가 없습니다. 방문자는 실시간으로 여기에 표시됩니다.',
    zh: '暂无消息 — 访客会实时显示在这里。',
  },
  companyRemoveSiteChat: {
    en: 'Delete this site chat', ru: 'Удалить этот чат сайта', de: 'Diesen Website-Chat löschen',
    es: 'Eliminar este chat del sitio', fr: 'Supprimer ce chat de site', ja: 'このサイトチャットを削除',
    ko: '이 사이트 채팅 삭제', zh: '删除此网站聊天',
  },
};

const INSERT_AFTER = [
  {
    anchor: 'companySubtitle',
    build: (loc) => [
      ['siteEmbed', T.settingsSiteEmbed[loc]],
      ['siteEmbedSubtitle', T.settingsSiteEmbedSubtitle[loc]],
    ],
  },
  {
    anchor: 'siteChatSection',
    build: (loc) => [
      ['relayOnline', T.companyRelayOnline[loc]],
      ['relayOffline', T.companyRelayOffline[loc]],
      ['relayConnecting', T.companyRelayConnecting[loc]],
      ['siteConversations', T.companySiteConversations[loc]],
      ['siteConversationEmpty', T.companySiteConversationEmpty[loc]],
      ['removeSiteChat', T.companyRemoveSiteChat[loc]],
    ],
  },
];

function insertAfterAnchor(txt, anchor, lines) {
  const idx = txt.indexOf(`"${anchor}":`);
  if (idx < 0) throw new Error(`anchor not found: ${anchor}`);
  // line start
  const lineStart = txt.lastIndexOf('\n', idx) + 1;
  const lineEnd = txt.indexOf('\n', idx);
  const end = lineEnd < 0 ? txt.length : lineEnd;
  const line = txt.slice(lineStart, end);
  const indent = line.match(/^\s*/)[0];
  const insert = lines.map(([k, v]) => `${indent}"${k}": ${JSON.stringify(v)},`).join('\n');
  return txt.slice(0, end + 1) + insert + '\n' + txt.slice(end + 1);
}

for (const loc of locales) {
  const file = join(localesDir, `${loc}.json`);
  let txt = readFileSync(file, 'utf8');
  for (const { anchor, build } of INSERT_AFTER) {
    if (txt.includes(`"${anchor}":`)) {
      const lines = build(loc);
      // skip if already present
      const done = lines.every(([k]) => txt.includes(`"${k}":`));
      if (!done) txt = insertAfterAnchor(txt, anchor, lines);
    }
  }
  writeFileSync(file, txt);
  JSON.parse(txt); // verify valid
  console.log(`ok ${loc}`);
}
