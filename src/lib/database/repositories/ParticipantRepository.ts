import { v4 as uuidv4, validate as validate_uuid } from 'uuid';
import db from '$lib/database';
import type { ParticipantUpdate, Participant, NewParticipant } from '$lib/database/types';

export const findById = async (id: number) => {
	return await db.selectFrom('participant').where('id', '=', id).selectAll().executeTakeFirst();
}

export const findByChatId = async (id: number) => {
	return await db.selectFrom('participant').where('chat_id', '=', id).selectAll().executeTakeFirst();
}

export const find = async (criteria: Partial<Participant>) => {
	let query = db.selectFrom('participant');

	if (criteria.id) {
		query = query.where('id', '=', criteria.id);
	}

	if (criteria.uuid) {
		query = query.where('uuid', '=', criteria.uuid);
	}

	if (criteria.current_datawalk_id) {
		query = query.where('current_datawalk_id', '=', criteria.current_datawalk_id);
	}

	if (criteria.chat_id) {
		query = query.where('chat_id', '=', criteria.chat_id);
	}

	if (criteria.username) {
		query = query.where('username', '=', criteria.username);
	}

	if (criteria.first_name) {
		query = query.where('first_name', '=', criteria.first_name);
	}

	if (criteria.last_name) {
		query = query.where('last_name', '=', criteria.last_name);
	}

	if (criteria.organization) {
		query = query.where('organization', '=', criteria.organization);
	}

	if (criteria.email) {
		query = query.where('email', '=', criteria.email);
	}

	if (criteria.created_at) {
		query = query.where('created_at', '=', criteria.created_at);
	}

	return await query.selectAll().execute();
}

export const findAll = async () => {
	return find({});
}

export const update = async (id: number, updateWith: ParticipantUpdate) => {
	await db.updateTable('participant').set(updateWith).where('id', '=', id).execute();
	const participant = await findById(id);
	return participant;
}

export const create = async (participant: NewParticipant) => {
	if (!participant.uuid || !validate_uuid(participant.uuid)) {
		participant.uuid = uuidv4();
	}

	return await db.insertInto('participant').values(participant).returningAll().executeTakeFirst();
}

export const remove = async (id: number) => {
	return await db.deleteFrom('participant').where('id', '=', id).returningAll().executeTakeFirst();
}

export const removeByChatId = async (id: number) => {
	return await db.deleteFrom('participant').where('chat_id', '=', id).returningAll().executeTakeFirst();
}

export const removeAll = async () => {
	return await db.deleteFrom('participant').execute();
}
