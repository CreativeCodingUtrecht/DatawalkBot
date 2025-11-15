import type { Migration, MigrationProvider } from "kysely";

export class StaticMigrationProvider implements MigrationProvider {
	constructor() {}

	async getMigrations(): Promise<Record<string, Migration>> {
		const migrations: Record<string, Migration> = {
			"20251115-4-birddetection": await import("./migrations/20251115-4-birddetection"),
			"20251115-3-birddetection": await import("./migrations/20251115-3-birddetection"),
			"20251115-2-birddetection": await import("./migrations/20251115-2-birddetection"),
			"20251115-1-birddetection": await import("./migrations/20251115-1-birddetection"),
			"20251112-2-locale": await import("./migrations/20251112-2-locale"),
			"20251112-1-birdweather": await import("./migrations/20251112-1-birdweather"),
			"20251110-1-begin-and-end": await import("./migrations/20251110-1-begin-and-end"),
			"20241117-1-datapoint": await import("./migrations/20241117-1-datapoint"),
			"20241115-1-initial": await import("./migrations/20241115-1-initial")
		};

		console.log("Available migrations:", migrations);

		return migrations;
	}
}
