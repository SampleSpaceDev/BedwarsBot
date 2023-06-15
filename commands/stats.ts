import { Command } from "./types/base";
import { SlashCommandBuilder } from "@discordjs/builders";
import { mojang, hypixel } from "../services";
import { interactions } from "../index";
import { Bedwars } from "../services/types/bedwars";
import { Canvas } from "skia-canvas";
import { randomBackground } from "../assets";
import {COLORS, ITEMS, TITLES} from "../assets/constants";
import { CanvasWrapper } from "../util/canvas";
import {getLevelProgress, getPrestige, getPrestigeProgress} from "../util/prestige";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Basic Bedwars stats command.")
        .addStringOption(option => option
            .setName("player")
            .setDescription("The username or UUID of a player.")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .toJSON(),
    execute: async (interaction) => {
        const options = interaction.data.options as { value: string }[];
        const tag = options[0].value;

        const profile = (await mojang.getPlayer(tag)).data.player;

        const player = (await hypixel.getPlayer("uuid", profile.id)).player;
        const stats = player.stats.Bedwars as Bedwars;

        const canvas = new Canvas(500, 500);
        const ctx = canvas.getContext("2d");
        const wrapper = new CanvasWrapper(ctx);

        const backgroundImage = await randomBackground("Bedwars");
        ctx.filter = 'blur(10px) brightness(50%)';
        ctx.drawImage(backgroundImage, -710, -580, 1920, 1080);
        ctx.filter = 'blur(0px) brightness(100%)';

        TITLES.Bedwars(ctx, { name: profile.username, rankColor: COLORS.GOLD });

        ctx.font = "20px Minecraft, Arial";
        wrapper.roundedRect(10, 60, canvas.width - 20, 55, COLORS.WHITE, 0.2);
        wrapper.drawText(
            `<gray>Level:</gray> ${getPrestige(player.achievements.bedwars_level)} ${getLevelProgress(stats.Experience)} ${getPrestige(player.achievements.bedwars_level + 1)}`,
            22, 80, true);
        wrapper.drawText(getPrestigeProgress(player.achievements.bedwars_level, stats.Experience), 22, 105, true);

        const width = await itemStats(wrapper, stats, 10, 125);
        wrapper.roundedRect(width, 125, canvas.width - width - 10, 110, COLORS.WHITE, 0.2);

        wrapper.roundedRect(10, 245, canvas.width - 20, canvas.height - 245 - 10, COLORS.WHITE, 0.2);
        await wrapper.drawPlayer(profile.id, 10, 250, 158, 256);

        await playerStats(wrapper, stats, 170, 255);

        await interactions.reply(interaction.id, interaction.token, {
            files: [{
                name: "stats.png",
                data: await canvas.toBuffer("png")
            }]
        });
    }
}

const purchases= [
    ["iron_resources_collected_bedwars", ITEMS.IRON, COLORS.GRAY],
    ["gold_resources_collected_bedwars", ITEMS.GOLD, COLORS.YELLOW],
    ["diamond_resources_collected_bedwars", ITEMS.DIAMOND, COLORS.AQUA],
    ["emerald_resources_collected_bedwars", ITEMS.EMERALD, COLORS.DARK_GREEN],
];

async function itemStats(wrapper: CanvasWrapper, stats: Bedwars, x: number, y: number) : Promise<number> {
    const sorted = purchases.sort((a, b) => stats[b[0]] - stats[a[0]]);
    let longest = wrapper.measure(sorted.map(([key]) => (stats[key] as number)).sort((a, b) => b - a).map(value => value.toLocaleString())[0]);

    wrapper.roundedRect(x, y, longest + 16 + 20, 110, COLORS.WHITE, 0.2);

    for (let [key, texture, color] of sorted) {
        await wrapper.drawTexture(texture, x + 8, y + 10, 16, 16);
        wrapper.drawText(`<${color}>${stats[key].toLocaleString()}</${color}>`, x + 8 + 20, y + 10 + 16, true);
        y += 25;
    }

    return longest + 16 + 20 + 20;
}

async function playerStats(wrapper: CanvasWrapper, stats: Bedwars, x: number, y: number) {
    // Calculate maximum width among the values
    const maxStatWidth = Math.max(
        wrapper.measure(stats.kills_bedwars.toLocaleString()),
        wrapper.measure(stats.deaths_bedwars.toLocaleString()),
        wrapper.measure((stats.kills_bedwars / stats.deaths_bedwars).toFixed(2).toLocaleString()),
        wrapper.measure(stats.final_kills_bedwars.toLocaleString()),
        wrapper.measure(stats.final_deaths_bedwars.toLocaleString()),
        wrapper.measure((stats.final_kills_bedwars / stats.final_deaths_bedwars).toFixed(2).toLocaleString()),
        wrapper.measure(stats.beds_broken_bedwars.toLocaleString()),
        wrapper.measure(stats.beds_lost_bedwars.toLocaleString()),
        wrapper.measure((stats.beds_broken_bedwars / stats.beds_lost_bedwars).toFixed(2).toLocaleString())
    );

    const spacing = maxStatWidth + 40;
    // Calculate the total width of the longest line
    x += (maxStatWidth / 3);

    // Draw K/D
    await wrapper.drawTexture(ITEMS.IRON_SWORD, x, y, 16, 16);
    wrapper.drawText(`<green>${stats.kills_bedwars.toLocaleString()}</green>`, x + 20, y + 14, true);

    await wrapper.drawTexture(ITEMS.BARRIER, x + spacing, y, 16, 16);
    wrapper.drawText(`<red>${stats.deaths_bedwars.toLocaleString()}</red>`, x + spacing + 20, y + 14, true);

    wrapper.drawText(`<gold>${(stats.kills_bedwars / stats.deaths_bedwars).toFixed(2).toLocaleString()}</gold>`, x + spacing * 2, y + 14, true);

    // Draw FK/D
    await wrapper.drawTexture(ITEMS.DIAMOND_SWORD, x, y + 30, 16, 16);
    wrapper.drawText(`<green>${stats.final_kills_bedwars.toLocaleString()}</green>`, x + 20, y + 14 + 30, true);

    await wrapper.drawTexture(ITEMS.BARRIER, x + spacing, y + 30, 16, 16);
    wrapper.drawText(`<red>${stats.final_deaths_bedwars.toLocaleString()}</red>`, x + spacing + 20, y + 14 + 30, true);

    wrapper.drawText(`<gold>${(stats.final_kills_bedwars / stats.final_deaths_bedwars).toFixed(2).toLocaleString()}</gold>`, x + spacing * 2, y + 14 + 30, true);

    // Draw BB/L
    await wrapper.drawTexture(ITEMS.BED, x, y + 60, 16, 16);
    wrapper.drawText(`<green>${stats.beds_broken_bedwars.toLocaleString()}</green>`, x + 20, y + 14 + 60, true);

    await wrapper.drawTexture(ITEMS.BARRIER, x + spacing, y + 60, 16, 16);
    wrapper.drawText(`<red>${stats.beds_lost_bedwars.toLocaleString()}</red>`, x + spacing + 20, y + 14 + 60, true);

    wrapper.drawText(`<gold>${(stats.beds_broken_bedwars / stats.beds_lost_bedwars).toFixed(2).toLocaleString()}</gold>`, x + spacing * 2, y + 14 + 60, true);

    y += 100;
    wrapper.drawLine(x + 20, y, spacing * 2 + 20, COLORS.WHITE, 0.4);

    wrapper.drawText("<yellow>More here soon!</yellow>", x + spacing - 40, y + 50, true);
}

export default command;