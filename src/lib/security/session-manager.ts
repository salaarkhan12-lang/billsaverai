// Secure session management with in-memory storage and CSRF protection
// HIPAA-compliant: No PHI persistence, automatic cleanup, session fingerprinting

interface SessionData {
    id: string;
    createdAt: number;
    lastActivityAt: number;
    csrfToken: string;
    fingerprint: string;
    metadata?: Record<string, unknown>;
}

interface SessionConfig {
    idleTimeout: number; // milliseconds
    absoluteTimeout: number; // milliseconds
    csrfTokenLength: number;
}

class SessionManager {
    private static instance: SessionManager;
    private currentSession: SessionData | null = null;
    private config: SessionConfig;
    private cleanupInterval: number | null = null;

    private constructor() {
        this.config = {
            idleTimeout: 30 * 60 * 1000, // 30 minutes
            absoluteTimeout: 8 * 60 * 60 * 1000, // 8 hours
            csrfTokenLength: 32,
        };

        // Start cleanup interval
        this.startCleanupInterval();

        // Clean up on page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.destroySession());
        }
    }

    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    /**
     * Generate cryptographically secure random token
     */
    private generateSecureToken(length: number): string {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate browser fingerprint for session hijacking detection
     */
    private generateFingerprint(): string {
        if (typeof window === 'undefined') return '';

        const components = [
            navigator.userAgent,
            navigator.language,
            screen.colorDepth,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
        ];

        return btoa(components.join('|'));
    }

    /**
     * Create a new session
     */
    public createSession(metadata?: Record<string, unknown>): SessionData {
        const now = Date.now();
        const session: SessionData = {
            id: this.generateSecureToken(32),
            createdAt: now,
            lastActivityAt: now,
            csrfToken: this.generateSecureToken(this.config.csrfTokenLength),
            fingerprint: this.generateFingerprint(),
            metadata,
        };

        this.currentSession = session;
        return session;
    }

    /**
     * Get current session (updates activity timestamp)
     */
    public getSession(): SessionData | null {
        if (!this.currentSession) {
            return null;
        }

        // Check if session is expired
        if (this.isSessionExpired()) {
            this.destroySession();
            return null;
        }

        // Update last activity
        this.currentSession.lastActivityAt = Date.now();
        return this.currentSession;
    }

    /**
     * Check if session is expired
     */
    private isSessionExpired(): boolean {
        if (!this.currentSession) return true;

        const now = Date.now();
        const idleTime = now - this.currentSession.lastActivityAt;
        const absoluteTime = now - this.currentSession.createdAt;

        return (
            idleTime > this.config.idleTimeout ||
            absoluteTime > this.config.absoluteTimeout
        );
    }

    /**
     * Validate CSRF token
     */
    public validateCsrfToken(token: string): boolean {
        if (!this.currentSession) return false;
        return this.currentSession.csrfToken === token;
    }

    /**
     * Validate session fingerprint (detect hijacking)
     */
    public validateFingerprint(): boolean {
        if (!this.currentSession) return false;
        const currentFingerprint = this.generateFingerprint();
        return this.currentSession.fingerprint === currentFingerprint;
    }

    /**
     * Regenerate CSRF token (call after sensitive operations)
     */
    public regenerateCsrfToken(): string {
        if (!this.currentSession) {
            throw new Error('No active session');
        }

        const newToken = this.generateSecureToken(this.config.csrfTokenLength);
        this.currentSession.csrfToken = newToken;
        return newToken;
    }

    /**
     * Update session metadata
     */
    public updateSessionMetadata(metadata: Record<string, unknown>): void {
        if (!this.currentSession) {
            throw new Error('No active session');
        }

        this.currentSession.metadata = {
            ...this.currentSession.metadata,
            ...metadata,
        };
    }

    /**
     * Destroy current session
     */
    public destroySession(): void {
        if (this.currentSession) {
            // Overwrite sensitive data before nullifying
            this.currentSession.id = '';
            this.currentSession.csrfToken = '';
            this.currentSession.fingerprint = '';
            this.currentSession = null;
        }
    }

    /**
     * Start automatic cleanup interval
     */
    private startCleanupInterval(): void {
        if (typeof window === 'undefined') return;

        // Check every minute
        this.cleanupInterval = window.setInterval(() => {
            if (this.isSessionExpired()) {
                this.destroySession();
            }
        }, 60 * 1000);
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
     * Get session info (sanitized for logging)
     */
    public getSessionInfo(): {
        exists: boolean;
        expired: boolean;
        idleTime: number;
        absoluteTime: number;
    } {
        if (!this.currentSession) {
            return {
                exists: false,
                expired: true,
                idleTime: 0,
                absoluteTime: 0,
            };
        }

        const now = Date.now();
        return {
            exists: true,
            expired: this.isSessionExpired(),
            idleTime: now - this.currentSession.lastActivityAt,
            absoluteTime: now - this.currentSession.createdAt,
        };
    }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Export types
export type { SessionData, SessionConfig };
