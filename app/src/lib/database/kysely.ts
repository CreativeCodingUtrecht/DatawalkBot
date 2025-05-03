import { Kysely, Migrator, SqliteDialect, ParseJSONResultsPlugin, type LogConfig } from "kysely";
import SQLite from "better-sqlite3";
import { SerializeJSONPlugin } from "./serialize-json-plugin";
import { browser } from "$app/environment";
import { StaticMigrationProvider } from "./migration-provider";
import type { Database } from "./types";
import { env } from "$env/dynamic/private";

const SQLITE_DATABASE_FILE = env.SQLITE_DATABASE_FILE;
if (!SQLITE_DATABASE_FILE) {
	throw new Error("SQLITE_DATABASE_FILE is not set");
}

const sqliteInMemoryDialect: SqliteDialect = new SqliteDialect({
	async database() {
		console.log("Initializing SQLite Dialect (better-sqlite3)");
		return new SQLite(":memory:");
	}
});

const sqliteDialect: SqliteDialect = new SqliteDialect({
	async database() {
		console.log("Initializing SQLite Dialect (better-sqlite3)");
		return new SQLite(SQLITE_DATABASE_FILE);
	}
});

const isVitest = () => {
	return process && process.env.TEST === "true";
};

const configureDialect = () => {
	// Vitest
	if (isVitest()) {
		return sqliteInMemoryDialect;
	}

	// Vite server or Vite build
	// return dummyDialect;
	return sqliteDialect;
};

const configureLog = (): LogConfig => {
	// Mobile platforms and browser
	if (browser || isVitest()) {
		return ["query", "error"];
	}

	// Vite server or Vite build
	return [];
};

const db = new Kysely<Database>({
	dialect: configureDialect(),
	log: configureLog(),
	// plugins: [new SerializeJSONPlugin()]
	plugins: [new ParseJSONResultsPlugin()]
});

const migrateToLatest = async () => {
	const migrator = new Migrator({
		db,
		provider: new StaticMigrationProvider()
	});

	const { error, results } = await migrator.migrateToLatest();

	results?.forEach((it) => {
		if (it.status === "Success") {
			console.log(`migration "${it.migrationName}" was executed successfully`);
		} else if (it.status === "Error") {
			console.error(`failed to execute migration "${it.migrationName}"`);
		}
	});

	if (error) {
		console.error("failed to migrate", error);
	}

	const tables = await db.introspection.getTables();
	console.log("Schema after migration:", tables);

	return db;
};

migrateToLatest();

export default db;
