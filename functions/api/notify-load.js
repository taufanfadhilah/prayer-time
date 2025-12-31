// Telegram notification config
const TELEGRAM_BOT_TOKEN = "8215763982:AAF4nSYRtbmxm4MOzh5RNL53QvwCJf4vsUE";
const TELEGRAM_CHAT_ID = "559092409";

async function sendTelegramNotification(message) {
  try {
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );
  } catch (e) {
    console.error("Failed to send Telegram notification:", e);
  }
}

export async function onRequest(context) {
  const { request } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Parse request body
    const body = await request.json();
    const {
      type = "load", // "load" | "upgrade"
      fromVersion = null,
      toVersion = null,
      currentVersion = null,
      locationId = null,
      userAgent = null,
    } = body;

    const timestamp = new Date().toISOString();

    // Determine notification message based on type
    let message = "";

    if (type === "upgrade" && fromVersion && toVersion) {
      // Version upgrade notification
      message =
        `🔄 <b>Client Upgraded</b>\n\n` +
        `📦 Version: <code>${fromVersion || "unknown"}</code> → <code>${toVersion}</code>\n` +
        `📍 Location ID: <code>${locationId || "N/A"}</code>\n` +
        `📱 Device: <code>${userAgent || "N/A"}</code>\n` +
        `🕐 Time: <code>${timestamp}</code>`;
    } else {
      // Regular page load notification
      message =
        `📱 <b>Page Loaded</b>\n\n` +
        `📦 Version: <code>${currentVersion || "unknown"}</code>\n` +
        `📍 Location ID: <code>${locationId || "N/A"}</code>\n` +
        `📱 Device: <code>${userAgent || "N/A"}</code>\n` +
        `🕐 Time: <code>${timestamp}</code>`;
    }

    await sendTelegramNotification(message);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error processing notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}
