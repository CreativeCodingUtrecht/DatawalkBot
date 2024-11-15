import type { PageServerLoad } from './$types';
import type { Datawalk } from '$lib/database/types'
import * as DatawalkRepository from '$lib/database/DatawalkRepository';

export const load: PageServerLoad = async () => {
    const datawalks = await DatawalkRepository.findAll();

    return {
        datawalks
    };
};
