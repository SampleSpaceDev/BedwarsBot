import {Command} from "./types/base";
import {SlashCommandBuilder} from "@discordjs/builders";
import {FeedbackMessage} from "../messages/error";
import * as config from "../config.json";
import {interactions} from "../index";
import {hypixel, mongo} from "../services";
import {Bedwars, Session} from "../services/types";
import {getPlayer, randomId} from "../util";
import {
    APIApplicationCommandAutocompleteInteraction,
    APIApplicationCommandInteractionDataStringOption
} from "@discordjs/core";
import { CanvasWrapper } from "../util/canvas";
import { defaultCanvas } from "../assets";
import { COLORS, TITLES } from "../assets/constants";
import { getPrestige } from "../util/prestige";

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

    const image = await buildImage(session);

    await interactions.followUp(config.appId, interaction.token, {
        files: [{
            name: "stats.png",
            data: await image.toBuffer("png")
        }]
    });
}

type Differences = {
    wins: number,
    losses: number,
    kills: number,
    deaths: number,
    finalKills: number,
    finalDeaths: number,
    bedsBroken: number,
    bedsLost: number,
    gamesPlayed: number,
    coins: number
}

const calcDifferences = (session: Session, stats: Bedwars): Differences => {
    return {
        wins: stats.wins_bedwars - session.start.bedwars.wins,
        losses: stats.losses_bedwars - session.start.bedwars.losses,
        kills: stats.kills_bedwars - session.start.bedwars.kills,
        deaths: stats.deaths_bedwars - session.start.bedwars.deaths,
        finalKills: stats.final_kills_bedwars - session.start.bedwars.finalKills,
        finalDeaths: stats.final_deaths_bedwars - session.start.bedwars.finalDeaths,
        bedsBroken: stats.beds_broken_bedwars - session.start.bedwars.bedsBroken,
        bedsLost: stats.beds_lost_bedwars - session.start.bedwars.bedsLost,
        gamesPlayed: stats.games_played_bedwars - session.start.bedwars.gamesPlayed,
        coins: stats.coins - session.start.bedwars.coins,
    };
}

const calcPerDay = (start: number, differences: Differences) => {
    const daysSinceStart = Math.floor((Date.now() / 1000 - start) / 86400);
    return {
        wins: Math.floor(differences.wins / daysSinceStart),
        losses: Math.floor(differences.losses / daysSinceStart),
        kills: Math.floor(differences.kills / daysSinceStart),
        deaths: Math.floor(differences.deaths / daysSinceStart),
        finalKills: Math.floor(differences.finalKills / daysSinceStart),
        finalDeaths: Math.floor(differences.finalDeaths / daysSinceStart),
        bedsBroken: Math.floor(differences.bedsBroken / daysSinceStart),
        bedsLost: Math.floor(differences.bedsLost / daysSinceStart),
        gamesPlayed: Math.floor(differences.gamesPlayed / daysSinceStart),
        coins: Math.floor(differences.coins / daysSinceStart),
    };
}

async function buildImage(session: Session) {
    const player = (await hypixel.getPlayer("uuid", session.ownerId)).player;
    const stats = player.stats.Bedwars as Bedwars;

    const differences = calcDifferences(session, stats);
    const statsPerDay = calcPerDay(session.started, differences);

    const ctx = await defaultCanvas("Bedwars");
    const wrapper = new CanvasWrapper(ctx);

    await TITLES.Session(ctx, { name: player.displayname, rankColor: hypixel.getRankColor(player) });

    ctx.font = "20px Minecraft, Arial";
    wrapper.roundedRect(10, 60, ctx.canvas.width - 20, 55, COLORS.WHITE, 0.2);

    wrapper.drawText(`<white>Session started:</white> <yellow>${new Date(session.started * 1000).toLocaleString()}</yellow>`, 20, 80, true);
    wrapper.drawText(`<white>Games Played:</white> <green>${differences.gamesPlayed.toLocaleString()}</green>`, 20, 105, true);

    wrapper.roundedRect(10, 125, ctx.canvas.width - 20, 30, COLORS.WHITE, 0.2);
    wrapper.drawText(
        `<white>Levels Gained:</white> <green>${(player.achievements.bedwars_level - session.start.bedwars.level).toLocaleString()}</green> <white>-</white> ${getPrestige(session.start.bedwars.level)} <white>➜</white> ${getPrestige(player.achievements.bedwars_level)}`, 20, 145, true);

    wrapper.roundedRect(10, 165, ctx.canvas.width - 20, 110, COLORS.WHITE, 0.2);

    return ctx.canvas;
}

export default command;
