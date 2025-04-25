import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import * as DatawalkRepository from '$lib/database/repositories/DatawalkRepository';
import * as TrackPointRepository from "$lib/database/repositories/TrackPointRepository";
import * as DataPointRepository from "$lib/database/repositories/DataPointRepository";
import type { Datawalk } from '$lib/database/types';

export const GET: RequestHandler = async ({ params }) => {
    const code = params.code;

    const datawalk : Datawalk = await DatawalkRepository.findExportableByCode(code);

    if (!datawalk) {
        throw error(500, `Unable to retrieve datawalk with code ${code}`);
    } 

    const data = JSON.stringify(datawalk);

    return new Response(data, {
        headers: {
            "Content-Type": "application/json"
        }
    });
}
