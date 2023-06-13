import fs from 'fs';
import path from 'path';
import logger from './logging'
import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { log } from 'winston';

interface Command {
    data: {
        toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
    };
    execute: () => void;
}

export function getCommands(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
    const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.resolve("commands");
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        import(filePath)
            .then((commandModule) => {
                const command = commandModule.default.default;
                if (!command) return; 

                if ('data' in command && 'execute' in command) {
                    commands.push(command.data);
                } else {
                    logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
                }

                logger.debug(`${command.data.name} was registered.`);
            })
            .catch((error) => {
                logger.error(`Failed to import command module at ${filePath}:`, error);
            });
    }

    return commands;
}


