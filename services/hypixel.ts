import { ButtonBuilder } from "@discordjs/builders";
import { ButtonStyle } from "discord-api-types/v10";
import { ErrorMessage } from "../messages/error";
import { PlayerResponse } from "./types/player";
import axios, {AxiosInstance} from "axios";
import * as config from "../config.json";
import logger from "../util/logging";

type PlayerTag = "name" | "uuid" | "none";
type Stats = "Bedwars";

export class HypixelApiService {
    private hypixel: AxiosInstance;

    public constructor() {
        this.hypixel = axios.create({
            baseURL: "https://api.hypixel.net/player",
            timeout: 10_000,
            headers: {
                "Content-Type": "application/json",
                "API-Key": config.apiKey
            }
        });
    }

    public async getPlayer(type: PlayerTag, tag: string): Promise<PlayerResponse> {
        const player = await this.hypixel.get<PlayerResponse>(``, {
            params: {
                [type]: tag
            }
        }).catch((error) => {
            logger.error(error);
            return;
        });

        if (!player || !player.data) {
            return;
        }

        return player.data;
    }

    public async getStats(type: PlayerTag, tag: string, game: Stats): Promise<any> {
        const player = await this.getPlayer(type, tag);

        if (!player || !player.player) {
            return;
        }

        return player.player.stats[game];
    }

    public missingPlayer(type: PlayerTag, tag: string) {
        const buttons: ButtonBuilder[] = [];

        const button = new ButtonBuilder()
            .setLabel("NameMC")
            .setStyle(ButtonStyle.Link)
            .setURL(encodeURI(`https://namemc.com/search?q=${tag}`));

        buttons.push(button);

        return new ErrorMessage(
            "Unknown Player",
            `A player with the ${type} of \`${tag}\` could not be found!`,
            { buttons }
        );
    }

    public unknownError() {
        return new ErrorMessage("Error", "An unknown error occurred!");
    }
}