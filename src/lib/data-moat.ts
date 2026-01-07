import nlp from 'compromise';

export interface DeidentifiedText {
    cleanText: string;
    phiDetected: boolean;
    redactionMap: Map<string, string>; // Maps token -> original value (kept locally)
    stats: {
        namesRemoved: number;
        datesRemoved: number;
        locationsRemoved: number;
        identifiersRemoved: number;
    };
}

export class DataMoatService {
    // Regex patterns for strict PHI detection
    private static readonly PATTERNS = {
        // Medical Record Numbers (various formats)
        MRN: /\b(MRN|Record No|Patient ID)[:#\s]*[A-Z0-9-]{4,15}\b/gi,
        // Social Security Numbers
        SSN: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g,
        // Phone Numbers
        PHONE: /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
        // Email Addresses
        EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        // Dates (simple formats)
        DATE: /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi,
        // Zip Codes
        ZIP: /\b\d{5}(-\d{4})?\b/g
    };

    /**
     * THE DATA MOAT:
     * 1. Strips all direct identifiers using Regex
     * 2. Uses NLP to find and remove Names and Locations
     * 3. Returns "Clean" text safe for AI processing
     * 4. Keeps the "Keys" (original values) locked in the client
     */
    static sanitizeClinicalText(rawText: string): DeidentifiedText {
        let cleanText = rawText;
        const redactionMap = new Map<string, string>();
        const stats = {
            namesRemoved: 0,
            datesRemoved: 0,
            locationsRemoved: 0,
            identifiersRemoved: 0
        };

        // Helper to replace and track
        const replace = (pattern: RegExp, placeholder: string, type: keyof typeof stats) => {
            cleanText = cleanText.replace(pattern, (match) => {
                // Create a specialized token to preserve context for the AI
                // e.g. [DATE_1], [PHONE_2]
                const token = `[${placeholder}_${redactionMap.size + 1}]`;
                redactionMap.set(token, match);
                stats[type]++;
                return token;
            });
        };

        // 1. Strict Regex Removal (High Confidence)
        replace(this.PATTERNS.MRN, "MRN", 'identifiersRemoved');
        replace(this.PATTERNS.SSN, "SSN", 'identifiersRemoved');
        replace(this.PATTERNS.PHONE, "PHONE", 'identifiersRemoved');
        replace(this.PATTERNS.EMAIL, "EMAIL", 'identifiersRemoved');
        replace(this.PATTERNS.DATE, "DATE", 'datesRemoved');
        replace(this.PATTERNS.ZIP, "ZIP", 'locationsRemoved');

        // 2. NLP Named Entity Recognition (Contextual)
        // We run this AFTER regex to avoid messing up formatted numbers
        const doc = nlp(cleanText);

        // Remove People's Names
        const people = doc.people().out('array');
        people.forEach((name: string) => {
            if (name.length > 2) { // Skip initials or short words that might be false positives
                // Escape special chars for regex
                const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = new RegExp(`\\b${escaped}\\b`, 'g');
                replace(pattern, "PATIENT_NAME", 'namesRemoved');
            }
        });

        // Remove Places (Cities, Addresses)
        const places = doc.places().out('array');
        places.forEach((place: string) => {
            if (place.length > 2) {
                const escaped = place.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = new RegExp(`\\b${escaped}\\b`, 'g');
                replace(pattern, "LOCATION", 'locationsRemoved');
            }
        });

        return {
            cleanText,
            phiDetected: redactionMap.size > 0,
            redactionMap, // This stays on the client!
            stats
        };
    }

    /**
     * Rehydrates the AI response with original data IF needed
     * (Usually we don't need to rehydrate the analysis itself, but maybe for snippets)
     */
    static rehydrateText(cleanText: string, redactionMap: Map<string, string>): string {
        let originalText = cleanText;
        redactionMap.forEach((value, token) => {
            originalText = originalText.replace(token, value);
        });
        return originalText;
    }
}
