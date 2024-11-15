import type { Kysely } from 'kysely';
import { addStandardColumns } from '$lib/database/migration-helpers';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('datawalk')
		.$call(addStandardColumns)
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('uuid', 'text', (col) => col.notNull())
		.addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('datawalk').execute();
}
