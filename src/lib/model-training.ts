import * as tf from '@tensorflow/tfjs';
import { QualityPrediction, TextPreprocessor } from './ml-models';

export interface TrainingExample {
  text: string;
  qualityScore: number;
  gaps: string[];
  cptCodes: string[];
  features: number[];
}

export interface ModelTrainingData {
  qualityData: {
    inputs: number[][];
    outputs: number[];
  };
  gapData: {
    inputs: number[][];
    outputs: number[][];
  };
  cptData: {
    inputs: number[][];
    outputs: number[][];
  };
}

const MEDICAL_TEMPLATES = {
  excellent: `CHIEF COMPLAINT: Patient presents for routine diabetes follow-up.\nHISTORY OF PRESENT ILLNESS:\n45-year-old male with type 2 diabetes mellitus diagnosed 5 years ago. Reports good glycemic control with current regimen. Denies hypoglycemia. Last A1c 6.8%. Location: No specific pain. Quality: Feeling well. Severity: Mild fatigue (2/10). Duration: 2 weeks. Timing: Intermittent. Context: Work-related stress. Modifying factors: Better with rest. Associated symptoms: None.\nREVIEW OF SYSTEMS: ...\nVITAL SIGNS: ...\nPHYSICAL EXAM: ...\nASSESSMENT: DM well controlled.\nPLAN: Continue meds.\nTIME: 25 minutes counseling`,
  good: `CC: Diabetes check-up\nHPI: ...`,
  fair: `Patient here for diabetes. ...`,
  poor: `Diabetes patient. ...`,
  critical: `DM check. ...`,
};

export function generateTrainingData(count: number = 100): TrainingExample[] {
  const examples: TrainingExample[] = [];
  for (let i = 0; i < count; i++) {
    const qualities = ['excellent', 'good', 'fair', 'poor', 'critical'] as const;
    const quality = qualities[Math.floor(Math.random() * qualities.length)];
    let text = MEDICAL_TEMPLATES[quality];
    const qualityScores = {
      excellent: 95 + Math.random() * 5,
      good: 75 + Math.random() * 15,
      fair: 50 + Math.random() * 20,
      poor: 20 + Math.random() * 20,
      critical: Math.random() * 20,
    };
    const score = qualityScores[quality];
    const features = TextPreprocessor.preprocessText(text);
    const gaps: string[] = [];
    examples.push({ text, qualityScore: score, gaps, cptCodes: [], features });
  }
  return examples;
}

export async function applyFeedback(examples: TrainingExample[]) {
  await tf.ready();
  const model = (QualityPrediction as any).getModel ? (QualityPrediction as any).getModel() : null;
  if (!model) return;
  const xs = tf.tensor2d(examples.map(e => e.features));
  const ys = tf.tensor1d(examples.map(e => e.qualityScore / 100));
  await model.fit(xs, ys, { epochs: 1, batchSize: 8, shuffle: true });
  await model.save('localstorage://quality-model');
  xs.dispose();
  ys.dispose();
}
