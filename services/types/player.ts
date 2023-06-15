import { Bedwars } from "./bedwars";

export interface PlayerResponse {
    player: Player;
}

interface Player {
    displayname: string;
    uuid: string;
    stats: Stats;
    achievements: Achievements;
}

interface Achievements {
    bedwars_level: number;
}

interface Stats {
    Bedwars: Bedwars;
}

