import { env } from "$env/dynamic/private";
import type { Message, Location, SendPhotoOptions, SendMessageOptions, EditMessageLiveLocationOptions} from "node-telegram-bot-api";
import { type DataPoint, type UpdatedLocation, DataPointType } from "$lib/telegram/types";
import TelegramBot from "node-telegram-bot-api";

import * as DatawalkRepository from '$lib/database/DatawalkRepository';
import type { Datawalk } from '$lib/database/types';

const BOT_TOKEN = env.BOT_TOKEN;
if (!BOT_TOKEN) {
	throw new Error("BOT_TOKEN is not set");
}

export const bot = new TelegramBot(BOT_TOKEN);
const userState: any = {};

const participants : any = {};

const isPrivateMessage = (msg: Message) => msg.chat.type === "private";
const isGroupMessage = (msg: Message) =>
	msg.chat.type === "group" || msg.chat.type === "supergroup";

bot.onText(/\/create/, async (msg : Message) => {
	if (isPrivateMessage(msg)) {
		await handleCreate(msg);
	} else {
		await bot.sendMessage(msg.chat.id, "Sorry, you can only create a new datawalk in a private chat.");
	}
});

bot.onText(/\/join/, async (msg : Message) => {
	if (isPrivateMessage(msg)) {
		await handleJoin(msg);
	} else {
		await bot.sendMessage(msg.chat.id, "Sorry, you can only join an existing datawalk in a private chat.");
	}
});

bot.onText(/\/list/, async (msg : Message) => {
	if (isPrivateMessage(msg)) {
		await handleList(msg);
	} else {
		await bot.sendMessage(msg.chat.id, "Sorry, you can only retrieve active datawalks in a private chat.");
	}
});

bot.onText(/\/status/, async (msg : Message) => {
	if (isPrivateMessage(msg)) {
		await handleStatus(msg);
	} else {
		await bot.sendMessage(msg.chat.id, "Sorry, you can only retrieve your status in a private chat.");
	}
});

bot.onText(/\/leave/, async (msg : Message) => {
	if (isPrivateMessage(msg)) {
		await handleLeave(msg);
	} else {
		await bot.sendMessage(msg.chat.id, "Sorry, you can only leave a datawalk in a private chat.");
	}
});

const handleCreate = async (msg: Message) => {
	const datawalk = await DatawalkRepository.create({
		name: `Datawalkshop with ${msg.chat?.first_name}`,
		status: 'active'
	});

	console.log("Created datawalk:", datawalk);

	const code = datawalk?.code;

	participants[msg.chat.id] = code;
	console.log("Participants list:", participants);

	await bot.sendMessage(msg.chat.id, `Cool! I've created the datawalkshop <b>${datawalk?.name}</b> with code <b>${code}</b>`,{ parse_mode: "HTML" });
};

const handleJoin = async (msg: Message) => {
	const code = msg.text?.replace("/join", "").trim();
	if (!code || code === "") {
		await bot.sendMessage(msg.chat.id, `Please provide a code to join a datawalk such as <b>YGXH</b>`,{parse_mode: "HTML"});
		return;
	}

	const datawalk = await DatawalkRepository.findByCode(code);

	if (datawalk) {
		participants[msg.chat.id] = datawalk.code;
		console.log("Participants list:", participants);		

		await bot.sendMessage(
			msg.chat.id,
			`Welcome to datawalk <b>${datawalk.name}</b> with code <b>${code}</b>!`,{parse_mode: "HTML"}
		);	
	} else {
		await bot.sendMessage(
			msg.chat.id,
			`Sorry, I couldn't find a datawalk with code <b>${code}</b>`,{parse_mode: "HTML"}
		);
	}
};

const handleList = async (msg: Message) => {
	let datawalks = await DatawalkRepository.findAll();

	const codes : string[] = datawalks.map((datawalk : Datawalk) => datawalk.code);

	if (codes.length > 0) {
		await bot.sendMessage(msg.chat.id, `The following datawalks are active: <b>${codes.join(", ")}</b>`,{parse_mode: "HTML"});
	} else {
		await bot.sendMessage(msg.chat.id, `There are currently no active datawalks`,{parse_mode: "HTML"});
	}
}

const handleStatus = async (msg: Message) => {

	if (Object.keys(participants).includes(`${msg.chat.id}`)) {
		const code = participants[msg.chat.id]	
		await bot.sendMessage(msg.chat.id, `You are participating in datawalk with code <b>${code}</b>`,{parse_mode: "HTML"});
	} else {
		await bot.sendMessage(msg.chat.id, `You are currently not participating in a datawalk`,{parse_mode: "HTML"});
	}
}

const handleLeave = async (msg: Message) => {
	if (Object.keys(participants).includes(`${msg.chat.id}`)) {
		const code = participants[msg.chat.id];
		delete participants[msg.chat.id]
		await bot.sendMessage(msg.chat.id, `You are no longer participating in datawalk with code <b>${code}</b>`,{parse_mode: "HTML"});
	} else {
		await bot.sendMessage(msg.chat.id, `You are currently not participating in a datawalk`,{parse_mode: "HTML"});
	}
}

bot.on("photo", async (msg : Message) => {
	const file_id = msg.photo?.[msg.photo.length - 1].file_id;
	if (file_id) {
		const url = await bot.getFileLink(file_id);
		const filename = await bot.downloadFile(file_id, "./")		
		// await bot.sendMessage(msg.chat.id, `Thanks for your photo! ${url}`);
		// await bot.sendMessage(msg.chat.id, `I saved it to ${filename}`);
		bot.sendMessage(msg.chat.id, `Thanks for your photo!`, {parse_mode: "HTML"});
		
		const datapoint : DataPoint = {
			type: DataPointType.Photo,
			text: msg.caption,
			created_at: Date.now(),
			media_url: filename,
		};

		console.log("Added data point:", datapoint);
		// const code = participants[msg.chat.id];
		// const datawalk = datawalks.find((datawalk) => datawalk.code === code);
		// datawalk?.data?.push(datapoint);
	}

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

bot.on("video", async (msg : Message) => {
	await bot.sendMessage(msg.chat.id, "Thanks for your video!");

	// TODO Validate file size 

	const file_id = msg.video?.file_id;
	if (file_id) {
		const url = await bot.getFileLink(file_id);
		await bot.sendMessage(msg.chat.id, `URL ${url}`);
	}

	if (file_id) {
		const filename = await bot.downloadFile(file_id, "./")
		await bot.sendMessage(msg.chat.id, `I saved it to ${filename}`);
	}

	return;
});

bot.on("voice", async (msg : Message) => {
	await bot.sendMessage(msg.chat.id, "Thanks for your voice message!");

	if (!msg.voice) {
		await bot.sendMessage(msg.chat.id, "Unable to read the voice message you've sent!");
	}

	const file_id = msg.voice?.file_id;
	
	// TODO Validate file size

	if (file_id) {
		const url = await bot.getFileLink(file_id);
		await bot.sendMessage(msg.chat.id, `URL ${url}`);
	}

	if (file_id) {
		const filename = await bot.downloadFile(file_id, "./")
		await bot.sendMessage(msg.chat.id, `I saved it to ${filename}`);
	}

	return;
});

bot.on("audio", async (msg : Message) => {
	await bot.sendMessage(msg.chat.id, "Thanks for your audio!");
	// TODO When is this sent?
});

bot.on("document", async (msg : Message) => {
	await bot.sendMessage(msg.chat.id, "Thanks for your document!");

	if (!msg.document) {
		await bot.sendMessage(msg.chat.id, "Unable to read the document you've sent!");
		return;
	}

	const file_id = msg.document.file_id;
	const file_name = msg.document.file_name;
	const file_size =  msg.document.file_size;

	if (!file_size || validateFileSize(file_size)) {
		await bot.sendMessage(msg.chat.id, "File size is too large! Please send a file less than 20MB.");
		return;
	}

	if (file_id) {
		const url = await bot.getFileLink(file_id);
		await bot.sendMessage(msg.chat.id, `URL ${url}`);

		const filename = await bot.downloadFile(file_id, "./")
		await bot.sendMessage(msg.chat.id, `I saved it to ${filename}`);
	}
});

const validateFileSize = (file_size : number) : boolean => {
	// check size of max 20MB
	const maxFileSize = 20 * 1024 * 1024;
	return file_size < maxFileSize;
}

bot.on("location", async (msg : Message) => {
	if (!msg.location) {
		await bot.sendMessage(
			msg.chat.id,
			`Location is missing ..?`
		);		
		return;
	}

	if (userState[msg.chat.id] && userState[msg.chat.id].locationExpected) {
		await bot.sendMessage(
			msg.chat.id,
			`Recorded location with media: ${msg.location?.latitude}, ${msg.location?.longitude}`
		);
		delete userState[msg.chat.id];
	} else {
		await bot.sendMessage(
			msg.chat.id,
			`Thanks for your unexpected sharing of location! ${msg.location?.latitude}, ${msg.location?.longitude}`
		);
	}
	await bot.sendLocation(msg.chat.id, msg.location?.latitude, msg.location?.longitude);
});

bot.on("edited_message", async (msg : Message) => {
	const location = <UpdatedLocation>msg.location;

	// bot.sendMessage(
	// 	msg.chat.id,
	// 	`Live location updated: Latitude: ${location?.latitude}, Longitude: ${location?.longitude}, Heading: ${location?.horizontal_accuracy}, Horizontal accuracy: ${location?.horizontal_accuracy}`
	// );

	if (userState[msg.chat.id] && userState[msg.chat.id].locationExpected) {
		await bot.sendMessage(
			msg.chat.id,
			`Recorded location with media: ${location?.latitude}, ${location?.longitude}`
		);
		delete userState[msg.chat.id];
	}
});

