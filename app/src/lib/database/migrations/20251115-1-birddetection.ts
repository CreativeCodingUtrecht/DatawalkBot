import type { Kysely } from "kysely";
import { addStandardColumns } from "$lib/database/migration-helpers";

export async function up(db: Kysely<any>): Promise<void> {

	await db.schema
		.createTable("birddetection")
		.$call(addStandardColumns)
		.addColumn("datawalk_id", "integer", (col) =>
			col.notNull().references("datawalk.id").onDelete("cascade")
		)
		.addColumn("uuid", "text", (col) => col.notNull().unique())		
		.addColumn("station_id", "integer")
		.addColumn("species_id", "integer")
		.addColumn("confidence", "decimal")
		.addColumn("probability", "decimal")
		.addColumn("score", "decimal")
		.addColumn("certainty", "text")
		.addColumn("algorithm", "text")
		.addColumn("lat", "decimal")
		.addColumn("lon", "decimal")
		.addColumn("commonName", "text")
		.addColumn("scientificName", "text")
		.addColumn("imageUrl", "text")
		.addColumn("thumbnailUrl", "text")
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("birddetection").execute();
}
