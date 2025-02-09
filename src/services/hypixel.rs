use crate::types::cache::ExpiringCache;
use crate::types::error::MinecraftError;
use crate::types::hypixel::stats::HypixelStats;
use reqwest::Client;
use serde::Deserialize;
use std::sync::{Arc, Once};
use std::time::Duration;

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

#[derive(Clone, Debug, Deserialize)]
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
}

impl HypixelPlayer {
    pub fn calculate_rank(&self) -> String {
        if let Some(ref prefix) = self.prefix {
            return prefix.clone();
        }
        
        if let Some(ref rank) = self.rank {
            return rank.clone();
        }

        if let Some(ref monthly_package_rank) = self.monthly_package_rank {
            return monthly_package_rank.clone();
        }
        
        if let Some(ref new_package_rank) = self.new_package_rank {
            return new_package_rank.clone();
        }
        
        if let Some(ref package_rank) = self.package_rank {
            return package_rank.clone();
        }
        
        "".to_string()
    }
    
    pub fn rank_formatted(&self) -> String {
        let rank = &self.calculate_rank();

        if let Some(ref prefix) = &self.prefix {
            todo!("Implement prefix conversion");
        }

        let rank_color: String = self.monthly_rank_color.clone().unwrap();
        let plus_color: String = self.rank_plus_color.clone().unwrap();
        
        let superstar = format!("<{0}>[MVP<{1}>++</{1}>]", rank_color, plus_color);
        let mvp_plus = format!("<aqua>[MVP<{0}>+</{0}>]", rank_color);
        
        match rank.as_str() {
            "ADMIN" => "<red>[ADMIN]",
            "GAME_MASTER" => "<dark_green>[GM]",
            "YOUTUBER" => "<red>[<white>YOUTUBE</white>]",
            "SUPERSTAR" => superstar.as_str(),
            "MVP_PLUS" => mvp_plus.as_str(),
            "MVP" => "<aqua>[MVP]",
            "VIP_PLUS" => "<green>[VIP<gold>+</gold>]",
            "VIP" => "<green>[VIP]",
            _ => "",
        }.to_string()
    } 
}

