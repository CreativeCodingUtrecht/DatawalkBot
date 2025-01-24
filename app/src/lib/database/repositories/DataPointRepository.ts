import { v4 as uuidv4, validate as validate_uuid } from "uuid";
import db from "$lib/database";
import type { DataPointUpdate, DataPoint, NewDataPoint } from "$lib/database/types";
import { sql } from "kysely";

export const findById = async (id: number) => {
	return await db.selectFrom("datapoint").where("id", "=", id).selectAll().executeTakeFirst();
};

export const findByUuid = async (uuid: string) => {
	return await db.selectFrom("datapoint").where("uuid", "=", uuid).selectAll().executeTakeFirst();
};

export const findByParticipantId = async (participant_id: number) => {
	return await db
		.selectFrom("datapoint")
		.where("participant_id", "=", participant_id)
		.selectAll()
		.execute();
};

export const findOrphansByParticipantId = async (participant_id: number) => {
	return await db
		.selectFrom("datapoint")
		.where("participant_id", "=", participant_id)
		.where("trackpoint_id", "is", null)
		.selectAll()
		.execute();
};

export const findByTrackPointId = async (trackpoint_id: number) => {
	return await db
		.selectFrom("datapoint")
		.where("trackpoint_id", "=", trackpoint_id)
		.selectAll()
		.executeTakeFirst();
};

export const find = async (criteria: Partial<DataPoint>) => {
	let query = db.selectFrom("datapoint");

	if (criteria.id) {
		query = query.where("id", "=", criteria.id);
	}

	if (criteria.uuid) {
		query = query.where("uuid", "=", criteria.uuid);
	}

	if (criteria.media_type) {
		query = query.where("media_type", "=", criteria.media_type);
	}

	if (criteria.caption) {
		query = query.where("caption", "=", criteria.caption);
	}

	if (criteria.filename) {
		query = query.where("filename", "=", criteria.filename);
	}

	if (criteria.mime_type) {
		query = query.where("mime_type", "=", criteria.mime_type);
	}

	if (criteria.participant_id) {
		query = query.where("participant_id", "=", criteria.participant_id);
	}

	if (criteria.trackpoint_id) {
		query = query.where("trackpoint_id", "=", criteria.trackpoint_id);
	}

	return await query.selectAll().execute();
};

export const findAll = async () => {
	return find({});
};

export const update = async (id: number, updateWith: DataPointUpdate) => {
	await db.updateTable("datapoint").set(updateWith).where("id", "=", id).execute();
	return await findById(id);
};

export const create = async (datapoint: NewDataPoint) => {
	if (!datapoint.uuid || !validate_uuid(datapoint.uuid)) {
		datapoint.uuid = uuidv4();
	}

	return await db.insertInto("datapoint").values(datapoint).returningAll().executeTakeFirst();
};

export const remove = async (id: number) => {
	return await db.deleteFrom("datapoint").where("id", "=", id).returningAll().executeTakeFirst();
};

export const removeAll = async () => {
	return await db.deleteFrom("datapoint").execute();
};
