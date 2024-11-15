import type { PageServerLoad } from './$types';
import * as DatawalkRepository from '$lib/database/DatawalkRepository';

export const load: PageServerLoad = async () => {
    let datawalks = await DatawalkRepository.findAll();

    return {
        datawalks : datawalks
    };
};