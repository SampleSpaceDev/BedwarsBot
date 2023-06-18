type CacheItem<T> = {
    value: T;
    expiration: number;
};

export class ExpiringCache<T> {
    private cache: Map<string, CacheItem<T>> = new Map();

    constructor(private defaultExpirationMs: number) {}

    get(key: string): T | undefined {
        const item = this.cache.get(key);
        if (item && Date.now() < item.expiration) {
            return item.value;
        }
        this.cache.delete(key);
        return undefined;
    }

    set(key: string, value: T, expirationMs?: number): void {
        const expiration = expirationMs ?? this.defaultExpirationMs;
        const expirationTime = Date.now() + expiration;
        this.cache.set(key, { value, expiration: expirationTime });
        this.scheduleCleanup();
    }

    entries = (): [string, CacheItem<T>][] => [...this.cache.entries()];

    private scheduleCleanup(): void {
        setTimeout(() => {
            this.cleanup();
        }, this.defaultExpirationMs);
    }

    private cleanup(): void {
        const now = Date.now();
        this.cache.forEach((item, key) => {
            if (now >= item.expiration) {
                this.cache.delete(key);
            }
        });
        this.scheduleCleanup();
    }
}