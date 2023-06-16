import {COLORS} from "../assets/constants";

const symbols = Object.freeze({
    FIRST: "✫",
    SECOND: "✪",
    THIRD: "⚝",
    FOURTH: "✥"
});

const prestigeColours = [
    { name: "Stone", color: COLORS.GRAY, symbol: symbols.FIRST },
    { name: "Iron", color: COLORS.WHITE, symbol: symbols.FIRST },
    { name: "Gold", color: COLORS.GOLD, symbol: symbols.FIRST },
    { name: "Diamond", color: COLORS.AQUA, symbol: symbols.FIRST },
    { name: "Emerald", color: COLORS.DARK_GREEN, symbol: symbols.FIRST },
    { name: "Sapphire", color: COLORS.DARK_AQUA, symbol: symbols.FIRST },
    { name: "Ruby", color: COLORS.DARK_RED, symbol: symbols.FIRST },
    { name: "Crystal", color: COLORS.LIGHT_PURPLE, symbol: symbols.FIRST },
    { name: "Opal", color: COLORS.BLUE, symbol: symbols.FIRST },
    { name: "Amethyst", color: COLORS.DARK_PURPLE, symbol: symbols.FIRST },
    { name: "Rainbow", color: [COLORS.RED, COLORS.GOLD, COLORS.YELLOW, COLORS.GREEN, COLORS.AQUA, COLORS.LIGHT_PURPLE, COLORS.DARK_PURPLE], symbol: symbols.FIRST },

    { name: "Iron Prime", color: [COLORS.GRAY, COLORS.WHITE, COLORS.WHITE, COLORS.WHITE, COLORS.WHITE, COLORS.GRAY, COLORS.GRAY], symbol: symbols.SECOND },
    { name: "Gold Prime", color: [COLORS.GRAY, COLORS.YELLOW, COLORS.YELLOW, COLORS.YELLOW, COLORS.YELLOW, COLORS.GOLD, COLORS.GRAY], symbol: symbols.SECOND },
    { name: "Diamond Prime", color: [COLORS.GRAY, COLORS.AQUA, COLORS.AQUA, COLORS.AQUA, COLORS.AQUA, COLORS.DARK_AQUA, COLORS.GRAY], symbol: symbols.SECOND },
    { name: "Emerald Prime", color: [COLORS.GRAY, COLORS.GREEN, COLORS.GREEN, COLORS.GREEN, COLORS.GREEN, COLORS.DARK_GREEN, COLORS.GRAY], symbol: symbols.SECOND },
    { name: "Sapphire Prime", color: [COLORS.GRAY, COLORS.DARK_AQUA, COLORS.DARK_AQUA, COLORS.DARK_AQUA, COLORS.DARK_AQUA, COLORS.BLUE, COLORS.GRAY], symbol: symbols.SECOND },
    { name: "Ruby Prime", color: [COLORS.GRAY, COLORS.RED, COLORS.RED, COLORS.RED, COLORS.RED, COLORS.DARK_RED, COLORS.GRAY], symbol: symbols.SECOND },
    { name: "Crystal Prime", color: [COLORS.GRAY, COLORS.LIGHT_PURPLE, COLORS.LIGHT_PURPLE, COLORS.LIGHT_PURPLE, COLORS.LIGHT_PURPLE, COLORS.DARK_PURPLE, COLORS.GRAY], symbol: symbols.SECOND },
    { name: "Opal Prime", color: [COLORS.GRAY, COLORS.BLUE, COLORS.BLUE, COLORS.BLUE, COLORS.BLUE, COLORS.DARK_BLUE, COLORS.GRAY], symbol: symbols.SECOND },
    { name: "Amethyst Prime", color: [COLORS.GRAY, COLORS.DARK_PURPLE, COLORS.DARK_PURPLE, COLORS.DARK_PURPLE, COLORS.DARK_PURPLE, COLORS.DARK_GRAY, COLORS.GRAY], symbol: symbols.SECOND },

    { name: "Mirror", color: [COLORS.DARK_GRAY, COLORS.GRAY, COLORS.WHITE, COLORS.WHITE, COLORS.GRAY, COLORS.GRAY, COLORS.DARK_GRAY], symbol: symbols.THIRD },
    { name: "Light", color: [COLORS.WHITE, COLORS.WHITE, COLORS.YELLOW, COLORS.YELLOW, COLORS.GOLD, COLORS.GOLD, COLORS.GOLD], symbol: symbols.THIRD },
    { name: "Dawn", color: [COLORS.GOLD, COLORS.GOLD, COLORS.WHITE, COLORS.WHITE, COLORS.AQUA, COLORS.DARK_AQUA, COLORS.DARK_AQUA], symbol: symbols.THIRD },
    { name: "Dusk", color: [COLORS.DARK_PURPLE, COLORS.DARK_PURPLE, COLORS.LIGHT_PURPLE, COLORS.LIGHT_PURPLE, COLORS.GOLD, COLORS.YELLOW, COLORS.YELLOW], symbol: symbols.THIRD },
    { name: "Air", color: [COLORS.AQUA, COLORS.AQUA, COLORS.WHITE, COLORS.WHITE, COLORS.GRAY, COLORS.GRAY, COLORS.DARK_GRAY], symbol: symbols.THIRD },
    { name: "Wind", color: [COLORS.WHITE, COLORS.WHITE, COLORS.GREEN, COLORS.GREEN, COLORS.DARK_GREEN, COLORS.DARK_GREEN, COLORS.DARK_GREEN], symbol: symbols.THIRD },
    { name: "Nebula", color: [COLORS.DARK_RED, COLORS.DARK_RED, COLORS.RED, COLORS.RED, COLORS.LIGHT_PURPLE, COLORS.LIGHT_PURPLE, COLORS.DARK_PURPLE], symbol: symbols.THIRD },
    { name: "Thunder", color: [COLORS.YELLOW, COLORS.YELLOW, COLORS.WHITE, COLORS.WHITE, COLORS.DARK_GRAY, COLORS.DARK_GRAY, COLORS.DARK_GRAY], symbol: symbols.THIRD },
    { name: "Earth", color: [COLORS.GREEN, COLORS.GREEN, COLORS.DARK_GREEN, COLORS.DARK_GREEN, COLORS.GOLD, COLORS.GOLD, COLORS.YELLOW], symbol: symbols.THIRD },
    { name: "Water", color: [COLORS.AQUA, COLORS.AQUA, COLORS.DARK_AQUA, COLORS.DARK_AQUA, COLORS.BLUE, COLORS.BLUE, COLORS.DARK_BLUE], symbol: symbols.THIRD },
    { name: "Fire", color: [COLORS.YELLOW, COLORS.YELLOW, COLORS.GOLD, COLORS.GOLD, COLORS.RED, COLORS.RED, COLORS.DARK_RED], symbol: symbols.THIRD },

    { name: "3100", color: [COLORS.DARK_BLUE, COLORS.DARK_BLUE, COLORS.DARK_AQUA, COLORS.DARK_AQUA, COLORS.GOLD, COLORS.GOLD, COLORS.YELLOW], symbol: symbols.FOURTH },
    { name: "3200", color: [COLORS.RED, COLORS.DARK_RED, COLORS.GRAY, COLORS.GRAY, COLORS.DARK_RED, COLORS.RED, COLORS.RED], symbol: symbols.FOURTH },
    { name: "3300", color: [COLORS.BLUE, COLORS.BLUE, COLORS.BLUE, COLORS.LIGHT_PURPLE, COLORS.RED, COLORS.RED, COLORS.DARK_RED], symbol: symbols.FOURTH },
    { name: "3400", color: [COLORS.DARK_GREEN, COLORS.GREEN, COLORS.LIGHT_PURPLE, COLORS.LIGHT_PURPLE, COLORS.DARK_PURPLE, COLORS.DARK_PURPLE, COLORS.DARK_GREEN], symbol: symbols.FOURTH },
    { name: "3500", color: [COLORS.RED, COLORS.RED, COLORS.DARK_RED, COLORS.DARK_RED, COLORS.DARK_GREEN, COLORS.GREEN, COLORS.GREEN], symbol: symbols.FOURTH },
    { name: "3600", color: [COLORS.GREEN, COLORS.GREEN, COLORS.GREEN, COLORS.AQUA, COLORS.BLUE, COLORS.BLUE, COLORS.DARK_BLUE], symbol: symbols.FOURTH },
    { name: "3700", color: [COLORS.DARK_RED, COLORS.DARK_RED, COLORS.RED, COLORS.RED, COLORS.AQUA, COLORS.DARK_AQUA, COLORS.DARK_AQUA], symbol: symbols.FOURTH },
    { name: "3800", color: [COLORS.DARK_BLUE, COLORS.DARK_BLUE, COLORS.BLUE, COLORS.DARK_PURPLE, COLORS.DARK_PURPLE, COLORS.LIGHT_PURPLE, COLORS.DARK_BLUE], symbol: symbols.FOURTH },
    { name: "3900", color: [COLORS.RED, COLORS.RED, COLORS.GREEN, COLORS.GREEN, COLORS.DARK_GREEN, COLORS.BLUE, COLORS.BLUE], symbol: symbols.FOURTH },
    { name: "4000", color: [COLORS.DARK_PURPLE, COLORS.DARK_PURPLE, COLORS.RED, COLORS.RED, COLORS.GOLD, COLORS.GOLD, COLORS.YELLOW], symbol: symbols.FOURTH },

    { name: "4100", color: [COLORS.YELLOW, COLORS.YELLOW, COLORS.GOLD, COLORS.RED, COLORS.LIGHT_PURPLE, COLORS.LIGHT_PURPLE, COLORS.DARK_PURPLE], symbol: symbols.FOURTH },
    { name: "4200", color: [COLORS.DARK_BLUE, COLORS.BLUE, COLORS.DARK_AQUA, COLORS.AQUA, COLORS.WHITE, COLORS.GRAY, COLORS.GRAY], symbol: symbols.FOURTH },
    { name: "4300", color: [COLORS.BLACK, COLORS.DARK_PURPLE, COLORS.DARK_GRAY, COLORS.DARK_GRAY, COLORS.DARK_PURPLE, COLORS.DARK_PURPLE, COLORS.BLACK], symbol: symbols.FOURTH },
    { name: "4400", color: [COLORS.DARK_GREEN, COLORS.DARK_GREEN, COLORS.GREEN, COLORS.YELLOW, COLORS.GOLD, COLORS.DARK_PURPLE, COLORS.LIGHT_PURPLE], symbol: symbols.FOURTH },
    { name: "4500", color: [COLORS.WHITE, COLORS.WHITE, COLORS.AQUA, COLORS.AQUA, COLORS.DARK_AQUA, COLORS.DARK_AQUA, COLORS.DARK_AQUA], symbol: symbols.FOURTH },
    { name: "4600", color: [COLORS.DARK_AQUA, COLORS.AQUA, COLORS.YELLOW, COLORS.YELLOW, COLORS.GOLD, COLORS.LIGHT_PURPLE, COLORS.DARK_PURPLE], symbol: symbols.FOURTH },
    { name: "4700", color: [COLORS.WHITE, COLORS.DARK_RED, COLORS.RED, COLORS.RED, COLORS.BLUE, COLORS.DARK_BLUE, COLORS.BLUE], symbol: symbols.FOURTH },
    { name: "4800", color: [COLORS.DARK_PURPLE, COLORS.DARK_PURPLE, COLORS.RED, COLORS.GOLD, COLORS.YELLOW, COLORS.AQUA, COLORS.DARK_AQUA], symbol: symbols.FOURTH },
    { name: "4900", color: [COLORS.DARK_GREEN, COLORS.GREEN, COLORS.WHITE, COLORS.WHITE, COLORS.GREEN, COLORS.GREEN, COLORS.DARK_GREEN], symbol: symbols.FOURTH },
    { name: "5000", color: [COLORS.DARK_RED, COLORS.DARK_RED, COLORS.DARK_PURPLE, COLORS.BLUE, COLORS.BLUE, COLORS.DARK_BLUE, COLORS.BLACK], symbol: symbols.FOURTH },
];

export function getPrestige(level: number) {
    const prestige = prestigeColours[Math.min(Math.floor(level / 100), prestigeColours.length - 1)];

    const formatted = `[${level}${prestige.symbol}]`;
    let result = '';

    if (Array.isArray(prestige.color)) {
        let chars = formatted.split("");

        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const color = prestige.color[i];

            result += `<${color}>${char}</${color}>`
        }
    } else {
        result += `<${prestige.color}>${formatted}</${prestige.color}>`
    }

    return result;
}

export function getLevelProgress(xp: number) : string {
    const EASY_XP = [500, 1000, 2000, 3500];
    const NORMAL_XP = 5000;

    let remainingXP = xp;
    let lvl = 0;
    let deltaXP = EASY_XP[0];
    while (remainingXP > 0) {
        deltaXP = NORMAL_XP;
        if (lvl % 100 < 4) {
            deltaXP = EASY_XP[lvl % 100];
        }
        remainingXP -= deltaXP;
        lvl++;
    }

    const repeats = Math.floor((1 + remainingXP / deltaXP) * 10);
    return `<dark_gray>[</dark_gray><aqua>${"■".repeat(repeats)}</aqua><gray>${"■".repeat(10 - repeats)}</gray><dark_gray>]</dark_gray>`;
}

export function getPrestigeProgress(level: number, xp: number) {
    return `<white>Progress to</white> ${getPrestige(Math.ceil(level / 100) * 100)}<gray>:</gray> <green>${((xp % 487000) / 487000 * 100).toFixed(1)}</green><gray>%</gray>`;
}