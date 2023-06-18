import { Command } from "./types/base";
import { SlashCommandBuilder } from "@discordjs/builders";
import { interactions } from "../index";
import { mongo } from "../services";
import { LinkedPlayer } from "../services/types";
import { FeedbackMessage } from "../messages/error";
import * as config from "../config.json";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("unlink")
        .setDescription("Unlink your Minecraft account from your Discord account.")
        .toJSON(),
    execute: async (interaction) => {
        await interactions.defer(interaction.id, interaction.token);
        const user = interaction.member.user;

        const collection = await mongo.getCollection<LinkedPlayer>("players");
        const result = await collection.deleteOne({ id: user.id });

        if (result === null || result.deletedCount === 0) {
            const body = FeedbackMessage.error("You have not linked your Discord account to a Minecraft account.");
            return interactions.followUp(config.appId, interaction.token, {
                embeds: body.embeds.map((embed) => embed.toJSON())
            });
        }

        const success = FeedbackMessage.success(`Your Discord account has been unlinked.`);
        return interactions.followUp(config.appId, interaction.token, {
            embeds: success.embeds.map((embed) => embed.toJSON())
        });
    }
}

export default command;