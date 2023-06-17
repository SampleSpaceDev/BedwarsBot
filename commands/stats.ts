import { Command } from "./types/base";
import { SlashCommandBuilder } from "@discordjs/builders";
import { mojang, hypixel } from "../services";
import { interactions } from "../index";
import { Bedwars } from "../services/types";
import { defaultCanvas } from "../assets";
import { COLORS, ITEMS, TITLES } from "../assets/constants";
import { CanvasWrapper } from "../util/canvas";
import { getLevelProgress, getPrestige, getPrestigeProgress } from "../util/prestige";
import { FeedbackMessage } from "../messages/error";
import * as config from "../config.json";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Basic Bedwars stats command.")
        .addStringOption(option => option
            .setName("player")
            .setDescription("The username or UUID of a player.")
            .setRequired(true)
        )
        .toJSON(),
    execute: async (interaction) => {
        await interactions.defer(interaction.id, interaction.token);

        const options = interaction.data.options as { value: string }[];
        const tag = options[0].value;

        const profile = (await mojang.getPlayer(tag)).data.player;

        const player = (await hypixel.getPlayer("uuid", profile.id)).player;
        const stats = player.stats.Bedwars as Bedwars;

        if (stats === undefined) {
            const errorMessage = FeedbackMessage.error("This player has not played Bedwars before.");
            await interactions.followUp(config.appId, interaction.token, {
                embeds: errorMessage.embeds.map(embed => embed.toJSON())
            });
            return;
        }

        const ctx = await defaultCanvas("Bedwars");
        const wrapper = new CanvasWrapper(ctx);

        TITLES.Stats(ctx, { name: profile.username, rankColor: hypixel.getRankColor(player) });

        ctx.font = "20px Minecraft, Arial";
        wrapper.roundedRect(10, 60, ctx.canvas.width - 20, 55, COLORS.WHITE, 0.2);
        wrapper.drawText(
            `<white>Level:</white> ${getPrestige(player.achievements.bedwars_level || 0)} ${getLevelProgress(stats.Experience || 0)} ${getPrestige((player.achievements.bedwars_level || 0) + 1)}`,
            20, 80, true);
        wrapper.drawText(getPrestigeProgress((player.achievements.bedwars_level || 0), (stats.Experience || 0)), 20, 105, true);

        const remainingWidth = await itemStats(wrapper, stats, 10, 125);

        wrapper.roundedRect(remainingWidth, 125, ctx.canvas.width - remainingWidth - 10, 110, COLORS.WHITE, 0.2);
        await projectedStats(wrapper, stats, remainingWidth + 10, 145, (player.achievements.bedwars_level || 0));

        wrapper.roundedRect(10, 245, ctx.canvas.width - 20, ctx.canvas.height - 245 - 10, COLORS.WHITE, 0.2);
        const error = await wrapper.drawPlayer(profile.id, 10, 250, 158, 256);

        if (error instanceof FeedbackMessage) {
            return interactions.followUp(config.appId, interaction.token, {
                embeds: error.embeds.map(embed => embed.toJSON()),
                content: error.content,
                files: error.files
            });
        }

        wrapper.font("18px Minecraft, Arial");
        let newY = await playerStats(wrapper, stats, 170, 255, ctx.canvas.width - 170 - 20 - 10);

        newY = await otherStats(wrapper, stats, 170, newY, ctx.canvas.width - 170 - 20 - 10);

        await TITLES.Footer(ctx, 170, newY + 3, ctx.canvas.width - 170 - 20 - 10);

        await interactions.followUp(config.appId, interaction.token, {
            content: `<:info:1119591149611528242> Projected stats assume __no__ negative stats are taken.`,
            files: [{
                name: "stats.png",
                data: await ctx.canvas.toBuffer("png")
            }]
        });
    }
}

async function projectedStats(wrapper: CanvasWrapper, stats: Bedwars, x: number, y: number, level: number) {
    const nextPrestige = Math.ceil(level / 100) * 100;
    const starsToGo = nextPrestige - level;

    const projectedKills: number = (stats.kills_bedwars || 0) + Math.round(((stats.kills_bedwars || 0) / level) * starsToGo);
    const projectedFinals: number = (stats.final_kills_bedwars || 0) + Math.round(((stats.final_kills_bedwars || 0) / level) * starsToGo);
    const projectedFkdr: number = projectedFinals / (stats.final_deaths_bedwars || 0);
    const projectedBeds: number = (stats.beds_broken_bedwars || 0) + Math.round(((stats.beds_broken_bedwars || 0) / level) * starsToGo);
    const winsPerStar: number = (stats.wins_bedwars || 0) + Math.round(((stats.wins_bedwars || 0) / level) * starsToGo);

    const prestige = getPrestige(nextPrestige);

    wrapper.font("16px Minecraft, Arial");

    const killsLine = `<white>Kills at </white>${prestige}<white>:</white> <yellow>${projectedKills.toLocaleString()}</yellow> <white>(</white><green>+${(projectedKills - stats.kills_bedwars).toLocaleString()}</green><white>)</white>`;
    const finalsLine = `<white>Finals at </white>${prestige}<white>:</white> <yellow>${projectedFinals.toLocaleString()}</yellow> <white>(</white><green>+${(projectedFinals - stats.final_kills_bedwars).toLocaleString()}</green><white>)</white>`;
    const bedsLine = `<white>Beds at </white>${prestige}<white>:</white> <yellow>${projectedBeds.toLocaleString()}</yellow> <white>(</white><green>+${(projectedBeds - stats.beds_broken_bedwars).toLocaleString()}</green><white>)</white>`;
    const winsLine = `<white>Wins at </white>${prestige}<white>:</white> <yellow>${winsPerStar.toLocaleString()}</yellow> <white>(</white><green>+${(winsPerStar - stats.wins_bedwars).toLocaleString()}</green><white>)</white>`;
    const fkdrLine = `<white>FKDR at </white>${prestige}<white>:</white> <yellow>${projectedFkdr.toFixed(2).toLocaleString()}</yellow> <white>(</white><green>+${(projectedFkdr - (stats.final_kills_bedwars / stats.final_deaths_bedwars)).toFixed(2).toLocaleString()}</green><white>)</white>`;

    const lines = [killsLine, finalsLine, bedsLine, winsLine, fkdrLine];
    const maxLineWidth = Math.max(...lines.map(line => wrapper.measure(line.substring(0, line.indexOf(":")))));

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineX = x + maxLineWidth - wrapper.measure(line.substring(0, line.indexOf(":")));
        const lineY = y + i * 20;

        wrapper.drawText(line, lineX, lineY, true);
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
    const longest = wrapper.measure(sorted.map(([key]) => ((stats[key] || 0) as number)).sort((a, b) => b - a).map(value => value.toLocaleString())[0]);

    wrapper.roundedRect(x, y, longest + 16 + 20, 110, COLORS.WHITE, 0.2);

    for (let [key, texture, color] of sorted) {
        await wrapper.drawTexture(texture, x + 8, y + 10, 16, 16);
        wrapper.drawText(`<${color}>${(stats[key] || 0).toLocaleString()}</${color}>`, x + 8 + 20, y + 10 + 16, true);
        y += 25;
    }

    return longest + 16 + 20 + 20;
}

type GameStat = {
    name: string,
    icon: string,
    pos: number,
    neg: number,
    ratio: string
}

type OtherStat = {
    name: string,
    icon: string,
    value: number,
    color: string
}

async function playerStats(wrapper: CanvasWrapper, stats: Bedwars, x: number, y: number, width: number) {
    const displayStats : GameStat[] = [
        {
            name: 'Kills',
            icon: ITEMS.IRON_SWORD,
            pos: stats.kills_bedwars || 0,
            neg: stats.deaths_bedwars || 0,
            ratio: ((stats.kills_bedwars || 0) / (stats.deaths_bedwars || 0)).toFixed(2)
        },
        {
            name: 'Finals',
            icon: ITEMS.DIAMOND_SWORD,
            pos: stats.final_kills_bedwars || 0,
            neg: stats.final_deaths_bedwars || 0,
            ratio: ((stats.final_kills_bedwars || 0) / (stats.final_deaths_bedwars || 0)).toFixed(2)
        },
        {
            name: 'Beds',
            icon: ITEMS.BED,
            pos: stats.beds_broken_bedwars || 0,
            neg: stats.beds_lost_bedwars || 0,
            ratio: ((stats.beds_broken_bedwars || 0) / (stats.beds_lost_bedwars || 0)).toFixed(2)
        },
        {
            name: 'Wins',
            icon: ITEMS.FIREWORK,
            pos: stats.wins_bedwars || 0,
            neg: stats.losses_bedwars || 0,
            ratio: ((stats.wins_bedwars || 0) / (stats.losses_bedwars || 0)).toFixed(2)
        }
    ];

    const lineHeight = 20;

    let currentY = y;
    for (const stat of displayStats) {
        const { icon, name, pos, neg, ratio } = stat;

        await wrapper.drawTexture(icon, x, currentY, 16, 16); // Adjust the size of the icon if needed
        wrapper.drawText(`<white>${name}:</white> <green>${pos.toLocaleString()}</green> <white>/</white> <red>${neg.toLocaleString()}</red> <white>/</white> <gold>${ratio.toLocaleString()}</gold>`, x + 24, currentY + 13, true);

        currentY += lineHeight;
    }

    currentY += 10;
    wrapper.drawLine(x + 28, currentY, width - 10 - 50, COLORS.WHITE, 0.4);

    return currentY + 15;
}

async function otherStats(wrapper: CanvasWrapper, stats: Bedwars, x: number, y: number, width: number) {
    const displayStats : OtherStat[] = [
        {
            name: 'Coins',
            icon: ITEMS.GOLD_NUGGET,
            value: stats.coins || 0,
            color: COLORS.GOLD
        },
        {
            name: 'Loot Chests',
            icon: ITEMS.TRIPWIRE_HOOK,
            value: stats.bedwars_boxes || 0,
            color: COLORS.AQUA
        },
        {
            name: "Games Played",
            icon: ITEMS.PAPER,
            value: stats.games_played_bedwars || 0,
            color: COLORS.GREEN
        },
        {
            name: 'Winstreak',
            icon: ITEMS.FIREWORK,
            value: stats.winstreak || 0,
            color: COLORS.DARK_GREEN
        }
    ];

    const lineHeight = 20;

    let currentY = y;
    for (const stat of displayStats) {
        const { icon, name, value, color } = stat;

        await wrapper.drawTexture(icon, x, currentY, 16, 16); // Adjust the size of the icon if needed
        wrapper.drawText(`<white>${name}:</white> <${color}>${value.toLocaleString()}</${color}>`, x + 24, currentY + 13, true);

        currentY += lineHeight;
    }

    currentY += 10;
    wrapper.drawLine(x + 28, currentY, width - 10 - 50, COLORS.WHITE, 0.4);

    return currentY + 10;
}

export default command;