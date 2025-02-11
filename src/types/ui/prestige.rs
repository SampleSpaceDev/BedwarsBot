use std::cmp::min;

pub struct Prestige {
    pub name: &'static str,
    pub color_pattern: &'static str,
    pub symbol: PrestigeSymbol,
}

pub enum PrestigeSymbol {
    First,
    Second,
    Third,
    Fourth,
}

pub const PRESTIGES: [Prestige; 51] = [
    Prestige { name: "Stone", color_pattern: "gray", symbol: PrestigeSymbol::First },
    Prestige { name: "Iron", color_pattern: "white", symbol: PrestigeSymbol::First },
    Prestige { name: "Gold", color_pattern: "gold", symbol: PrestigeSymbol::First },
    Prestige { name: "Diamond", color_pattern: "aqua", symbol: PrestigeSymbol::First },
    Prestige { name: "Emerald", color_pattern: "dark_green", symbol: PrestigeSymbol::First },
    Prestige { name: "Sapphire", color_pattern: "dark_aqua", symbol: PrestigeSymbol::First },
    Prestige { name: "Ruby", color_pattern: "dark_red", symbol: PrestigeSymbol::First },
    Prestige { name: "Crystal", color_pattern: "light_purple", symbol: PrestigeSymbol::First },
    Prestige { name: "Opal", color_pattern: "blue", symbol: PrestigeSymbol::First },
    Prestige { name: "Amethyst", color_pattern: "dark_purple", symbol: PrestigeSymbol::First },
    Prestige { name: "Rainbow", color_pattern: "red|gold|yellow|green|aqua|light_purple|dark_purple", symbol: PrestigeSymbol::First },
    
    Prestige { name: "Iron Prime", color_pattern: "gray|white|white|white|white|gray|gray", symbol: PrestigeSymbol::Second },
    Prestige { name: "Gold Prime", color_pattern: "gray|yellow|yellow|yellow|yellow|gold|gray", symbol: PrestigeSymbol::Second },
    Prestige { name: "Diamond Prime", color_pattern: "gray|aqua|aqua|aqua|aqua|dark_aqua|gray", symbol: PrestigeSymbol::Second },
    Prestige { name: "Emerald Prime", color_pattern: "gray|green|green|green|green|dark_green|gray", symbol: PrestigeSymbol::Second },
    Prestige { name: "Sapphire Prime", color_pattern: "gray|dark_aqua|dark_aqua|dark_aqua|dark_aqua|blue|gray", symbol: PrestigeSymbol::Second },
    Prestige { name: "Ruby Prime", color_pattern: "gray|red|red|red|red|dark_red|gray", symbol: PrestigeSymbol::Second },
    Prestige { name: "Crystal Prime", color_pattern: "gray|light_purple|light_purple|light_purple|light_purple|dark_purple|gray", symbol: PrestigeSymbol::Second },
    Prestige { name: "Opal Prime", color_pattern: "gray|blue|blue|blue|blue|dark_blue|gray", symbol: PrestigeSymbol::Second },
    Prestige { name: "Amethyst Prime", color_pattern: "gray|dark_purple|dark_purple|dark_purple|dark_purple|dark_gray|gray", symbol: PrestigeSymbol::Second },
    Prestige { name: "Mirror", color_pattern: "dark_gray|gray|white|white|gray|gray|dark_gray", symbol: PrestigeSymbol::Second },

    Prestige { name: "Light", color_pattern: "white|white|yellow|yellow|gold|gold|gold", symbol: PrestigeSymbol::Third },
    Prestige { name: "Dawn", color_pattern: "gold|gold|white|white|aqua|dark_aqua|dark_aqua", symbol: PrestigeSymbol::Third },
    Prestige { name: "Dusk", color_pattern: "dark_purple|dark_purple|light_purple|light_purple|gold|yellow|yellow", symbol: PrestigeSymbol::Third },
    Prestige { name: "Air", color_pattern: "aqua|aqua|white|white|gray|gray|dark_gray", symbol: PrestigeSymbol::Third },
    Prestige { name: "Wind", color_pattern: "white|white|green|green|dark_green|dark_green|dark_green", symbol: PrestigeSymbol::Third },
    Prestige { name: "Nebula", color_pattern: "dark_red|dark_red|red|red|light_purple|light_purple|dark_purple", symbol: PrestigeSymbol::Third },
    Prestige { name: "Thunder", color_pattern: "yellow|yellow|white|white|dark_gray|dark_gray|dark_gray", symbol: PrestigeSymbol::Third },
    Prestige { name: "Earth", color_pattern: "green|green|dark_green|dark_green|gold|gold|yellow", symbol: PrestigeSymbol::Third },
    Prestige { name: "Water", color_pattern: "aqua|aqua|dark_aqua|dark_aqua|blue|blue|dark_blue", symbol: PrestigeSymbol::Third },
    Prestige { name: "Fire", color_pattern: "yellow|yellow|gold|gold|red|red|dark_red", symbol: PrestigeSymbol::Third },

    Prestige { name: "Sunrise", color_pattern: "blue|blue|dark_aqua|dark_aqua|gold|gold|yellowred", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Eclipse", color_pattern: "red|dark_red|gray|gray|dark_red|red|red", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Gamma", color_pattern: "blue|blue|blue|light_purple|red|red|dark_red", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Majestic", color_pattern: "dark_green|green|light_purple|light_purple|dark_purple|dark_purple|dark_green", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Andesine", color_pattern: "red|red|dark_red|dark_red|dark_green|green|green", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Marine", color_pattern: "green|green|green|aqua|blue|blue|dark_blue", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Element", color_pattern: "dark_red|dark_red|red|red|aqua|dark_aqua|dark_aqua", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Galaxy", color_pattern: "dark_blue|dark_blue|blue|dark_purple|dark_purple|light_purple|dark_blue", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Atomic", color_pattern: "red|red|green|green|dark_aqua|blue|blue", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Sunset", color_pattern: "dark_purple|dark_purple|red|red|gold|gold|yellow", symbol: PrestigeSymbol::Fourth },
    
    Prestige { name: "Time", color_pattern: "yellow|yellow|gold|red|light_purple|light_purple|dark_purple", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Winter", color_pattern: "dark_blue|blue|dark_aqua|aqua|white|gray|gray", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Obsidian", color_pattern: "black|dark_purple|dark_gray|dark_gray|dark_purple|dark_purple|black", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Spring", color_pattern: "dark_green|dark_green|green|yellow|gold|dark_purple|light_purple", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Ice", color_pattern: "white|white|aqua|aqua|dark_aqua|dark_aqua|dark_aqua", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Summer", color_pattern: "dark_aqua|aqua|yellow|yellow|gold|light_purple|dark_purple", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Spinel", color_pattern: "white|dark_red|red|red|blue|dark_blue|blue", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Autumn", color_pattern: "dark_purple|dark_purple|red|gold|yellow|aqua|dark_aqua", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Mystic", color_pattern: "dark_green|green|white|white|green|green|dark_green", symbol: PrestigeSymbol::Fourth },
    Prestige { name: "Eternal", color_pattern: "dark_red|dark_red|dark_purple|blue|blue|dark_blue|black", symbol: PrestigeSymbol::Fourth },
];

pub fn format_level(level: u32) -> String {
    let prestige = &PRESTIGES[min(((level / 100) as f32).floor() as u32, PRESTIGES.len() as u32 - 1) as usize];
    
    let prestige_symbol = match prestige.symbol {
        PrestigeSymbol::First => "✫",
        PrestigeSymbol::Second => "✪",
        PrestigeSymbol::Third => "⚝",
        PrestigeSymbol::Fourth => "✥",
    };
    
    let formatted = format!("[{level}{prestige_symbol}]");
    let mut result = "".to_string();
    
    let colors: Vec<&str> = prestige.color_pattern.split("|").collect();
    // println!("{:?}", colors);
    
    if colors.len() > 1 {
        let chars: Vec<&str> = formatted.trim().split("").filter(|c| !c.is_empty()).collect();
        // println!("{:?}", chars);

        for i in 0..chars.len() {
            let color = colors[i];

            result.insert_str(result.len(), format!("<{color}>{c}</{color}>", c = chars[i]).as_str());
        }
    } else {
        let color = colors[0];
        result = format!("<{color}>{formatted}</{color}>");
    }
    
    result
}

const EASY_XP: [i32; 4] = [500, 1000, 2000, 3500];

pub fn get_level(experience: u32) -> f32 {
    let mut remaining_xp: f32 = experience as f32;
    let mut level: f32 = 0.0;
    let mut delta_xp: f32 = EASY_XP[0] as f32;

    while remaining_xp > 0.0 {
        delta_xp = 5000.0;
        if (level % 100.0) < 4.0 {
            delta_xp = EASY_XP[(level % 100.0) as usize] as f32;
        }
        remaining_xp = remaining_xp - delta_xp;
        level += 1.0;
    }

    level + (remaining_xp / delta_xp)
}

pub fn get_prestige_progress(experience: u32) -> String {
    let level = get_level(experience);
    let prestige = format_level(((level.floor() / 100.0).ceil() * 100.0) as u32);

    let progress = (((experience as f32) % 487000.0) / 487000.0) * 100.0;

    format!("<white>Progress to</white> {prestige}<gray>: <green>{progress:.1}</green>%</gray>")
}