// Client-side NLP & Expert System Models for BillSaver
// Implements deterministic, feature-based scoring for medical documentation
// HIPAA COMPLIANCE: All processing happens locally. No data leaves the client.

import nlp from 'compromise';

// Model interfaces
export interface QualityPrediction {
  score: number;
  confidence: number;
  features: {
    textLength: number;
    keywordDensity: number;
    structureScore: number;
    completenessScore: number;
  };
}

export interface GapPrediction {
  gapType: string;
  probability: number;
  severity: 'low' | 'medium' | 'high';
  suggestedFix: string;
}

export interface CPTCodePrediction {
  code: string;
  description: string;
  confidence: number;
  category: 'evaluation_management' | 'laboratory' | 'radiology' | 'procedures' | 'other';
}

export interface TemplateSuggestion {
  templateId: string;
  relevanceScore: number;
  context: string;
}

// Text preprocessing and Feature Extraction Utilities
export class TextPreprocessor {
  private static readonly MEDICAL_KEYWORDS = [
    'chief complaint', 'cc', 'history', 'hpi', 'ros', 'review of systems',
    'physical exam', 'pe', 'vital signs', 'assessment', 'plan', 'diagnosis',
    'medication', 'prescription', 'lab', 'laboratory', 'imaging', 'x-ray',
    'ct', 'mri', 'ultrasound', 'procedure', 'surgery', 'follow-up', 'time',
    'acute', 'chronic', 'symptoms', 'pain', 'fever', 'normal', 'abnormal'
  ];

  static extractFeatures(text: string): number[] {
    const doc = nlp(text);
    const lowerText = text.toLowerCase();

    // 1. Keyword Density (Medical Terms per 100 words)
    const wordCount = doc.wordCount();
    const keywordCount = this.countKeywords(lowerText);
    // Avoid division by zero
    const density = wordCount > 0 ? (keywordCount / wordCount) * 10 : 0;

    // 2. Structural Completeness (0-1)
    const structureScore = this.calculateStructureScore(lowerText);

    // 3. Clinical Completeness (Specific vitals/metrics)
    const completenessScore = this.calculateCompletenessScore(doc);

    // 4. Linguistic Complexity (Avg sentence length / 20)
    // Longer sentences often imply more detailed clinical reasoning
    const sentenceCount = doc.sentences().length;
    const avgSentenceLength = sentenceCount > 0 ? (wordCount / sentenceCount) : 0;
    const complexityScore = Math.min(avgSentenceLength / 20, 1);

    return [density, structureScore, completenessScore, complexityScore];
  }

  private static countKeywords(text: string): number {
    return this.MEDICAL_KEYWORDS.reduce((count, keyword) =>
      count + (text.split(keyword).length - 1), 0);
  }

  private static calculateStructureScore(text: string): number {
    let score = 0;
    const sections = ['chief complaint', 'history', 'physical exam', 'assessment', 'plan'];
    const weight = 1 / sections.length;

    sections.forEach(section => {
      if (text.includes(section)) score += weight;
    });

    return Math.min(score, 1);
  }

  private static calculateCompletenessScore(doc: any): number {
    let score = 0;

    // Check for numbers (vitals, dosages)
    if (doc.numbers().length > 3) score += 0.3;

    // Check for values (mg, mmhg, etc - simple check via regex on raw text for speed)
    const text = doc.text();
    if (/mg|ml|tabs|caps/i.test(text)) score += 0.2; // Meds
    if (/\d+\/\d+/.test(text)) score += 0.2; // BP
    if (/\d+(\.\d+)?\s*(F|C)/.test(text)) score += 0.1; // Temp
    if (/pain/i.test(text)) score += 0.2; // Symptoms

    return Math.min(score, 1);
  }
}

// Quality Prediction Model (Expert System)
export class QualityPredictor {

  async loadModel(): Promise<void> {
    // No-op: This is now a deterministic expert system, no weights to load
    return;
  }

  async predict(text: string): Promise<QualityPrediction> {
    const features = TextPreprocessor.extractFeatures(text);
    const [density, structure, completeness, complexity] = features;

    // Expert Scoring Algorithm (Linear Model)
    // Weights derived from clinical documentation standards
    // Density (30%), Structure (40%), Completeness (20%), Complexity (10%)

    // Normalize density (expecting ~1 medical term per 10 words as 'good')
    const normalizedDensity = Math.min(density, 1.5);

    let rawScore =
      (normalizedDensity * 30) +
      (structure * 40) +
      (completeness * 20) +
      (complexity * 10);

    // Scaling to 0-100 range logically
    // Base score of 20 just for having text
    let finalScore = 20 + (rawScore * 0.8);
    finalScore = Math.max(0, Math.min(100, finalScore));

    // Confidence depends on text length (short text = low confidence)
    const confidence = Math.min(text.length / 500, 0.95);

    return {
      score: Math.round(finalScore),
      confidence,
      features: {
        keywordDensity: density,
        structureScore: structure,
        completenessScore: completeness,
        textLength: text.length
      },
    };
  }
}

// Gap Detection Model (Rule-Based + NLP Enhancement)
export class GapDetector {
  async loadModel(): Promise<void> { return; }

  async predictGaps(text: string): Promise<GapPrediction[]> {
    const gaps: GapPrediction[] = [];
    const lowerText = text.toLowerCase();
    const doc = nlp(text);

    // Rule 1: Missing Chief Complaint
    if (!/chief complaint|cc:/i.test(lowerText) && !/reason for visit/i.test(lowerText)) {
      gaps.push({
        gapType: 'missing_chief_complaint',
        probability: 1.0,
        severity: 'high',
        suggestedFix: 'Add a clear Chief Complaint (CC) section.',
      });
    }

    // Rule 2: Missing Assessment/Diagnosis
    if (!/assessment|diagnosis|impression/i.test(lowerText)) {
      gaps.push({
        gapType: 'missing_assessment',
        probability: 1.0,
        severity: 'high',
        suggestedFix: 'Document the Assessment or Diagnosis clearly.',
      });
    }

    // Rule 3: Missing Plan
    if (!/plan|treatment|recommendation/i.test(lowerText)) {
      gaps.push({
        gapType: 'missing_plan',
        probability: 1.0,
        severity: 'high',
        suggestedFix: 'Outline the Treatment Plan.',
      });
    }

    // NLP Rule 4: Weak History (Low Complexity)
    const features = TextPreprocessor.extractFeatures(text);
    // complexity is features[3]
    if (features[3] < 0.3 && text.length > 200) {
      // Only flag if text is long enough but sentences are too simple
      gaps.push({
        gapType: 'poor_narrative',
        probability: 0.6,
        severity: 'medium',
        suggestedFix: 'Expand on the patient history with more detailed narrative.',
      });
    }

    return gaps;
  }
}

// CPT Code Predictor (Keyword/Pattern Matching)
export class CPTCodePredictor {
  async loadModel(): Promise<void> { return; }

  async predictCodes(text: string): Promise<CPTCodePrediction[]> {
    const predictions: CPTCodePrediction[] = [];
    const lowerText = text.toLowerCase();

    // 1. E/M Coding Logic (Time or MDM based)
    // Very basic heuristic for demo purposes
    if (lowerText.includes('comprehensive') || lowerText.includes('high complexity')) {
      predictions.push({
        code: '99215',
        description: 'Office Visit, High Complexity (40-54 mins)',
        confidence: 0.85,
        category: 'evaluation_management',
      });
    } else if (lowerText.includes('detailed') || lowerText.includes('moderate complexity')) {
      predictions.push({
        code: '99214',
        description: 'Office Visit, Moderate Complexity (30-39 mins)',
        confidence: 0.90,
        category: 'evaluation_management',
      });
    }

    // 2. Procedures & Labs (Keyword match)
    const keywordMap: Record<string, { code: string, desc: string, cat: CPTCodePrediction['category'] }> = {
      'ekg': { code: '93000', desc: 'Electrocardiogram, complete', cat: 'other' },
      'ecg': { code: '93000', desc: 'Electrocardiogram, complete', cat: 'other' },
      'chest x-ray': { code: '71045', desc: 'Radiologic Exam, Chest (1 view)', cat: 'radiology' },
      'cxr': { code: '71045', desc: 'Radiologic Exam, Chest (1 view)', cat: 'radiology' },
      'cbc': { code: '85025', desc: 'Complete CBC w/ auto diff', cat: 'laboratory' },
      'lipid': { code: '80061', desc: 'Lipid Panel', cat: 'laboratory' },
      'vaccine': { code: '90471', desc: 'Immunization Admin', cat: 'procedures' },
      'injection': { code: '96372', desc: 'Therapeutic/Prophylactic Injection', cat: 'procedures' },
      'suture': { code: '12001', desc: 'Simple Repair of Superficial Wounds', cat: 'procedures' }
    };

    Object.keys(keywordMap).forEach(key => {
      if (lowerText.includes(key)) {
        const match = keywordMap[key];
        // Verify we haven't already added this code
        if (!predictions.some(p => p.code === match.code)) {
          predictions.push({
            code: match.code,
            description: match.desc,
            confidence: 0.95,
            category: match.cat
          });
        }
      }
    });

    return predictions;
  }
}

// Template Suggester (Contextual)
export class TemplateSuggester {
  async suggestTemplates(text: string, gaps: GapPrediction[]): Promise<TemplateSuggestion[]> {
    const suggestions: TemplateSuggestion[] = [];

    gaps.forEach((gap) => {
      let context = '';
      if (gap.gapType.includes('chief_complaint')) context = 'Subjective: Patient presents with...';
      if (gap.gapType.includes('assessment')) context = 'Assessment: 1. Primary Diagnosis...';
      if (gap.gapType.includes('plan')) context = 'Plan: 1. Medications... 2. Follow-up...';

      if (context) {
        suggestions.push({
          templateId: `tpl_${gap.gapType}`,
          relevanceScore: 0.9,
          context: context,
        });
      }
    });

    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

// Singleton instances
export const qualityPredictor = new QualityPredictor();
export const gapDetector = new GapDetector();
export const cptPredictor = new CPTCodePredictor();
export const templateSuggester = new TemplateSuggester();

// Utility function to initialize all models
export async function initializeMLModels(): Promise<void> {
  console.log('Initializing Deterministic NLP Engine...');
  // No asyncio loading needed for expert systems, but keeping signature for compatibility
  await Promise.resolve();
  console.log('NLP Engine Ready.');
}
