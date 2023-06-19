import { Command } from "./types/base";
import { SlashCommandBuilder } from "@discordjs/builders";
import { interactions } from "../index";
import { hypixel, mojang, mongo } from "../services";
import {LinkedPlayer, Player, PlayerResponse} from "../services/types";
import { FeedbackMessage } from "../messages/error";
import * as config from "../config.json";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("link")
        .setDescription("Link your Minecraft account to your Discord account.")
        .addStringOption(option => option
            .setName("player")
            .setDescription("The username or UUID of the player you wish to link to.")
            .setRequired(true)
        )
        .toJSON(),
    execute: async (interaction) => {
        await interactions.defer(interaction.id, interaction.token);
        const user = interaction.member.user;

        const options = interaction.data.options as { value: string }[];
        const tag = options[0].value;

        const profile = (await mojang.getPlayer(tag)).data.player;

        let player: PlayerResponse | FeedbackMessage | Player = (await hypixel.getPlayer("uuid", profile.id));

        if (player instanceof FeedbackMessage) {
            return interactions.followUp(config.appId, interaction.token, {
                embeds: player.embeds.map((embed) => embed.toJSON())
            });
        }
        player = player.player as Player;

        const discord = player.socialMedia?.links?.DISCORD;

        if (!discord) {
            const body = FeedbackMessage.error("This player has not linked their Discord account.");
            return interactions.followUp(config.appId, interaction.token, {
                embeds: body.embeds.map((embed) => embed.toJSON())
            });
        }

        const discordTag = user.discriminator == "0" ? user.username : `${user.username}#${user.discriminator}`;
        if (discordTag != discord) {
            const body = FeedbackMessage.error(`The Discord tag linked to this account is \`${discord}\`, but you are \`${discordTag}\`. Update your Discord tag and try again.`);
            return interactions.followUp(config.appId, interaction.token, {
                embeds: body.embeds.map((embed) => embed.toJSON())
            });
        }

        const collection = await mongo.getCollection<LinkedPlayer>("players");
        await collection.insertOne({
            id: interaction.member.user.id,
            uuid: profile.id
        })

        const success = FeedbackMessage.success(`Your Discord account has been linked to \`${profile.username}\`.`);
        return interactions.followUp(config.appId, interaction.token, {
            embeds: success.embeds.map((embed) => embed.toJSON())
        });
    }
}

export default command;