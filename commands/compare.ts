import {Command} from "./types/base";
import {SlashCommandBuilder} from "@discordjs/builders";
import {interactions} from "../index";
import {hypixel, mojang} from "../services";
import {FeedbackMessage} from "../messages/error";
import {Player} from "../services/types";
import {defaultCanvas} from "../assets";
import {CanvasWrapper} from "../util/canvas";
import {COLORS, TITLES} from "../assets/constants";
import * as config from "../config.json";
import {formatStat, stripColor} from "../util";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("compare")
        .setDescription("Compare the stats of two players")
        .addStringOption((option) => option
            .setName("first")
            .setDescription("The first player to compare")
            .setMinLength(1)
            .setMaxLength(36)
            .setRequired(true)
        )
        .addStringOption((option) => option
            .setName("second")
            .setDescription("The second player to compare")
            .setMinLength(1)
            .setMaxLength(36)
            .setRequired(true)
        )
        .toJSON(),
    execute: async (interaction) => {
        await interactions.defer(interaction.id, interaction.token);

        // Get both options
        const options = interaction.data.options as [{ type: number, options: [], name: string, value?: string }];
        const first = options.find((option) => option.name === "first");
        const second = options.find((option) => option.name === "second");

        // Get both players
        const firstProfile = await mojang.getPlayer(first.value);
        const secondProfile = await mojang.getPlayer(second.value);

        // Check if both players exist
        if (!firstProfile || !secondProfile) {
            const body = FeedbackMessage.error("One or both of the players do not exist.");
            return interactions.followUp(interaction.id, interaction.token, {
                embeds: body.embeds.map((embed) => embed.toJSON())
            });
        }

        // Get both players' stats
        const firstPlayer = await hypixel.getPlayer("uuid", firstProfile.data.player.id);
        const secondPlayer = await hypixel.getPlayer("uuid", secondProfile.data.player.id);

        // Check if both players have stats
        if (!firstPlayer || !secondPlayer) {
            const body = FeedbackMessage.error("One or both of the players do not have stats.");
            return interactions.followUp(interaction.id, interaction.token, {
                embeds: body.embeds.map((embed) => embed.toJSON())
            });
        }

        // Get the comparison
        const comparison: Comparison = compare(firstPlayer.player, secondPlayer.player);

        // Create the image
        const ctx = await defaultCanvas("Bedwars");
        const wrapper = new CanvasWrapper(ctx);

        await TITLES.Compare(ctx);

        wrapper.font("16px Minecraft");

        wrapper.roundedRect(10, 60, (480 / 2) - 5, 50, COLORS.WHITE, 0.2);
        wrapper.drawText(`<white>Player 1:</white>`, 10 + ((480 / 2 - 5) / 2) - (wrapper.measure(`Player 1:`) / 2), 80, true);
        wrapper.drawText(hypixel.getDisplayName(firstPlayer.player), 10 + ((480 / 2 - 5) / 2) - (wrapper.measure(stripColor(hypixel.getDisplayName(firstPlayer.player))) / 2), 100, true);

        wrapper.roundedRect(255, 60, (480 / 2) - 5, 50, COLORS.WHITE, 0.2);
        wrapper.drawText(`<white>Player 2:</white>`, 255 + ((480 / 2 - 5) / 2) - (wrapper.measure(`Player 2:`) / 2), 80, true);
        wrapper.drawText(hypixel.getDisplayName(secondPlayer.player), 255 + ((480 / 2 - 5) / 2) - (wrapper.measure(stripColor(hypixel.getDisplayName(secondPlayer.player))) / 2), 100, true);

        wrapper.roundedRect(10, 120, (480 / 2) - 5, 300, COLORS.WHITE, 0.2);
        wrapper.roundedRect(255, 120, (480 / 2) - 5, 300, COLORS.WHITE, 0.2);

        await wrapper.drawPlayer(firstProfile.data.player.id, 10 + (96 / 2), 420 - 128, {
            type: "bust",
            size: 128
        });

        await wrapper.drawPlayer(secondProfile.data.player.id, 255 + (96 / 2), 420 - 128, {
            type: "bust",
            size: 128,
            yaw: -40
        });

        for (const stat in comparison.first) {
            if (Object.prototype.hasOwnProperty.call(comparison.first, stat)) {
                const firstValue = comparison.first[stat].toLocaleString();
                const secondValue = comparison.second[stat].toLocaleString();

                let color: { first: string, second: string };
                if (firstValue === secondValue) {
                    color = { first: COLORS.GOLD, second: COLORS.GOLD };
                } else if (firstValue > secondValue) {
                    color = { first: COLORS.GREEN, second: COLORS.RED };
                } else if (firstValue < secondValue) {
                    color = { first: COLORS.RED, second: COLORS.GREEN };
                }

                const formattedStat = formatStat(stat);
                const isRatioStat = stat.endsWith('r');

                if (isRatioStat) {
                    const firstRatio = comparison.first[stat].toLocaleString();
                    const secondRatio = comparison.second[stat].toLocaleString();

                    wrapper.drawText(`<white>${formattedStat}</white>: <${color.first}>${firstValue}</${color.first}> (<${color.first}>${firstRatio}</${color.first}>)`, 10 + ((480 / 2) - 5 / 2) - (wrapper.measure(`${formattedStat} ${firstValue} (${firstRatio})`) / 2), 140 + (20 * Object.keys(comparison.first).indexOf(stat)), true);
                    wrapper.drawText(`<white>${formattedStat}</white>: <${color.second}>${secondValue}</${color.second}> (<${color.second}>${secondRatio}</${color.second}>)`, 255 + ((480 / 2) - 5 / 2) - (wrapper.measure(`${formattedStat} ${secondValue} (${secondRatio})`) / 2), 140 + (20 * Object.keys(comparison.second).indexOf(stat)), true);
                } else {
                    wrapper.drawText(`<white>${formattedStat}</white> <${color.first}>${firstValue}</${color.first}>`, 10 + ((480 / 2) - 5 / 2) - (wrapper.measure(`${formattedStat} ${firstValue}`) / 2), 140 + (20 * Object.keys(comparison.first).indexOf(stat)), true);
                    wrapper.drawText(`<white>${formattedStat}</white> <${color.second}>${secondValue}</${color.second}>`, 255 + ((480 / 2) - 5 / 2) - (wrapper.measure(`${formattedStat} ${secondValue}`) / 2), 140 + (20 * Object.keys(comparison.second).indexOf(stat)), true);
                }
            }
        }


        wrapper.font("20px Minecraft");
        wrapper.roundedRect(10, 460, 480, 30, COLORS.WHITE, 0.2);
        await TITLES.Footer(ctx, 10, 500 - 32, 480);

        return await interactions.followUp(config.appId, interaction.token, {
            files: [{
                name: "comparison.png",
                data: await ctx.canvas.toBuffer("png")
            }]
        });
    }
}

function getStats(playerStats) {
    const stats = playerStats.stats.Bedwars;

    return {
        wins: stats.wins_bedwars,
        // losses: stats.losses_bedwars,
        wlr: stats.wins_bedwars / stats.losses_bedwars,
        kills: stats.kills_bedwars,
        // deaths: stats.deaths_bedwars,
        kdr: stats.kills_bedwars / stats.deaths_bedwars,
        finalKills: stats.final_kills_bedwars,
        // finalDeaths: stats.final_deaths_bedwars,
        fkdr: stats.final_kills_bedwars / stats.final_deaths_bedwars,
        bedsBroken: stats.beds_broken_bedwars,
        // bedsLost: stats.beds_lost_bedwars,
        bblr: stats.beds_broken_bedwars / stats.beds_lost_bedwars,
        gamesPlayed: stats.games_played_bedwars,
        winstreak: stats.winstreak || 0
    };
}

function compare(firstPlayer: Player, secondPlayer: Player) {
    const firstComparison = getStats(firstPlayer);
    const secondComparison = getStats(secondPlayer);

    const comparison: Comparison = {
        first: { ...firstComparison, level: firstPlayer.achievements.bedwars_level },
        second: { ...secondComparison, level: secondPlayer.achievements.bedwars_level },
        difference: {}
    };

    for (const key in firstComparison) {
        comparison.difference[key] = firstComparison[key] - secondComparison[key];
    }

    comparison.difference["level"] = firstPlayer.achievements.bedwars_level - secondPlayer.achievements.bedwars_level;

    return comparison;
}

type Stats = {
    wins: number,
    // losses: number,
    wlr: number,
    kills: number,
    // deaths: number,
    kdr: number,
    finalKills: number,
    // finalDeaths: number,
    fkdr: number,
    bedsBroken: number,
    // bedsLost: number,
    bblr: number,
    gamesPlayed: number,
    winstreak: number,
    level: number,
}

type Comparison = {
    first: Stats,
    second: Stats,
    difference: Stats | {},
}

export default command;