import axios, { AxiosInstance } from "axios";
import { ExpiringCache } from "../../util/cache";
import * as config from "../../config.json";
import { BedwarsMap, Rotation, Status } from "../types/polsu";

export class PolsuApiService {
    private polsu: AxiosInstance;
    private polsuBeta: AxiosInstance;
    private cache: ExpiringCache<any>;

    public constructor() {
        this.polsu = axios.create({
            baseURL: "https://api.polsu.xyz/polsu/bedwars",
            timeout: 10_000,
            headers: {
                "Content-Type": "application/json",
            }
        });

        this.polsuBeta = axios.create({
            baseURL: "https://api.polsu.xyz/beta/polsu/bedwars",
            timeout: 10_000,
            headers: {
                "Content-Type": "application/json",
            }
        });

        this.cache = new ExpiringCache<any>(60 * 60 * 1000);
    }

    public async getStatus(): Promise<Status> {
        if (this.cache.get("status")) {
            return this.cache.get("status");
        }

        const response = await this.polsu.get("/status", {
            params: {
                key: config.polsuKey
            }
        });

        if (!response || !response.data) {
            console.error("Failed to get Polsu status")
            return;
        }

        this.cache.set("status", response.data.data);

        return response.data.data as Status;
    }

    public async getNextDreamMode(): Promise<string> {
        if (this.cache.get("dreams")) {
            return this.cache.get("dreams");
        }

        const response = await this.polsu.get("/dream", {
            params: {
                key: config.polsuKey
            }
        });

        if (!response || !response.data) {
            console.error("Failed to get dreams information")
            return;
        }

        const currentDate = new Date();
        const year = currentDate.getFullYear().toString();
        const month = currentDate.toLocaleString('default', { month: 'long' }).toUpperCase();

        const data = response.data.data?.[year]?.[month] ?? {};
        const filteredData = Object.values(data).find((x: any) => x.date >= currentDate.getDate());
        const mode = filteredData?.["mode"];

        if (mode === undefined) {
            console.error("Failed to get next dream mode");
            return;
        }

        this.cache.set("dreams", mode);

        return mode;
    }

    public async getRotation(): Promise<Rotation> {
        if (this.cache.get("rotation")) {
            return this.cache.get("rotation");
        }

        const status = await this.getStatus() as Status;

        const quickMaps = await this.getFilteredRotation("quick");
        const longMaps = await this.getFilteredRotation("long");

        const groupedMaps: {
            [key: string]: {
                [key: string]: BedwarsMap[];
            };
        } = {};

        for (const map of quickMaps.concat(longMaps)) {
            const mode = map.mode;
            const playstyle = map.playstyle;

            if (!groupedMaps[mode]) {
                groupedMaps[mode] = {};
            }

            if (!groupedMaps[mode][playstyle]) {
                groupedMaps[mode][playstyle] = [];
            }

            groupedMaps[mode][playstyle].push(map);
        }

        const rotation: Rotation = {
            currentDream: status.dream.mode,
            nextDream: await this.getNextDreamMode(),

            items: {
                item1: status.rotation.items.item1,
                item2: status.rotation.items.item2
            },

            eight_fast: groupedMaps["2"]["Quick & Rushy"],
            eight_slow: groupedMaps["2"]["Long & Tactical"],
            four_fast: groupedMaps["4"]["Quick & Rushy"],
            four_slow: groupedMaps["4"]["Long & Tactical"]
        };

        this.cache.set("rotation", rotation);

        return rotation;
    }

    private async getFilteredRotation(playstyle: string) {
        const response = await this.polsuBeta.get("/maps/data", {
            params: {
                key: config.polsuKey,
                playstyle
            }
        });

        if (!response || !response.data) {
            console.error("Failed to get rotation data");
            return;
        }

        return response.data.data as BedwarsMap[];
    }
}