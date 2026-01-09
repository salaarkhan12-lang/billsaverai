// Memory-only data store for PHI - no persistence to disk
// HIPAA-compliant: Automatic cleanup, tamper detection, no browser storage

interface StoreEntry<T> {
    data: T;
    timestamp: number;
    checksum: string;
}

interface MemoryStoreConfig {
    maxAge?: number; // Max age in milliseconds (default: session lifetime)
    enableTamperDetection?: boolean;
}

/**
 * In-memory only data store with automatic cleanup
 * Data is destroyed on page unload and never persists to disk
 */
class MemoryStore {
    private static instance: MemoryStore;
    private store: Map<string, StoreEntry<any>>;
    private cleanupInterval: number | null = null;

    private constructor() {
        this.store = new Map();
        this.startCleanupInterval();

        // Clean up on page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.clear());
        }
    }

    public static getInstance(): MemoryStore {
        if (!MemoryStore.instance) {
            MemoryStore.instance = new MemoryStore();
        }
        return MemoryStore.instance;
    }

    /**
     * Generate checksum for tamper detection
     */
    private async generateChecksum(data: any): Promise<string> {
        const encoder = new TextEncoder();
        const dataString = JSON.stringify(data);
        const dataBuffer = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Verify data integrity
     */
    private async verifyChecksum(data: any, checksum: string): Promise<boolean> {
        const currentChecksum = await this.generateChecksum(data);
        return currentChecksum === checksum;
    }

    /**
     * Store data in memory
     */
    public async set<T>(
        key: string,
        data: T,
        config: MemoryStoreConfig = {}
    ): Promise<void> {
        const checksum = config.enableTamperDetection
            ? await this.generateChecksum(data)
            : '';

        const entry: StoreEntry<T> = {
            data,
            timestamp: Date.now(),
            checksum,
        };

        this.store.set(key, entry);
    }

    /**
     * Retrieve data from memory
     */
    public async get<T>(
        key: string,
        config: MemoryStoreConfig = {}
    ): Promise<T | null> {
        const entry = this.store.get(key);

        if (!entry) {
            return null;
        }

        // Check age if maxAge is specified
        if (config.maxAge) {
            const age = Date.now() - entry.timestamp;
            if (age > config.maxAge) {
                this.delete(key);
                return null;
            }
        }

        // Verify integrity if tamper detection is enabled
        if (config.enableTamperDetection && entry.checksum) {
            const isValid = await this.verifyChecksum(entry.data, entry.checksum);
            if (!isValid) {
                console.error('Data integrity check failed for key:', key);
                this.delete(key);
                return null;
            }
        }

        return entry.data as T;
    }

    /**
     * Check if key exists
     */
    public has(key: string): boolean {
        return this.store.has(key);
    }

    /**
     * Delete data from memory
     */
    public delete(key: string): boolean {
        const entry = this.store.get(key);
        if (entry) {
            // Overwrite sensitive data before deletion
            if (typeof entry.data === 'object' && entry.data !== null) {
                const keys = Object.keys(entry.data);
                keys.forEach((k) => {
                    (entry.data as any)[k] = null;
                });
            }
            entry.checksum = '';
        }
        return this.store.delete(key);
    }

    /**
     * Clear all data from memory
     */
    public clear(): void {
        // Overwrite all data before clearing
        this.store.forEach((entry, key) => {
            if (typeof entry.data === 'object' && entry.data !== null) {
                const keys = Object.keys(entry.data);
                keys.forEach((k) => {
                    (entry.data as any)[k] = null;
                });
            }
            entry.checksum = '';
        });

        this.store.clear();
    }

    /**
     * Get all keys
     */
    public keys(): string[] {
        return Array.from(this.store.keys());
    }

    /**
     * Get store size
     */
    public size(): number {
        return this.store.size;
    }

    /**
     * Start automatic cleanup interval
     */
    private startCleanupInterval(): void {
        if (typeof window === 'undefined') return;

        // Clean up expired entries every 5 minutes
        this.cleanupInterval = window.setInterval(() => {
            this.cleanupExpired();
        }, 5 * 60 * 1000);
    }

    /**
     * Clean up expired entries
     */
    private cleanupExpired(): void {
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // 1 hour default

        this.store.forEach((entry, key) => {
            const age = now - entry.timestamp;
            if (age > maxAge) {
                this.delete(key);
            }
        });
    }

    /**
     * Stop cleanup interval
     */
    public stopCleanupInterval(): void {
        if (this.cleanupInterval !== null) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Export data for debugging (sanitized)
     */
    public exportDebugInfo(): {
        totalEntries: number;
        keys: string[];
        avgAge: number;
    } {
        const now = Date.now();
        let totalAge = 0;
        const keys: string[] = [];

        this.store.forEach((entry, key) => {
            keys.push(key);
            totalAge += now - entry.timestamp;
        });

        return {
            totalEntries: this.store.size,
            keys,
            avgAge: this.store.size > 0 ? totalAge / this.store.size : 0,
        };
    }
}

// Export singleton instance
export const memoryStore = MemoryStore.getInstance();

// Export types
export type { StoreEntry, MemoryStoreConfig };
