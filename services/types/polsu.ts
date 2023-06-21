
export class PolsuResponse {
    success: boolean;
    data: any;
}

export class Status {
    players: number;
    dreammode: {
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