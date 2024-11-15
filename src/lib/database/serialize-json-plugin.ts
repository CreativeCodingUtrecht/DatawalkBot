import type { QueryResult, RootOperationNode, UnknownRow } from 'kysely';
import type { KyselyPlugin, PluginTransformQueryArgs, PluginTransformResultArgs } from 'kysely';

export class SerializeJSONPlugin implements KyselyPlugin {
	transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
		return args.node;
	}

	async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
		const { result } = args;

		return {
			...args.result,
			rows: result.rows.map(parseRow)
		};
	}
}

function parseRow(row: UnknownRow): UnknownRow {
	return Object.entries(row).reduce<UnknownRow>((row, [key, value]) => {
		if (typeof value === 'string' && value.match(/^[\[\{]/) != null) {
			try {
				value = JSON.parse(value);
			} catch (err) {
				// this catch block is intentionally empty.
			}
		}

		row[key] = value;

		return row;
	}, {});
}
