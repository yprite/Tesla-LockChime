# Cloudflare Durable Object Chat Setup

## 1) Deploy Worker

```bash
npm run chat:deploy
```

If not logged in:

```bash
npx wrangler login
```

This project uses:
- Worker entry: `cloudflare/chat-worker.mjs`
- Durable Object class: `ChatRoom`
- Config: `wrangler.toml`

## 2) Get WebSocket endpoint

After deploy, Wrangler prints a Worker URL similar to:

`https://tesla-lock-chat.<subdomain>.workers.dev`

Use this chat endpoint:

`wss://tesla-lock-chat.<subdomain>.workers.dev/chat/global`

## 3) Connect frontend

Set the default endpoint in `js/chat-config.js`:

```js
window.CHAT_WS_ENDPOINT = "wss://tesla-lock-chat.<subdomain>.workers.dev/chat/global";
```

Then deploy the web app again.

## 4) Room usage

- Global room: `/chat/global`
- Custom room example: `/chat/modely`

All users connected to the same room path receive broadcast messages.
