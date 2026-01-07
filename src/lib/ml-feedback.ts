// ML Feedback System for BillSaver
// Handles user corrections and model improvement through feedback loop

export interface UserFeedback {
  id: string;
  timestamp: Date;
  documentText: string;
  originalPrediction: {
    qualityScore: number;
    gaps: string[];
    cptCodes: string[];
  };
  userCorrection: {
    qualityScore?: number;
    gaps?: string[];
    cptCodes?: string[];
    notes?: string;
  };
  feedbackType: 'quality_correction' | 'gap_correction' | 'cpt_correction' | 'general_feedback';
  confidence: number;
}

export interface FeedbackStats {
  totalFeedback: number;
  qualityCorrections: number;
  gapCorrections: number;
  cptCorrections: number;
  averageConfidence: number;
  commonCorrections: Record<string, number>;
}

// Feedback storage key
const FEEDBACK_STORAGE_KEY = 'billsaver_ml_feedback';

// Collect user feedback for model improvement
export function submitFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): void {
  const feedbackEntry: UserFeedback = {
    ...feedback,
    id: generateFeedbackId(),
    timestamp: new Date(),
  };

  // Store feedback locally
  const existingFeedback = getStoredFeedback();
  existingFeedback.push(feedbackEntry);

  // Keep only last 1000 feedback entries to prevent storage bloat
  if (existingFeedback.length > 1000) {
    existingFeedback.splice(0, existingFeedback.length - 1000);
  }

  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(existingFeedback));

  // Trigger model retraining if enough feedback accumulated
  checkRetrainingThreshold(existingFeedback);
}

// Get stored feedback
export function getStoredFeedback(): UserFeedback[] {
  try {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!stored) return [];

    const feedback = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    return feedback.map((f: any) => ({
      ...f,
      timestamp: new Date(f.timestamp),
    }));
  } catch (error) {
    console.error('Failed to load feedback:', error);
    return [];
  }
}

// Get feedback statistics
export function getFeedbackStats(): FeedbackStats {
  const feedback = getStoredFeedback();

  const stats: FeedbackStats = {
    totalFeedback: feedback.length,
    qualityCorrections: 0,
    gapCorrections: 0,
    cptCorrections: 0,
    averageConfidence: 0,
    commonCorrections: {},
  };

  let totalConfidence = 0;

  feedback.forEach(f => {
    totalConfidence += f.confidence;

    switch (f.feedbackType) {
      case 'quality_correction':
        stats.qualityCorrections++;
        break;
      case 'gap_correction':
        stats.gapCorrections++;
        break;
      case 'cpt_correction':
        stats.cptCorrections++;
        break;
    }

    // Track common corrections
    if (f.userCorrection.qualityScore !== undefined) {
      const key = `quality_${Math.round(f.userCorrection.qualityScore / 10) * 10}`;
      stats.commonCorrections[key] = (stats.commonCorrections[key] || 0) + 1;
    }

    if (f.userCorrection.gaps) {
      f.userCorrection.gaps.forEach(gap => {
        stats.commonCorrections[gap] = (stats.commonCorrections[gap] || 0) + 1;
      });
    }

    if (f.userCorrection.cptCodes) {
      f.userCorrection.cptCodes.forEach(code => {
        stats.commonCorrections[code] = (stats.commonCorrections[code] || 0) + 1;
      });
    }
  });

  stats.averageConfidence = feedback.length > 0 ? totalConfidence / feedback.length : 0;

  return stats;
}

// Check if we should trigger model retraining
function checkRetrainingThreshold(feedback: UserFeedback[]): void {
  const recentFeedback = feedback.filter(f =>
    Date.now() - f.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
  );

  // Retrain if we have 50+ recent feedback entries
  if (recentFeedback.length >= 50) {
    console.log('Sufficient feedback collected, triggering model retraining...');
    // In a real implementation, this would trigger background retraining
    // For now, just log the intent
    scheduleModelRetraining();
  }
}

// Schedule model retraining (simplified)
function scheduleModelRetraining(): void {
  // In production, this would use a service worker or background process
  // For now, we'll just set a flag that can be checked on next app load
  localStorage.setItem('billsaver_retrain_pending', 'true');
}

// Check if retraining is pending
export function isRetrainingPending(): boolean {
  return localStorage.getItem('billsaver_retrain_pending') === 'true';
}

// Clear retraining flag
export function clearRetrainingFlag(): void {
  localStorage.removeItem('billsaver_retrain_pending');
}

// Generate unique feedback ID
function generateFeedbackId(): string {
  return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export feedback data for analysis (for development/debugging)
export function exportFeedbackData(): string {
  const feedback = getStoredFeedback();
  return JSON.stringify(feedback, null, 2);
}

// Clear all feedback data (for testing/admin purposes)
export function clearFeedbackData(): void {
  localStorage.removeItem(FEEDBACK_STORAGE_KEY);
  console.log('Feedback data cleared');
}

// Get feedback insights for UI display
export interface FeedbackInsights {
  recentActivity: UserFeedback[];
  improvementAreas: string[];
  confidenceTrend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export function getFeedbackInsights(): FeedbackInsights {
  const feedback = getStoredFeedback();
  const recent = feedback.slice(-10); // Last 10 feedback entries

  const insights: FeedbackInsights = {
    recentActivity: recent,
    improvementAreas: [],
    confidenceTrend: 'stable',
    recommendations: [],
  };

  // Analyze improvement areas
  const stats = getFeedbackStats();
  const corrections = stats.commonCorrections;

  // Find most common correction types
  const sortedCorrections = Object.entries(corrections)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  insights.improvementAreas = sortedCorrections.map(([type]) => type);

  // Analyze confidence trend (simplified)
  if (recent.length >= 5) {
    const recentConfidence = recent.reduce((sum, f) => sum + f.confidence, 0) / recent.length;
    const olderFeedback = feedback.slice(-20, -10);
    const olderConfidence = olderFeedback.length > 0
      ? olderFeedback.reduce((sum, f) => sum + f.confidence, 0) / olderFeedback.length
      : recentConfidence;

    if (recentConfidence > olderConfidence + 0.1) {
      insights.confidenceTrend = 'improving';
    } else if (recentConfidence < olderConfidence - 0.1) {
      insights.confidenceTrend = 'declining';
    }
  }

  // Generate recommendations
  if (stats.qualityCorrections > stats.totalFeedback * 0.5) {
    insights.recommendations.push('Focus on improving quality score predictions');
  }
  if (stats.gapCorrections > stats.totalFeedback * 0.3) {
    insights.recommendations.push('Enhance gap detection algorithms');
  }
  if (stats.cptCorrections > stats.totalFeedback * 0.2) {
    insights.recommendations.push('Improve CPT code classification');
  }
  if (insights.confidenceTrend === 'declining') {
    insights.recommendations.push('Consider model retraining with recent feedback');
  }

  return insights;
}
