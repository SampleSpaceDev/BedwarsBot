import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import { GatewayDispatchEvents, GatewayIntentBits, InteractionType, MessageFlags, Client, ApplicationCommandsAPI } from "@discordjs/core";

import logger from "./util/logging";
import { getCommands } from "./util/slashCommands";
import * as config from "./config.json";

const rest = new REST({ version: '10' }).setToken(config.token);

const gateway = new WebSocketManager({
    token: config.token,
    intents: GatewayIntentBits.Guilds | GatewayIntentBits.MessageContent,
    rest
});

const client = new Client({ rest, gateway });

const slashCommandApi = new ApplicationCommandsAPI(rest);
slashCommandApi.bulkOverwriteGuildCommands(config.appId, config.guildId, getCommands());

client.once(GatewayDispatchEvents.Ready, () => {
    logger.info("Client online.");
});

client.on(GatewayDispatchEvents.InteractionCreate, async ({ data: interaction, api }) => {
	if (interaction.type !== InteractionType.ApplicationCommand || interaction.data.name !== 'ping') {
		return;
	}

	await api.interactions.reply(interaction.id, interaction.token, { content: 'Pong!', flags: MessageFlags.Ephemeral });
});

gateway.connect();