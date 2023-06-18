import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import {
    GatewayDispatchEvents,
    GatewayIntentBits,
    InteractionType,
    Client,
    InteractionsAPI, WebhooksAPI,
    APIChatInputApplicationCommandInteraction
} from "@discordjs/core";

import logger from "./util/logging";
import { registerCommands, commands } from "./util/slashCommands";
import * as config from "./config.json";
import { registerFonts } from "./assets";
import fs from "fs";
import axios from "axios";

const heartbeatUrl = "https://status.samplespace.dev/api/push/6RqKRC8aZD?status=up&msg=OK&ping=";
const statusWebhook = "https://discord.com/api/webhooks/1055185320108368053/Kp_qWDPE-TcCanYCxdsuKzGozF-F6PNpua7ciyWuamZYIp66Jg-S7dEj8WRtVSZFEJTD";

const rest = new REST({ version: '10' }).setToken(config.token);

const gateway = new WebSocketManager({
    token: config.token,
    intents: GatewayIntentBits.Guilds | GatewayIntentBits.MessageContent,
    rest
});

const client = new Client({ rest, gateway });


export const webhooks: WebhooksAPI = new WebhooksAPI(rest);
export const interactions: InteractionsAPI = new InteractionsAPI(rest, webhooks);

const packageJson = fs.readFileSync('package.json', 'utf8');
export const properties = JSON.parse(packageJson);

client.once(GatewayDispatchEvents.Ready, async () => {
    logger.info("[CLIENT] Client online.");

    const commit = extractCommitInfo();
    if (commit) {
        await axios.post(statusWebhook, {
            content: {
                "content": null,
                "embeds": [
                    {
                        "title": "✅ Mango is now online.",
                        "color": 4156010,
                        "fields": [
                            {
                                "name": "Version",
                                "value": `"[\`${commit.shortHash}\`](https://github.com/SampleSpaceDev/Mango/commit/${commit.hash}) - \`${commit.message}\`"`,
                                "inline": true
                            }
                        ]
                    }
                ],
                "attachments": []
            }
        });
    }

    await registerCommands(client.api.applicationCommands);
    await registerFonts();
});

client.on(GatewayDispatchEvents.InteractionCreate, async ({ data: rawInteraction}) => {
    let interaction = rawInteraction as APIChatInputApplicationCommandInteraction;
    let command = commands.get(interaction.data.id);

    if (!command) {
        return;
    }

    try {
        if (rawInteraction.type === InteractionType.ApplicationCommandAutocomplete) {
            await command.autocomplete(interaction);
        } else if (rawInteraction.type === InteractionType.ApplicationCommand) {
            await command.execute(interaction);
        }
    } catch (error) {
        logger.error(error);
        console.error(error);
    }
});

const extractCommitInfo = () => {
    if (fs.existsSync("./commit.txt") === false) {
        return undefined;
    }

    const fileContent = fs.readFileSync("./commit.txt", 'utf-8');
    const [commitHash, commitMessage] = fileContent.trim().split('\n');
    const shortCommitHash = commitHash.substring(0, 7);

    return {
        hash: commitHash,
        shortHash: shortCommitHash,
        message: commitMessage,
    };
}

const sendHeartbeat = async () => {
    let response = await fetch(heartbeatUrl);
    if (response.status !== 200) {
        logger.error("[MONITOR] Failed to send heartbeat.");
    }
}

gateway.connect().then(async () => {
    logger.info("[CLIENT] Gateway connected.");

    await sendHeartbeat();
    setInterval(sendHeartbeat, 1000 * 60);
});