import { join } from "node:path";
import { existsSync, readFileSync, readdirSync } from "node:fs";

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

export const getAssetPath = (path: string) => join(PATH, checkAsset(path), path);