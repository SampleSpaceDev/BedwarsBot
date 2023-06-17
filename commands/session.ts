import { Command } from "./types/base";
import { SlashCommandBuilder } from "@discordjs/builders";
import { FeedbackMessage } from "../messages/error";
import * as config from "../config.json";
import { interactions } from "../index";
import { hypixel, mongo } from "../services";
import { Session, Bedwars } from "../services/types";
import { getPlayer, randomId } from "../util";
import {
    APIApplicationCommandAutocompleteInteraction,
    APIApplicationCommandInteractionDataStringOption
} from "@discordjs/core";

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



    // return interactions.followUp(config.appId, interaction.token, {
    //     embeds: [embed.toJSON()]
    // });
}

export default command;
