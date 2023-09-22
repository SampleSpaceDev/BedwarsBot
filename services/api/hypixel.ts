import { Player, PlayerResponse } from "../types";
import axios, { AxiosInstance } from "axios";
import * as config from "../../config.json";
import logger from "../../util/logging";
import { COLORS } from "../../assets/constants";
import { ExpiringCache } from "../../util/cache";
import { FeedbackMessage } from "../../messages/error";

export type PlayerTag = "name" | "uuid" | "none";
type Stats = "Bedwars";

export class HypixelApiService {
    private hypixel: AxiosInstance;
    private cache: ExpiringCache<PlayerResponse>

    public constructor() {
        this.hypixel = axios.create({
            baseURL: "https://api.hypixel.net",
            timeout: 10_000,
            headers: {
                "Content-Type": "application/json",
                "API-Key": config.apiKey
            }
        });

        this.cache = new ExpiringCache<PlayerResponse>(10 * 60 * 1000);
    }

    public async getPlayer(type: PlayerTag, tag: string): Promise<PlayerResponse> {
        if (this.cache.get(tag)) {
            return this.cache.get(tag);
        }

        const player = await this.hypixel.get<PlayerResponse>("/player", {
            params: {
                [type]: tag
            }
        }).catch((error) => {
            logger.error(error);
        });


        if (!player || !player.data) {
            return;
        }

        this.cache.set(tag, player.data);

        return player.data;
    }

    public async getStats(type: PlayerTag, tag: string, game: Stats): Promise<any | FeedbackMessage> {
        const player = await this.getPlayer(type, tag);

        if (player instanceof FeedbackMessage) {
            return player;
        }

        if (!player || !player.player) {
            return;
        }

        return player.player.stats[game];
    }

    public getRank(player: Player): string {
        let ranks = [
            player.rank,
            player.monthlyPackageRank,
            player.newPackageRank,
            player.packageRank
        ];

        for (const rank of ranks) {
            if (rank !== undefined && rank !== "NONE" && rank !== "NORMAL") return rank;
        }
        return "NONE";
    }

    public getRankColor(player: Player): string {
        if (player.prefix) {
            return this.codesToColor[player.prefix.substring(0, 2)];
        }

        switch (this.getRank(player)) {
            case "VIP":
            case "VIP_PLUS":
                return COLORS.GREEN;
            case "MVP":
            case "MVP_PLUS":
                return COLORS.AQUA;
            case "SUPERSTAR":
                return player.monthlyRankColor !== "AQUA" ? COLORS.GOLD : COLORS.AQUA;
            case "GAME_MASTER":
                return COLORS.DARK_GREEN;
            case "YOUTUBER":
            case "ADMIN":
                return COLORS.RED;
            default:
                return COLORS.GRAY;
        }
    }

    public getDisplayName(player: Player): string {
        if (player.prefix) {
            return `${this.prefixToDisplay(player.prefix)} ${player.displayname}`;
        }

        const plusColor = player.rankPlusColor ? player.rankPlusColor.toLowerCase() : "red";
        const superstarColor = player.monthlyRankColor !== "AQUA" ? `gold` : `aqua`;

        switch (this.getRank(player)) {
            case "VIP":
                return `<green>[VIP] ${player.displayname}</green>`;
            case "VIP_PLUS":
                return `<green>[VIP</green><gold>+</gold><green>] ${player.displayname}</green>`;
            case "MVP":
                return `<aqua>[MVP] ${player.displayname}</aqua>`;
            case "MVP_PLUS":
                return `<aqua>[MVP</aqua><${plusColor}>+</${plusColor}><aqua>] ${player.displayname}</aqua>`;
            case "SUPERSTAR":
                return `<${superstarColor}>[MVP</${superstarColor}><${plusColor}>++</${plusColor}><${superstarColor}>] ${player.displayname}</${superstarColor}>`;
            case "GAME_MASTER":
                return `<dark_green>[GM] ${player.displayname}</dark_green>`;
            case "YOUTUBER":
                return `<red>[</red><white>YOUTUBE</white><red>] ${player.displayname}</red>`;
            case "ADMIN":
                return `<red>[ADMIN] ${player.displayname}</red>`;
            default:
                return `<gray>${player.displayname}</gray>`;
        }
    }

    public prefixToDisplay(prefix: string): string {
        let result = "";
        let insideCode = false;
        let colorCode = "";

        for (let i = 0; i < prefix.length; i++) {
            const char = prefix[i];
            const nextChar = prefix[i + 1];
            const nextColorCode = `§${nextChar}`;

            if (insideCode && nextColorCode in this.codesToColor) {
                result += `</${this.codesToColor[colorCode]}>`;
                insideCode = false;
            }

            if (char === "§" && nextColorCode in this.codesToColor) {
                colorCode = nextColorCode;
                result += `<${this.codesToColor[colorCode]}>`;
                insideCode = true;
                i++; // Skip the color code character
            } else {
                result += char;
            }
        }

        if (insideCode) {
            result += `</${this.codesToColor[colorCode]}>`;
        }

        return result;
    }

    private codesToColor: { [key: string]: string } = {
        "§0": `black`,
        "§1": `dark_blue`,
        "§2": `dark_green`,
        "§3": `dark_aqua`,
        "§4": `dark_red`,
        "§5": `dark_purple`,
        "§6": `gold`,
        "§7": `gray`,
        "§8": `dark_gray`,
        "§9": `blue`,
        "§a": `green`,
        "§b": `aqua`,
        "§c": `red`,
        "§d": `light_purple`,
        "§e": `yellow`,
        "§f": `white`,
    }
}