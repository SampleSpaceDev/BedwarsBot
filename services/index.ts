import { MojangApiService } from "./mojang";
import { HypixelApiService } from "./hypixel";
import { MongoDbService } from "./mongo";

export const mojang: MojangApiService = new MojangApiService();
export const hypixel: HypixelApiService = new HypixelApiService();
export const mongo: MongoDbService = new MongoDbService();