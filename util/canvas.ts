import { COLORS, getShadowColor } from "../assets/constants";
import { CanvasRenderingContext2D, loadImage } from "skia-canvas";
import {urlToBuffer} from "../assets";

type TextStyle = {
    color: string;
}

export class CanvasWrapper {
    private readonly ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public measure(text: string) {
        return this.ctx.measureText(text).width;
    }

    public roundedRect(x: number, y: number, width: number, height: number, color: string, opacity: number) {
        // Draw a rounded rectangle using ctx
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = opacity;

        this.ctx.beginPath();
        this.ctx.moveTo(x + 10, y);
        this.ctx.lineTo(x + width - 10, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + 10);
        this.ctx.lineTo(x + width, y + height - 10);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - 10, y + height);
        this.ctx.lineTo(x + 10, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - 10);
        this.ctx.lineTo(x, y + 10);
        this.ctx.quadraticCurveTo(x, y, x + 10, y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }

    public async drawTexture(texture: string, x: number, y: number, width: number, height: number) {
        const image = await loadImage(texture);
        this.ctx.drawImage(image, x, y, width, height);
    }


    public drawText(text: string, x: number, y: number, shadow: boolean) {
        const styleStack: TextStyle[] = [];
        let currentStyle: TextStyle = { color: "red" };

        const openTag = (tag: string) => {
            if (tag.startsWith("#")) {
                currentStyle = { color: tag };
                styleStack.push(currentStyle);
            } else if (COLORS[tag.toUpperCase()] != undefined) {
                currentStyle = { color: COLORS[tag.toUpperCase()] };
                styleStack.push(currentStyle);
            }
        }

        const closeTag = () => {
            if (styleStack.length > 0) {
                currentStyle = styleStack.pop()!;
            }
        }

        const processText = (text: string) => {
            const words = text.split("");

            for (const word of words) {
                if (shadow) {
                    this.drawShadowedText(word, x, y, currentStyle.color);
                } else {
                    this.ctx.fillStyle = currentStyle.color;
                    this.ctx.fillText(word, x, y);
                }

                x += this.ctx.measureText(word).width;
            }
        }

        const tagRegex = /<([^>]+)>/g;
        const tagStack: string[] = [];

        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = tagRegex.exec(text)) !== null) {
            const tag = match[1];

            if (tag.startsWith("/")) {
                // Closing tag
                closeTag();
                tagStack.pop();
            } else {
                // Opening tag
                openTag(tag);
                tagStack.push(tag);
            }

            const tagIndex = match.index;
            const plainText = text.slice(lastIndex, tagIndex);

            if (plainText) {
                processText(plainText);
            }

            lastIndex = tagIndex + match[0].length;
        }

        const remainingText = text.slice(lastIndex);
        if (remainingText) {
            processText(remainingText);
        }
    }

    private drawShadowedText(text: string, x: number, y: number, color: string) {
        const fontSizeRegex = /(\d+)px/;
        const fontSizeMatch = this.ctx.font.match(fontSizeRegex);
        const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1]) : 20;

        let offset = 0;
        if (fontSize >= 15 && fontSize < 30) {
            offset = 2;
        } else if (fontSize >= 30 && fontSize < 40) {
            offset = 3;
        }

        this.ctx.fillStyle = getShadowColor(color);
        this.ctx.fillText(text, x + offset, y + offset);

        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }

    async drawPlayer(id: string, x: number, y: number, width: number, height: number) {
        const imageUrl = `https://visage.surgeplay.com/full/${id}.png`;
        const buffer = await urlToBuffer(imageUrl);
        const image = await loadImage(buffer);

        this.ctx.drawImage(image, x, y, width, height);
    }

    public drawLine(x: number, y: number, length: number, color: string, opacity: number) {
        this.ctx.strokeStyle = color;
        this.ctx.globalAlpha = opacity;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + length, y);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }
}