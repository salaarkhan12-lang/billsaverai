# Security & Compliance

## Modes
- Default: Client-only (no backend persistence); PHI stays in-browser.
- Backend-enabled (requires DB config): encrypted storage + RBAC + audit logging.

## Credentials
- PBKDF2 sha512, 500,000 iterations + PEPPER (PBKDF2_PEPPER). Legacy bcrypt only for existing hashes.

## PHI Handling
- Client-only: No PHI leaves the browser.
- Backend (when enabled): AES-256-GCM envelope encryption with PBKDF2-derived keys (FILE_KEY_SECRET + PBKDF2_PEPPER). isEncrypted=true.
- No cleartext scores/levels/revenue in DB; metadataSafe only (non-PHI).

## Tokens & Sessions
- JWT access/refresh; refresh tokens hashed in DB.
- CORS/helmet/rate-limit applied.

## RBAC
- validateHealthcareRole + permission checks on document/analysis/feedback routes (active when backend enabled).

## Audit
- Encrypted, tamper-evident audit.log.enc; no PHI in audit entries (active when backend enabled).

## Metadata Sync
- Optional; payload validator rejects PHI fields (text/gaps/codes/raw). Requires backend + DB.

## Feedback
- Non-PHI payloads stored in feedback_events. Requires backend + DB.

## Environment (backend, when enabled)
PBKDF2_PEPPER, FILE_KEY_SECRET, AUDIT_LOG_KEY, JWT_SECRET, JWT_REFRESH_SECRET, UPLOAD_DIR, MAX_FILE_SIZE, PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE.

## Compliance Posture
- Client-only: HIPAA-friendly (PHI stays local).
- Backend-enabled: HIPAA-aligned encryption at rest/in transit, RBAC, PHI minimization, encrypted audit; requires real DB config.
