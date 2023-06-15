import {
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
} from "@discordjs/builders";
import { InteractionAttachment } from "./types/interaction.content";
import {IMessage, Message} from "./base";

interface ErrorMessageOptions {
    color?: number;
    buttons?: ButtonBuilder[];
    thumbnail?: InteractionAttachment;
    image?: InteractionAttachment;
}

export class ErrorMessage extends Message {
    public constructor(
        title: string,
        description: string,
        options?: ErrorMessageOptions
    );
    public constructor(
        title: string,
        description?: string,
        {
            image,
            thumbnail,
            buttons = [],
            color = 0xcd1820,
        }: ErrorMessageOptions = {}
    ) {
        const embed = new EmbedBuilder().setColor(color);

        if (description) {
            embed.setTitle(title).setDescription(description);
        } else {
            embed
                .setTitle(title)
                .setDescription(description);
        }

        const data: IMessage = { embeds: [embed] };

        if (buttons.length > 0) data.components = [new ActionRowBuilder().setComponents(buttons)];

        if (image) {
            data.files = [image];
            embed.setImage(`attachment://${data.files[0].name}`);
        } else if (thumbnail) {
            data.files = [thumbnail];
            embed.setThumbnail(`attachment://${data.files[0].name}`);
        }

        super(data);
    }
}