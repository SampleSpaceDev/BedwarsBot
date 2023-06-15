import { FontLibrary, loadImage } from "skia-canvas";
import { readdirSync } from "node:fs";
import logger from "../util/logging";
import axios from "axios";

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

export async function urlToBuffer(imageUrl: string) {
    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer'
        });

        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error('Error downloading the image:', error);
        throw error;
    }
}
