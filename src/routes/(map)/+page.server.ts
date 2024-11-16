import type { PageServerLoad } from './$types';
import * as DatawalkRepository from '$lib/database/repositories/DatawalkRepository';
import * as ParticipantRepository from '$lib/database/repositories/ParticipantRepository';

export const load: PageServerLoad = async () => {
    let datawalks = await DatawalkRepository.findAll();
    let participants = await ParticipantRepository.findAll();

    return {
        datawalks : datawalks,
        participants : participants
    };
};
