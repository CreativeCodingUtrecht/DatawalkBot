export interface BirdWeatherSpecies {
    id: number;
    commonName: string;
    scientificName: string;
    color: string;
    imageUrl: string;
    thumbnailUrl: string;
    pngUrl: string;
}

export interface BirdWeatherSoundscape {
    id: number;
    url: string;
    startTime: number;
    endTime: number;
    mode: string;
}

export interface BirdWeatherDetection {
    id: number;
    stationId: number;
    timestamp: string;
    confidence: number;
    probability: number;
    score: number;
    certainty: string;
    algorithm: string;
    metadata: any | null;
    species: BirdWeatherSpecies;
    lat: number;
    lon: number;
    favorite: boolean;
    soundscape?: BirdWeatherSoundscape;
}

export interface BirdWeatherDetectionCounts {
    total: number;
    almostCertain: number;
    veryLikely: number;
    uncertain: number;
    unlikely: number;
}

export interface BirdWeatherSpeciesInfo extends BirdWeatherSpecies {
    detections: BirdWeatherDetectionCounts;
    latestDetectionAt: string;
}