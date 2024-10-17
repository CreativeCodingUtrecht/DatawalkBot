import type { PageServerLoadEvent } from "./$types";
import { bot, history } from "../lib/telegram/bot";

export async function load({ depends }: PageServerLoadEvent) {
    const me = await bot.getWebHookInfo();
    depends("bot:refresh");
    return { webhook: me, history };
}