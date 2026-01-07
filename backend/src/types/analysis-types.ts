export interface GapLocation {
  page: number;
  position: number; // Character position in the full text
  textSnippet: string; // Context around the gap
  section?: string; // Medical section (HPI, Assessment, etc.)
  x?: number; // PDF coordinate X
  y?: number; // PDF coordinate Y
}

export interface DocumentationGap {
  id: string;
  category: 'critical' | 'major' | 'moderate' | 'minor';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  potentialRevenueLoss: string;
  cptCodes?: string[];
  icdCodes?: string[];
  mlConfidence?: number; // ML confidence score for this gap
  isMLDetected?: boolean; // Whether this gap was detected by ML
  location?: GapLocation; // Location information in the PDF
}

export interface AnalysisResult {
  overallScore: number;
  documentationLevel: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  gaps: DocumentationGap[];
  strengths: string[];
  suggestedEMLevel: string;
  currentEMLevel: string;
  potentialUpcodeOpportunity: boolean;
  totalPotentialRevenueLoss: string;
  mdmComplexity: 'Straightforward' | 'Low' | 'Moderate' | 'High';
  timeDocumented: boolean;
  meatCriteriaMet: boolean;
  // ML-enhanced fields
  mlQualityScore?: number;
  mlConfidence?: number;
  suggestedCPTCodes?: any[]; // Simplified for backend
  mlDetectedGaps?: any[]; // Simplified for backend
}
