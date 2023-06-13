"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MojangApiService = void 0;
const axios_1 = __importDefault(require("axios"));
class MojangApiService {
    playerDb;
    constructor() {
        this.playerDb = axios_1.default.create({
            baseURL: "https://playerdb.co/api/player/minecraft/",
            timeout: 10000
        });
    }
    async getPlayer(tag) {
        const [formattedTag, type] = this.parseTag(tag);
        return this.getData(tag).catch((e) => {
            if (!e.response || !e.response.data) {
                throw new Error();
            }
            const error = e.response.data;
            if (error.code === "minecraft.api_failure") {
                throw new Error(tag);
            }
            throw new Error();
        });
    }
    parseTag(tag) {
        tag = tag.replace("-", "");
        const type = tag.length >= 32 ? "uuid" : "username";
        return [tag, type];
    }
    async getData(input) {
        const { data } = await this.playerDb.get(input);
        if (!data) {
            throw new Error();
        }
        return data;
    }
}
exports.MojangApiService = MojangApiService;
