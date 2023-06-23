import { Command } from "./types/base";
import { SlashCommandBuilder } from "@discordjs/builders";
import { polsu } from "../services";
import { FeedbackMessage } from "../messages/error";
import { interactions } from "../index";
import * as config from "../config.json";
import { PermissionFlagsBits } from "discord-api-types/v8";

const command: Command = {
    isDev: true,
    data: new SlashCommandBuilder()
        .setName("dev")
        .setDescription("Developer commands")
        .addSubcommand((subcommand) => subcommand
            .setName("status")
            .setDescription("Get Bedwars status")
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .toJSON(),
    execute: async (interaction) => {
        await interactions.defer(interaction.id, interaction.token);

        const options = interaction.data.options as [{ type: number, options: [], name: string, value?: string }];
        const subcommand = options.find((option) => option.type === 1);

        switch (subcommand.name) {
            case "status":
                await Subcommands.status(interaction);
                return;
            default:
                const error = FeedbackMessage.error("Invalid subcommand");
                return interactions.followUp(config.appId, interaction.token, {
                    embeds: error.embeds.map((embed) => embed.toJSON())
                });
        }
    }
}

class Subcommands {
    public static status = async (interaction) => {
        const status = await polsu.getStatus();

        if (!status) {
            const error = FeedbackMessage.error("Failed to get status");
            return interactions.followUp(config.appId, interaction.token, {
                embeds: error.embeds.map((embed) => embed.toJSON())
            });
        }
        await polsu.getRotation();

        const embed = FeedbackMessage.success(`Rotation at <t:${status.rotation.lastRotation}:D> logged.`);

        return interactions.followUp(config.appId, interaction.token, {
            embeds: embed.embeds.map((embed) => embed.toJSON())
        });
    }
}

export default command;