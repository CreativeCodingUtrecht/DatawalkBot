import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {

	await db.schema
		.alterTable("datawalk")
		.addColumn("begin_at", "timestamp")
		.execute();
	
	await db.schema
		.alterTable("datawalk")
		.addColumn("end_at", "timestamp")
		.execute();
		
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable("datawalk")
		.dropColumn("begin_at")
		.execute();

	await db.schema
		.alterTable("datawalk")
		.dropColumn("end_at")
		.execute();
}
