import type { Kysely } from "kysely";
import { addStandardColumns } from "$lib/database/migration-helpers";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable("birddetection")
		.addColumn("notified_at", "timestamp")
		.execute();		
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable("birddetection")
		.dropColumn("notified_at")
		.execute();

}
