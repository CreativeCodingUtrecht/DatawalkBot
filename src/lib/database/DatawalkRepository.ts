import { v4 as uuidv4, validate as validate_uuid } from 'uuid';
import db from '$lib/database';
import type { DatawalkUpdate, Datawalk, NewDatawalk } from '$lib/database/types';

export const findById = async (id: number) => {
	return await db.selectFrom('datawalk').where('id', '=', id).selectAll().executeTakeFirst();
}

export const findByUuid = async (uuid: string) => {
	return await db.selectFrom('datawalk').where('uuid', '=', uuid).selectAll().executeTakeFirst();
}

export const findByCode = async (code: string) => {
	return await db.selectFrom('datawalk').where('code', '=', code).selectAll().executeTakeFirst();
}

export const find = async (criteria: Partial<Datawalk>) => {
	let query = db.selectFrom('datawalk');

	if (criteria.id) {
		query = query.where('id', '=', criteria.id);
	}

	if (criteria.name) {
		query = query.where('name', '=', criteria.name);
	}

	if (criteria.uuid) {
		query = query.where('uuid', '=', criteria.uuid);
	}

	if (criteria.status) {
		query = query.where('status', '=', criteria.status);
	}

	if (criteria.created_at) {
		query = query.where('created_at', '=', criteria.created_at);
	}

	// if (criteria.updated_at) {
	// 	query = query.where('updated_at', '=', criteria.updated_at);
	// }

	return await query.selectAll().execute();
}

export const findAll = async () => {
	return find({});
}

export const update = async (id: number, updateWith: DatawalkUpdate) => {
	await db.updateTable('datawalk').set(updateWith).where('id', '=', id).execute();
	const datawalk = await findById(id);
	return datawalk;
}

export const create = async (datawalk: NewDatawalk) => {
	if (!datawalk.uuid || !validate_uuid(datawalk.uuid)) {
		datawalk.uuid = uuidv4();
	}

	if (!datawalk.code || datawalk.code.length <= 4) {
		datawalk.code = generateDatawalkCode(4);
	}

	return await db.insertInto('datawalk').values(datawalk).returningAll().executeTakeFirst();
}

export const remove = async (id: number) => {
	return await db.deleteFrom('datawalk').where('id', '=', id).returningAll().executeTakeFirst();
}

export const removeByUuid = async (uuid: string) => {
	return await db.deleteFrom('datawalk').where('uuid', '=', uuid).returningAll().executeTakeFirst();
}

export const removeAll = async () => {
	return await db.deleteFrom('datawalk').execute();
}

const CODE_CHARACTERS ='ABCDEFGHIJKLMNPQRSTUVWXYZ';

const generateDatawalkCode = (length : number) => {
    let result = "";
    for ( let i = 0; i < length; i++ ) {
        result += CODE_CHARACTERS.charAt(Math.floor(Math.random() * CODE_CHARACTERS.length));
    }
    return result;
}