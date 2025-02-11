use crate::types::cache::ExpiringCache;
use crate::types::error::MinecraftError;
use crate::types::hypixel::stats::HypixelStats;
use reqwest::Client;
use serde::Deserialize;
use std::sync::{Arc, Once};
use std::time::Duration;
use skia_safe::Color;
use tracing::debug;
use tracing::field::debug;
use crate::types::ui::colors::rank_colors::{get_rank_color, RANK_COLORS};
use crate::types::hypixel::achievements::HypixelAchievements;

pub struct HypixelService {
    cache: ExpiringCache<String, HypixelPlayer>,
    api_key: String,
}

impl HypixelService {
    /// Synchronously creates a new HypixelService with a cache that expires after 5 minutes.
    fn new() -> Self {
        Self {
            cache: ExpiringCache::new(Duration::from_secs(300)),
            api_key: dotenv::var("HYPIXEL_API_KEY").expect("HYPIXEL_API_KEY must be set"),
        }
    }

    /// Returns a singleton instance of HypixelService.
    pub fn instance() -> Arc<Self> {
        static mut INSTANCE: Option<Arc<HypixelService>> = None;
        static INIT: Once = Once::new();

        unsafe {
            INIT.call_once(|| {
                INSTANCE = Some(Arc::new(HypixelService::new()));
            });
            INSTANCE.clone().unwrap()
        }
    }

    /// Retrieves the Hypixel player data for a given UUID.
    /// If a cached value exists and is not expired, it returns that.
    /// Otherwise, it fetches fresh data from the Hypixel API.
    pub async fn get_player_data(&self, uuid: &str) -> Result<HypixelPlayer, MinecraftError> {
        // Check cache
        if let Some(player_data) = self.cache.get(&uuid.to_string()).await {
            return Ok(player_data);
        }

        // Fetch from API (dummy implementation)
        let player_data = self.get_hypixel_data_api(uuid).await?;
        self.cache.insert(uuid.to_string(), player_data.clone()).await;

        Ok(player_data)
    }

    pub async fn get_hypixel_data_api(&self, uuid: &str) -> Result<HypixelPlayer, MinecraftError> {
        let url = format!("https://api.hypixel.net/player?uuid={}", uuid);

        let response: HypixelResponse = Client::new()
            .get(&url)
            .header("API-Key", &self.api_key)
            .send()
            .await?
            .json()
            .await?;

        Ok(response.player)
    }
}

// ---------- HypixelResponse Definition ---------- //

#[derive(Clone, Debug, Deserialize)]
pub struct HypixelResponse {
    pub player: HypixelPlayer,
}

#[derive(Clone, Debug, Deserialize, Default)]
pub struct HypixelPlayer {
    pub displayname: String,
    
    pub prefix: Option<String>,
    pub rank: Option<String>,
    #[serde(rename = "packageRank")]
    pub package_rank: Option<String>,
    #[serde(rename = "newPackageRank")]
    pub new_package_rank: Option<String>,
    #[serde(rename = "monthlyPackageRank")]
    pub monthly_package_rank: Option<String>,
    
    #[serde(rename = "rankPlusColor")]
    pub rank_plus_color: Option<String>,
    #[serde(rename = "monthlyRankColor")]
    pub monthly_rank_color: Option<String>,
    
    pub stats: HypixelStats,
    pub achievements: HypixelAchievements,
}

impl HypixelPlayer {
    pub fn calculate_rank(&self) -> String {        
        fn is_valid(rank: &Option<String>) -> bool {
            if let Some(value) = rank {
                value != "NONE" && value != "NORMAL"
            } else {
                false
            }
        }
        
        if let Some(ref prefix) = self.prefix {
            return prefix.clone();
        }
        
        [self.rank.as_ref(), self.monthly_package_rank.as_ref(), self.new_package_rank.as_ref(), self.package_rank.as_ref()]
            .into_iter()
            .flatten()
            .find(|rank| is_valid(&Some(rank.to_string())))
            .cloned()
            .unwrap_or_else(|| "DEFAULT".to_string())
    }
    
    pub fn rank_formatted(&self) -> String {
        let rank = &self.calculate_rank();

        if let Some(ref prefix) = &self.prefix {
            todo!("Implement prefix conversion");
        }

        let rank_color: String = self.monthly_rank_color.clone().or_else(|| { Some("gold".to_string()) }).unwrap();
        let plus_color: String = self.rank_plus_color.clone().or_else(|| { Some("red".to_string()) }).unwrap();
        
        let superstar = format!("<{0}>[MVP<{1}>++</{1}>]", rank_color, plus_color);
        let mvp_plus = format!("<aqua>[MVP<{0}>+</{0}>]", plus_color);
        
        match rank.as_str() {
            "ADMIN" => "<red>[ADMIN]",
            "GAME_MASTER" => "<dark_green>[GM]",
            "YOUTUBER" => "<red>[<white>YOUTUBE</white>]",
            "SUPERSTAR" => superstar.as_str(),
            "MVP_PLUS" => mvp_plus.as_str(),
            "MVP" => "<aqua>[MVP]",
            "VIP_PLUS" => "<green>[VIP<gold>+</gold>]",
            "VIP" => "<green>[VIP]",
            "DEFAULT" => "<gray>",
            _ => "",
        }.to_string()
    }
    
    pub fn primary_rank_color(&self) -> Color {
        let mut rank = self.calculate_rank();
        let rank_color: String = self.monthly_rank_color.clone().or_else(|| { Some("gold".to_string()) }).unwrap();
        
        if rank == "SUPERSTAR" {
            rank = format!("SUPERSTAR_{}", rank_color);
        }
        
        debug!("Rank: {}", rank);
        
        match get_rank_color(rank.to_uppercase().as_str()) {
            Some(color) => color.clone(),
            None => Color::from_rgb(255, 255, 255),
        }
    }
    
    pub fn bedwars_level(&self) -> i32 {
        self.achievements.bedwars_level
    }
}

