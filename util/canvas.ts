import { COLORS, getShadowColor } from "../assets/constants";
import { CanvasRenderingContext2D, loadImage } from "skia-canvas";
import { urlToBuffer } from "../assets";
import { FeedbackMessage } from "../messages/error";

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

    public drawGradientText(text: string, x: number, y: number, color1: string, color2: string) {
        const characters = text.split("");
        const gradient = this.createGradient(color1, color2, characters.length);

        for (let i = 0; i < characters.length; i++) {
            this.drawShadowedText(characters[i], x, y, gradient[i], this.darken(gradient[i], 0.8));
            x += this.ctx.measureText(characters[i]).width;
        }
    }

    public drawText(text: string, x: number, y: number, shadow: boolean) {
        const styleStack: TextStyle[] = [];
        let currentStyle: TextStyle = { color: COLORS.WHITE };

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

    async drawPlayer(id: string, x: number, y: number, options: {
        type: "head" | "body" | "full" | "bust";
        rotation?: number;
        yaw?: number;
        pitch?: number;
        size?: number;
    }): Promise<{ width: number, height: number } | FeedbackMessage> {
        const rotations = [
            options.rotation ? `r=${options.rotation}` : ``,
            options.pitch ? `p=${options.pitch}` : ``,
            options.yaw ? `y=${options.yaw}` : ``,
        ];

        const imageUrl =
            `https://visage.surgeplay.com/${options.type}${options.type !== "full" ? `/${options.size}` : ""}/${id}.png${rotations.some(r => Boolean(r)) ? `?${rotations.join("&")}` : ""}`;
        const buffer = await urlToBuffer(imageUrl);

        if (buffer instanceof FeedbackMessage) {
            return buffer;
        }

        const image = await loadImage(buffer);
        this.ctx.drawImage(image, x, y, image.width, image.height);

        return { width: image.width, height: image.height };
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

    public font(font: string) {
        this.ctx.font = font;
    }

    private drawShadowedText(text: string, x: number, y: number, color: string, shadowColor?: string) {
        const fontSizeRegex = /(\d+)px/;
        const fontSizeMatch = this.ctx.font.match(fontSizeRegex);
        const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1]) : 20;

        let offset = 0;
        if (fontSize >= 15 && fontSize < 30) {
            offset = 2;
        } else if (fontSize >= 30 && fontSize < 40) {
            offset = 3;
        }

        this.ctx.fillStyle = shadowColor || getShadowColor(color);
        this.ctx.fillText(text, x + offset, y + offset);

        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }

    private interpolate = (a: number, b: number, ratio: number) => Math.round(a + (b - a) * ratio);
    private clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
    private hexToRGB = (hex: string) => hex.replace(/^#/, '').match(/.{2}/g).map(v => parseInt(v, 16));
    private rgbToHex = (rgb: number[]) => `#${rgb.map(c => this.clamp(c, 0, 255).toString(16).padStart(2, '0')).join('')}`;

    private createGradient(color1: string, color2: string, length: number) {
        const startRGB = this.hexToRGB(color1);
        const endRGB = this.hexToRGB(color2);

        return Array.from({ length }, (_, i) => {
            const ratio = i / (length - 1);
            const interpolatedRGB = startRGB.map((c, j) => this.interpolate(c, endRGB[j], ratio));
            return this.rgbToHex(interpolatedRGB);
        });
    }

    private darken(color: string, amount: number) {
        const rgb = this.hexToRGB(color);
        const darkenedRGB = rgb.map(c => Math.round(c * (1 - amount)));

        return this.rgbToHex(darkenedRGB)
    }
}