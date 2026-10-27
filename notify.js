// Sends a Telegram notification after the guest submits the date invitation.
// Credentials must be configured as Netlify environment variables.
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { Allow: "POST" }, body: "Method Not Allowed" };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    return { statusCode: 500, body: "Not configured" };
  }

  if (Buffer.byteLength(event.body || "", "utf8") > 4096) {
    return { statusCode: 413, body: "Payload too large" };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "Bad JSON" };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { statusCode: 400, body: "Bad payload" };
  }

  const cut = (value, limit) => String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, limit);
  const name = cut(data.name, 40) || "Анастасия";
  const place = cut(data.place, 100) || "не выбрано";
  const extra = cut(data.extra, 60) || "не выбрано";
  const when = cut(data.when, 60) || "не указано";
  const text = `💌 ${name} сказала ДА ❤️\n📍 Место: ${place}\n🎁 Любит больше: ${extra}\n🌅 Когда: ${when}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text }),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return { statusCode: 502, body: "telegram error" };
    return { statusCode: 200, headers: { "Content-Type": "text/plain; charset=utf-8" }, body: "ok" };
  } catch {
    return { statusCode: 502, body: "telegram unavailable" };
  }
};
