import { Bedwars } from "./bedwars";

export class PlayerResponse {
    player: Player;
}

export class Player {
    displayname: string;
    uuid: string;
    stats: Stats;
    achievements: Achievements;

    prefix?: string;
    rank: string;
    monthlyPackageRank: string;
    newPackageRank: string;
    packageRank: string;
    monthlyRankColor: string;

    socialMedia?: SocialMedia;
}

interface SocialMedia {
    links: {
        DISCORD?: string;
    };
}

interface Achievements {
    bedwars_level: number;
}

interface Stats {
    Bedwars: Bedwars;
}

