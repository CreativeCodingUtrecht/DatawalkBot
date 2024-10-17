import type { RequestEvent } from "./$types";
import { bot } from "../lib/telegram/bot";

// Handle Telegram API Webhook calls
export async function POST({ request }: RequestEvent) {
	try {
		const data = await request.json();
		console.log("Webhook data:", data);
		bot.processUpdate(data);
		return new Response("", { status: 200 });
	} catch (e) {
		console.error(e);
		return new Response("", { status: 500 });
	}
}
