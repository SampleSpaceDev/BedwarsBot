import { Command } from "./types/base";
import { SlashCommandBuilder } from "@discordjs/builders";
import { FeedbackMessage } from "../messages/error";
import * as config from "../config.json";
import { interactions } from "../index";
import { hypixel, mongo } from "../services";
import { Bedwars, Session } from "../services/types";
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
            .setDescription("Starts a new session")
        )
        .addSubcommand(command => command
            .setName("list")
            .setDescription("List your sessions")
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

        const sessionId: Option = subcommand.options.find((option: Option) => option.name === "session");

        switch (subcommand.name) {
            case "start":
                await startSubcommand(interaction);
                return;
            case "list":
                await listSubcommand(interaction);
                return;
            case "view":
                await viewSubcommand(interaction, sessionId.value);
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
                return {
                    name: new Date(session.started * 1000).toLocaleString(),
                    value: session.id
                }
            })
        });
    }
}

async function startSubcommand(interaction) {
    const uuid = await getPlayer(interaction.member.user.id);
    const sessions = await mongo.getCollection<Session>("sessions");

    const player = (await hypixel.getPlayer("uuid", uuid)).player;
    const stats = player.stats.Bedwars as Bedwars;

    const sessionId = randomId();

    await sessions.insertOne({
        id: sessionId,
        started: Math.floor(Date.now() / 1000),
        ownerId: uuid,

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
        content: `Started session \`${sessionId}\``
    });
}

async function listSubcommand(interaction) {
    const sessions = await mongo.getCollection<Session>("sessions");
    const player = await getPlayer(interaction.member.user.id);

    const playerSessions = await sessions.find({
        ownerId: player
    }).toArray();

    return interactions.followUp(config.appId, interaction.token, {
        content: playerSessions.map((session) => `\`${session.id}\``).join(", ")
    });
}

async function viewSubcommand(interaction, id: string) {
    const sessions = await mongo.getCollection<Session>("sessions");
    const session = await sessions.findOne({ id });

    if (!session) {
        const error = FeedbackMessage.error("Session not found");
        return interactions.followUp(config.appId, interaction.token, {
            embeds: error.embeds.map((embed) => embed.toJSON())
        });
    }

    const player = await getPlayer(interaction.member.user.id);

    if (session.ownerId !== player) {
        const error = FeedbackMessage.error("You do not own this session");
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

type Differences = {
    wins: { name: string, value: number },
    losses: { name: string, value: number },
    kills: { name: string, value: number },
    deaths: { name: string, value: number },
    finalKills: { name: string, value: number },
    finalDeaths: { name: string, value: number },
    bedsBroken: { name: string, value: number },
    bedsLost: { name: string, value: number },
    gamesPlayed: { name: string, value: number },
    level: { name: string, value: number },
    coins: { name: string, value: number },
    experience: { name: string, value: number },
}

const calcDifferences = (session: Session, stats: Bedwars, level: number): Differences => {
    return {
        wins:        { name: "Wins", value: stats.wins_bedwars - session.start.bedwars.wins },
        losses:      { name: "Losses", value: stats.losses_bedwars - session.start.bedwars.losses },
        kills:       { name: "Kills", value: stats.kills_bedwars - session.start.bedwars.kills },
        deaths:      { name: "Deaths", value: stats.deaths_bedwars - session.start.bedwars.deaths },
        finalKills:  { name: "Final Kills", value: stats.final_kills_bedwars - session.start.bedwars.finalKills },
        finalDeaths: { name: "Final Deaths", value: stats.final_deaths_bedwars - session.start.bedwars.finalDeaths },
        bedsBroken:  { name: "Beds Broken", value: stats.beds_broken_bedwars - session.start.bedwars.bedsBroken },
        bedsLost:    { name: "Beds Lost", value: stats.beds_lost_bedwars - session.start.bedwars.bedsLost },
        gamesPlayed: { name: "Games Played", value: stats.games_played_bedwars - session.start.bedwars.gamesPlayed },
        level:       { name: "Levels", value: level - session.start.bedwars.level },
        coins:       { name: "Coins", value: stats.coins - session.start.bedwars.coins },
        experience:  { name: "Experience", value: stats.Experience - session.start.bedwars.experience },
    };
}

const calcPerDay = (start: number, differences: Differences): Differences => {
    const daysSinceStart = Math.floor((Date.now() / 1000 - start) / 86400);
    return {
        wins:        { name: "Wins", value: differences.wins.value / daysSinceStart },
        losses:      { name: "Losses", value: differences.losses.value / daysSinceStart },
        kills:       { name: "Kills", value: differences.kills.value / daysSinceStart },
        deaths:      { name: "Deaths", value: differences.deaths.value / daysSinceStart },
        finalKills:  { name: "Final Kills", value: differences.finalKills.value / daysSinceStart },
        finalDeaths: { name: "Final Deaths", value: differences.finalDeaths.value / daysSinceStart },
        bedsBroken:  { name: "Beds Broken", value: differences.bedsBroken.value / daysSinceStart },
        bedsLost:    { name: "Beds Lost", value: differences.bedsLost.value / daysSinceStart },
        gamesPlayed: { name: "Games Played", value: differences.gamesPlayed.value / daysSinceStart },
        level:       { name: "Level", value: differences.level.value / daysSinceStart },
        coins:       { name: "Coins", value: differences.coins.value / daysSinceStart },
        experience:  { name: "Experience", value: differences.experience.value / daysSinceStart },
    };
}

async function buildImage(interaction, session: Session) {
    const player = (await hypixel.getPlayer("uuid", session.ownerId)).player;
    const stats = player.stats.Bedwars as Bedwars;

    const differences = calcDifferences(session, stats, player.achievements.bedwars_level);
    const statsPerDay = calcPerDay(session.started, differences);

    const ctx = await defaultCanvas("Bedwars");
    const wrapper = new CanvasWrapper(ctx);

    await TITLES.Session(ctx, { name: player.displayname, rankColor: hypixel.getRankColor(player) });

    ctx.font = "20px Minecraft, Arial";
    wrapper.roundedRect(10, 60, ctx.canvas.width - 20, 55, COLORS.WHITE, 0.2);

    wrapper.drawText(`<white>Session started:</white> <yellow>${new Date(session.started * 1000).toLocaleString()}</yellow>`, 20, 80, true);
    wrapper.drawText(`<white>Games Played:</white> <green>${f(differences.gamesPlayed.value)}</green>`, 20, 105, true);

    wrapper.roundedRect(10, 125, ctx.canvas.width - 20, 55, COLORS.WHITE, 0.2);
    wrapper.drawText(
        `<white>Levels Gained:</white> <green>${f(player.achievements.bedwars_level - session.start.bedwars.level)}</green> <white>-</white> ${getPrestige(session.start.bedwars.level)} <white>➜</white> ${getPrestige(player.achievements.bedwars_level)}`, 20, 145, true);

    const levelsToPrestige = 100 - player.achievements.bedwars_level % 100;
    wrapper.drawText(`<white>Est.</white> ${getPrestige(player.achievements.bedwars_level + levelsToPrestige)} <white>Date:</white> <yellow>${moment().add(Math.round(levelsToPrestige * statsPerDay.level.value), "days").format("MMM Do YYYY")}</yellow>`, 20, 170, true);

    wrapper.roundedRect(10, 190, ctx.canvas.width - 158 - 50, 105, COLORS.WHITE, 0.2);
    wrapper.roundedRect(10, 305, ctx.canvas.width - 158 - 50, 185, COLORS.WHITE, 0.2);

    [
        `<white>Kills:</white> <green>${f(differences.kills.value)}</green> <white>/</white> <red>${f(differences.deaths.value)}</red> <white>/</white> <gold>${ratio(differences.kills.value, differences.deaths.value)}</gold>`,
        `<white>Finals:</white> <green>${f(differences.finalKills.value)}</green> <white>/</white> <red>${f(differences.finalDeaths.value)}</red> <white>/</white> <gold>${ratio(differences.finalKills.value, differences.finalDeaths.value)}</gold>`,
        `<white>Beds:</white> <green>${f(differences.bedsBroken.value)}</green> <white>/</white> <red>${f(differences.bedsLost.value)}</red> <white>/</white> <gold>${ratio(differences.bedsBroken.value, differences.bedsLost.value)}</gold>`,
        `<white>Wins:</white> <green>${f(differences.wins.value)}</green> <white>/</white> <red>${f(differences.losses.value)}</red> <white>/</white> <gold>${ratio(differences.wins.value, differences.losses.value)}</gold>`,
    ].forEach((stat, i) => wrapper.drawText(stat, 20, 210 + (i * 25), true));

    [
        `<white>Coins:</white> <gold>${f(differences.coins.value)}</gold>`,
        `<white>Experience:</white> <aqua>${f(differences.experience.value)}</aqua>`,
        `<white>Length:</white> <yellow>${formatDate(moment.duration((Date.now() / 1000) - session.started, "seconds"))}</yellow>`,
    ].forEach((stat, i) => wrapper.drawText(stat, 20, 325 + (i * 25), true));

    wrapper.drawText(`<white>Per Day:</white>`, 20, 400, true);
    wrapper.font("16px Minecraft, Arial");
    const perDay = [
        `<white>Kills:</white> <green>${f(Math.floor(statsPerDay.kills.value))}</green> <white>/</white> <red>${f(Math.floor(statsPerDay.deaths.value))}</red>`,
        `<white>Finals:</white> <green>${f(Math.floor(statsPerDay.finalKills.value))}</green> <white>/</white> <red>${f(Math.floor(statsPerDay.finalDeaths.value))}</red>`,
        `<white>Beds:</white> <green>${f(Math.floor(statsPerDay.bedsBroken.value))}</green> <white>/</white> <red>${f(Math.floor(statsPerDay.bedsLost.value))}</red>`,
        `<white>Wins:</white> <green>${f(Math.floor(statsPerDay.wins.value))}</green> <white>/</white> <red>${f(Math.floor(statsPerDay.losses.value))}</red>`,
        `<white>Coins:</white> <gold>${f(Math.floor(statsPerDay.coins.value))}</gold>`,
        `<white>XP:</white> <aqua>${f(Math.floor(statsPerDay.experience.value))}</aqua>`,
        `<white>Levels:</white> <dark_aqua>${statsPerDay.level.value.toFixed(2)}</dark_aqua>`,
        `<white>FKDR:</white> <gold>${ratio(statsPerDay.finalKills.value, statsPerDay.finalDeaths.value)}</gold>`
    ];

    // Split perDay into arrays of size 4
    const split = Array.from({ length: Math.ceil(perDay.length / 4) }, (_, index) =>
        perDay.slice(index * 4, index * 4 + 4)
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

export default command;
