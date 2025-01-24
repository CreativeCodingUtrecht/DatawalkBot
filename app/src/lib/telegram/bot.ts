import { env } from "$env/dynamic/private";
import type { Message, SendMessageOptions } from "node-telegram-bot-api";
import type { UpdatedLocation } from "$lib/telegram/types";
import TelegramBot from "node-telegram-bot-api";
import * as DatawalkRepository from "$lib/database/repositories/DatawalkRepository";
import * as ParticipantRepository from "$lib/database/repositories/ParticipantRepository";
import * as TrackPointRepository from "$lib/database/repositories/TrackPointRepository";
import * as DataPointRepository from "$lib/database/repositories/DataPointRepository";
import type { Datawalk, Participant, DataPoint } from "$lib/database/types";
import mime from "mime-types";

const BOT_TOKEN = env.BOT_TOKEN;
if (!BOT_TOKEN) {
	throw new Error("BOT_TOKEN is not set");
}

export const bot = new TelegramBot(BOT_TOKEN);
const locationQueue: any = {};

const DATA_MEDIA_ROOT = env.DATA_MEDIA_ROOT;
if (!DATA_MEDIA_ROOT) {
	throw new Error("DATA_MEDIA_ROOT is not set");
}

const isPrivateMessage = (msg: Message) => msg.chat.type === "private";
const isGroupMessage = (msg: Message) =>
	msg.chat.type === "group" || msg.chat.type === "supergroup";

bot.onText(/\/start/, async (msg: Message) => {
	if (isPrivateMessage(msg)) {
		await handleStart(msg);
	} else {
		await bot.sendMessage(
			msg.chat.id,
			"Sorry, you can only create a new Datawalk in a private chat."
		);
	}
});

bot.onText(/\/create/, async (msg: Message) => {
	if (isPrivateMessage(msg)) {
		await handleCreate(msg);
	} else {
		await bot.sendMessage(
			msg.chat.id,
			"Sorry, you can only create a new Datawalk in a private chat."
		);
	}
});

bot.onText(/\/join/, async (msg: Message) => {
	if (isPrivateMessage(msg)) {
		await handleJoin(msg);
	} else {
		await bot.sendMessage(
			msg.chat.id,
			"Sorry, you can only join an existing Datawalk in a private chat."
		);
	}
});

bot.onText(/\/name/, async (msg: Message) => {
	if (isPrivateMessage(msg)) {
		await handleName(msg);
	} else {
		await bot.sendMessage(
			msg.chat.id,
			"Sorry, you can only change the name of an existing Datawalk in a private chat."
		);
	}
});

bot.onText(/\/list/, async (msg: Message) => {
	if (isPrivateMessage(msg)) {
		await handleList(msg);
	} else {
		await bot.sendMessage(
			msg.chat.id,
			"Sorry, you can only retrieve active Datawalks in a private chat."
		);
	}
});

bot.onText(/\/status/, async (msg: Message) => {
	if (isPrivateMessage(msg)) {
		await handleStatus(msg);
	} else {
		await bot.sendMessage(
			msg.chat.id,
			"Sorry, you can only retrieve your status in a private chat."
		);
	}
});

bot.onText(/\/leave/, async (msg: Message) => {
	if (isPrivateMessage(msg)) {
		await handleLeave(msg);
	} else {
		await bot.sendMessage(msg.chat.id, "Sorry, you can only leave a Datawalk in a private chat.");
	}
});

bot.onText(/\/archive/, async (msg: Message) => {
	if (isPrivateMessage(msg)) {
		await handleArchive(msg);
	} else {
		await bot.sendMessage(msg.chat.id, "Sorry, you can only archive and unarchive a Datawalk in a private chat.");
	}
});

bot.on("text", async (msg: Message) => {
	if (isPrivateMessage(msg)) {
		await handleText(msg);
	} 	
});

const handleText = async (msg: Message) => {	
	if (msg.text?.startsWith("/")) {
		// This is a command, ignore it
		return;
	}

	console.log("Handling text message")

	const participant: Participant | undefined = await findOrCreateParticipant(msg);
	if (!participant) {
		console.error("Unable to find participant data")
		return;		
	}	
	
	if (!participant.current_datawalk_id) {
		// Try using the received message as a code to join a datawalk 
		const code = msg.text?.split(" ")[0].trim().toUpperCase();

		const datawalk = await DatawalkRepository.findByCode(code);

		if (datawalk) {
			participate(msg, datawalk);
		} else {
			await bot.sendMessage(
				msg.chat.id,
				`Sorry, I couldn't find a Datawalk with code <b>${code}</b>. Please provide me the 4-letter code of the Datawalk you want to join (e.g. <b>YGXH</b>). Use the /list command and I'll send you a list of active Datawalks.`,
				{ parse_mode: "HTML" }
			);
		}
	} else {
		// Try to store the text message as a data point
		storeTextOnlyDataPoint(msg);		
	}
}

const handleStart = async (msg: Message) => {
	const participant: Participant | undefined = await findOrCreateParticipant(msg);

	if (!participant) {
		await bot.sendMessage(
			msg.chat.id,
			`Sorry, I was not able to save your details for participation in Datawalks`,
			{
				parse_mode: "HTML"
			}
		);
		return;
	}

	await bot.sendMessage(
		msg.chat.id,
		`Hi there, I'm Datawalk Bot 👋`,
		{ parse_mode: "HTML" }
	);

	await bot.sendMessage(
		msg.chat.id,
		`I will help you collect data such as photos, videos, and audio during your Datawalk. Let me know when you want to create a new Datawalk using /create or join an existing Datawalk using /join!`,
		{ parse_mode: "HTML" }
	);

	
};

const handleCreate = async (msg: Message) => {
	const datawalk: Datawalk | undefined = await DatawalkRepository.create({
		name: `Datawalk with ${msg.chat?.first_name}`,
		status: "active"
	});

	if (datawalk) {
		console.log("Created datawalk:", datawalk);
		const code = datawalk.code;

		await bot.sendMessage(
			msg.chat.id,
			`Cool! I've created a new Datawalk called <b>${datawalk?.name}</b> with code <b>${code}</b>`,
			{ parse_mode: "HTML" }
		);
		participate(msg, datawalk);
	} else {
		await bot.sendMessage(msg.chat.id, `Sorry, an error occured while creating the Datawalk`, {
			parse_mode: "HTML"
		});
	}
};

const handleJoin = async (msg: Message) => {
	const code = msg.text?.replace("/join", "").trim().toUpperCase();
	if (!code || code === "") {
		await bot.sendMessage(
			msg.chat.id,
			`Please provide me the 4-letter code of the Datawalk you want to join (e.g. <b>YGXH</b>). Use the /list command and I'll send you a list of active Datawalks.`,
			{ parse_mode: "HTML" }
		);
		return;
	}

	const datawalk = await DatawalkRepository.findByCode(code);

	if (datawalk) {
		participate(msg, datawalk);
	} else {
		await bot.sendMessage(
			msg.chat.id,
			`Sorry, I couldn't find a Datawalk with code <b>${code}</b>`,
			{ parse_mode: "HTML" }
		);
	}
};

const handleList = async (msg: Message) => {
	let datawalks = await DatawalkRepository.findAll();

	const codes: string[] = datawalks.map((datawalk: Datawalk) => datawalk.code);

	if (codes.length > 0) {
		await bot.sendMessage(
			msg.chat.id,
			`The following Datawalks are currently active: <b>${codes.join(", ")}</b>`,
			{ parse_mode: "HTML" }
		);
	} else {
		await bot.sendMessage(msg.chat.id, `There are currently no active Datawalks`, {
			parse_mode: "HTML"
		});
	}
};

const handleName = async (msg: Message) => {
	const name = msg.text?.replace("/name", "").trim();
	if (!name || name === "") {
		await bot.sendMessage(msg.chat.id, `Please provide me with a new name for the Datawalk`, {
			parse_mode: "HTML"
		});
		return;
	}

	const participant = await ParticipantRepository.findByChatId(msg.chat.id);

	if (participant?.current_datawalk_id) {
		const datawalk = await DatawalkRepository.findById(participant.current_datawalk_id);
		datawalk.name = name;
		await DatawalkRepository.update(datawalk.id, datawalk);

		await bot.sendMessage(
			msg.chat.id,
			`Okay, I've renamed the Datawalk to <b>${datawalk?.name}</b>!`,
			{ parse_mode: "HTML" }
		);
	} else {
		await bot.sendMessage(
			msg.chat.id,
			`You are currently not participating in a Datawalk. Please join the Datawalk you want to give a new name!`,
			{
				parse_mode: "HTML"
			}
		);
	}
};

const handleStatus = async (msg: Message) => {
	const participant = await ParticipantRepository.findByChatId(msg.chat.id);

	if (participant && participant.current_datawalk_id) {
		const datawalk = await DatawalkRepository.findById(participant.current_datawalk_id);
		if (datawalk) {
			await bot.sendMessage(
				msg.chat.id,
				`You are participating in Datawalk with code <b>${datawalk.code}</b>`,
				{ parse_mode: "HTML" }
			);
			return;
		}
	}

	await bot.sendMessage(msg.chat.id, `You are currently not participating in a Datawalk`, {
		parse_mode: "HTML"
	});
};

const handleLeave = async (msg: Message) => {
	const participant = await ParticipantRepository.findByChatId(msg.chat.id);

	if (participant?.current_datawalk_id) {
		const datawalk = await DatawalkRepository.findById(participant.current_datawalk_id);

		participant.current_datawalk_id = null;
		await ParticipantRepository.update(participant.id, participant);
		await bot.sendMessage(
			msg.chat.id,
			`You are no longer participating in Datawalk with code <b>${datawalk?.code}</b>`,
			{ parse_mode: "HTML" }
		);
	} else {
		await bot.sendMessage(msg.chat.id, `You are currently not participating in a Datawalk`, {
			parse_mode: "HTML"
		});
	}
};

const handleArchive = async (msg: Message) => {
	const code = msg.text?.replace("/archive", "").trim().toUpperCase();
	if (!code || code === "") {
		await bot.sendMessage(
			msg.chat.id,
			`Please provide me the 4-letter code of the Datawalk you want to archive or unarchive (e.g. <b>YGXH</b>). Use the /list command and I'll send you a list of active Datawalks.`,
			{ parse_mode: "HTML" }
		);
		return;
	}

	const datawalk = await DatawalkRepository.findByCode(code);

	if (datawalk) {
		datawalk.status = datawalk.status === "active" ? "archived" : "active";
		await DatawalkRepository.update(datawalk.id, datawalk);

		await bot.sendMessage(
			msg.chat.id,
			`Datawalk <b>${datawalk.name}</b> with code <b>${datawalk.code}</b> is now <b>${datawalk.status}</b>!`,
			{ parse_mode: "HTML" }
		);
	} else {
		await bot.sendMessage(
			msg.chat.id,
			`Sorry, I couldn't find a Datawalk with code <b>${code}</b>`,
			{ parse_mode: "HTML" }
		);
	}
};


bot.on("photo", async (msg: Message) => {
	const file_id = msg.photo?.[msg.photo.length - 1].file_id;
	storeDataPoint(msg, file_id, "photo");
});

bot.on("video", async (msg: Message) => {
	const file_id = msg.video?.file_id;
	storeDataPoint(msg, file_id, "video");
});

bot.on("video_note", async (msg: Message) => {
	const file_id = msg.video_note?.file_id;
	storeDataPoint(msg, file_id, "video");
});

bot.on("voice", async (msg: Message) => {
	const file_id = msg.voice?.file_id;
	storeDataPoint(msg, file_id, "audio");
});

bot.on("location", async (msg: Message) => {
	if (!msg.location) {
		await bot.sendMessage(msg.chat.id, `Location is missing ..?`);
		return;
	}

	const participant = await ParticipantRepository.findByChatId(msg.chat.id);

	if (!participant || !participant.current_datawalk_id) {
		await bot.sendMessage(msg.chat.id, `Sorry, I was not able to store the location you sent. Please join a Datawalk first!`, {
			parse_mode: "HTML"
		});
		return;
	}

	const datawalk = await DatawalkRepository.findById(participant.current_datawalk_id);

	if (datawalk) {
		const trackpoint = await TrackPointRepository.create({
			latitude: msg.location.latitude,
			longitude: msg.location.longitude,
			// accuracy: msg.location.horizontal_accuracy,
			// heading: msg.location.heading,
			participant_id: participant.id,
			datawalk_id: datawalk.id
		});
		console.log("Added trackpoint:", trackpoint);

		const orphans = await DataPointRepository.findOrphansByParticipantId(participant.id);

		for (const orphan of orphans) {
			orphan.trackpoint_id = trackpoint?.id;
			await DataPointRepository.update(orphan.id, orphan);
		}

		// if (locationQueue[msg.chat.id] && locationQueue[msg.chat.id].locationExpected) {
		// 	let datapoint = await DataPointRepository.findById(locationQueue[msg.chat.id].datapoint_id);

		// 	datapoint.trackpoint_id = trackpoint?.id;

		// 	datapoint = await DataPointRepository.update(datapoint.id, datapoint);

		// 	// await bot.sendMessage(
		// 	// 	msg.chat.id,
		// 	// 	`Recorded location with media: ${msg.location?.latitude}, ${msg.location?.longitude}`
		// 	// );
		// 	delete locationQueue[msg.chat.id];
		// }
	}
});

bot.on("edited_message", async (msg: Message) => {
	const location = <UpdatedLocation>msg.location;

	const participant = await ParticipantRepository.findByChatId(msg.chat.id);
	const datawalk = await DatawalkRepository.findById(participant?.current_datawalk_id);

	if (datawalk) {
		const trackpoint = await TrackPointRepository.create({
			latitude: location.latitude,
			longitude: location.longitude,
			accuracy: location.horizontal_accuracy,
			heading: location.heading,
			participant_id: participant.id,
			datawalk_id: datawalk.id
		});
		console.log("Added data point:", trackpoint);

		if (locationQueue[msg.chat.id] && locationQueue[msg.chat.id].locationExpected) {
			let datapoint = await DataPointRepository.findById(locationQueue[msg.chat.id].datapoint_id);

			datapoint.trackpoint_id = trackpoint?.id;

			datapoint = await DataPointRepository.update(datapoint.id, datapoint);

			// await bot.sendMessage(
			// 	msg.chat.id,
			// 	`Recorded location with media: ${msg.location?.latitude}, ${msg.location?.longitude}`
			// );
			delete locationQueue[msg.chat.id];
		}
	}
});

const findOrCreateParticipant = async (msg: Message) => {
	let participant: Participant | undefined = await ParticipantRepository.findByChatId(msg.chat.id);

	if (!participant) {
		participant = await ParticipantRepository.create({
			chat_id: msg.chat.id,
			username: msg.chat.username,
			first_name: msg.chat.first_name,
			last_name: msg.chat.last_name
		});
	}

	return participant;
};

const participate = async (msg: Message, datawalk: Datawalk) => {
	const participant: Participant | undefined = await findOrCreateParticipant(msg);

	if (!participant) {
		await bot.sendMessage(
			msg.chat.id,
			`Sorry, I was not able to save your participation to the requested Datawalk`,
			{
				parse_mode: "HTML"
			}
		);
		return;
	}

	participant.current_datawalk_id = datawalk.id;
	await ParticipantRepository.update(participant.id, participant);

	console.log("Participant:", participant);

	await bot.sendMessage(
		msg.chat.id,
		`Welcome to Datawalk <b>${datawalk.name}</b> with code <b>${datawalk.code}</b>! Please start sharing your live location when you start your Datawalk. You may turn of location sharing as soon as the Datawalk is over.`,
		{ parse_mode: "HTML" }
	);
};

const storeTextOnlyDataPoint = async (msg: Message) => {
	const participant = await ParticipantRepository.findByChatId(msg.chat.id);

	if (!participant || !participant.current_datawalk_id) {
		await bot.sendMessage(
			msg.chat.id,
			`Sorry, I was not able to store the text you sent.`,
			{
				parse_mode: "HTML"
			}
		);

		return;
	}

	const datapoint: DataPoint | undefined = await DataPointRepository.create({
		media_type: "text",
		caption: msg.text,
		participant_id: participant?.id
	});

	bot.sendMessage(msg.chat.id, `Thanks for sharing your thought! 💬`, {
		parse_mode: "HTML",
		reply_to_message_id: msg.message_id
	});

	locationQueue[msg.chat.id] = {
		datapoint_id: datapoint?.id,
		photoMessageId: msg.message_id,
		locationExpected: true
	};
}

const storeDataPoint = async (msg: Message, file_id: string, media_type: string) => {
	if (!file_id) {
		await bot.sendMessage(
			msg.chat.id,
			`Sorry, I was not able to store the ${media_type} you sent.`,
			{
				parse_mode: "HTML"
			}
		);

		return;
	}

	const participant = await ParticipantRepository.findByChatId(msg.chat.id);

	if (!participant || !participant.current_datawalk_id) {
		await bot.sendMessage(
			msg.chat.id,
			`Sorry, I was not able to store the ${media_type} you sent.`,
			{
				parse_mode: "HTML"
			}
		);

		return;
	}

	if (!file_id) {
		await bot.sendMessage(
			msg.chat.id,
			`Sorry, I was not able to store the ${media_type} you sent.`,
			{
				parse_mode: "HTML"
			}
		);

		return;
	}

	// Download media
	const download_path = await bot.downloadFile(file_id, DATA_MEDIA_ROOT);
	const filename = download_path.split("/").pop();	
	const extension = filename.split(".").pop() || "";

	const mime_type = mime.lookup(extension) || "application/octet-stream";

	const datapoint: DataPoint | undefined = await DataPointRepository.create({
		media_type: media_type,
		caption: msg.caption,
		filename: filename,
		mime_type: mime_type,
		participant_id: participant?.id
	});

	let emoji;
	switch (media_type) {
		case "photo":
			emoji = "📸";
			break;
		case "video":
			emoji = "🎥";
			break;
		case "audio":
			emoji = "🎙";
			break;
		default:
			emoji = "📦";
	}
	bot.sendMessage(msg.chat.id, `Thanks for sharing! ${emoji}`, {
		parse_mode: "HTML",
		reply_to_message_id: msg.message_id
	});
};

// bot.on("audio", async (msg: Message) => {
// 	// TODO When is this sent?
// });

// bot.on("document", async (msg: Message) => {
// 	await bot.sendMessage(msg.chat.id, "Thanks for your document!");

// 	if (!msg.document) {
// 		await bot.sendMessage(msg.chat.id, "Unable to read the document you've sent!");
// 		return;
// 	}

// 	const file_id = msg.document.file_id;
// 	const file_name = msg.document.file_name;
// 	const file_size = msg.document.file_size;

// 	if (!file_size || validateFileSize(file_size)) {
// 		await bot.sendMessage(
// 			msg.chat.id,
// 			"File size is too large! Please send a file less than 20MB."
// 		);
// 		return;
// 	}

// 	if (file_id) {
// 		const url = await bot.getFileLink(file_id);
// 		await bot.sendMessage(msg.chat.id, `URL ${url}`);

// 		const filename = await bot.downloadFile(file_id, "./");
// 		await bot.sendMessage(msg.chat.id, `I saved it to ${filename}`);
// 	}
// });

// const validateFileSize = (file_size: number): boolean => {
// 	// check size of max 20MB
// 	const maxFileSize = 20 * 1024 * 1024;
// 	return file_size < maxFileSize;
// };
