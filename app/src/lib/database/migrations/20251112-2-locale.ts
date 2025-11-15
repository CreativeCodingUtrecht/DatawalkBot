import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable("datawalk")
		.addColumn("locale", "text", (col) => col.notNull().defaultTo("en"))
		.execute();		
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable("datawalk")
		.dropColumn("locale")
		.execute();
}
