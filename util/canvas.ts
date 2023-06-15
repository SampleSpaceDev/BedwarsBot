import { getShadowColor } from "../assets/constants";
import { CanvasRenderingContext2D } from "skia-canvas";

type TextStyle = {
    color: string;
}

export class CanvasWrapper {
    private readonly ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public drawText(text: string, x: number, y: number, shadow: boolean) {
        const styleStack: TextStyle[] = [];
        let currentStyle: TextStyle = { color: "red" };

        const openTag = (tag: string) => {
            if (tag.startsWith("#")) {
                currentStyle = { color: tag };
                styleStack.push(currentStyle);
            }
        }

        const closeTag = () => {
            if (styleStack.length > 0) {
                currentStyle = styleStack.pop()!;
            }
        }

        const processText = (text: string) => {
            const words = text.split(" ");
            console.log(currentStyle);

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

    public drawShadowedText(text: string, x: number, y: number, color: string) {
        this.ctx.fillStyle = getShadowColor(color);
        this.ctx.fillText(text, x + 4, y + 4);

        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }
}