import { CanvasRenderingContext2D } from "skia-canvas";
import { CanvasWrapper } from "../util/canvas";
import { properties } from "../index";
import { FeedbackMessage } from "../messages/error";
import { ButtonBuilder } from "@discordjs/builders";
import { ButtonStyle } from "discord-api-types/v10";
import { PlayerTag } from "../services/api/hypixel";
import { drawTitleText } from "./index";

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
    MANGO: "assets/minecraft/textures/item/mango.png",

    DIAMOND: "assets/minecraft/textures/item/diamond.png",
    EMERALD: "assets/minecraft/textures/item/emerald.png",
    IRON: "assets/minecraft/textures/item/iron_ingot.png",
    GOLD: "assets/minecraft/textures/item/gold_ingot.png",
    IRON_SWORD: "assets/minecraft/textures/item/iron_sword.png",
    DIAMOND_SWORD: "assets/minecraft/textures/item/diamond_sword.png",
    BARRIER: "assets/minecraft/textures/item/barrier.png",
    BED: "assets/minecraft/textures/item/bed.png",
    FIREWORK: "assets/minecraft/textures/item/firework_rocket.png",
    GOLD_NUGGET: "assets/minecraft/textures/item/gold_nugget.png",
    TRIPWIRE_HOOK: "assets/minecraft/textures/block/tripwire_hook.png",
    PAPER: "assets/minecraft/textures/item/paper.png",
});

export const TITLES = Object.freeze({
    Stats: function(ctx: CanvasRenderingContext2D, player: { name: string, rankColor: string } ) {
        drawTitleText(ctx, `<${player.rankColor}>${player.name}<\\${player.rankColor}><gray>'s</gray> <red>Bed<\red><white>Wars Stats</white>`);
    },
    Session: function(ctx: CanvasRenderingContext2D, player: { name: string, rankColor: string }, isList?: boolean ) {
        drawTitleText(ctx, `<${player.rankColor}>${player.name}<\\${player.rankColor}><gray>'s</gray> <red>Bed<\red><white>Wars Session${isList ? "s" : ""}</white>`);
    },
    Footer: async function(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
        const wrapper = new CanvasWrapper(ctx);

        x += (width / 2) - (wrapper.measure(`Mango v${properties.version}`) / 2) - 12;

        await wrapper.drawTexture(ITEMS.MANGO, x, y, 16, 16);
        wrapper.drawGradientText(`Mango`, x + 24, y + 13, COLORS.GOLD, COLORS.YELLOW)
        wrapper.drawText(`<dark_green>v</dark_green>`, x + 24 + wrapper.measure("Mango "), y + 13, true);
        wrapper.drawGradientText(properties.version, x + 24 + wrapper.measure("Mango v"), y + 13, COLORS.GREEN, "#ddffdd")
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

export function unknownError() {
    return FeedbackMessage.error("An unknown error occurred! Please report this if it continues.");
}

export function missingPlayer(type: PlayerTag, tag: string) {
    const buttons: ButtonBuilder[] = [];

    const button = new ButtonBuilder()
        .setLabel("NameMC")
        .setStyle(ButtonStyle.Link)
        .setURL(encodeURI(`https://namemc.com/search?q=${tag}`));

    buttons.push(button);

    return FeedbackMessage.error(
        `A player with the ${type} of \`${tag}\` could not be found!`,
        { buttons }
    );
}