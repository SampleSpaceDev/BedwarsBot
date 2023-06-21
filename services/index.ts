import { MojangApiService } from "./api/mojang";
import { HypixelApiService } from "./api/hypixel";
import { MongoDbService } from "./mongo";
import { PolsuApiService } from "./api/polsu";

export const mojang: MojangApiService = new MojangApiService();
export const hypixel: HypixelApiService = new HypixelApiService();
export const mongo: MongoDbService = new MongoDbService();
export const polsu: PolsuApiService = new PolsuApiService();