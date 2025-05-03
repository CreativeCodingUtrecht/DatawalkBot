import type * as GeoJSON from "geojson";
import type {
	DataPointWithCoordinates,
	DatawalkWithParticipantsData,
	Participant,
	TrackPoint
} from "$lib/database/types";
import * as DatawalkRepository from "$lib/database/repositories/DatawalkRepository";
import * as turf from "@turf/turf";

export const exportDatawalkGeoJSON = async (code: string): Promise<GeoJSON.FeatureCollection> => {
	const datawalk: DatawalkWithParticipantsData | undefined =
		await DatawalkRepository.findDatawalkWithRelationsByCode(code);

	if (!datawalk) {
		throw new Error(`Datawalk with code ${code} not found`);
	}

	const geojson = {
		type: "FeatureCollection",
		features: [],
		datawalk: {
			uuid: datawalk.uuid,
			name: datawalk.name,
			code: datawalk.code,
			status: datawalk.status
		}
	} as GeoJSON.FeatureCollection & { 
		datawalk: any; 
	};

	for (const participant of datawalk.participants) {
		const trackpoints: TrackPoint[] = participant.trackpoints;
		const datapoints: DataPointWithCoordinates[] = participant.datapoints;
		const features = geoJSONParticipantFeatures(participant, trackpoints, datapoints);
		geojson.features.push(...features);
	}

	geojson.bbox = turf.bbox(geojson);
	geojson.datawalk.center = turf.center(geojson).geometry.coordinates as GeoJSON.Position;

	return geojson;
};

export const geoJSONParticipantFeatures = (
	participant: Participant,
	trackpoints: TrackPoint[],
	datapoints: DataPointWithCoordinates[]
): GeoJSON.Feature[] => {
	return [
		geoJSONTrackFeature(participant, trackpoints),
		...geoJSONDatapointFeatures(participant, datapoints)
	] as GeoJSON.Feature[];
};

export const geoJSONTrackFeature = (
	participant: Participant,
	trackpoints: TrackPoint[]
): GeoJSON.Feature => {
	return {
		type: "Feature",
		geometry: {
			type: "LineString",
			coordinates: trackpoints.map((trackpoint) => [
				trackpoint.longitude,
				trackpoint.latitude
			]) as GeoJSON.Position[]
		},
		properties: {
			type: "track",
			...participantFeatureProperties(participant)
		}
	} as GeoJSON.Feature;
};

export const geoJSONDatapointFeatures = (
	participant: Participant,
	datapoints: DataPointWithCoordinates[]
): GeoJSON.Feature[] => {
	return datapoints.map((datapoint) => geoJSONDatapointFeature(participant, datapoint));
};

export const geoJSONDatapointFeature = (
	participant: Participant,
	datapoint: DataPointWithCoordinates
): GeoJSON.Feature => {
	return {
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: [datapoint.longitude, datapoint.latitude]
		},
		properties: {
			type: "data",
			...participantFeatureProperties(participant),
			uuid: datapoint.uuid,
			media_type: datapoint.media_type,
			caption: datapoint.caption,
			filename: datapoint.filename,
			mime_type: datapoint.mime_type,
			created_at: datapoint.created_at,
			latitude: datapoint.latitude,
			longitude: datapoint.longitude
		}
	} as GeoJSON.Feature;
};

const participantFeatureProperties = (participant: Participant): GeoJSON.GeoJsonProperties => {
	const geojson = {
		uuid: participant.uuid,
		first_name: participant.first_name,
		last_name: participant.last_name
	} as GeoJSON.GeoJsonProperties;

	return geojson;
};
