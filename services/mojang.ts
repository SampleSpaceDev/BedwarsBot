import axios, { AxiosInstance } from "axios";

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

interface PlayerDbErrorResponse {
    message: string,
    code: string,
    data: {},
    success: boolean,
    error: boolean
}

export class MojangApiService {
    private playerDb: AxiosInstance;

    public constructor() {
        this.playerDb = axios.create({
            baseURL: "https://playerdb.co/api/player/minecraft/",
            timeout: 10_000
        });
    }

    public async getPlayer(tag: string) {
        const [formattedTag, type] = this.parseTag(tag);

        return this.getData<PlayerDbResponse>(tag).catch((e) => {
            if (!e.response || !e.response.data) {
                throw new Error();
            }

            const error = e.response.data as PlayerDbErrorResponse;
            if (error.code === "minecraft.api_failure") {
                throw new Error(`Unknown player: ${tag}`);
            }

            throw new Error();
        });
    }

    private parseTag(tag: string): [tag: string, type: string] {
        tag = tag.replace("-", "");
        const type = tag.length >= 32 ? "uuid" : "name";
    
        return [tag, type];
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