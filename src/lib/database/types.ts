import type { Generated, Selectable, Insertable, Updateable, ColumnType } from 'kysely';

export interface Database {
	datawalk: DatawalkTable;
}

export interface DatawalkTable {
	id: Generated<number>;
	created_at: Generated<Date>	
	name: string;
	uuid: Generated<string>;
	status: Generated<'active' | 'archived'>;
	// updated_at: Generated<Date>
}

export type Datawalk = Selectable<DatawalkTable>
export type NewDatawalk = Insertable<DatawalkTable>
export type DatawalkUpdate = Updateable<DatawalkTable>
