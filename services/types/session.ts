export interface Session {
    name?: string;
    id: string;
    ownerId: string;

    started: number;
    ended?: number;
    isEnded?: boolean;

    start: {
        bedwars: BedwarsSession;
    }

    end?: {
        bedwars: BedwarsSession;
    }
}

export interface BedwarsSession {
    wins: number;
    losses: number;
    kills: number;
    deaths: number;
    finalKills: number;
    finalDeaths: number;
    bedsBroken: number;
    bedsLost: number;
    gamesPlayed: number;
    level: number;
    coins: number;
    experience: number;
}


export interface LinkedPlayer {
    id: string;
    uuid: string;
}