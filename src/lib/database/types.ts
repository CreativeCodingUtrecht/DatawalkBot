import type { Generated, Selectable, Insertable, Updateable, ColumnType } from 'kysely';

export interface Database {
	datawalk: DatawalkTable;
	participant: ParticipantTable;
	trackpoint: TrackPointTable;
}

export interface DatawalkTable {
	id: Generated<number>;
	created_at: Generated<Date>	
	name: string;
	uuid: Generated<string>;
	code: Generated<string>;	
	status: Generated<'active' | 'archived'>;
}

export type Datawalk = Selectable<DatawalkTable>
export type NewDatawalk = Insertable<DatawalkTable>
export type DatawalkUpdate = Updateable<DatawalkTable>

export interface ParticipantTable {
	id: Generated<number>;
	created_at: Generated<Date>;
	uuid: Generated<string>;	
	chat_id: number;	
	username: string | null;
	first_name: string | null;
	last_name: string | null;
	organization: string | null;
	email: string | null;
	current_datawalk_id: number | null;		
}

export type Participant = Selectable<ParticipantTable>
export type NewParticipant = Insertable<ParticipantTable>
export type ParticipantUpdate = Updateable<ParticipantTable>

export interface TrackPointTable {
	id: Generated<number>;
	created_at: Generated<Date>;
	uuid: Generated<string>;	
	latitude: number;
	longitude: number;
	accuracy: number | null;
	heading: number | null;
	participant_id: number;	
	datawalk_id: number;
}

export type TrackPoint = Selectable<TrackPointTable>
export type NewTrackPoint = Insertable<TrackPointTable>
export type TrackPointUpdate = Updateable<TrackPointTable>

expoe