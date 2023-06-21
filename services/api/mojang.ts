import axios, { AxiosInstance } from "axios";
import { ExpiringCache } from "../../util/cache";
import { PlayerTag } from "./hypixel";

interface PlayerDbResponse {
    code: string,
    message: string,
    data: {
        player: {
            meta: { cachedAt: Number },
            username: string,
            raw_id: string,
            id: string,
            avatar: string
        }
    },
    success: boolean
}

export class MojangApiService {
    private playerDb: AxiosInstance;
    private cache: ExpiringCache<PlayerDbResponse>

    public constructor() {
        this.playerDb = axios.create({
            baseURL: "https://playerdb.co/api/player/minecraft/",
            timeout: 10_000
        });

        this.cache = new ExpiringCache<PlayerDbResponse>(3 * 60 * 60 * 1000);
    }

    public async getPlayer(tag: string) {
        if (this.cache.get(tag)) {
            return this.cache.get(tag);
        }

        const response = await this.getData<PlayerDbResponse>(tag);

        if (response.success) {
            this.cache.set(response.data.player.username, response);
        }

        return response;
    }

    public parseTag(tag: string): PlayerTag {
        return tag.length >= 32 ? "uuid" : "name";
    }

    private async getData<T>(input: string): Promise<T> {
        const { data } = await this.playerDb.get<T>(input);

        if (!data) {
            throw new Error();
        }

        return data;
    }
}

export default new MojangApiService();