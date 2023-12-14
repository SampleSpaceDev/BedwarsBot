import { Canvas, FontLibrary, loadImage, CanvasRenderingContext2D } from "skia-canvas";
import { readdirSync } from "node:fs";
import logger from "../util/logging";
import axios from "axios";
import { COLORS, unknownError } from "./constants";
import { FeedbackMessage } from "../messages/error";
import { CanvasWrapper } from "../util/canvas";
import { stripColor } from "../util";
import { properties } from "../index";

type Game = "Bedwars";

export async function randomBackground(game: Game) {
    const path = `assets/${game.toLowerCase()}`;
    const images = readdirSync(path).filter(file => file.endsWith(".png"));
    return await loadImage(`${path}/${images[Math.floor(Math.random() * images.length)]}`);
}

export async function registerFonts() {
    const paths = readdirSync(`assets/fonts`).map(font => `assets/fonts/${font}`);
    FontLibrary.use(paths);
    paths.forEach(path => logger.info(`[FONT] Font "${path.match(/\/([^/]+)\.[^/.]+$/)[1]}" was registered.`));
}

export async function urlToBuffer(imageUrl: string) : Promise<Buffer | FeedbackMessage> {
    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': `Mango/v${properties.version}`
            },
            timeout: 10_000
        });

        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error('Error downloading the image:', error);
        return unknownError();
    }
}

export async function defaultCanvasWithSize(game: Game, width: number, height: number): Promise<CanvasRenderingContext2D> {
    const canvas = new Canvas(width, height);
    const ctx = canvas.getContext("2d");

    const backgroundImage = await randomBackground(game);
    ctx.filter = 'blur(10px) brightness(50%)';
    ctx.drawImage(backgroundImage, 0, 0, 500, 500);
    ctx.filter = 'blur(0px) brightness(100%)';

    return ctx;
}

export async function defaultCanvas(game: Game): Promise<CanvasRenderingContext2D> {
    return await defaultCanvasWithSize(game, 500, 500);
}

export function drawTitleText(ctx: CanvasRenderingContext2D, title: string) {
    const wrapper = new CanvasWrapper(ctx);
    const maxWidth = 460;
    let fontSize = 30;

    ctx.font = `30px Minecraft`;
    const text = stripColor(title);
    let textWidth = wrapper.measure(text);
    let textHeight = ctx.measureText(ctx.font).actualBoundingBoxAscent + ctx.measureText(ctx.font).actualBoundingBoxDescent;

    // Reduce the font size while the text width exceeds the maximum width
    while (textWidth > maxWidth) {
        fontSize--;
        ctx.font = `${fontSize}px Minecraft`;
        textWidth = wrapper.measure(text);
        textHeight = ctx.measureText(text).actualBoundingBoxAscent + ctx.measureText(text).actualBoundingBoxDescent;
    }

    const x = ctx.canvas.width / 2 - textWidth / 2;
    const y = 25 + (textHeight / 2);

    wrapper.roundedRect(10, 10, ctx.canvas.width - 20, 40, COLORS.WHITE, 0.2);
    wrapper.drawText(title, x, y, true);
}
