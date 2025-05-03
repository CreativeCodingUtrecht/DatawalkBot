import { v4 as uuidv4, validate as validate_uuid } from "uuid";
import db from "$lib/database";
import type {
	DatawalkUpdate,
	Datawalk,
	NewDatawalk,
	Participant,
	DatawalkExportable,
	DatawalkWithParticipantsData
} from "$lib/database/types";
import { jsonArrayFrom } from "kysely/helpers/sqlite";
import { sql } from "kysely";

export const findById = async (id: number) => {
	return await db.selectFrom("datawalk").where("id", "=", id).selectAll().executeTakeFirst();
};

export const findByUuid = async (uuid: string) => {
	return await db.selectFrom("datawalk").where("uuid", "=", uuid).selectAll().executeTakeFirst();
};

export const findByCode = async (code: string) => {
	return await db.selectFrom("datawalk").where("code", "=", code).selectAll().executeTakeFirst();
};

export const find = async (criteria: Partial<Datawalk>) => {
	let query = db.selectFrom("datawalk");

	if (criteria.id) {
		query = query.where("id", "=", criteria.id);
	}

	if (criteria.name) {
		query = query.where("name", "=", criteria.name);
	}

	if (criteria.uuid) {
		query = query.where("uuid", "=", criteria.uuid);
	}

	if (criteria.code) {
		query = query.where("code", "=", criteria.code);
	}

	if (criteria.status) {
		query = query.where("status", "=", criteria.status);
	}

	if (criteria.created_at) {
		query = query.where("created_at", "=", criteria.created_at);
	}

	return await query.orderBy("created_at", "desc").selectAll().execute();
};

export const findWithParticipantsByCode = async (
	code: string
): Promise<DatawalkWithParticipants> => {
	return await db
		.selectFrom("datawalk")
		.selectAll("datawalk")
		.where("datawalk.code", "=", code)
		.select((eb) => [
			// participants
			jsonArrayFrom(
				eb
					.selectFrom("participant")
					.select([
						"id",
						"uuid",
						"created_at",
						"chat_id",
						"username",
						"first_name",
						"last_name",
						"organization",
						"email"
					])
					.whereRef("participant.current_datawalk_id", "=", "datawalk.id")
			).as("participants_current")
		])
		.select((eb) => [
			// contributing participants
			jsonArrayFrom(
				eb
					.selectFrom("participant")
					.select([
						"id",
						"uuid",
						"created_at",
						"chat_id",
						"username",
						"first_name",
						"last_name",
						"organization",
						"email"
					])
					.where((eb) =>
						eb.exists(
							eb
								.selectFrom("trackpoint")
								.select("participant.id")
								.whereRef("trackpoint.participant_id", "=", "participant.id")
								.whereRef("trackpoint.datawalk_id", "=", "datawalk.id")
						)
					)
			).as("participants_contributing")
		])
		.executeTakeFirst();
};

export const findAllWithParticipants = async () => {
	return await db
		.selectFrom("datawalk")
		.selectAll("datawalk")
		.select((eb) => [
			// participants
			jsonArrayFrom(
				eb
					.selectFrom("participant")
					.select([
						"id",
						"uuid",
						"created_at",
						"chat_id",
						"username",
						"first_name",
						"last_name",
						"organization",
						"email"
					])
					.whereRef("participant.current_datawalk_id", "=", "datawalk.id")
			).as("participants_current")
		])
		.select((eb) => [
			// contributing participants
			jsonArrayFrom(
				eb
					.selectFrom("participant")
					.select([
						"id",
						"uuid",
						"created_at",
						"chat_id",
						"username",
						"first_name",
						"last_name",
						"organization",
						"email"
					])
					.where((eb) =>
						eb.exists(
							eb
								.selectFrom("trackpoint")
								.select("participant.id")
								.whereRef("trackpoint.participant_id", "=", "participant.id")
								.whereRef("trackpoint.datawalk_id", "=", "datawalk.id")
						)
					)
			).as("participants_contributing")
		])
		.execute();
};

export const findAllWithParticipantsAndContributors = async () => {
	return await db
		.selectFrom("datawalk")
		.select((eb) => [
			"datawalk.id",
			"datawalk.code",
			"datawalk.name",

			// Current participants as a JSON array of objects using jsonArrayFrom
			jsonArrayFrom(
				eb
					.selectFrom("participant")
					.select(["participant.id", "participant.first_name", "participant.last_name"])
					.whereRef("participant.current_datawalk_id", "=", "datawalk.id")
			).as("currentParticipants"),

			// Contributing participants as a JSON array of objects using jsonArrayFrom
			jsonArrayFrom(
				eb
					.selectFrom("trackpoint")
					.innerJoin("participant as contributor", "contributor.id", "trackpoint.participant_id")
					.select(["contributor.id", "contributor.first_name", "contributor.last_name"])
					.whereRef("trackpoint.datawalk_id", "=", "datawalk.id")
					.distinct()
			).as("contributingParticipants")
		])
		.where("datawalk.status", "=", "active")
		.orderBy("datawalk.created_at", "desc")
		.execute();
};

export const findExportableParticipantData = async (
	datawalk: Datawalk,
	participant: Participant
): Promise<DatawalkExportable> => {
	let query = db
		.selectFrom("participant")
		.select([
			"participant.id",
			"participant.uuid",
			"participant.first_name",
			"participant.last_name",
			"participant.username",
			"participant.organization",
			"participant.created_at",
			"participant.email",
			"participant.chat_id"
		])
		.where("participant.id", "=", participant.id)
		.select((eb) => [
			jsonArrayFrom(
				eb
					.selectFrom("trackpoint")
					.select([
						"trackpoint.uuid",
						"trackpoint.latitude",
						"trackpoint.longitude",
						"trackpoint.accuracy",
						"trackpoint.heading",
						"trackpoint.created_at"
					])
					.innerJoin("participant", "participant.id", "trackpoint.participant_id")
					.whereRef("trackpoint.participant_id", "=", "participant.id")
					.where("trackpoint.datawalk_id", "=", datawalk.id)
			).as("trackpoints"),
			jsonArrayFrom(
				eb
					.selectFrom("datapoint")
					.select([
						"datapoint.uuid",
						"datapoint.media_type",
						"datapoint.caption",
						"datapoint.filename",
						"datapoint.mime_type",
						"datapoint.created_at"
						// "trackpoint.latitude",
						// "trackpoint.longitude",
					])
					.innerJoin("participant as participant", "participant.id", "datapoint.participant_id")
					.innerJoin("trackpoint", "trackpoint.id", "datapoint.trackpoint_id")
					.whereRef("trackpoint.participant_id", "=", "participant.id")
					.where("trackpoint.datawalk_id", "=", datawalk.id)
			).as("datapoints")
		]);

	return await query.execute();
};

export const findDatawalkWithRelationsByCode = async (code: string) => {
	let query = db
		.selectFrom("datawalk")
		.select((eb) => [
			"datawalk.id",
			"datawalk.uuid",
			"datawalk.name",
			"datawalk.code",
			"datawalk.status",
			"datawalk.created_at",
			jsonArrayFrom(
				eb
					.selectFrom("participant")
					.select([
						"participant.id",
						"participant.uuid",
						"participant.username",
						"participant.first_name",
						"participant.last_name",
						"participant.organization",
						"participant.created_at",
						jsonArrayFrom(
							eb
								.selectFrom("trackpoint")
								.select([
									"trackpoint.id",
									"trackpoint.uuid",
									"trackpoint.latitude",
									"trackpoint.longitude",
									"trackpoint.accuracy",
									"trackpoint.heading",
									"trackpoint.created_at"
								])
								// .innerJoin("participant", "participant.id", "trackpoint.participant_id")
								.whereRef("trackpoint.datawalk_id", "=", "datawalk.id")
								.whereRef("trackpoint.participant_id", "=", sql.ref("participant.id"))
						).as("trackpoints"),
						jsonArrayFrom(
							eb
								.selectFrom("datapoint")
								.innerJoin("trackpoint", "trackpoint.id", "datapoint.trackpoint_id")
								// .innerJoin("participant", "participant.id", "trackpoint.participant_id")
								.select([
									"datapoint.uuid",
									"datapoint.media_type",
									"datapoint.caption",
									"datapoint.filename",
									"datapoint.mime_type",
									"datapoint.created_at",
									"trackpoint.latitude",
									"trackpoint.longitude"
								])
								.whereRef("trackpoint.datawalk_id", "=", "datawalk.id")
								.whereRef("trackpoint.participant_id", "=", sql.ref("participant.id"))
						).as("datapoints")
					])
					.innerJoin("trackpoint", "trackpoint.participant_id", "participant.id")
					.whereRef("trackpoint.datawalk_id", "=", "datawalk.id")
					.distinct()
			).as("participants")
		])
		.where("datawalk.code", "=", code)
		.$castTo<DatawalkWithParticipantsData>();

	return await query.executeTakeFirst();
};

export const findAll = async () => {
	return find({});
};

export const update = async (id: number, updateWith: DatawalkUpdate) => {
	await db.updateTable("datawalk").set(updateWith).where("id", "=", id).execute();
	const datawalk = await findById(id);
	return datawalk;
};

export const create = async (datawalk: NewDatawalk) => {
	if (!datawalk.uuid || !validate_uuid(datawalk.uuid)) {
		datawalk.uuid = uuidv4();
	}

	if (!datawalk.code || datawalk.code.length <= 4) {
		datawalk.code = generateDatawalkCode(4);
	}

	return await db.insertInto("datawalk").values(datawalk).returningAll().executeTakeFirst();
};

export const remove = async (id: number) => {
	return await db.deleteFrom("datawalk").where("id", "=", id).returningAll().executeTakeFirst();
};

export const removeByUuid = async (uuid: string) => {
	return await db.deleteFrom("datawalk").where("uuid", "=", uuid).returningAll().executeTakeFirst();
};

export const removeAll = async () => {
	return await db.deleteFrom("datawalk").execute();
};

const CODE_CHARACTERS = "ABCDEFGHIJKLMNPQRSTUVWXYZ";

const generateDatawalkCode = (length: number) => {
	let result = "";
	for (let i = 0; i < length; i++) {
		result += CODE_CHARACTERS.charAt(Math.floor(Math.random() * CODE_CHARACTERS.length));
	}
	return result;
};
