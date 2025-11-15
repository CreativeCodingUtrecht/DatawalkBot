import * as DatawalkRepository from "$lib/database/repositories/DatawalkRepository";
import * as BirdDetectionRepository from "$lib/database/repositories/BirdDetectionRepository";
import type { BirdWeatherDetection, BirdWeatherSpecies } from "./types";
import type { Datawalk, BirdDetection, Participant, DataPoint } from "$lib/database/types";
import { bot } from "$lib/telegram/bot";

const POLL_INTERVAL = 30000; // 30 seconds
const BIRDWEATHER_API_URL = "https://app.birdweather.com/api/v1";
const MAX_DETECTION_AGE = 5 * 60 * 1000; // 5 minutes
const MIN_NOTIFICATION_INTERVAL = 3 * 60; // 5 minute
const FETCH_DETECTION_LIMIT = 5;

export const startPollingBirdWeather = () => {
	let i = 0;

	setInterval(async () => {
		try {
			pollBirdWeather();
		} catch (e) {
			console.error("Error polling BirdWeather:", e);
		}
	}, POLL_INTERVAL);
};

export const pollBirdWeather = async () => {
	const datawalks: Datawalk[] = await DatawalkRepository.findWithParticipantsByBirdWeatherStation();

	for (let datawalk of datawalks) {
		console.log(
			`Retrieving BirdWeather data for station ${datawalk.birdweather} for datawalk ${datawalk.code}`
		);

		if (datawalk.birdweather) {
			const detections: BirdWeatherDetection[] = await fetchBirdDetections(
				datawalk.birdweather,
				datawalk.locale
			);

			const birddetections: BirdDetection[] = await processBirdDetections(detections, datawalk.id);

			for (let birddetection of birddetections) {
				console.log("BirdDetection", birddetection);

				// Check whether this is a recent detection
				if (birddetection.detected_at) {
					const now = Date.now();
					const detected_at = new Date(birddetection.detected_at + "Z").getTime();
					const diff = now - detected_at;
					if (diff > MAX_DETECTION_AGE) {
						console.log("Detection is old, ignoring it. Minutes: ",diff/60/1000);
						continue;
					}
				}

				// Notify if this species has not been seen within a set interval (50 seconds)
				if (!(await BirdDetectionRepository.findNotified(birddetection, MIN_NOTIFICATION_INTERVAL))) {
					console.log("Species is actual enough, send notification");
					notifyParticipants(birddetection, datawalk);
				} else {
					console.log("Species has been seen and notified recently, do not send notification");
				}
			}
		}
	}
};

const notifyParticipants = async (birddetection: BirdDetection, datawalk: Datawalk) => {
	const confidence = Math.floor(birddetection.confidence * 100);

	let message = `Psst, <b>${birddetection.commonName}</b> (<a href="https://${datawalk.locale}.wikipedia.org/wiki/${birddetection.commonName}">${birddetection.scientificName}</a>) appears to be near you (${confidence}% certain) 🪶`;

	let audio;
	if (birddetection.soundscapeUrl) {
		const audio_data = await fetch(birddetection.soundscapeUrl);
		audio = Buffer.from(await audio_data.arrayBuffer());
	}

	const participants = datawalk.participants_current;

	for (let participant of participants) {
		try {
		await bot.sendPhoto(participant.chat_id, birddetection.imageUrl, {
			caption: message,
			parse_mode: "HTML"
		});
		} catch (e) {
			console.error("Unable to send photo to Telegram bot", e)
		}

		if (false && audio) {
			await bot.sendVoice(
				participant.chat_id,
				audio
				// {
				// 	caption: `<a href="${img_url}">&#8205;</a>` + message, //"🔊 Soundscape",
				// 	parse_mode: "HTML",

				// 	// thumbnail: img_url
				// },
				// {
				// 	// filename: `${observation.species.commonName}`
				// }
			);
		}
	}

	await BirdDetectionRepository.setNotified(birddetection.id);
};

const processBirdDetections = async (detections: BirdWeatherDetection[], datawalk_id: number) => {
	const birdDetections: BirdDetection[] = [];

	for (let detection of detections) {
		// const species = await fetchBirdSpeciesInfo(observation.species.id, datawalk.locale);

		// // Check whether this is a recent detection
		// if (detection.timestamp) {
		// 	const now = Date.now();
		// 	const detected_at = new Date(detection.timestamp).getTime();
		// 	const diff = now - detected_at;
		// 	const maxAllowedDiff = 5 * 60 * 1000; // 5 minutes
		// 	if (diff > maxAllowedDiff) {
		// 		console.log("Detection is old, ignoring it");
		// 		continue;
		// 	}
		// }

		const existing = await BirdDetectionRepository.find({
			datawalk_id: datawalk_id,
			species_id: detection.species.id,
			station_id: detection.stationId,
			detected_at: detection.timestamp
		});

		if (existing.length > 0) {
			console.log("Skipping seen detection");
			continue;
		}
		const birdDetection: BirdDetection = await BirdDetectionRepository.create({
			datawalk_id,
			detected_at: detection.timestamp,
			station_id: detection.stationId,
			species_id: detection.species.id,
			confidence: detection.confidence,
			probability: detection.probability,
			score: detection.score,
			certainty: detection.certainty,
			algorithm: detection.algorithm,
			lat: detection.lat,
			lon: detection.lon,
			commonName: detection.species.commonName,
			scientificName: detection.species.scientificName,
			imageUrl: detection.species.imageUrl,
			thumbnailUrl: detection.species.thumbnailUrl,
			soundscapeUrl: detection.soundscape?.url
		});

		birdDetections.push(birdDetection);
	}

	return birdDetections;
};

const fetchBirdDetections = async (
	station: number,
	locale: string = "en",
	limit: number = FETCH_DETECTION_LIMIT
): Promise<BirdWeatherDetection[]> => {
	const url: string = `${BIRDWEATHER_API_URL}/stations/${String(station)}/detections?locale=${locale}&limit=${limit}`;

	try {
		const res = await fetch(url);
		if (!res.ok) return [];

		const data = await res.json();
		// console.log(`BirdWeather detection data for station ${station}`, data);

		return data.detections;
	} catch (err) {
		console.error("Error fetching BirdWeather data:", err);
		return [];
	}
};

const fetchBirdSpeciesInfo = async (
	id: number,
	locale: string = "en"
): Promise<BirdWeatherSpecies[]> => {
	const url: string = `${BIRDWEATHER_API_URL}/species/${String(id)}?locale=${locale}`;

	try {
		const res = await fetch(url);
		if (!res.ok) return [];

		const data = await res.json();
		console.log(`BirdWeather species info`, data.species);

		return data;
	} catch (err) {
		console.error("Error fetching BirdWeather species info:", err);
		return [];
	}
};

// export async function fetchBirdWiki(scientificName: string, locale: string = "en") {
// 	const encodedName = encodeURIComponent(scientificName);
// 	const url = `https://${locale}.wikipedia.org/api/rest_v1/page/summary/${encodedName}`;
// 	console.log(`Retrieving Wikipedia info at URL`, url)

// 	try {
// 		const res = await fetch(url);
// 		console.log("res",res)
// 		if (!res.ok) return null;

// 		const data = await res.json();
// 		console.log(`Wikipedia data for ${scientificName}`, data)

// 		return {
// 			title: data.title,
// 			summary: data.extract,
// 			image: data.thumbnail?.source,
// 			link: data.content_urls?.desktop?.page
// 		};
// 	} catch (err) {
// 		console.error("Error fetching Wikipedia data:", err);
// 		return null;
// 	}
// }
