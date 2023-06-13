import { Command } from "./base.command.js";
import { SlashCommandBuilder } from "@discordjs/builders";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("test")
        .setDescription("Test command")
        .addStringOption(option => option
            .setName("player")
            .setDescription("The username or UUID of a player.")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .toJSON(),
    execute: async (interaction) => {
        console.log(interaction);
    }
}

export default command;