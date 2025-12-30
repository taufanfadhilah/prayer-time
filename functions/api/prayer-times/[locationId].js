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
    // Silently fail - don't let notification errors affect the main response
    console.error("Failed to send Telegram notification:", e);
  }
}

export async function onRequest(context) {
  const { params } = context;
  const locationId = params.locationId;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };

  // Handle preflight request
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch from Vaktija API (server-side, no CORS issue)
    const response = await fetch(
      `https://api.vaktija.ba/vaktija/v1/${locationId}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "PrayerTimeApp/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Return with CORS headers
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
        ...corsHeaders,
      },
    });
  } catch (error) {
    // Send Telegram notification on error
    const timestamp = new Date().toISOString();
    await sendTelegramNotification(
      `🚨 <b>Prayer Time API Error</b>\n\n` +
        `📍 Location ID: <code>${locationId}</code>\n` +
        `❌ Error: <code>${error.message}</code>\n` +
        `🕐 Time: <code>${timestamp}</code>\n` +
        `🌐 Source: prayertime-v2.fonti.dev`
    );

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
}
