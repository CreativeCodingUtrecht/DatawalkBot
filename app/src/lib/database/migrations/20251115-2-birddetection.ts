import type { Kysely } from "kysely";
import { addStandardColumns } from "$lib/database/migration-helpers";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable("birddetection")
		.addColumn("soundscapeUrl", "text")
		.execute();		
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable("birddetection")
		.dropColumn("soundscapeUrl")
		.execute();

}
