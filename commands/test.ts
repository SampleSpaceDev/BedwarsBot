import { Command } from "./types/base";
import { SlashCommandBuilder } from "@discordjs/builders";
import { mojang } from "../services";
import { interactions } from "../index";

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
        const options = interaction.data.options as { value: string }[];
        const tag = options[0].value;

        const player = await mojang.getPlayer(tag);
        await interactions.reply(interaction.id, interaction.token, {
            content: `\`${player.data.player.username}\` is \`${player.data.player.id}\``
        });
    }
}

export default command;