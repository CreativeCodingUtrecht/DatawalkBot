import type { Migration, MigrationProvider } from 'kysely';

export class StaticMigrationProvider implements MigrationProvider {
	constructor() {}

	async getMigrations(): Promise<Record<string, Migration>> {
		const migrations: Record<string, Migration> = {
			"migration-initial": await import('./migrations/migration-initial')
		};

		// console.log('Available migrations:', migrations);

		return migrations;
	}
}
