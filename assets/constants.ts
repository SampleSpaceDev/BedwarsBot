import { CanvasRenderingContext2D } from "skia-canvas";
import { CanvasWrapper } from "../util/canvas";

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
        const wrapper = new CanvasWrapper(ctx);

        ctx.font = "30px Minecraft";
        ctx.fillStyle = player.rankColor;

        wrapper.drawText(
            `<${player.rankColor}>${player.name}<\\${player.rankColor}>'s <${COLORS.RED}>Bed<\\${COLORS.RED}>Wars Stats`,
            x, 50, true);
    }
});

export function getShadowColor(colorValue: string): string | undefined {
    for (const key in COLORS) {
        if (COLORS[key as keyof typeof COLORS] === colorValue) {
            return SHADOWS[key as keyof typeof SHADOWS];
        }
    }
    return undefined;
}