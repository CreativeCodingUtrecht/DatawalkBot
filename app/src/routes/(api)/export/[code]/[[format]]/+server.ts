import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import * as DatawalkRepository from '$lib/database/repositories/DatawalkRepository';
import type { GeoJSON } from 'geojson';

export const GET: RequestHandler = async ({ params }) => {
    const code = params.code;
    const format = params.format;

    const datawalk : any = await DatawalkRepository.findExportableByCode(code);

    if (!datawalk) {
        throw error(500, `Unable to retrieve datawalk with code ${code}`);
    } 

    let contentType = "application/json";
    let exportableData;

    switch (format) {
        case 'geojson':            
            const geojson : GeoJSON.FeatureCollection = {
                type: "FeatureCollection",
                features: []
            };

            geojson.features = [
                ...datawalk.participants.map((participant) => (
                    {
                        type: "Feature",
                        geometry: {
                            type: "LineString",
                            coordinates: datawalk.trackpoints.map((trackpoint) => 
                                trackpoint.participant_uuid == participant.uuid ? [trackpoint.longitude, trackpoint.latitude] : null).filter(n => n)
                        },    
                        properties: {
                            type: "track",                        
                            participant_uuid: participant.uuid,
                            // participant_username: participant.username,
                            participant_first_name: participant.first_name,
                            participant_last_name: participant.last_name
                        }    
                    } as GeoJSON.Feature
                )).filter((feature : any) => feature.geometry.coordinates.length > 1),
                ...datawalk.datapoints.map((datapoint) => (
                    {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [datapoint.longitude, datapoint.latitude]
                        },
                        properties: {
                            type: "data",
                            participant_uuid: datapoint.participant_uuid,
                            // participant_username: datapoint.participant_username,
                            participant_first_name: datapoint.participant_first_name,
                            participant_last_name: datapoint.participant_last_name,
                            media_type: datapoint.media_type,   
                            caption: datapoint.caption,
                            url: datapoint.filename ? `http://localhost:5173/media/${datapoint.uuid}` : null,                            
                            mime_type: datapoint.mime_type,
                            filename: datapoint.filename,
                            created_at: datapoint.created_at,                                                        
                        }
                    } as GeoJSON.Feature))                
            ];
            
            exportableData = JSON.stringify(geojson);            
            break;
        default:
            exportableData = JSON.stringify(datawalk);;                    
            break;
    }

    return new Response(exportableData, {
        headers: {
            "Content-Type": contentType
        }
    });
}
