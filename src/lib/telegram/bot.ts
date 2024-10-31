import { env } from "$env/dynamic/private";
import type { Message, Location, SendPhotoOptions, SendMessageOptions, EditMessageLiveLocationOptions} from "node-telegram-bot-api";
import TelegramBot from "node-telegram-bot-api";

interface UpdatedLocation extends Location {
	horizontal_accuracy?: number | undefined;
	heading?: number | undefined;
}

const BOT_TOKEN = env.BOT_TOKEN;

if (!BOT_TOKEN) {
	throw new Error("BOT_TOKEN is not set");
}

export const bot = new TelegramBot(BOT_TOKEN);
const userState: any = {};

const isPrivateMessage = (msg: Message) => msg.chat.type === "private";
const isGroupMessage = (msg: Message) =>
	msg.chat.type === "group" || msg.chat.type === "supergroup";

bot.onText(/\/start/, async (msg) => {
	if (isPrivateMessage(msg)) {
		await handleStart(msg);
	} else {
		await bot.sendMessage(msg.chat.id, "Sorry, you can only start a new datawalk in a private chat.");
	}
});

bot.onText(/\/join/, async (msg) => {
	if (isPrivateMessage(msg)) {
		await handleJoin(msg);
	} else {
		await bot.sendMessage(msg.chat.id, "Sorry, you can only join a datawalk in a private chat.");
	}
});

const handleStart = async (msg: Message) => {
	await bot.sendMessage(msg.chat.id, "Ok! Let's start a new datawalk.");
};

const handleJoin = async (msg: Message) => {
	await bot.sendMessage(msg.chat.id, "Ok! Let's join a datawalk.");
};


bot.onText(/\/photo/, async (msg) => {
	await bot.sendPhoto(msg.chat.id, "https://i.ibb.co/SJ5STXr/640x360.jpg");
});

// bot.onText(/\/video/, async (msg) => {
// 	await bot.sendVideo(msg.chat.id, );
// });

bot.on("photo", async (msg) => {
	const file_id = msg.photo?.[msg.photo.length - 1].file_id;
	// if (file_id) {
	// 	const url = await bot.getFileLink(file_id);
	// }

	const options: SendMessageOptions = {
		reply_markup: {
			keyboard: [
				[
					{
						text: "Share Location 📍",
						request_location: true
					}
				]
			],
			resize_keyboard: true,
			one_time_keyboard: true
		}
	};

	await bot.sendMessage(
		msg.chat.id,
		"Thanks for your photo. Please share your location to complete the data collection.",
		options
	);

	// Store photo information in userState
	userState[msg.chat.id] = {
		photoFileId: file_id,
		photoMessageId: msg.message_id,
		locationExpected: true
	};
});

bot.on("video", async (msg) => {
	await bot.sendMessage(msg.chat.id, "Thanks for your video!");
});

bot.on("voice", async (msg) => {
	await bot.sendMessage(msg.chat.id, "Thanks for your voice message!");
});

bot.on("audio", async (msg) => {
	await bot.sendMessage(msg.chat.id, "Thanks for your audio!");
});

bot.on("location", async (msg) => {
	if (userState[msg.chat.id] && userState[msg.chat.id].locationExpected) {
		await bot.sendMessage(
			msg.chat.id,
			`Thanks for your location! ${msg.location?.latitude}, ${msg.location?.longitude}`
		);
		delete userState[msg.chat.id];
	} else {
		await bot.sendMessage(
			msg.chat.id,
			`Thanks for your unexpected sharing of location! ${msg.location?.latitude}, ${msg.location?.longitude}`
		);
	}
});

bot.on("edited_message", async (msg : Message) => {
	const location = <UpdatedLocation>msg.location;

	bot.sendMessage(
		msg.chat.id,
		`Live location updated: Latitude: ${location?.latitude}, Longitude: ${location?.longitude}, Heading: ${location?.horizontal_accuracy}, Horizontal accuracy: ${location?.horizontal_accuracy}`
	);
});
