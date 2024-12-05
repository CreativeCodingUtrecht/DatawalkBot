import type { Kysely } from "kysely";
import { addStandardColumns } from "$lib/database/migration-helpers";

export async function up(db: Kysely<any>): Promise<void> {

	await db.schema
		.createTable("datapoint")
		.$call(addStandardColumns)
		.addColumn("uuid", "text", (col) => col.notNull().unique())		
		.addColumn("media_type", "text", (col) => col.notNull().defaultTo("text"))
		.addColumn("caption", "text")
		.addColumn("filename", "text")
		.addColumn("mime_type", "text")
		.addColumn("participant_id", "integer", (col) =>
			col.notNull().references("participant.id").onDelete("cascade")
		)
		.addColumn("trackpoint_id", "integer", (col) =>
			col.references("trackpoint.id").onDelete("cascade")
		)
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("datapoint").execute();
}
