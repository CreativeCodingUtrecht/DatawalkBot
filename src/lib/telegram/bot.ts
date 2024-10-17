import { env } from '$env/dynamic/private';
import type { SendPhotoOptions } from 'node-telegram-bot-api';
import TelegramBot from 'node-telegram-bot-api';

const BOT_TOKEN = env.BOT_TOKEN;

if (!BOT_TOKEN) {
	throw new Error('BOT_TOKEN is not set');
}

export const bot = new TelegramBot(BOT_TOKEN);

export const history: any[] = [];

bot.onText(/\/start/, (msg) => {
	bot.sendMessage(msg.chat.id, 'Welcome to the Datawalk Bot');
});

bot.onText(/\/photo/, async (msg) => {
	await bot.sendPhoto(msg.chat.id, 'https://i.ibb.co/SJ5STXr/640x360.jpg');
});

// bot.onText(/\/video/, async (msg) => {
// 	await bot.sendVideo(msg.chat.id, );
// });

bot.on('photo', async (msg) => {
	// await bot.sendMessage(msg.chat.id, 'Thanks for your photo!', {});

	msg.photo?.forEach(async (photo) => {
		const link = await bot.getFileLink(photo.file_id);
		console.log(`Photo ${photo.file_id} @ ${link}`);

		const options: SendPhotoOptions = { caption: 'Thanks for your photo, this is one from me!', parse_mode: 'Markdown' };
		await bot.sendPhoto(msg.chat.id, "https://i.ibb.co/SJ5STXr/640x360.jpg", options);
	});

	history.push({ when: new Date(), msg, location: { latitude: undefined, longitude: undefined } });
});

bot.on('video', async (msg) => {
	await bot.sendMessage(msg.chat.id, 'Thanks for your video!');
});

bot.on('voice', async (msg) => {
	await bot.sendMessage(msg.chat.id, 'Thanks for your voice message!');
});

bot.on('audio', async (msg) => {
	await bot.sendMessage(msg.chat.id, 'Thanks for your audio!');
});

bot.on('location', async (msg) => {
	await bot.sendMessage(
		msg.chat.id,
		`Thanks for your location! ${msg.location?.latitude}, ${msg.location?.longitude}`
	);

	history.push({
		when: new Date(),
		msg,
		location: { latitude: msg.location?.latitude, longitude: msg.location?.longitude }
	});
});

// bot.on('message', async (msg) => {
// 	try {
// 		// await bot.sendMessage(msg.chat.id, `${msg.text}`, {
// 		// 	reply_to_message_id: msg.message_id,
// 		// 	disable_notification: true
// 		// });

// 		history.push({ when: new Date(), msg });
// 	} catch (e) {
// 		console.error(e);
// 	}
// });

// bot.on('callback_query', async (query) => { // for callbacks by inline keyboard
// 	try {
// 		await bot.answerCallbackQuery(query.id);
// 		const text = query.data;
// 		await bot.sendMessage(query.from.id, `what's up with ${text}?`);
// 	} catch (e) {
// 		console.error(e);
// 	}
// });
