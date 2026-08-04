const fs = require('fs');
const files = ['de.json', 'es.json', 'fr.json', 'ja.json', 'ko.json'];
const keys = {
  cloudPasswordTOTP: 'Cloud Password (TOTP)',
  autoWipe: 'Auto-wipe (Dead Man\'s Switch)',
  restoreBtn: 'Restore',
  cancelBtn: 'Cancel',
  priorityContactsTitle: 'Priority contacts',
  priorityContactsSubtitle: 'Comma-separated names that bypass DND',
  mediaAutoLoad: 'Media auto-load',
  forwardingMetadata: 'Forwarding & Metadata',
  deliveryReceipts: 'Delivery receipts',
  deliveryReceiptsSubtitle: 'Show sent/delivered status for outgoing messages',
  readReceiptsSettings: 'Read receipts',
  readReceiptsSubtitle: 'Show read status when messages are opened',
  typingIndicatorsSettings: 'Typing indicators',
  typingIndicatorsSubtitle: 'Show when the other side is typing',
  deviceManagerTitle: 'Devices',
  deviceWebBrowserCurrent: 'Web Browser (Current)',
  socks5HTTP: 'SOCKS5 / HTTP',
  obfuscationSubtitle: 'WebRTC \u2192 WS \u2192 MTProto \u2192 Fastly'
};
files.forEach(f => {
  const path = 'F:\\AISTUDIO\\neumorphic-ui\\src\\locales\\' + f;
  let content = JSON.parse(fs.readFileSync(path, 'utf8'));
  content.settings = Object.assign({}, content.settings, keys);
  fs.writeFileSync(path, JSON.stringify(content, null, 2));
  console.log('Updated: ' + f);
});
