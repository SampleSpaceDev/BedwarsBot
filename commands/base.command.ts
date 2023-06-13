import { APIApplicationCommandInteraction, APIInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord-api-types/v10";

export interface Command {
    data: RESTPostAPIChatInputApplicationCommandsJSONBody;
    execute: (interaction: APIApplicationCommandInteraction) => void;
}