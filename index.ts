import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import {
    GatewayDispatchEvents,
    GatewayIntentBits,
    InteractionType,
    Client,
    ApplicationCommandsAPI, InteractionsAPI, WebhooksAPI,
    APIChatInputApplicationCommandInteraction
} from "@discordjs/core";

import logger from "./util/logging";
import { registerCommands, commands } from "./util/slashCommands";
import * as config from "./config.json";
import {registerFonts} from "./assets";

const rest = new REST({ version: '10' }).setToken(config.token);

const gateway = new WebSocketManager({
    token: config.token,
    intents: GatewayIntentBits.Guilds | GatewayIntentBits.MessageContent,
    rest
});

const client = new Client({ rest, gateway });

(async function slashCommands() {
    const slashCommandApi = new ApplicationCommandsAPI(rest);
    await registerCommands(slashCommandApi);
})();

export const webhooks: WebhooksAPI = new WebhooksAPI(rest);
export const interactions: InteractionsAPI = new InteractionsAPI(rest, webhooks);

client.once(GatewayDispatchEvents.Ready, async () => {
    logger.info("Client online.");

    await registerFonts();
});

client.on(GatewayDispatchEvents.InteractionCreate, async ({ data: rawInteraction, api }) => {
	if (rawInteraction.type !== InteractionType.ApplicationCommand) {
		return;
	}

    let interaction = rawInteraction as APIChatInputApplicationCommandInteraction;
    let execute = commands.get(interaction.data.id);
    
    if (!execute) {
        return;
    }

    try {
        await execute(interaction);
    } catch (error) {
        logger.error(error);
    }
});

gateway.connect();