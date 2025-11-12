import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable("datawalk")
		.addColumn("birdweather", "integer")
		.execute();		
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable("datawalk")
		.dropColumn("birdweather")
		.execute();
}
