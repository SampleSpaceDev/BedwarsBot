import fs from 'fs';
import path from 'path';
import logger from './logging'
import { ApplicationCommandsAPI } from '@discordjs/core';
import * as config from '../config.json';
import { Command } from "../commands/types/base";

export const commands = new Map<String, Command>();

export async function registerCommands(api: ApplicationCommandsAPI): Promise<void> {
    // Grab all the command files from the commands directory
    const commandsPath = path.resolve("commands");
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);

        await import(filePath).then(async module => {
            const command = module.default.default;
            if (!command) return;

            if ('data' in command && 'execute' in command) {

                if ('isDev' in command && command.isDev) {
                    const devCommand = await api.createGuildCommand(config.appId, config.guildId, command.data);
                    logger.info(`[COMMAND] Dev command "${command.data.name}" was registered.`);
                    commands.set(devCommand.id, command);
                    return;
                }

                const registeredCommand = await api.createGlobalCommand(config.appId, command.data);
                commands.set(registeredCommand.id, command);

                logger.info(`[COMMAND] Command "${command.data.name}" was registered.`);
            } else {
                logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        });
    }
}


