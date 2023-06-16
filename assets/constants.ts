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

export const ITEMS = Object.freeze({
    DIAMOND: "assets/minecraft/textures/item/diamond.png",
    EMERALD: "assets/minecraft/textures/item/emerald.png",
    IRON: "assets/minecraft/textures/item/iron_ingot.png",
    GOLD: "assets/minecraft/textures/item/gold_ingot.png",
    IRON_SWORD: "assets/minecraft/textures/item/iron_sword.png",
    DIAMOND_SWORD: "assets/minecraft/textures/item/diamond_sword.png",
    BARRIER: "assets/minecraft/textures/item/barrier.png",
    BED: "assets/minecraft/textures/item/bed.png",
    FIREWORK: "assets/minecraft/textures/item/firework_rocket.png",
});

export const TITLES = Object.freeze({
    Bedwars: function(ctx: CanvasRenderingContext2D, player: { name: string, rankColor: string } ) {
        ctx.font = "30px Minecraft";

        const wrapper = new CanvasWrapper(ctx);
        const x = ctx.canvas.width / 2 - wrapper.measure(`${player.name}'s BedWars Stats`) / 2;

        wrapper.roundedRect(10, 10, ctx.canvas.width - 20, 40, COLORS.WHITE, 0.2);

        wrapper.drawText(
            `<${player.rankColor}>${player.name}<\\${player.rankColor}><gray>'s</gray> <red>Bed<\red><white>Wars Stats</white>`,
            x, 40, true);
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