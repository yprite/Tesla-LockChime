const MAX_MESSAGE_LENGTH = 500;
const DEFAULT_ROOM = "global";

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function sanitizeName(value, fallback = "guest") {
  const clean = String(value || "")
    .trim()
    .replace(/[^\w\- ]/g, "")
    .slice(0, 24);
  return clean || fallback;
}

function sanitizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE_LENGTH);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return jsonResponse({ ok: true, service: "tesla-lock-chat" });
    }

    if (url.pathname === "/") {
      return jsonResponse({
        ok: true,
        usage: "Connect websocket to /chat/{room}?user={name}",
        roomExample: "/chat/global?user=tesla-owner",
      });
    }

    if (!url.pathname.startsWith("/chat")) {
      return jsonResponse({ ok: false, error: "Not found" }, 404);
    }

    const upgrade = request.headers.get("Upgrade");
    if (upgrade !== "websocket") {
      return jsonResponse({ ok: false, error: "Expected WebSocket upgrade" }, 426);
    }

    const room = decodeURIComponent(url.pathname.split("/")[2] || DEFAULT_ROOM).trim() || DEFAULT_ROOM;
    const roomId = env.CHAT_ROOM.idFromName(room);
    const stub = env.CHAT_ROOM.get(roomId);
    return stub.fetch(request);
  },
};

export class ChatRoom {
  constructor(ctx) {
    this.ctx = ctx;
  }

  getSockets() {
    return this.ctx.getWebSockets();
  }

  broadcast(payload) {
    const data = JSON.stringify(payload);
    for (const socket of this.getSockets()) {
      try {
        socket.send(data);
      } catch (_error) {
      }
    }
  }

  getSocketMeta(socket) {
    try {
      return socket.deserializeAttachment() || {};
    } catch (_error) {
      return {};
    }
  }

  async fetch(request) {
    const upgrade = request.headers.get("Upgrade");
    if (upgrade !== "websocket") {
      return jsonResponse({ ok: false, error: "WebSocket required" }, 426);
    }

    const url = new URL(request.url);
    const user = sanitizeName(url.searchParams.get("user"), "guest");
    const room = decodeURIComponent(url.pathname.split("/")[2] || DEFAULT_ROOM).trim() || DEFAULT_ROOM;

    const pair = new WebSocketPair();
    const clientSocket = pair[0];
    const serverSocket = pair[1];

    serverSocket.serializeAttachment({
      user,
      room,
      joinedAt: Date.now(),
    });

    this.ctx.acceptWebSocket(serverSocket);

    this.broadcast({
      type: "system",
      text: `${user} joined`,
      room,
      ts: Date.now(),
    });

    return new Response(null, {
      status: 101,
      webSocket: clientSocket,
    });
  }

  webSocketMessage(socket, message) {
    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch (_error) {
      return;
    }

    const text = sanitizeText(parsed.text);
    if (!text) return;

    const meta = this.getSocketMeta(socket);
    const sender = sanitizeName(parsed.user || meta.user, "guest");

    this.broadcast({
      type: "chat",
      user: sender,
      text,
      room: meta.room || DEFAULT_ROOM,
      ts: Date.now(),
    });
  }

  webSocketClose(socket) {
    const meta = this.getSocketMeta(socket);
    this.broadcast({
      type: "system",
      text: `${sanitizeName(meta.user, "guest")} left`,
      room: meta.room || DEFAULT_ROOM,
      ts: Date.now(),
    });
    try {
      socket.close(1000, "closed");
    } catch (_error) {
    }
  }
}
