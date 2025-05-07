import type { RequestHandler } from "./$types";
import JSZip from "jszip";
import type {
	DatawalkWithParticipantsData,
    DataPointWithCoordinates
} from "$lib/database/types";
import * as DatawalkRepository from "$lib/database/repositories/DatawalkRepository";

import * as GeoJSONUtil from "$lib/util/geojson";

export const GET: RequestHandler = async ({ url, params }) => {
	const hostname = `${url.protocol}//${url.host}`;
	const code = params.code;

	const geojson = await GeoJSONUtil.exportDatawalkGeoJSON(code, hostname);

	const zip = new JSZip();

	// Add GeoJSON
	zip.file(`${code}.geojson`, JSON.stringify(geojson, null, 4));

	// Add images
    const datawalk: DatawalkWithParticipantsData | undefined =
        await DatawalkRepository.findDatawalkWithRelationsByCode(code);

    if (!datawalk) {
        throw new Error(`Datawalk with code ${code} not found`);
    }

    const allDatapoint = []
    for (const participant of datawalk.participants) {
        const datapoints: DataPointWithCoordinates[] = participant.datapoints;
        allDatapoint.push(...datapoints);
    }    
    await Promise.all(
    allDatapoint.map(async (datapoint) => {
		if (datapoint.media_type === "text") {
			return;
		}

		const response = await fetch(`${hostname}/media/${datapoint.uuid}`);
		if (!response.ok) {
			console.error(`Failed to fetch ${url}`);
			return;
		}
		const arrayBuffer = await response.arrayBuffer();
        console.log("Adding file", datapoint.filename);
        const uint8 = new Uint8Array(arrayBuffer);
		zip.file(`${datapoint.filename}`, uint8);
	}));

	const base64 = await zip.generateAsync({ type: "blob" });

	// Download zip file
	return new Response(base64, {
		headers: {
			"Content-Type": "data:application/zip;base64",
			"Content-Disposition": `attachment; filename="${code}.zip"`
		}
	});
};
