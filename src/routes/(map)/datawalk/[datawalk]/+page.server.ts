import type { PageServerLoad } from "./$types";
import type { Datawalk, TrackPoint, Participant } from "$lib/database/types";
import * as DatawalkRepository from "$lib/database/repositories/DatawalkRepository";
import * as ParticipantRepository from "$lib/database/repositories/ParticipantRepository";
import * as TrackPointRepository from "$lib/database/repositories/TrackPointRepository";
import * as DataPointRepository from "$lib/database/repositories/DataPointRepository";

export const load: PageServerLoad = async ({ params }) => {
	const code = params.datawalk as string;
	const datawalk: any = await DatawalkRepository.findWithParticipantsByCode(code);

	if (datawalk) {
		const participants = datawalk.participants_contributing;
		for (let participant of participants) {
			const trackpoints : any = await TrackPointRepository.find({datawalk_id: datawalk.id, participant_id: participants[0].id});

			for (let trackpoint of trackpoints) {
				const datapoints = await DataPointRepository.find({trackpoint_id: trackpoint.id});
				trackpoint.datapoints = datapoints;
			}
			
			participant.trackpoints = trackpoints;
		}
	}

	return {
		datawalk
	};
};
