// Secure memory management utilities for sensitive data cleanup
// Ensures cryptographic keys and PHI are properly cleared from memory

/**
 * Securely clear ArrayBuffer
 */
export function clearArrayBuffer(buffer: ArrayBuffer): void {
    const view = new Uint8Array(buffer);
    crypto.getRandomValues(view); // Overwrite with random data
    view.fill(0); // Then zero out
}

/**
 * Securely clear Uint8Array
 */
export function clearUint8Array(array: Uint8Array): void {
    crypto.getRandomValues(array); // Overwrite with random data
    array.fill(0); // Then zero out
}

/**
 * Securely clear string (convert to buffer and clear)
 */
export function clearString(str: string): void {
    // Create array from string
    const encoder = new TextEncoder();
    const buffer = encoder.encode(str);
    clearUint8Array(buffer);
}

/**
 * Securely clear object properties
 */
export function clearObject(obj: Record<string, any>): void {
    Object.keys(obj).forEach((key) => {
        const value = obj[key];

        if (value === null || value === undefined) {
            return;
        }

        if (typeof value === 'string') {
            obj[key] = '';
            clearString(value);
        } else if (value instanceof ArrayBuffer) {
            clearArrayBuffer(value);
            obj[key] = null;
        } else if (value instanceof Uint8Array) {
            clearUint8Array(value);
            obj[key] = null;
        } else if (typeof value === 'object') {
            clearObject(value);
            obj[key] = null;
        } else {
            obj[key] = null;
        }
    });
}

/**
 * Create auto-clearing wrapper for sensitive data
 */
export class SecureData<T> {
    private data: T | null;
    private cleared = false;

    constructor(data: T) {
        this.data = data;
    }

    /**
     * Get data (throws if already cleared)
     */
    get(): T {
        if (this.cleared || this.data === null) {
            throw new Error('SecureData has been cleared and is no longer accessible');
        }
        return this.data;
    }

    /**
     * Check if data is available
     */
    isAvailable(): boolean {
        return !this.cleared && this.data !== null;
    }

    /**
     * Securely clear the data
     */
    clear(): void {
        if (this.cleared || this.data === null) {
            return;
        }

        if (typeof this.data === 'object' && this.data !== null) {
            clearObject(this.data as any);
        } else if (typeof this.data === 'string') {
            clearString(this.data);
        }

        this.data = null;
        this.cleared = true;
    }

    /**
     * Auto-clear on object destruction
     */
    [Symbol.dispose]() {
        this.clear();
    }
}

/**
 * Monitor memory pressure and trigger cleanup
 */
export class MemoryPressureMonitor {
    private static instance: MemoryPressureMonitor;
    private cleanupCallbacks: Array<() => void> = [];
    private monitorInterval: number | null = null;

    private constructor() {
        this.startMonitoring();
    }

    public static getInstance(): MemoryPressureMonitor {
        if (!MemoryPressureMonitor.instance) {
            MemoryPressureMonitor.instance = new MemoryPressureMonitor();
        }
        return MemoryPressureMonitor.instance;
    }

    /**
     * Register cleanup callback
     */
    public registerCleanup(callback: () => void): void {
        this.cleanupCallbacks.push(callback);
    }

    /**
     * Trigger all cleanup callbacks
     */
    public triggerCleanup(): void {
        this.cleanupCallbacks.forEach((callback) => {
            try {
                callback();
            } catch (error) {
                console.error('Error during cleanup:', error);
            }
        });
    }

    /**
     * Start memory monitoring
     */
    private startMonitoring(): void {
        if (typeof window === 'undefined') return;

        // Check memory pressure every 30 seconds
        this.monitorInterval = window.setInterval(() => {
            this.checkMemoryPressure();
        }, 30 * 1000);

        // Trigger cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.triggerCleanup();
        });

        // Trigger cleanup on visibility change (tab hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.triggerCleanup();
            }
        });
    }

    /**
     * Check memory pressure using Performance APIs
     */
    private checkMemoryPressure(): void {
        if ('memory' in performance && (performance as any).memory) {
            const memory = (performance as any).memory;
            const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

            // Trigger cleanup if using more than 80% of available heap
            if (usedRatio > 0.8) {
                console.warn('High memory pressure detected, triggering cleanup');
                this.triggerCleanup();
            }
        }
    }

    /**
     * Stop monitoring
     */
    public stopMonitoring(): void {
        if (this.monitorInterval !== null) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
    }
}

// Export singleton
export const memoryMonitor = MemoryPressureMonitor.getInstance();
