import {REST} from "@discordjs/rest";
import {WebSocketManager} from "@discordjs/ws";
import {
    ActivityType,
    APIChatInputApplicationCommandInteraction,
    Client,
    GatewayDispatchEvents,
    GatewayIntentBits,
    InteractionsAPI,
    InteractionType,
    PresenceUpdateStatus,
    WebhooksAPI
} from "@discordjs/core";

import logger from "./util/logging";
import {commands, registerCommands} from "./util/slashCommands";
import * as config from "./config.json";
import {registerFonts} from "./assets";
import fs from "fs";
import axios from "axios";
import {FeedbackMessage} from "./messages/error";

const rest = new REST({ version: '10' }).setToken(config.token);

const gateway = new WebSocketManager({
    token: config.token,
    intents: GatewayIntentBits.Guilds | GatewayIntentBits.MessageContent,
    rest,
    shardCount: 1
});

const client = new Client({ rest, gateway });

export const webhooks: WebhooksAPI = new WebhooksAPI(rest);
export const interactions: InteractionsAPI = new InteractionsAPI(rest, webhooks);

const packageJson = fs.readFileSync('package.json', 'utf8');
export const properties = JSON.parse(packageJson);

client.once(GatewayDispatchEvents.Ready, async () => {
    logger.info("[CLIENT] Client online.");

    const shards = await gateway.getShardIds();
    for (let shard of shards) {
        await client.updatePresence(shard, {
            status: PresenceUpdateStatus.Online,
            activities: [
                {
                    name: `Mango v${properties.version}`,
                    type: ActivityType.Watching
                }
            ],
            afk: false,
            since: Date.now()
        }).catch((error) => {
            logger.error(error);
        });
    }

    const commit = extractCommitInfo();
    if (commit) {
        await axios.post(config.statusWebhook, {
            content: null,
            embeds: [
                {
                    "title": `✅ Mango v${properties.version} is now online.`,
                    "color": 4156010,
                    "fields": [
                        {
                            "name": "Version",
                            "value": `[\`${commit.shortHash}\`](https://github.com/SampleSpaceDev/Mango/commit/${commit.hash}) - \`${commit.message}\``,
                            "inline": true
                        }
                    ]
                }
            ]
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

        try {
            await interactions.reply(interaction.id, interaction.token, {
                embeds: FeedbackMessage.error(`\`\`\`ansi\n${error.message}\n\`\`\``).embeds.map((embed) => embed.toJSON()),
                flags: 64
            });
        } catch (err) {
            try {
                await interactions.followUp(config.appId, interaction.token, {
                    embeds: FeedbackMessage.error(`\`\`\`ansi\n${error.message}\n\`\`\``).embeds.map((embed) => embed.toJSON()),
                    flags: 64
                });
            } catch (e) {
                logger.error(`Failed to respond to interaction ${interaction.id}.`);
            }
        }
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
    let response = await fetch(config.heartbeatUrl);
    if (response.status !== 200) {
        logger.error("[MONITOR] Failed to send heartbeat.");
    }
}

gateway.connect().then(async () => {
    logger.info("[CLIENT] Gateway connected.");

    await sendHeartbeat();
    setInterval(sendHeartbeat, 1000 * 60);
});