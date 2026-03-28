/**
 * Risk Adjustment Module Index
 * 
 * Exports all risk adjustment analyzers for HCC, MEAT, and code specificity.
 * Import from this file for consolidated access to all risk adjustment tools.
 */

// HCC Analyzer
export {
    analyzeHCCOpportunities,
    calculateRAFScore,
    findMissedHCCs,
    HCC_DETECTION_PATTERNS,
    RAF_ANNUAL_VALUE,
    type HCCOpportunity,
    type HCCAnalysisResult,
    type HCCRecommendation,
} from './hcc-analyzer';

// MEAT Analyzer
export {
    analyzeConditionMEAT,
    analyzeMEATCompliance,
    isMEATSufficient,
    MEAT_PATTERN_DATABASE,
    type MEATElement,
    type ConditionMEATAnalysis,
    type MEATAnalysisResult,
    type MEATRecommendation,
} from './meat-analyzer';

// Specificity Database & Analyzer
export {
    analyzeSpecificityUpgrade,
    analyzeAllSpecificityOpportunities,
    getAvailableUpgrades,
    findUpgradePath,
    SPECIFICITY_DATABASE,
    type SpecificityUpgrade,
    type SpecificityAnalysisResult,
    type SpecificityOverview,
} from './specificity-database';
