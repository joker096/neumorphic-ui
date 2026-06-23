# Privacy Policy for Mess&Anger Messenger

**Last updated: June 23, 2026**

---

## Our Commitment to Privacy

Mess&Anger Messenger is designed from the ground up to be **private by default**. We believe you should own your conversations — not us, not any corporation, not any government.

This Privacy Policy explains how Mess&Anger Messenger ("we," "our," or "the app") handles your data. Because of our architecture, the answer is almost always: **we don't.**

---

## 1. What Data We Collect

### Nothing by Default

Mess&Anger Messenger collects **zero data** about you automatically. We do not have accounts, user profiles, or registration. There is:

- No phone number required
- No email address required
- No username required
- No analytics or telemetry
- No tracking cookies
- No advertising identifiers
- No fingerprinting

### What Exists Locally on Your Device

The only data that exists is stored **entirely on your device** inside your browser's IndexedDB:

- Your identity key pairs (X25519 + ML-KEM-768 post-quantum keys)
- Your conversation history (encrypted at rest)
- Your contact list
- Your settings and preferences (language, theme, disabled features)

This data never leaves your device unless you explicitly export it.

### Peer-to-Peer Connections

When you connect to another user, a direct peer-to-peer WebRTC connection is established. During this process, a **signaling server** (see Section 6) relays temporary Session Description Protocol (SDP) and ICE candidate data to help establish the connection. These are ephemeral network handshake messages — they contain no message content and are discarded immediately after the connection is established.

---

## 2. How Your Data Is Stored

### Local Storage (IndexedDB)

All data on your device is stored in your browser's IndexedDB, **encrypted at rest** using your identity key. This means even if someone gains physical access to your device, they cannot read your messages without your key.

### What Is Never Stored

- **No messages are ever stored on any server.** Messages exist only on the sender's and recipient's devices.
- **No conversation metadata** (who you talk to, when, how often) is stored anywhere except locally on your device.
- **No IP addresses** are logged by us.

### Data Export and Deletion

You can export your data at any time from the app's settings. Exporting produces an encrypted file containing your identity keys, conversations, contacts, and settings. You can also delete all local data from within the app, which wipes your IndexedDB and generates fresh identity keys.

---

## 3. Third-Party Services

Mess&Anger Messenger is fully functional without any third-party services. Two optional features connect to external APIs, both **disabled by default**:

### Tenor API (Optional GIF Search)

If you enable GIF search, the app sends your search query to Tenor's API to retrieve GIF results. Tenor may collect search queries according to their own privacy policy. This feature is **entirely optional** and disabled by default.

- **What is sent:** Your search query text
- **What is not sent:** Your identity, messages, or any other app data
- **How to disable:** Do not enable GIF search in settings, or disable it at any time

### Gemini API (Optional AI Features)

If you enable AI features, the app sends messages you explicitly choose to the Gemini API for processing (e.g., summarization, smart replies). This feature is **entirely optional** and disabled by default.

- **What is sent:** Only the specific messages you select for AI processing
- **What is not sent:** Your identity, key material, or any messages you do not explicitly choose
- **How to disable:** Do not enable AI features in settings, or disable them at any time

### Self-Hosted Signaling Server

You can configure the app to use your own signaling server instead of the default one. When you self-host, all signaling traffic goes to your own server. We have no access to or visibility into self-hosted servers.

### Open Source Transparency

The entire Mess&Anger Messenger source code is open source. Anyone can inspect, audit, and verify that the app behaves as described in this policy.

---

## 4. Data Security

### End-to-End Encryption (E2EE)

Every message is encrypted on your device before transmission and can only be decrypted by the intended recipient. We use:

- **Signal Protocol** with Double Ratchet algorithm for forward secrecy and break-in recovery
- **X25519** elliptic-curve Diffie-Hellman key exchange
- **ML-KEM-768** post-quantum key encapsulation for protection against quantum threats

This means:
- **Not even we** can read your messages
- **No server operator** (including your self-hosted server) can read your messages
- **No ISP or network observer** can read your messages
- **No future quantum computer** can decrypt recorded messages (thanks to ML-KEM-768)

### At-Rest Encryption

Your locally stored data is encrypted using your identity key. Each time you return to the app, you must authenticate (via biometric or passphrase) to decrypt your local data.

### Perfect Forward Secrecy

If a long-term key is ever compromised, past messages remain secure because each message uses a unique, ephemeral encryption key that is permanently discarded after use.

### No Metadata Collection

We do not collect, store, or process any metadata about your communications — not who you talk to, not when you talk, not how often you talk.

---

## 5. Your Rights and Choices

You have full control over your data:

| Right | How It Works |
|-------|-------------|
| **Access** | View all your conversations and data within the app |
| **Export** | Export all your data as an encrypted backup file |
| **Delete** | Delete all local data from app settings |
| **Disable features** | Keep GIF search and AI features disabled (default) |
| **Self-host** | Run your own signaling server for full network independence |

Because we have **no servers** and **no access to your data**, we cannot:

- Recover your account or messages if you lose your device
- Provide law enforcement with your messages (we do not have them)
- Comply with data access requests (there is nothing to hand over)

---

## 6. Signaling Server

The signaling server is a minimal relay that helps two peers find each other to establish a direct WebRTC connection. It has **no access to message content** and **stores no data permanently**.

The signaling server handles:
- Relaying Session Description Protocol (SDP) offers/answers
- Relaying ICE candidates for NAT traversal

These are temporary network handshake messages, not message content. They exist only for the duration of the connection handshake and are discarded immediately.

The default signaling server is operated by us. You can always switch to a self-hosted signaling server.

---

## 7. Children's Privacy

Mess&Anger Messenger is not directed at children under the age of 13 (or the relevant age of digital consent in your jurisdiction). We do not knowingly collect any personal information from children.

Because we collect no data whatsoever, there is no risk of children's data being collected, stored, or shared by us.

If you are a parent or guardian and believe your child has provided us with personal information, there is nothing for us to delete — but you can delete all data locally from within the app.

---

## 8. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. When we do, we will:

1. Update the "Last updated" date at the top of this policy
2. Notify users via the app's release notes

Material changes will be highlighted in release notes. Continued use of the app after changes constitutes acceptance of the updated policy.

---

## 9. Contact

For questions about this Privacy Policy or Mess&Anger Messenger's privacy practices:

- **Open an issue:** https://github.com/messandanger/messenger/issues
- **Email:** privacy@messandanger.app

We respond to privacy inquiries promptly.

---

## Summary

| Question | Answer |
|----------|--------|
| Do you collect my data? | No |
| Do you store my messages? | No (they live on your device only) |
| Can you read my messages? | No (they are end-to-end encrypted) |
| Do you use third-party services? | Only if you explicitly enable them |
| Do you have ads? | No |
| Do you have analytics? | No |
| Can I export my data? | Yes |
| Is the app open source? | Yes |

**Your conversations are yours. Period.**
