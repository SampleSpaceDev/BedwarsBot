import { Bedwars } from "./bedwars";

export interface PlayerResponse {
    player: Player;
}

interface Player {
    displayname: string;
    uuid: string;
    stats: Stats;
}

interface Stats {
    Bedwars: Bedwars;
}

