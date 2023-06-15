import { APIAllowedMentions, APIAttachment } from "discord-api-types/v10";
import { ActionRowBuilder, EmbedBuilder } from "@discordjs/builders";
import { InteractionAttachment, InteractionContent } from "./types/interaction.content";
import type { RemoveMethods } from "../util";

export type IMessage = RemoveMethods<Message>;

export class Message {
    public attachments?: APIAttachment[];
    public components?: ActionRowBuilder<any>[];
    public content?: string;
    public embeds?: EmbedBuilder[];
    public ephemeral?: boolean;
    public files?: InteractionAttachment[];
    public mentions?: APIAllowedMentions;
    public tts?: boolean;

    public constructor(data: IMessage) {
        Object.assign(this, data);
    }

    public build(): InteractionContent {
        return {
            attachments: this.attachments,
            components: this.components.map((component) => component.toJSON()),
            content: this.content,
            embeds: this.embeds.map((embed) => embed.toJSON()),
            ephemeral: this.ephemeral,
            files: this.files,
            mentions: this.mentions,
            tts: this.tts,
        };
    }

    public toAPI() {
        const data = this.build();

        const res = {
            content: data.content,
            tts: data.tts,
            flags: data.ephemeral ? 1 << 6 : undefined,
            allowed_mentions: data.mentions,
            embeds: data.embeds,
            attachments: data.attachments,
            components: data.components,
        };

        if (data.files)
            return {
                files: data.files,
                payload_json: res,
            };

        return res;
    }
}