import { v4 as uuidv4, validate as validate_uuid } from 'uuid';
import db from '$lib/database';
import type { TrackPointUpdate, TrackPoint, NewTrackPoint } from '$lib/database/types';

export const findById = async (id: number) => {
	return await db.selectFrom('trackpoint').where('id', '=', id).selectAll().executeTakeFirst();
}

export const findByDatawalkId = async (datawalk_id: number) => {
	return await db.selectFrom('trackpoint').where('datawalk_id', '=', datawalk_id).selectAll().executeTakeFirst();
}

export const findByDatawalkParticipantId = async (datawalk_id: number, participant_id: number) => {
	return await db.selectFrom('trackpoint')
		.where('datawalk_id', '=', datawalk_id)
		.where('participant_id', '=', participant_id)
		.selectAll().executeTakeFirst();
}


export const find = async (criteria: Partial<TrackPoint>) => {
	let query = db.selectFrom('trackpoint');

	if (criteria.id) {
		query = query.where('id', '=', criteria.id);
	}

	if (criteria.datawalk_id) {
		query = query.where('datawalk_id', '=', criteria.datawalk_id);
	}

	if (criteria.participant_id) {
		query = query.where('participant_id', '=', criteria.participant_id);
	}

	if (criteria.longitude) {
		query = query.where('longitude', '=', criteria.longitude);
	}

	if (criteria.latitude) {
		query = query.where('lattitude', '=', criteria.lattitude);
	}

	if (criteria.created_at) {
		query = query.where('created_at', '=', criteria.created_at);
	}

	return await query.selectAll().execute();
}

export const findAll = async () => {
	return find({});
}

export const update = async (id: number, updateWith: TrackPointUpdate) => {
	await db.updateTable('trackpoint').set(updateWith).where('id', '=', id).execute();
	const trackpoint = await findById(id);
	return trackpoint;
}

export const create = async (trackpoint: NewTrackPoint) => {
	if (!trackpoint.uuid || !validate_uuid(trackpoint.uuid)) {
		trackpoint.uuid = uuidv4();
	}

	return await db.insertInto('trackpoint').values(trackpoint).returningAll().executeTakeFirst();
}

export const remove = async (id: number) => {
	return await db.deleteFrom('trackpoint').where('id', '=', id).returningAll().executeTakeFirst();
}

export const removeByDatawalkId = async (id: number) => {
	return await db.deleteFrom('trackpoint').where('datawalk_id', '=', id).returningAll().executeTakeFirst();
}

export const removeAll = async () => {
	return await db.deleteFrom('trackpoint').execute();
}
