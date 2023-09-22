import {Command} from "./types/base";
import {SlashCommandBuilder} from "@discordjs/builders";
import {interactions} from "../index";
import {defaultCanvas, defaultCanvasWithSize} from "../assets";
import {CanvasWrapper} from "../util/canvas";
import {COLORS, missingPlayer, TITLES} from "../assets/constants";
import * as config from "../config.json";
import { getPlayer, stripColor } from "../util";
import {FeedbackMessage} from "../messages/error";
import {hypixel, mojang} from "../services";
import {Bedwars, Player} from "../services/types";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("calculate")
        .setDescription("Calculate the necessary amount of stats to hit a certain ratio.")
        .addStringOption(option => option
            .setName("player")
            .setDescription("The username or UUID of a player.")
            .setMinLength(1)
            .setMaxLength(36)
        )
        .addNumberOption((option) => option
            .setName("ratio")
            .setDescription("The ratio to calculate")
            .setMinValue(0)
            .setMaxValue(10000)
            .setRequired(false))
        .toJSON(),
    execute: async (interaction) => {
        await interactions.defer(interaction.id, interaction.token);

        const options = interaction.data.options as [{ type: number, options: [], name: string, value?: string | number }];

        let tag: string;
        if (options === undefined || options.find(item => item.name === 'player') === undefined) {
            tag = await getPlayer(interaction.member.user.id);
            if (tag === undefined) {
                const errorMessage = FeedbackMessage.error("Your username is not linked! Use </link:1119652679052972152> to link your username.");
                await interactions.followUp(config.appId, interaction.token, {
                    embeds: errorMessage.embeds.map(embed => embed.toJSON())
                });
                return;
            }
        } else {
            tag = options[0]?.value as string;
        }

        const ratio = options === undefined || options.find(item => item.name === 'ratio') === undefined
            ? -1
            : Math.round(options.find(item => item.name === 'ratio').value as number * 100) / 100;


        const profile = (await mojang.getPlayer(tag));
        if (!profile.success) {
            return interactions.followUp(config.appId, interaction.token, {
                embeds: missingPlayer(mojang.parseTag(tag), tag).embeds.map((embed) => embed.toJSON())
            });
        }

        const player = (await hypixel.getPlayer("uuid", profile.data.player.id)).player as Player;
        const stats = player.stats.Bedwars as Bedwars;

        if (stats === undefined) {
            const errorMessage = FeedbackMessage.error("This player has not played Bedwars before.");
            await interactions.followUp(config.appId, interaction.token, {
                embeds: errorMessage.embeds.map(embed => embed.toJSON())
            });
            return;
        }

        const ctx = await defaultCanvasWithSize("Bedwars", 500, 400);
        const wrapper = new CanvasWrapper(ctx);

        TITLES.Ratios(ctx, { name: profile.data.player.username, rankColor: hypixel.getRankColor(player) });

        const calculations = {
            kdr: checkRatio(ratio as number, stats.kills_bedwars, stats.deaths_bedwars),
            fkdr: checkRatio(ratio as number, stats.final_kills_bedwars, stats.final_deaths_bedwars),
            wlr: checkRatio(ratio as number, stats.wins_bedwars, stats.losses_bedwars),
            bblr: checkRatio(ratio as number, stats.beds_broken_bedwars, stats.beds_lost_bedwars)
        }

        wrapper.roundedRect(10, 60, 168, 290, COLORS.WHITE, 0.2);
        const error = await wrapper.drawPlayer(profile.data.player.id, 15, 84, {
            type: "full"
        });

        wrapper.roundedRect(188, 60, 302, 290, COLORS.WHITE, 0.2);

        wrapper.font("20px Minecraft");

        // KDR
        if (calculations.kdr.value === true) {
            let text = `<yellow>${ratio}</yellow> <white>KDR is</white> <green>already achieved!</green>`;
            wrapper.font(`${wrapper.calculateSize(stripColor(text), 292)}px Minecraft`);
            wrapper.drawText(text, 198, 90, true);
            wrapper.font("20px Minecraft");
        } else {
            wrapper.drawText(`<white>Kills to</white> <yellow>${calculations.kdr.ratio}</yellow> <white>KDR:</white> <green>${calculations.kdr.value.toLocaleString()}</green>`, 198, 85, true);
            wrapper.drawText(`<white>Kills at</white> <yellow>${calculations.kdr.ratio}</yellow> <white>KDR:</white> <green>${(stats.kills_bedwars + (calculations.kdr.value as number)).toLocaleString()}</green>`, 198, 110, true);
        }

        // FKDR
        if (calculations.fkdr.value === true) {
            let text = `<yellow>${ratio}</yellow> <white>FKDR is</white> <green>already achieved!</green>`;
            wrapper.font(`${wrapper.calculateSize(stripColor(text), 292)}px Minecraft`);
            wrapper.drawText(text, 198, 165, true);
            wrapper.font("20px Minecraft");
        } else {
            wrapper.drawText(`<white>Finals to</white> <yellow>${calculations.fkdr.ratio}</yellow> <white>FKDR:</white> <green>${calculations.fkdr.value.toLocaleString()}</green>`, 198, 160, true);
            wrapper.drawText(`<white>Finals at</white> <yellow>${calculations.fkdr.ratio}</yellow> <white>FKDR:</white> <green>${(stats.final_kills_bedwars + (calculations.fkdr.value as number)).toLocaleString()}</green>`, 198, 185, true);
        }

        // WLR
        if (calculations.wlr.value === true) {
            let text = `<yellow>${ratio}</yellow> <white>WLR is</white> <green>already achieved!</green>`;
            wrapper.font(`${wrapper.calculateSize(stripColor(text), 292)}px Minecraft`);
            wrapper.drawText(text, 198, 240, true);
            wrapper.font("20px Minecraft");
        } else {
            wrapper.drawText(`<white>Wins to</white> <yellow>${calculations.wlr.ratio}</yellow> <white>WLR:</white> <green>${calculations.wlr.value.toLocaleString()}</green>`, 198, 235, true);
            wrapper.drawText(`<white>Wins at</white> <yellow>${calculations.wlr.ratio}</yellow> <white>WLR:</white> <green>${(stats.wins_bedwars + (calculations.wlr.value as number)).toLocaleString()}</green>`, 198, 260, true);
        }

        // BBLR
        if (calculations.bblr.value === true) {
            let text = `<yellow>${ratio}</yellow> <white>BBLR is</white> <green>already achieved!</green>`;
            wrapper.font(`${wrapper.calculateSize(stripColor(text), 292)}px Minecraft`);
            wrapper.drawText(text, 198, 315, true);
            wrapper.font("20px Minecraft");
        } else {
            wrapper.drawText(`<white>Beds to</white> <yellow>${calculations.bblr.ratio}</yellow> <white>BBLR:</white> <green>${calculations.bblr.value.toLocaleString()}</green>`, 198, 310, true);
            wrapper.drawText(`<white>Beds at</white> <yellow>${calculations.bblr.ratio}</yellow> <white>BBLR:</white> <green>${(stats.beds_broken_bedwars + (calculations.bblr.value as number)).toLocaleString()}</green>`, 198, 335, true);
        }

        if (error instanceof FeedbackMessage) {
            return interactions.followUp(config.appId, interaction.token, {
                embeds: error.embeds.map(embed => embed.toJSON()),
                content: error.content,
                files: error.files
            });
        }

        wrapper.font("20px Minecraft");
        wrapper.roundedRect(10, 360, 480, 30, COLORS.WHITE, 0.2);
        await TITLES.Footer(ctx, 10, 400 - 32, 480);

        return await interactions.followUp(config.appId, interaction.token, {
            files: [{
                name: "ratios.png",
                data: await ctx.canvas.toBuffer("png")
            }]
        });
    }
}

const checkRatio = (givenRatio: number, pos: number, neg: number): { ratio: number, value: number | boolean } => {
    if (givenRatio === -1) {
        givenRatio = Math.ceil(pos / neg);
    }

    if (givenRatio < (pos / neg)) {
        return { ratio: pos / neg, value: true };
    } else {
        return { ratio: givenRatio, value: Math.ceil((neg * givenRatio) - pos) };
    }
}

export default command;