import { v4 as uuidv4, validate as validate_uuid } from "uuid";
import db from "$lib/database";
import type { BirdDetection, BirdDetectionUpdate, NewBirdDetection } from "$lib/database/types";
import { sql } from "kysely";

export const findById = async (id: number) => {
	return await db.selectFrom("birddetection").where("id", "=", id).selectAll().executeTakeFirst();
};

export const findByUuid = async (uuid: string) => {
	return await db
		.selectFrom("birddetection")
		.where("uuid", "=", uuid)
		.selectAll()
		.executeTakeFirst();
};

export const findByDatawalkId = async (datawalk_id: number) => {
	return await db
		.selectFrom("birddetection")
		.where("datawalk_id", "=", datawalk_id)
		.selectAll()
		.execute();
};

export const findNotified = async (birddetection: BirdDetection, seconds: number = 300) => {
	return await db
		.selectFrom("birddetection")
		.selectAll()
		.where("datawalk_id", "=", birddetection.datawalk_id)
		.where("species_id", "=", birddetection.species_id)
		.where("station_id", "=", birddetection.station_id)
		.where("notified_at", ">", sql`datetime('now', '-' || ${seconds} || ' seconds')`)
		.limit(1)
		.executeTakeFirst();
};

export const find = async (criteria: Partial<BirdDetection>) => {
	let query = db.selectFrom("birddetection");

	if (criteria.detected_at) {
		query = query.where("detected_at", "=", sql`datetime(${criteria.detected_at})`);
	}

	if (criteria.id) {
		query = query.where("id", "=", criteria.id);
	}

	if (criteria.uuid) {
		query = query.where("uuid", "=", criteria.uuid);
	}

	if (criteria.species_id) {
		query = query.where("species_id", "=", criteria.species_id);
	}

	if (criteria.station_id) {
		query = query.where("station_id", "=", criteria.station_id);
	}

	if (criteria.datawalk_id) {
		query = query.where("datawalk_id", "=", criteria.datawalk_id);
	}

	return await query.selectAll().execute();
};

export const findAll = async () => {
	return find({});
};

export const update = async (id: number, updateWith: BirdDetectionUpdate) => {
	await db.updateTable("birddetection").set(updateWith).where("id", "=", id).execute();
	return await findById(id);
};

export const setNotified = async (id: number) => {
	await db
		.updateTable("birddetection")
		.set({ notified_at: sql`CURRENT_TIMESTAMP` })
		.where("id", "=", id)
		.execute();
	const birddetection = await findById(id);
	return birddetection;
};

export const create = async (birddetection: NewBirdDetection) => {
	if (!birddetection.uuid || !validate_uuid(birddetection.uuid)) {
		birddetection.uuid = uuidv4();
	}

	return await db
		.insertInto("birddetection")
		.values({
			...birddetection,
			detected_at: birddetection.detected_at ? sql`datetime(${birddetection.detected_at})` : null
		})
		.returningAll()
		.executeTakeFirst();
};

export const remove = async (id: number) => {
	return await db
		.deleteFrom("birddetection")
		.where("id", "=", id)
		.returningAll()
		.executeTakeFirst();
};

export const removeAll = async () => {
	return await db.deleteFrom("birddetection").execute();
};
