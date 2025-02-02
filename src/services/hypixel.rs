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
    
    pub stats: HypixelStats,
}

