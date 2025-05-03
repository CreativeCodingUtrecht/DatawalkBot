import type { RequestHandler } from './$types';

import * as GeoJSONUtil from '$lib/util/geojson';

export const GET: RequestHandler = async ({ url, params }) => {
    const hostname = `${url.protocol}//${url.host}`;
    const code = params.code;

    const geojson = await GeoJSONUtil.exportDatawalkGeoJSON(code, hostname);

    return new Response(JSON.stringify(geojson), {
        headers: {
            'Content-Type': "application/geo+json",        
            // 'Content-Disposition': `attachment; filename="${datawalk.code}.geojson"`
        }
    });
}
