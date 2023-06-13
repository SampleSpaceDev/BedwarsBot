"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const command = {
    data: new builders_1.SlashCommandBuilder()
        .setName("test")
        .setDescription("Test command")
        .addStringOption(option => option
        .setName("player")
        .setDescription("The username or UUID of a player.")
        .setAutocomplete(true)
        .setRequired(true))
        .toJSON(),
    execute: async (interaction) => {
        console.log(interaction);
    }
};
exports.default = command;
