import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/firebase";
import { makeKey, LicensePayload } from "@/lib/server/license_core";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { telegramId } = await req.json();

    if (!telegramId || isNaN(Number(telegramId))) {
      return new NextResponse("Invalid Telegram ID", { status: 400 });
    }

    // Salva in Firestore
    const db = getDb();
    if (!db) {
      return new NextResponse("Database not configured", { status: 500 });
    }

    await db.collection("users").doc(userId).set({
      telegram_id: Number(telegramId),
      updated_at: new Date().toISOString()
    }, { merge: true });

    // --- MOCK PRO SUBSCRIPTION per TEST ---
    const planName = "PRO";
    const nowTs = Math.floor(Date.now() / 1000);
    const expiryTs = nowTs + (30 * 86400); // 30 giorni

    const payload: LicensePayload = {
      v: 2,
      product: "SOFTIBRIDGE_LITEB",
      telegram_id: Number(telegramId),
      plan: planName,
      groups_limit: 3,
      accounts_limit: 3,
      allowed_accounts: [],
      iat: nowTs,
      exp: expiryTs
    };

    const licenseKey = makeKey(payload);

    await db.collection("users").doc(userId).collection("licenses").add({
      license_key: licenseKey,
      plan: planName,
      status: "ACTIVE",
      expires_at: new Date(expiryTs * 1000).toISOString(),
      created_at: new Date().toISOString(),
      stripe_subscription_id: "mock_sub_" + Math.random().toString(36).substring(7)
    });

    console.log(`✅ [TEST MOCK] Licenza PRO creata per ${userId} (Telegram: ${telegramId}): ${licenseKey}`);

    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (telegramBotToken) {
      const msg = `✅ <b>SoftiBridge Acquisto Web (TEST)</b>\n\n<b>Piano:</b> ${planName}\n<b>La tua License Key:</b>\n<code>${licenseKey}</code>`;
      try {
        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramId,
            text: msg,
            parse_mode: 'HTML'
          })
        });
      } catch (e) { console.error("Errore invio Telegram", e); }
    }
    // ---------------------------------------

    return NextResponse.json({ success: true, licenseKey });
  } catch (error) {
    console.error("Error saving Telegram ID & mocking license:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
