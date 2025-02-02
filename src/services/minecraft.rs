use std::sync::{Arc, Once};
use std::time::Duration;
use reqwest::Client;
use serde::Deserialize;
use crate::types::cache::ExpiringCache;
use crate::types::error::MinecraftError;

pub struct PlayerDBService {
    cache: ExpiringCache<String, PlayerDBPlayer>,
}

impl PlayerDBService {
    /// Creates a new PlayerDBService with a cache TTL of 60 minutes.
    fn new() -> Self {
        Self {
            cache: ExpiringCache::new(Duration::from_secs(3600)), // 5 minutes TTL
        }
    }

    /// Returns a singleton instance of PlayerDBService.
    pub fn instance() -> Arc<Self> {
        static mut INSTANCE: Option<Arc<PlayerDBService>> = None;
        static INIT: Once = Once::new();

        unsafe {
            INIT.call_once(|| {
                INSTANCE = Some(Arc::new(PlayerDBService::new()));
            });
            INSTANCE.clone().unwrap()
        }
    }

    /// Retrieves player data for the given Minecraft username.
    /// It first checks the cache, and if not found or expired, fetches fresh data from the API.
    pub async fn get_player_data(&self, username: &str) -> Result<PlayerDBPlayer, MinecraftError> {
        if let Some(response) = self.cache.get(&username.to_string()).await {
            return Ok(response);
        }

        let response = self.get_player_data_api(username).await?;
        self.cache.insert(username.to_string(), response.clone()).await;
        
        Ok(response)
    }

    pub async fn get_player_data_api(&self, username: &str) -> Result<PlayerDBPlayer, MinecraftError> {
        let url = format!("https://playerdb.co/api/player/minecraft/{}", username);
        let response: PlayerDBResponse = Client::new().get(&url).send().await?.json().await?;
        
        Ok(response.data.player)
    }
}

#[derive(Deserialize)]
pub struct PlayerDBResponse {
    pub data: PlayerDBData,
}

#[derive(Deserialize)]
pub struct PlayerDBData {
    pub player: PlayerDBPlayer,
}

#[derive(Deserialize)]
#[derive(Clone)]
pub struct PlayerDBPlayer {
    pub id: String,
    pub username: String,
}