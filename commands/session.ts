import { Command } from "./types/base";
import { SlashCommandBuilder } from "@discordjs/builders";
import { FeedbackMessage } from "../messages/error";
import * as config from "../config.json";
import { interactions } from "../index";
import { hypixel, mongo } from "../services";
import { Bedwars, BedwarsSession, Player, Session } from "../services/types";
import { f, formatDate, getPlayer, randomId, ratio, stripColor } from "../util";
import {
    APIApplicationCommandAutocompleteInteraction,
    APIApplicationCommandInteractionDataStringOption
} from "@discordjs/core";
import { CanvasWrapper } from "../util/canvas";
import { defaultCanvas } from "../assets";
import { COLORS, TITLES } from "../assets/constants";
import { getPrestige } from "../util/prestige";
import moment from "moment";
import { Canvas } from "skia-canvas";

type Option = APIApplicationCommandInteractionDataStringOption;

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("session")
        .setDescription("View and manage your sessions")
        .addSubcommand(command => command
            .setName("start")
            .setDescription("Starts a new session, optionally with a name")
            .addStringOption(option => option
                .setName("name")
                .setDescription("The name of the session")
            )
        )
        .addSubcommand(command => command
            .setName("rename")
            .setDescription("Rename a session")
            .addStringOption(option => option
                .setName("session")
                .setDescription("The ID of the session you wish to rename")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addStringOption(option => option
                .setName("name")
                .setDescription("The new name of the session")
                .setRequired(true)
            )
        )
        .addSubcommand(command => command
            .setName("delete")
            .setDescription("Delete a session")
            .addStringOption(option => option
                .setName("session")
                .setDescription("The ID of the session you wish to delete")
                .setRequired(true)
                .setAutocomplete(true)
            )
        )
        .addSubcommand(command => command
            .setName("view")
            .setDescription("View a session")
            .addStringOption(option => option
                .setName("session")
                .setDescription("The ID of the session you wish to view")
                .setRequired(true)
                .setAutocomplete(true)
            )
        )
        .toJSON(),
    execute: async (interaction) => {
        await interactions.defer(interaction.id, interaction.token);

        const options = interaction.data.options as [{ type: number, options: [], name: string, value?: string }];
        const subcommand = options.find((option) => option.type === 1);

        const sessionName: Option = subcommand.options.find((option: Option) => option.name === "name");
        const sessionId: Option = subcommand.options.find((option: Option) => option.name === "session");

        switch (subcommand.name) {
            case "start":
                await Subcommands.start(interaction, sessionName?.value || undefined);
                return;
            case "end":
                await Subcommands.end(interaction, sessionId.value);
                return;
            case "rename":
                await Subcommands.rename(interaction, sessionId.value, sessionName.value);
                return;
            case "delete":
                await Subcommands.delete(interaction, sessionId.value);
                return;
            case "view":
                await Subcommands.view(interaction, sessionId.value);
                return;
            default:
                const error = FeedbackMessage.error("Invalid subcommand");
                return interactions.followUp(config.appId, interaction.token, {
                    embeds: error.embeds.map((embed) => embed.toJSON())
                });
        }
    },
    autocomplete: async (interaction: APIApplicationCommandAutocompleteInteraction) => {
        const sessions = await mongo.getCollection<Session>("sessions");
        const player = await getPlayer(interaction.member.user.id);

        const playerSessions = await sessions.find({
            ownerId: player
        }).toArray();

        await interactions.createAutocompleteResponse(interaction.id, interaction.token, {
            choices: playerSessions.map((session) => {
                const date = new Date(session.started * 1000).toLocaleString();
                return {
                    name: session.name !== undefined ? `${session.name} (${date})` : date,
                    value: session.id
                }
            })
        });
    }
}

type Differences = {
    overall: BedwarsSession,
    perDay: {}
}

const getDifferences = (session: Session, stats: Bedwars, level: number): Differences => {
    const daysSinceStart = Math.max(1, Math.floor((Date.now() / 1000 - session.started) / 86400));

    const overall = {
        wins: (session.ended ? session.end.bedwars.wins : stats.wins_bedwars) - session.start.bedwars.wins,
        losses: (session.ended ? session.end.bedwars.losses : stats.losses_bedwars) - session.start.bedwars.losses,
        kills: (session.ended ? session.end.bedwars.kills : stats.kills_bedwars) - session.start.bedwars.kills,
        deaths: (session.ended ? session.end.bedwars.deaths : stats.deaths_bedwars) - session.start.bedwars.deaths,
        finalKills: (session.ended ? session.end.bedwars.finalKills : stats.final_kills_bedwars) - session.start.bedwars.finalKills,
        finalDeaths: (session.ended ? session.end.bedwars.finalDeaths : stats.final_deaths_bedwars) - session.start.bedwars.finalDeaths,
        bedsBroken: (session.ended ? session.end.bedwars.bedsBroken : stats.beds_broken_bedwars) - session.start.bedwars.bedsBroken,
        bedsLost: (session.ended ? session.end.bedwars.bedsLost : stats.beds_lost_bedwars) - session.start.bedwars.bedsLost,
        gamesPlayed: (session.ended ? session.end.bedwars.gamesPlayed : stats.games_played_bedwars) - session.start.bedwars.gamesPlayed,
        level: (session.ended ? session.end.bedwars.level : level) - session.start.bedwars.level,
        coins: (session.ended ? session.end.bedwars.coins : stats.coins) - session.start.bedwars.coins,
        experience: (session.ended ? session.end.bedwars.experience : stats.Experience) - session.start.bedwars.experience,
    }
    
    const perDay: {} = Object.keys(overall).reduce((acc, key) => {
        acc[key] = overall[key] / daysSinceStart;
        return acc;
    }, {});
    
    return { overall, perDay: perDay };
}

async function buildImage(interaction, session: Session) {
    const player = (await hypixel.getPlayer("uuid", session.ownerId)).player as Player;
    const stats = player.stats.Bedwars as Bedwars;

    const differences = getDifferences(session, stats, player.achievements.bedwars_level);
    const perDay = differences.perDay as BedwarsSession;

    const ctx = await defaultCanvas("Bedwars");
    const wrapper = new CanvasWrapper(ctx);

    await TITLES.Session(ctx, { name: player.displayname, rankColor: hypixel.getRankColor(player) });

    ctx.font = "20px Minecraft, Arial";
    wrapper.roundedRect(10, 60, ctx.canvas.width - 20, 55, COLORS.WHITE, 0.2);

    wrapper.drawText(`<white>Session started:</white> <yellow>${new Date(session.started * 1000).toLocaleString()}</yellow>`, 20, 80, true);
    wrapper.drawText(`<white>Games Played:</white> <green>${f(differences.overall.gamesPlayed)}</green>`, 20, 105, true);

    wrapper.roundedRect(10, 125, ctx.canvas.width - 20, 55, COLORS.WHITE, 0.2);
    wrapper.drawText(
        `<white>Levels Gained:</white> <green>${f(player.achievements.bedwars_level - session.start.bedwars.level)}</green> <white>-</white> ${getPrestige(session.start.bedwars.level)} <white>➜</white> ${getPrestige(player.achievements.bedwars_level)}`, 20, 145, true);

    const levelsToPrestige = 100 - player.achievements.bedwars_level % 100;
    wrapper.drawText(`<white>Est.</white> ${getPrestige(player.achievements.bedwars_level + levelsToPrestige)} <white>Date:</white> <yellow>${perDay.level > 0 ? moment().add(Math.round(levelsToPrestige / perDay.level), "days").format("MMM Do YYYY") : "Cannot calculate"}</yellow>`, 20, 170, true);

    wrapper.roundedRect(10, 190, ctx.canvas.width - 158 - 50, 105, COLORS.WHITE, 0.2);
    wrapper.roundedRect(10, 305, ctx.canvas.width - 158 - 50, 185, COLORS.WHITE, 0.2);

    [
        `<white>Kills:</white> <green>${f(differences.overall.kills)}</green> <white>/</white> <red>${f(differences.overall.deaths)}</red> <white>/</white> <gold>${ratio(differences.overall.kills, differences.overall.deaths)}</gold>`,
        `<white>Finals:</white> <green>${f(differences.overall.finalKills)}</green> <white>/</white> <red>${f(differences.overall.finalDeaths)}</red> <white>/</white> <gold>${ratio(differences.overall.finalKills, differences.overall.finalDeaths)}</gold>`,
        `<white>Beds:</white> <green>${f(differences.overall.bedsBroken)}</green> <white>/</white> <red>${f(differences.overall.bedsLost)}</red> <white>/</white> <gold>${ratio(differences.overall.bedsBroken, differences.overall.bedsLost)}</gold>`,
        `<white>Wins:</white> <green>${f(differences.overall.wins)}</green> <white>/</white> <red>${f(differences.overall.losses)}</red> <white>/</white> <gold>${ratio(differences.overall.wins, differences.overall.losses)}</gold>`,
    ].forEach((stat, i) => wrapper.drawText(stat, 20, 210 + (i * 25), true));

    [
        `<white>Coins:</white> <gold>${f(differences.overall.coins)}</gold>`,
        `<white>Experience:</white> <aqua>${f(differences.overall.experience)}</aqua>`,
        `<white>Length:</white> <yellow>${formatDate(moment.duration(((session.ended || Date.now()) / 1000) - session.started, "seconds"))}</yellow>`,
    ].forEach((stat, i) => wrapper.drawText(stat, 20, 325 + (i * 25), true));

    wrapper.drawText(`<white>Per Day:</white>`, 20, 400, true);
    wrapper.font("16px Minecraft, Arial");
    const perDayStats = [
        `<white>Kills:</white> <green>${f(Math.floor(perDay.kills))}</green> <white>/</white> <red>${f(Math.floor(perDay.deaths))}</red>`,
        `<white>Finals:</white> <green>${f(Math.floor(perDay.finalKills))}</green> <white>/</white> <red>${f(Math.floor(perDay.finalDeaths))}</red>`,
        `<white>Beds:</white> <green>${f(Math.floor(perDay.bedsBroken))}</green> <white>/</white> <red>${f(Math.floor(perDay.bedsLost))}</red>`,
        `<white>Wins:</white> <green>${f(Math.floor(perDay.wins))}</green> <white>/</white> <red>${f(Math.floor(perDay.losses))}</red>`,
        `<white>Coins:</white> <gold>${f(Math.floor(perDay.coins))}</gold>`,
        `<white>XP:</white> <aqua>${f(Math.floor(perDay.experience))}</aqua>`,
        `<white>Levels:</white> <dark_aqua>${perDay.level.toFixed(2)}</dark_aqua>`,
        `<white>FKDR:</white> <gold>${ratio(perDay.finalKills, perDay.finalDeaths)}</gold>`
    ];

    // Split perDay into arrays of size 4
    const split = Array.from({ length: Math.ceil(perDayStats.length / 4) }, (_, index) =>
        perDayStats.slice(index * 4, index * 4 + 4)
    );

    let x = 20;
    let y = 420;
    for (let column of split) {
        let index = 0;
        let longest = 0;
        for (let row of column) {
            longest = Math.max(longest, wrapper.measure(stripColor(row)));
            wrapper.drawText(row, x, y + (index * 20), true);
            index++;
        }
        x += longest + 20;
        index = 0;
    }

    wrapper.roundedRect(ctx.canvas.width - 158 - 30, 190, 178, ctx.canvas.height - 190 - 10, COLORS.WHITE, 0.2);
    const skinRender = await wrapper.drawPlayer(player.uuid, ctx.canvas.width - 158 - 20, 200, {
        type: "full",
        yaw: -40
    });

    if (skinRender instanceof FeedbackMessage) {
        return interactions.followUp(config.appId, interaction.token, {
            embeds: skinRender.embeds.map(embed => embed.toJSON()),
            content: skinRender.content,
            files: skinRender.files
        });
    }

    await TITLES.Footer(ctx, ctx.canvas.width - 158 - 20, 190 + skinRender.height + 20, 158);

    return ctx.canvas;
}

class Subcommands {
    public static view = async(interaction, sessionId: string) => {
        const sessions = await mongo.getCollection<Session>("sessions");
        const session = await sessions.findOne({ id: sessionId });

        if (!session) {
            const error = FeedbackMessage.error("Session not found");
            return interactions.followUp(config.appId, interaction.token, {
                embeds: error.embeds.map((embed) => embed.toJSON())
            });
        }

        const image = await buildImage(interaction, session);

        await interactions.followUp(config.appId, interaction.token, {
            files: [{
                name: "stats.png",
                data: await (image as Canvas).toBuffer("png")
            }]
        });
    }
    public static delete = async(interaction, sessionId: string) => {
        const sessions = await mongo.getCollection<Session>("sessions");
        const player = await getPlayer(interaction.member.user.id);

        const result = await sessions.findOneAndDelete({
            id: sessionId,
            ownerId: player
        });

        if (!result.value) {
            return interactions.followUp(config.appId, interaction.token, {
                embeds: FeedbackMessage.error("Session not found").embeds.map((embed) => embed.toJSON())
            });
        }

        return interactions.followUp(config.appId, interaction.token, {
            embeds: FeedbackMessage.success(`Deleted session \`${result.value.name || sessionId}\`.`).embeds.map((embed) => embed.toJSON())
        });
    }
    public static rename = async(interaction, sessionId: string, sessionName: string) => {
        const sessions = await mongo.getCollection<Session>("sessions");
        const player = await getPlayer(interaction.member.user.id);

        const result = await sessions.findOneAndUpdate(
            {
                id: sessionId,
                ownerId: player
            },
            {
                $set: {
                    name: sessionName
                }
            }
        );

        if (!result.value) {
            return interactions.followUp(config.appId, interaction.token, {
                embeds: FeedbackMessage.error("Session not found").embeds.map((embed) => embed.toJSON())
            });
        }

        return interactions.followUp(config.appId, interaction.token, {
            embeds: FeedbackMessage.success(`Renamed session \`${result.value.name || sessionId}\` to \`${sessionName}\`.`).embeds.map((embed) => embed.toJSON())
        });
    }
    public static end = async(interaction, sessionId: string) => {
        const uuid = await getPlayer(interaction.member.user.id);
        const sessions = await mongo.getCollection<Session>("sessions");

        const player = (await hypixel.getPlayer("uuid", uuid)).player as Player;
        const stats = player.stats.Bedwars as Bedwars;

        const result = await sessions.findOneAndUpdate(
            {
                id: sessionId,
                ownerId: uuid,
                isEnded: false
            },
            {
                $set: {
                    isEnded: true,

                    end: {
                        bedwars: {
                            wins: stats.wins_bedwars,
                            losses: stats.losses_bedwars,
                            kills: stats.kills_bedwars,
                            deaths: stats.deaths_bedwars,
                            finalKills: stats.final_kills_bedwars,
                            finalDeaths: stats.final_deaths_bedwars,
                            bedsBroken: stats.beds_broken_bedwars,
                            bedsLost: stats.beds_lost_bedwars,
                            gamesPlayed: stats.games_played_bedwars,
                            level: player.achievements.bedwars_level,
                            coins: stats.coins,
                            experience: stats.Experience
                        }
                    }
                }
            }
        );

        if (!result.value) {
            return interactions.followUp(config.appId, interaction.token, {
                embeds: FeedbackMessage.error("Session not found or already ended").embeds.map((embed) => embed.toJSON())
            });
        }

        return interactions.followUp(config.appId, interaction.token, {
            embeds: FeedbackMessage.success(
                `Session \`${result.value.name || result.value.id}\` ended. You can still view it using </session view:1119607952316301343>. Use </session delete:1119607952316301343> to delete it.`
            ).embeds.map((embed) => embed.toJSON())
        });
    }
    public static start = async(interaction, sessionName?: string) => {
        const uuid = await getPlayer(interaction.member.user.id);

        if (!uuid) {
            return interactions.followUp(config.appId, interaction.token, {
                embeds: FeedbackMessage.error("You need to link your account first. Use </link:1119652679052972152>.").embeds.map((embed) => embed.toJSON())
            });
        }

        const sessions = await mongo.getCollection<Session>("sessions");

        const player = (await hypixel.getPlayer("uuid", uuid)).player as Player;
        const stats = player.stats.Bedwars as Bedwars;

        const sessionId = randomId();

        await sessions.insertOne({
            id: sessionId,
            name: sessionName || undefined,
            ownerId: uuid,
            started: Math.floor(Date.now() / 1000),

            start: {
                bedwars: {
                    wins: stats.wins_bedwars,
                    losses: stats.losses_bedwars,
                    kills: stats.kills_bedwars,
                    deaths: stats.deaths_bedwars,
                    finalKills: stats.final_kills_bedwars,
                    finalDeaths: stats.final_deaths_bedwars,
                    bedsBroken: stats.beds_broken_bedwars,
                    bedsLost: stats.beds_lost_bedwars,
                    gamesPlayed: stats.games_played_bedwars,
                    level: player.achievements.bedwars_level,
                    coins: stats.coins,
                    experience: stats.Experience
                }
            }
        });

        return interactions.followUp(config.appId, interaction.token, {
            embeds: FeedbackMessage.success(`Created session \`${sessionName || sessionId}\`.`).embeds.map((embed) => embed.toJSON())
        });
    }
}

export default command;
