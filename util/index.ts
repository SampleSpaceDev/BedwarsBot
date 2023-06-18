import { join } from "node:path";
import { existsSync } from "node:fs";
import { mongo } from "../services";
import { LinkedPlayer } from "../services/types";
import { Duration } from "moment";

const PATH = "../../assets";
const PRIVATE_PATH = join(PATH, "private");

const hasPrivateAssets = existsSync(join(PRIVATE_PATH, "package.json"));

const checkAsset = (file: string) =>
  hasPrivateAssets && existsSync(join(PRIVATE_PATH, file)) ? "private" : "public";

export type RemoveMethods<T> = Pick<
  T,
  // eslint-disable-next-line @typescript-eslint/ban-types
  { [Key in keyof T]: T[Key] extends Function ? never : Key }[keyof T]
>;

export const noop = <T>() => null as unknown as T;

export const ratio = (a, b): string => (b === 0 ? "∞" : (a / b).toFixed(2));

export const getAssetPath = (path: string) => join(PATH, checkAsset(path), path);

export const stripColor = (string: string) => string.replace(/<\/?[^>]+(>|$)|<#[^>]+(>|$)/g, "");

export async function getPlayer(discordId: string): Promise<string> {
    const players = await mongo.getCollection<LinkedPlayer>("players");
    const found = await players.find({
        id: discordId
    }).toArray();

    return found[0].uuid || undefined;
}

export const randomId = () => Math.random().toString(16).substring(2, 9);

export const formatDate = (duration: Duration) => {
    const units = ['y', 'mo', 'w', 'd', 'h', 'm'];
    const values = [duration.years(), duration.months(), duration.weeks(), duration.days(), duration.hours(), duration.minutes()];

    return units.reduce((result, unit, index) => {
        if (values[index] > 1) {
            result += `${values[index]}${unit} `;
        }
        return result;
    }, '').trim();
}

export const f = (number: number) => Math.round(number).toLocaleString();