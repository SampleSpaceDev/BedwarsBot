import { mongo } from "../services";
import { LinkedPlayer } from "../services/types";
import { Duration } from "moment";

export const ratio = (a: number, b: number): string => (a === 0 && b === 0 ? "∞" : (a / Math.max(1, b)).toFixed(2));

export const stripColor = (string: string) => string.replace(/<\/?[^>]+(>|$)|<#[^>]+(>|$)/g, "");

export async function getPlayer(discordId: string): Promise<string> {
    const players = await mongo.getCollection<LinkedPlayer>("players");
    const found = await players.find({
        id: discordId
    }).toArray();

    return found[0].uuid || undefined;
}

export const randomId = () => Math.random().toString(16).substring(2, 9);

export const formatDate = (duration: Duration) => {
    const units = ['y', 'mo', 'w', 'd', 'h', 'm'];
    const values = [duration.years(), duration.months(), duration.weeks(), duration.days(), duration.hours(), duration.minutes()];

    return units.reduce((result, unit, index) => {
        if (values[index] > 1) {
            result += `${values[index]}${unit} `;
        }
        return result;
    }, '').trim();
}

export const f = (number: number) => Math.round(number).toLocaleString();