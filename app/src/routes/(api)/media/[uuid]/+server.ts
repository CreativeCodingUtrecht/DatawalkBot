import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { env } from "$env/dynamic/private";
import fs from 'fs';
import * as DataPointRepository from '$lib/database/repositories/DataPointRepository';
import type { DataPoint } from '$lib/database/types';

const DATA_MEDIA_ROOT = env.DATA_MEDIA_ROOT;
if (!DATA_MEDIA_ROOT) {
	throw new Error("DATA_MEDIA_ROOT is not set");
}

export const GET: RequestHandler = async ({ params }) => {
    const uuid = params.uuid;

    const datapoint : DataPoint = await DataPointRepository.findByUuid(uuid);

    if (!datapoint) {
        throw error(500, 'Unable to retrieve datapoint');
    } 

    const filename : string = `${DATA_MEDIA_ROOT}/${datapoint.filename}`;

    if (!fs.existsSync(filename)) {
        console.log(`File ${filename }does not exist`)
        throw error(404, {
            message: 'Requested image does not exist',
        });
    }

    const data = fs.readFileSync(filename);
    const mime = datapoint.mime_type;

    return new Response(data, {
        headers: {
            "Content-Type": mime
        }
    });
}
