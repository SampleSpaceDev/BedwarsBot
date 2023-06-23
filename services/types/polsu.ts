
export class PolsuResponse {
    success: boolean;
    data: any;
}

export class Status {
    players: number;
    dream: {
        mode: string,
        players: number
    }
    rotation: {
        total: number,
        season: string,
        lastRotation: number,
        maps: {
            solos_doubles: string[],
            threes_fours: string[],
            notInDataBase: string[]
        },
        items: {
            item1: string,
            item2: string,
        }
    }
}

export class BedwarsMap {
    name: string;
    mode: string;
    playstyle: string;
    gen: string;
    description: string;
    added: number;
    builders: string;
    new: boolean;
    festival: string;
    reskinOf: string;
    minBuild: number;
    maxBuild: number;
    buildRadius: number;
    preview: string;
}

export class Rotation {
    currentDream: string;
    nextDream: string;

    items: {
        item1: string,
        item2: string
    }

    eight_fast: BedwarsMap[]
    eight_slow: BedwarsMap[]
    four_fast: BedwarsMap[]
    four_slow: BedwarsMap[]
}