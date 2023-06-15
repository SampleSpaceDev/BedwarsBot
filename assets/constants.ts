import { CanvasRenderingContext2D } from "skia-canvas";

export const COLORS = Object.freeze({
    BLACK: "#000000",
    DARK_BLUE: "#0000AA",
    DARK_GREEN: "#00AA00",
    DARK_AQUA: "#00AAAA",
    DARK_RED: "#AA0000",
    DARK_PURPLE: "#AA00AA",
    GOLD: "#FFAA00",
    GRAY: "#AAAAAA",
    DARK_GRAY: "#555555",
    BLUE: "#5555FF",
    GREEN: "#55FF55",
    AQUA: "#55FFFF",
    RED: "#FF5555",
    LIGHT_PURPLE: "#FF55FF",
    YELLOW: "#FFFF55",
    WHITE: "#FFFFFF"
})

export const SHADOWS = Object.freeze({
    BLACK: "#000000",
    DARK_BLUE: "#00002A",
    DARK_GREEN: "#002A00",
    DARK_AQUA: "#002A2A",
    DARK_RED: "#2A0000",
    DARK_PURPLE: "#2A002A",
    GOLD: "#2A2A00",
    GRAY: "#2A2A2A",
    DARK_GRAY: "#151515",
    BLUE: "#15153F",
    GREEN: "#153F15",
    AQUA: "#153F3F",
    RED: "#3F1515",
    LIGHT_PURPLE: "#3F153F",
    YELLOW: "#3F3F15",
    WHITE: "#3F3F3F"
});

export const TITLES = Object.freeze({
    Bedwars: function(ctx: CanvasRenderingContext2D, player: { name: string, rankColor: string } ) {
        let x = 0;
        const titleWidth = ctx.measureText(player + "'s BedWars Stats").width;

        ctx.font = "30px Minecraft";
        drawText(ctx, "<#FFAA00>Test</#FFAA00>");
        // drawShadowedText(ctx, player.name, x, 50, player.rankColor);
        // drawShadowedText(ctx, "'s ", x + ctx.measureText(player.name).width, 50, COLORS.WHITE);
        // drawShadowedText(ctx, "Bed", x + ctx.measureText(player.name + "'s ").width, 50, COLORS.RED);
        // drawShadowedText(ctx, "Wars Stats", x + ctx.measureText(player.name + "'s Bed").width, 50, COLORS.WHITE);
    }
});

type TextStyle = {
    color: string;
};

export function drawText(ctx: CanvasRenderingContext2D, text: string) {
    const styleStack: TextStyle[] = [];
    let currentStyle: TextStyle = { color: "red" };

    function openTag(tag: string) {
        if (tag.startsWith("#")) {
            // Handle color tag
            const color = tag.slice(1).toLowerCase();
            currentStyle = { color };
            styleStack.push(currentStyle);
        }
    }

    function closeTag() {
        if (styleStack.length > 0) {
            // Restore previous color style
            currentStyle = styleStack.pop()!;
        }
    }

    function processText(text: string) {
        const words = text.split(" ");

        for (const word of words) {
            ctx.fillStyle = currentStyle.color;
            ctx.fillText(word, 0, 0);
            ctx.translate(ctx.measureText(word).width, 0);
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

