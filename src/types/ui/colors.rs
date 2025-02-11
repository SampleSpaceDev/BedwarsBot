pub mod colors {
    pub const COLORS: [(&str, &str); 16] = [
        ("black", "#000000"),
        ("dark_blue", "#0000AA"),
        ("dark_green", "#00AA00"),
        ("dark_aqua", "#00AAAA"),
        ("dark_red", "#AA0000"),
        ("dark_purple", "#AA00AA"),
        ("gold", "#FFAA00"),
        ("gray", "#AAAAAA"),
        ("dark_gray", "#555555"),
        ("blue", "#5555FF"),
        ("green", "#55FF55"),
        ("aqua", "#55FFFF"),
        ("red", "#FF5555"),
        ("light_purple", "#FF55FF"),
        ("yellow", "#FFFF55"),
        ("white", "#FFFFFF"),
    ];
    
    pub fn get_color(name: &str) -> Option<&'static str> {
        COLORS.iter().find_map(|(k, v)| if *k == name { Some(*v) } else { None })
    }
    
    pub fn exists(hex: &str) -> bool {
        COLORS.iter().any(|(_, v)| *v == hex)
    }
}

pub mod shadows {
    pub const SHADOWS: [(&str, &str); 16] = [
        ("black", "#000000"),
        ("dark_blue", "#00002A"),
        ("dark_green", "#002A00"),
        ("dark_aqua", "#002A2A"),
        ("dark_red", "#2A0000"),
        ("dark_purple", "#2A002A"),
        ("gold", "#2A2A00"),
        ("gray", "#2A2A2A"),
        ("dark_gray", "#151515"),
        ("blue", "#15153F"),
        ("green", "#153F15"),
        ("aqua", "#153F3F"),
        ("red", "#3F1515"),
        ("light_purple", "#3F153F"),
        ("yellow", "#3F3F15"),
        ("white", "#3F3F3F"),
    ];
}

pub mod rank_colors {
    use skia_safe::Color;

    pub const RANK_COLORS: [(&str, Color); 10] = [
        ("ADMIN", Color::from_rgb(255, 85, 85)),
        ("GAME_MASTER", Color::from_rgb(0, 170, 0)),
        ("YOUTUBER", Color::from_rgb(255, 85, 85)),
        ("SUPERSTAR_GOLD", Color::from_rgb(255, 170, 0)),
        ("SUPERSTAR_AQUA", Color::from_rgb(85, 255, 255)),
        ("MVP_PLUS", Color::from_rgb(85, 255, 255)),
        ("MVP", Color::from_rgb(85, 255, 255)),
        ("VIP_PLUS", Color::from_rgb(85, 255, 85)),
        ("VIP", Color::from_rgb(85, 255, 85)),
        ("DEFAULT", Color::from_rgb(170, 170, 170)),
    ];

    pub fn get_rank_color(name: &str) -> Option<Color> {
        RANK_COLORS.iter().find_map(|(k, v)| if *k.to_uppercase() == name.to_uppercase() { Some(*v) } else { None })
    }
}