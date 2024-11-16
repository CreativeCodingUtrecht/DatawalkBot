import type { PageServerLoad } from './$types';
import type { Datawalk, TrackPoint } from '$lib/database/types'
import * as DatawalkRepository from '$lib/database/repositories/DatawalkRepository';
import * as TrackPointRepository from '$lib/database/repositories/TrackPointRepository';

export const load: PageServerLoad = async ({ params }) => {
    const code = params.datawalk as string;
    const datawalk : Datawalk = await DatawalkRepository.findByCode(code);
    const trackpoints = await TrackPointRepository.findByDatawalkId(datawalk.id);

    return {
        datawalk,
        trackpoints
    };
};
