import { Command } from "./types/base";
import { SlashCommandBuilder } from "@discordjs/builders";
import { mojang, hypixel } from "../services";
import { interactions } from "../index";
import { Bedwars } from "../services/types/bedwars";
import { Canvas } from "skia-canvas";
import { randomBackground } from "../assets";
import {COLORS, ITEMS, TITLES} from "../assets/constants";
import { CanvasWrapper } from "../util/canvas";
import { getLevelProgress, getPrestige, getPrestigeProgress } from "../util/prestige";

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
            `<white>Level:</white> ${getPrestige(player.achievements.bedwars_level)} ${getLevelProgress(stats.Experience)} ${getPrestige(player.achievements.bedwars_level + 1)}`,
            22, 80, true);
        wrapper.drawText(getPrestigeProgress(player.achievements.bedwars_level, stats.Experience), 22, 105, true);


        const remainingWidth = await itemStats(wrapper, stats, 10, 125);

        wrapper.roundedRect(remainingWidth, 125, canvas.width - remainingWidth - 10, 110, COLORS.WHITE, 0.2);
        await projectedStats(wrapper, stats, remainingWidth + 10, 145, player.achievements.bedwars_level);

        wrapper.roundedRect(10, 245, canvas.width - 20, canvas.height - 245 - 10, COLORS.WHITE, 0.2);
        await wrapper.drawPlayer(profile.id, 10, 250, 158, 256);

        wrapper.font("18px Minecraft, Arial");
        await playerStats(wrapper, stats, 170, 255);

        await interactions.reply(interaction.id, interaction.token, {
            files: [{
                name: "stats.png",
                data: await canvas.toBuffer("png")
            }]
        });
    }
}

async function projectedStats(wrapper: CanvasWrapper, stats: Bedwars, x: number, y: number, level: number) {
    const nextPrestige = Math.ceil(level / 100) * 100;
    const starsToGo = nextPrestige - level;

    const projectedKills: number = stats.kills_bedwars + Math.round((stats.kills_bedwars / level) * starsToGo);
    const projectedFinals: number = stats.final_kills_bedwars + Math.round((stats.final_kills_bedwars / level) * starsToGo);
    const projectedFkdr: number = projectedFinals / stats.final_deaths_bedwars;
    const projectedBeds: number = stats.beds_broken_bedwars + Math.round((stats.beds_broken_bedwars / level) * starsToGo);
    const winsPerStar: number = stats.wins_bedwars + Math.round((stats.wins_bedwars / level) * starsToGo);

    const prestige = getPrestige(nextPrestige);

    wrapper.font("16px Minecraft, Arial");
    wrapper.drawText(`<white>Kills at </white>${prestige}<white>:</white> <yellow>${projectedKills.toLocaleString()}</yellow> <white>(</white><green>+${(projectedKills - stats.kills_bedwars).toLocaleString()}</green><white>)</white>`, x, y, true);
    wrapper.drawText(`<white>Finals at </white>${prestige}<white>:</white> <yellow>${projectedFinals.toLocaleString()}</yellow> <white>(</white><green>+${(projectedFinals - stats.final_kills_bedwars).toLocaleString()}</green><white>)</white>`, x, y + 20, true);
    wrapper.drawText(`<white>Beds at </white>${prestige}<white>:</white> <yellow>${projectedBeds.toLocaleString()}</yellow> <white>(</white><green>+${(projectedBeds - stats.beds_broken_bedwars).toLocaleString()}</green><white>)</white>`, x, y + 40, true);
    wrapper.drawText(`<white>Wins at </white>${prestige}<white>:</white> <yellow>${winsPerStar.toLocaleString()}</yellow> <white>(</white><green>+${(winsPerStar - stats.wins_bedwars).toLocaleString()}</green><white>)</white>`, x, y + 60, true);
    wrapper.drawText(`<white>FKDR at </white>${prestige}<white>:</white> <yellow>${projectedFkdr.toFixed(2).toLocaleString()}</yellow> <white>(</white><green>+${(projectedFkdr - (stats.final_kills_bedwars / stats.final_deaths_bedwars)).toFixed(2).toLocaleString()}</green><white>)</white>`, x, y + 80, true);
}

const purchases= [
    ["iron_resources_collected_bedwars", ITEMS.IRON, COLORS.GRAY],
    ["gold_resources_collected_bedwars", ITEMS.GOLD, COLORS.YELLOW],
    ["diamond_resources_collected_bedwars", ITEMS.DIAMOND, COLORS.AQUA],
    ["emerald_resources_collected_bedwars", ITEMS.EMERALD, COLORS.DARK_GREEN],
];

async function itemStats(wrapper: CanvasWrapper, stats: Bedwars, x: number, y: number) : Promise<number> {
    const sorted = purchases.sort((a, b) => stats[b[0]] - stats[a[0]]);
    const longest = wrapper.measure(sorted.map(([key]) => (stats[key] as number)).sort((a, b) => b - a).map(value => value.toLocaleString())[0]);

    wrapper.roundedRect(x, y, longest + 16 + 20, 110, COLORS.WHITE, 0.2);

    for (let [key, texture, color] of sorted) {
        await wrapper.drawTexture(texture, x + 8, y + 10, 16, 16);
        wrapper.drawText(`<${color}>${stats[key].toLocaleString()}</${color}>`, x + 8 + 20, y + 10 + 16, true);
        y += 25;
    }

    return longest + 16 + 20 + 20;
}

type Stat = {
    name: string,
    icon: string,
    pos: number,
    neg: number,
    ratio: string
}

type Legend = {
    name: string,
    icon: string
}

const legend: Legend[] = [
    {
        name: 'Kills',
        icon: ITEMS.IRON_SWORD
    },
    {
        name: 'Final Kills',
        icon: ITEMS.DIAMOND_SWORD
    },
    {
        name: 'Beds',
        icon: ITEMS.BED
    },
    {
        name: 'Wins',
        icon: ITEMS.FIREWORK
    }
];

async function playerStats(wrapper: CanvasWrapper, stats: Bedwars, x: number, y: number) {
    const displayStats : Stat[] = [
        {
            name: 'Kills',
            icon: ITEMS.IRON_SWORD,
            pos: stats.kills_bedwars,
            neg: stats.deaths_bedwars,
            ratio: (stats.beds_broken_bedwars / stats.beds_lost_bedwars).toFixed(2)
        },
        {
            name: 'Final Kills',
            icon: ITEMS.DIAMOND_SWORD,
            pos: stats.final_kills_bedwars,
            neg: stats.final_deaths_bedwars,
            ratio: (stats.final_kills_bedwars / stats.final_deaths_bedwars).toFixed(2)
        },
        {
            name: 'Beds',
            icon: ITEMS.BED,
            pos: stats.beds_broken_bedwars,
            neg: stats.beds_lost_bedwars,
            ratio: (stats.beds_broken_bedwars / stats.beds_lost_bedwars).toFixed(2)
        },
        {
            name: 'Wins',
            icon: ITEMS.FIREWORK,
            pos: stats.wins_bedwars,
            neg: stats.losses_bedwars,
            ratio: (stats.wins_bedwars / stats.losses_bedwars).toFixed(2)
        }
    ];

    let maxStatWidth = 0;

    for (const stat of displayStats) {
        const statWidth = Math.max(
            wrapper.measure(stat.pos.toLocaleString()),
            wrapper.measure(stat.neg.toLocaleString()),
            wrapper.measure(stat.ratio.toLocaleString())
        );
        maxStatWidth = Math.max(maxStatWidth, statWidth);
    }

    const spacing = maxStatWidth + 40;
    x += (maxStatWidth / 3);

    for (const stat of displayStats) {
        await wrapper.drawTexture(stat.icon, x, y, 16, 16);
        wrapper.drawText(`<green>${stat.pos.toLocaleString()}</green>`, x + 20, y + 14, true);

        await wrapper.drawTexture(ITEMS.BARRIER, x + spacing, y, 16, 16);
        wrapper.drawText(`<red>${stat.neg.toLocaleString()}</red>`, x + spacing + 20, y + 14, true);

        wrapper.drawText(`<gold>${stat.ratio.toLocaleString()}</gold>`, x + spacing * 2, y + 14, true);

        y += 30;
    }

    let offsetX = x + 29;
    wrapper.font('10px Minecraft');

    for (const label of legend) {
        await wrapper.drawTexture(label.icon, offsetX, y, 12, 12);
        wrapper.drawText(`<white>${label.name}</white>`, offsetX + 16, y + 10, true);
        offsetX += wrapper.measure(label.name) + 22;
    }

    wrapper.drawLine(x + 20, y + 20, x + 20, COLORS.WHITE, 0.4);
}

export default command;