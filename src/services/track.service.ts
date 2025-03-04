import type { Track } from '../db/schema';
import { trackRepository, TrackRepository } from '../repository/track.repository';
import type { Access1 } from '../types/access';

class TrackService {
    private readonly trackRepository: TrackRepository;
    constructor() {
        this.trackRepository = trackRepository;
    }
    // async checkTracks(accessToVerify: Access1[]): Promise<Track[]> {
    //     const tracks = await this.trackRepository.checkTrack(accessToVerify);
    //     if (tracks.length === 0) return [];

    //     const uniqueRuns = new Set<string>();
    //     tracks.forEach((track) => uniqueRuns.add(track.run));
    //     const runs = Array.from(uniqueRuns);

    //     const accessToUpdate = accessToVerify.filter((access) => runs.includes(access.run));
    //     await this.trackRepository.updateTrack(accessToUpdate);

    //     return tracks;
    // }
}

const trackService = new TrackService();

export { trackService, TrackService };
