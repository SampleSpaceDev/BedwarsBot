import { Player, PlayerResponse } from "./types";
import axios, { AxiosInstance } from "axios";
import * as config from "../config.json";
import logger from "../util/logging";
import {COLORS, missingPlayer} from "../assets/constants";
import { ExpiringCache } from "../util/cache";
import {FeedbackMessage} from "../messages/error";

export type PlayerTag = "name" | "uuid" | "none";
type Stats = "Bedwars";

export class HypixelApiService {
    private hypixel: AxiosInstance;
    private cache: ExpiringCache<PlayerResponse>

    public constructor() {
        this.hypixel = axios.create({
            baseURL: "https://api.hypixel.net/player",
            timeout: 10_000,
            headers: {
                "Content-Type": "application/json",
                "API-Key": config.apiKey
            }
        });

        this.cache = new ExpiringCache<PlayerResponse>(30 * 60 * 1000);
    }

    public async getPlayer(type: PlayerTag, tag: string): Promise<PlayerResponse | FeedbackMessage> {
        if (this.cache.get(tag)) {
            return this.cache.get(tag);
        }

        const player = await this.hypixel.get<PlayerResponse>(``, {
            params: {
                [type]: tag
            }
        }).catch((error) => {
            logger.error(error);
            return missingPlayer(type, tag);
        });

        if (player instanceof FeedbackMessage) {
            return player;
        }

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
                return player.monthlyRankColor === "GOLD" ? COLORS.GOLD : COLORS.AQUA;
            case "GAME_MASTER":
                return COLORS.DARK_GREEN;
            case "YOUTUBER":
            case "ADMIN":
                return COLORS.RED;
            default:
                return COLORS.GRAY;
        }
    }

    private codesToColor: { [key: string]: string } = {
        "§0": COLORS.BLACK,
        "§1": COLORS.DARK_BLUE,
        "§2": COLORS.DARK_GREEN,
        "§3": COLORS.DARK_AQUA,
        "§4": COLORS.DARK_RED,
        "§5": COLORS.DARK_PURPLE,
        "§6": COLORS.GOLD,
        "§7": COLORS.GRAY,
        "§8": COLORS.DARK_GRAY,
        "§9": COLORS.BLUE,
        "§a": COLORS.GREEN,
        "§b": COLORS.AQUA,
        "§c": COLORS.RED,
        "§d": COLORS.LIGHT_PURPLE,
        "§e": COLORS.YELLOW,
        "§f": COLORS.WHITE,
    }
}