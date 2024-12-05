import type { Migration, MigrationProvider } from "kysely";

export class StaticMigrationProvider implements MigrationProvider {
	constructor() {}

	async getMigrations(): Promise<Record<string, Migration>> {
		const migrations: Record<string, Migration> = {
			"20241117-1-datapoint": await import("./migrations/20241117-1-datapoint"),
			"20241115-1-initial": await import("./migrations/20241115-1-initial")
		};

		console.log("Available migrations:", migrations);

		return migrations;
	}
}
