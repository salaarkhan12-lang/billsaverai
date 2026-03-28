/**
 * MIPS (Merit-based Incentive Payment System) Module Index
 * 
 * Exports all MIPS quality measure analysis tools.
 */

export {
    analyzeMIPSMeasures,
    isMeasureApplicable,
    getMeasureById,
    calculatePaymentAdjustment,
    MIPS_MEASURES_DATABASE,
    PAYMENT_ADJUSTMENT_MAP,
    type MIPSMeasure,
    type MIPSMeasureResult,
    type MIPSAnalysisResult,
    type MIPSRecommendation,
} from './mips-database';
