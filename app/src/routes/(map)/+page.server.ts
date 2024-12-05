import type { PageServerLoad } from './$types';
import * as DatawalkRepository from '$lib/database/repositories/DatawalkRepository';
import * as ParticipantRepository from '$lib/database/repositories/ParticipantRepository';
import type { Participant } from '$lib/database/types';

export const load: PageServerLoad = async () => {
    let datawalks : any = await DatawalkRepository.find({status: 'active'});
    
    for (let datawalk of datawalks) {
        const participants = await ParticipantRepository.find({ current_datawalk_id: datawalk.id});
        datawalk.participants_current = participants;
        console.log("Participants: current", datawalk.participants_current);        
    }

    return {
        datawalks : datawalks
    };
};
