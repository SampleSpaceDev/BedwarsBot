import { FontLibrary, loadImage, CanvasRenderingContext2D } from "skia-canvas";
import { readdirSync } from "node:fs";
import logger from "../util/logging";
import { SHADOWS } from "./constants";

type Game = "Bedwars";

export async function randomBackground(game: Game) {
    const path = `assets/${game.toLowerCase()}`;
    const images = readdirSync(path);
    return await loadImage(`${path}/${images[Math.floor(Math.random() * images.length)]}`);
}

export async function registerFonts() {
    const paths = readdirSync(`assets/fonts`).map(font => `assets/fonts/${font}`);
    FontLibrary.use(paths);
    paths.forEach(path => logger.info(`[FONT] Font "${path.match(/\/([^/]+)\.[^/.]+$/)[1]}" was registered.`));
}

export function drawShadowedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
    ctx.fillStyle = SHADOWS[color];
    ctx.fillText(text, x + 4, y + 4);

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}