# Paymento Integration — Setup & Usage

Crypto payment gateway (Paymento) integrated into **Mess&Anger** as a backend proxy
(clients never hold the secret), a **Payment Requests** manager, and inline
**payment cards inside chat**. Merchant credentials are operator config in the server
environment — there is no runtime UI for changing them.

---

## 1. Environment variables

Copy `.env.example` → `.env` and fill:

| Variable | Where | Purpose |
|----------|-------|---------|
| `JWT_SECRET` | server | Required for admin auth tokens. Use a long random value. |
| `PAYMENTO_API_URL` | server | Paymento API base, default `https://api.paymento.io`. Override to point at staging/test. |
| `PAYMENTO_API_KEY` | server | Operator (global) API key. |
| `PAYMENTO_SECRET_KEY` | server | Operator (global) secret. Used to verify IPN HMAC signatures. |
| `PAYMENTO_RETURN_URL` | server (optional) | Default `ReturnUrl` sent to the gateway when the client does not send one. |
| `VITE_PAYMENTO_API_URL` | client (optional) | Override the API base the client shows; normally not needed. |
| `VITE_APP_URL` | client (optional) | Public app URL used for return links. |

`PAYMENTO_API_KEY` / `PAYMENTO_SECRET_KEY` are the **only** credential source.
Leave them empty to disable payments (create/verify answer `503`).

---

## 2. Running the server

The payment routes live inside the existing signaling server. Start it (dev):

```bash
JWT_SECRET=change-me-please   npx tsx server/signaling-server.ts
# REST API  -> http://localhost:8766
# WebSocket -> http://localhost:8765
```

In the frontend dev server, `/api` is proxied to `:8766` (see `vite.config.ts`),
so the client calls `/api/paymento/*` directly.

The `payments` database table is created automatically on first run (`server/db.ts`).

---

## 3. Configuration

1. Set `PAYMENTO_API_KEY` and `PAYMENTO_SECRET_KEY` in the server environment (`.env`).
   There is no runtime UI or API for changing credentials.
2. Configure the **IPN URL** at your Paymento dashboard as:
    ```
    https://<your-domain>/api/paymento/ipn
    ```

---

## 4. Creating a payment request

**Settings → Payment Requests**:
- Enter amount, currency, optional description → **Create**.
- The request is created via our backend (`/api/paymento/create`), which calls Paymento
  with the server-held secret and returns a gateway token + URL.
- The active card shows a **QR code**, status badge, and **Open / Copy / Share** actions.
- Status is polled live via `/api/paymento/verify/:token`.

---

## 5. Sending a payment card inside chat (new)

Instead of only sharing a link, a created payment request can be sent **inside any chat**
as a native message of type `payment`:

1. On the active payment card, press the **Send** (paper plane) button.
2. Pick a chat from the **chat picker** modal.
3. The backend-less message object is appended to that chat's `history` and renders
   inline as a **PaymentChatBubble** (amount, description, status badge, *Pay* / *Copy*).
4. The card polls Paymento status the same way, so both sides see live paid/pending state.

Implementation notes:
- Message builder: `buildPaymentMessage()` in `src/services/paymento.ts`.
- Renderer: `src/components/payments/PaymentChatBubble.tsx`, dispatched in
  `src/components/chat-preview/ChatMessage.tsx` (`msg.type === "payment"`).
- Chat insertion: `useAppStore.getState().forwardMessage(msg, chatId)`
  (`src/store/slices/chatSlice.ts`).

> Note: in this P2P build, "send to chat" appends to local `history` (same pattern as
> stickers/forward). Real cross-device delivery rides the existing data-channel transport.

---

## 6. Backend API (proxy) endpoints

All under `/api/paymento`:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/create` | Create Paymento request (secret stays server-side), returns `{token, paymentUrl, orderId}`. |
| POST | `/ipn` | Paymento callback. Verifies `X-HMAC-SHA256-SIGNATURE` (HMAC-SHA256, uppercase hex). Updates status. Returns `401` on bad signature. |
| GET  | `/verify/:token` | Proxies Paymento verify, returns `{status, orderId, amount, currency}`. |
| GET  | `/list` | Recent payments from local DB. **Requires admin JWT** (`Authorization: Bearer <token>` from `/api/auth/verify-2fa`); operator-only, not used by the app UI. |

---

## 7. Security

- **Secret never reaches the client**; it lives only in the server environment.
- **IPN HMAC**: `HMAC-SHA256(rawBody, secret).toUpperCase().hex()` compared timing-safely.
- IPN payloads that are not yet in our DB are still recorded on first valid contact.

---

## 8. Verified API paths (live-checked 2026-08-22)

Probed against `https://api.paymento.io` with a live merchant key:

- **Create:** `POST /v1/payment/request`, header `Api-key`, JSON body
  (`fiatAmount`, `fiatCurrency`, `orderId`, `Speed`). Response: `{success, body: <token>}`.
- **Verify:** `POST /v1/payment/verify`, header `Api-key`, JSON body `{"token"}`.
  Response: `{success, body: {token, orderId, orderStatus, additionalData, settlement:{requestedFiatAmount, ...}}}`.
  The fiat currency is NOT in the verify response — the proxy falls back to the locally
  stored `payments.currency`.
- The documented GET path `/api/v1/payments/verify/:token?api_key=` returns **404** and is not used.

Paths are isolated in constants so a gateway version change is a one-line fix:

- `src/config/paymento.ts` → `PAYMENTO_CREATE_PATH`, `PAYMENTO_VERIFY_PATH`
- `server/routes/paymento.ts` → `CREATE_PATH`, `VERIFY_PATH`

---

## 9. Tests

Integration test with a mock Paymento server (create, list, IPN valid/invalid, verify):

```bash
npx vitest run --config vitest.server.config.ts server/__tests__/paymento.test.ts
```

Full server suite: `npx vitest run --config vitest.server.config.ts`
