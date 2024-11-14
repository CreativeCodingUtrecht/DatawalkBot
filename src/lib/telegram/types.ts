export interface UpdatedLocation extends Location {
	horizontal_accuracy?: number | undefined;
	heading?: number | undefined;
}

export interface Datawalk {
	created_by_chat_id: number; // Who created the datawalk
    created_at: number,
    name: string | undefined;
	code: string; // Code to access the datawalk (e.g. YGXH)
	data : Data[]; 
}

export interface Data { 
	collected_by_chat_id: number;
    created_at: number,
	name: string | undefined;
	points : DataPoint[];
}

export enum DataPointType {
	Location,
	Voice,
	Photo, 
	Video,
	Document,
	Text
}

export interface DataPoint { 
	type: DataPointType,
    created_at: number,   
	text: string | undefined,
	media_url: string | undefined,
	location: {
		langitude: number | undefined,
		longitude: number | undefined
	}
	accuracy: number | undefined
}