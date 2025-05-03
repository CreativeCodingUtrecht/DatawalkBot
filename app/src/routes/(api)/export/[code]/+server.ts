import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

import * as GeoJSONUtil from '$lib/util/geojson';

export const GET: RequestHandler = async ({ params }) => {
    const code = params.code;

    const geojson = await GeoJSONUtil.geoJSONDatawalk(code);
    // console.debug("GeoJSON: ", geojson);    

    return new Response(JSON.stringify(geojson), {
        headers: {
            'Content-Type': "application/geo+json",        
            // 'Content-Disposition': `attachment; filename="${datawalk.code}.geojson"`
        }
    });
}
