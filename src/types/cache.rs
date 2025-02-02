use std::collections::HashMap;
use std::hash::Hash;
use std::sync::Mutex;
use std::time::{Duration, Instant};

pub struct ExpiringCache<K, V> {
    ttl: Duration,
    // Using a Mutex for safe concurrent access.
    data: Mutex<HashMap<K, CacheEntry<V>>>,
}

struct CacheEntry<V> {
    value: V,
    expires_at: Instant,
}

impl<K, V> ExpiringCache<K, V>
where
    K: Eq + Hash,
    V: Clone,
{
    /// Creates a new cache with the given time-to-live (TTL).
    pub fn new(ttl: Duration) -> Self {
        Self {
            ttl,
            data: Mutex::new(HashMap::new()),
        }
    }

    /// Retrieves a value by key if present and not expired.
    pub async fn get(&self, key: &K) -> Option<V> {
        let mut data = self.data.lock().unwrap();
        if let Some(entry) = data.get(key) {
            if Instant::now() < entry.expires_at {
                return Some(entry.value.clone());
            } else {
                // Remove expired entry.
                data.remove(key);
            }
        }
        None
    }

    /// Inserts a value into the cache.
    pub async fn insert(&self, key: K, value: V) {
        let expires_at = Instant::now() + self.ttl;
        let mut data = self.data.lock().unwrap();
        data.insert(key, CacheEntry { value, expires_at });
    }
}