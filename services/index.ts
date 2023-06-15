import { MojangApiService } from "./mojang";
import { HypixelApiService } from "./hypixel";

export const mojang: MojangApiService = new MojangApiService();
export const hypixel: HypixelApiService = new HypixelApiService();