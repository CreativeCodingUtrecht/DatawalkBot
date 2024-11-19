import type { Kysely } from "kysely";
import { addStandardColumns } from "$lib/database/migration-helpers";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("datawalk")
		.$call(addStandardColumns)
		.addColumn("code", "text", (col) => col.notNull().unique())
		.addColumn("name", "text", (col) => col.notNull())
		.addColumn("uuid", "text", (col) => col.notNull().unique())
		.addColumn("status", "text", (col) => col.notNull().defaultTo("active"))
		.execute();

	await db.schema
		.createTable("participant")
		.$call(addStandardColumns)
		.addColumn("uuid", "text", (col) => col.notNull().unique())		
		.addColumn("chat_id", "integer", (col) => col.notNull().unique())
		.addColumn("username", "text")
		.addColumn("first_name", "text")
		.addColumn("last_name", "text")
		.addColumn("organization", "text")
		.addColumn("email", "text")
		.addColumn("current_datawalk_id", "integer", (col) =>
			col.references("datawalk.id").onDelete("set null")
		)
		.execute();

	await db.schema
		.createTable("trackpoint")
		.$call(addStandardColumns)
		.addColumn("uuid", "text", (col) => col.notNull().unique())		
		.addColumn("latitude", "real", (col) => col.notNull())
		.addColumn("longitude", "real", (col) => col.notNull())
		.addColumn("accuracy", "integer")
		.addColumn("heading", "integer")
		.addColumn("participant_id", "integer", (col) =>
			col.notNull().references("participant.id").onDelete("cascade")
		)
		.addColumn("datawalk_id", "integer", (col) =>
			col.notNull().references("datawalk.id").onDelete("cascade")
		)
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("datawalk").execute();
	await db.schema.dropTable("participant").execute();
	await db.schema.dropTable("trackpoint").execute();
}
