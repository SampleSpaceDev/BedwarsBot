import { Command } from "./types/base";
import { SlashCommandBuilder } from "@discordjs/builders";
import { interactions } from "../index";
import { defaultCanvas } from "../assets";
import { CanvasWrapper } from "../util/canvas";
import { COLORS, FESTIVALS, TITLES } from "../assets/constants";
import * as config from "../config.json";
import { stripColor } from "../util";
import { polsu } from "../services";
import { BedwarsMap, Rotation } from "../services/types/polsu";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("rotation")
        .setDescription("View the current Bedwars rotation")
        .toJSON(),
    execute: async (interaction) => {
        await interactions.defer(interaction.id, interaction.token);

        const ctx = await defaultCanvas("Bedwars");
        const wrapper = new CanvasWrapper(ctx);

        await TITLES.Rotation(ctx);

        const rotation = await polsu.getRotation() as Rotation;

        const pools = [
            ["<yellow>8s</yellow> <aqua>Fast</aqua>", rotation.eight_fast],
            ["<yellow>8s</yellow> <dark_aqua>Slow</dark_aqua>", rotation.eight_slow],
            ["<green>4s</green> <aqua>Fast</aqua>", rotation.four_fast],
            ["<green>4s</green> <dark_aqua>Slow</dark_aqua>", rotation.four_slow]
        ];

        wrapper.font("16px Minecraft");

        const y = 70;
        const height = 10 + (20 * pools.map(value => value[1])
            .reduce((maxLength, currentArray) => Math.max(maxLength, currentArray.length), 0));

        for (let i = 0; i < 4; i++) {
            const pool = pools[i] as [string, BedwarsMap[]];
            const poolWidth = wrapper.measure(stripColor(pool[0]));
            await wrapper.drawText(pool[0], 10 + (i * 122.5) + (112.5 / 2) - (poolWidth / 2), y, true);

            let x = 10 + (i * 122.5);
            await wrapper.roundedRect(x, y + 10, 112.5, height, COLORS.WHITE, 0.2);

            wrapper.font("15px Minecraft");

            let tempY = y + 30;
            const maps = pool[1] as BedwarsMap[];

            for (let map of maps.sort((a, b) => a.name.localeCompare(b.name))) {
                const mapWidth = wrapper.measure(map.name);
                const color = FESTIVALS[map.festival] || (map.new ? "aqua" : "white");
                await wrapper.drawText(`<${color}>${map.name}</${color}>`, x + (112.5 / 2) - (mapWidth / 2), tempY, true);
                tempY += 20;
            }

            wrapper.font("16px Minecraft");
        }

        wrapper.roundedRect(10, y + height + 20, (480 / 2) - 5, 450 - (y + height + 20), COLORS.WHITE, 0.2);
        wrapper.font("16px Minecraft");
        await wrapper.drawText(`<white>Dream Modes</white>`, 10 + ((480 / 2 - 5) / 2) - (wrapper.measure("Dream Modes") / 2), y + height + 40, true);
        await wrapper.drawText(`<white>Current:</white> <yellow>${rotation.currentDream}</yellow>`, 20, y + height + 60, true);
        await wrapper.drawText(`<white>Next:</white> <yellow>${rotation.nextDream}</yellow>`, 20, y + height + 80, true);

        wrapper.roundedRect(255, y + height + 20, (480 / 2) - 5, 450 - (y + height + 20), COLORS.WHITE, 0.2);
        wrapper.font("16px Minecraft");
        await wrapper.drawText(`<white>Rotating Items</white>`, 255 + ((480 / 2 - 5) / 2) - (wrapper.measure("Rotating Items") / 2), y + height + 40, true);
        await wrapper.drawText(`<white>Item 1:</white> <green>${rotation.items.item1}</green>`, 265, y + height + 60, true);
        await wrapper.drawText(`<white>Item 2:</white> <green>${rotation.items.item2}</green>`, 265, y + height + 80, true);

        wrapper.font("20px Minecraft");
        wrapper.roundedRect(10, 460, 480, 30, COLORS.WHITE, 0.2);
        await TITLES.Footer(ctx, 10, 500 - 32, 480);

        return interactions.followUp(config.appId, interaction.token, {
            files: [{
                name: "stats.png",
                data: await ctx.canvas.toBuffer("png")
            }]
        });
    }
}

export default command;