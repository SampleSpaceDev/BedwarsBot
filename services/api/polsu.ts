import axios, { AxiosInstance } from "axios";
import { ExpiringCache } from "../../util/cache";
import * as config from "../../config.json";

export class PolsuApiService {
    private polsu: AxiosInstance;
    private cache: ExpiringCache<any>;

    public constructor() {
        this.polsu = axios.create({
            baseURL: "https://api.polsu.xyz/polsu/bedwars", // TODO: Change this to the real API URL
            timeout: 10_000,
            headers: {
                "Content-Type": "application/json",
            }
        });

        this.cache = new ExpiringCache<any>(60 * 60 * 1000);
    }

    public async getStatus() {
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

        this.cache.set("status", response.data);

        return response.data;
    }
}