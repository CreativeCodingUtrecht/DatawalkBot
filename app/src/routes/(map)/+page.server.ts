import type { PageServerLoad } from './$types';
import * as DatawalkRepository from '$lib/database/repositories/DatawalkRepository';
import * as ParticipantRepository from '$lib/database/repositories/ParticipantRepository';

export const load: PageServerLoad = async () => {

    let datawalks : any = await DatawalkRepository.findAllWithParticipantsAndContributors();

    return {
        datawalks : datawalks
    };
};
