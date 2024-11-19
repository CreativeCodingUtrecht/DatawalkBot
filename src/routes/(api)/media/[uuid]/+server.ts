import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import fs from 'fs';
import * as DataPointRepository from '$lib/database/repositories/DataPointRepository';
import type { DataPoint } from '$lib/database/types';

export const GET: RequestHandler = async ({ params }) => {
    const uuid = params.uuid;

    const datapoint : DataPoint = await DataPointRepository.findByUuid(uuid);

    if (datapoint && !fs.existsSync(datapoint.filename)) {
        console.log("File does not exist")
        throw error(404, {
            message: 'Requested image does not exist',
        });
    }

    const data = fs.readFileSync(datapoint.filename);
    const mime = datapoint.mime_type;

    return new Response(data, {
        headers: {
            "Content-Type": mime
        }
    });

}
