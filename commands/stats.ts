import { Command } from "./types/base";
import { SlashCommandBuilder } from "@discordjs/builders";
import { mojang, hypixel } from "../services";
import { interactions } from "../index";
import { Bedwars } from "../services/types/bedwars";
import { Canvas } from "skia-canvas";
import { drawShadowedText, randomBackground } from "../assets";
import {COLORS, SHADOWS, TITLES} from "../assets/constants";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Basic Bedwars stats command.")
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

        const player = (await mojang.getPlayer(tag)).data.player;

        const stats = (await hypixel.getStats("uuid", player.id, "Bedwars")) as Bedwars;

        const canvas = new Canvas(500, 500);
        const ctx = canvas.getContext("2d");

        const backgroundImage = await randomBackground("Bedwars");
        ctx.filter = 'blur(10px) brightness(50%)';
        ctx.drawImage(backgroundImage, -500, -400, 1920, 1080);
        ctx.filter = 'blur(0px)';

        TITLES.Bedwars(ctx, { name: player.username, rankColor: COLORS.GOLD });

        ctx.font = "20px Minecraft";
        ctx.fillText(`Games Played: ${stats.games_played_bedwars.toLocaleString()}`, 10, 100);

        await interactions.reply(interaction.id, interaction.token, {
            content: `${player.username} played ${stats.games_played_bedwars.toLocaleString()} games of Bedwars.`,
            files: [{
                name: "stats.png",
                data: await canvas.toBuffer("png")
            }]
        });
    }
}

export default command;