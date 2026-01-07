// Model Training and Data Generation for BillSaver ML Models
// Generates synthetic training data and trains client-side models

import * as tf from '@tensorflow/tfjs';
import { QualityPrediction, TextPreprocessor } from './ml-models';

// Training data interfaces
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

// Sample medical note templates for data generation
const MEDICAL_TEMPLATES = {
  excellent: `
CHIEF COMPLAINT: Patient presents for routine diabetes follow-up.

HISTORY OF PRESENT ILLNESS:
45-year-old male with type 2 diabetes mellitus diagnosed 5 years ago.
Reports good glycemic control with current regimen. Denies hypoglycemia.
Last A1c 6.8%. Location: No specific pain. Quality: Feeling well.
Severity: Mild fatigue (2/10). Duration: 2 weeks. Timing: Intermittent.
Context: Work-related stress. Modifying factors: Better with rest.
Associated symptoms: None.

REVIEW OF SYSTEMS:
Constitutional: Denies fever, weight loss
Eyes: Denies vision changes
ENT: Denies sore throat
Cardiovascular: Denies chest pain, palpitations
Respiratory: Denies cough, SOB
GI: Denies nausea, abdominal pain
GU: Denies dysuria
MSK: Mild low back pain
Skin: Denies rash
Neuro: Denies headache
Psych: Mild stress
Endocrine: As above
Hematologic: Denies bleeding
Allergic: No new allergies

VITAL SIGNS: BP 128/82, HR 72, RR 16, O2 98%, BMI 29.5

PHYSICAL EXAM:
General: Well-appearing, no distress
HEENT: Normocephalic, PERRLA, oropharynx clear
Neck: Supple, no JVD
CV: RRR, no murmurs
Resp: Clear bilaterally
Abd: Soft, NT, no masses
Ext: No edema, pulses 2+
Neuro: CN II-XII intact, strength 5/5

LABS REVIEWED: A1c 6.8% (improved), BMP normal, lipids acceptable

ASSESSMENT:
1. Type 2 DM, well-controlled - E11.9
2. Hypertension, controlled - I10
3. Obesity - E66.9

PLAN:
Diabetes: Continue metformin 1000mg BID, monitor A1c q3months
HTN: Continue lisinopril 10mg daily
Obesity: Discuss weight management, refer to nutrition
Follow-up: 3 months

TIME: 25 minutes counseling on lifestyle modifications
`,

  good: `
CC: Diabetes check-up

HPI: 45 yo male with DM2 x5 years. Doing well on current meds.
A1c was 7.2 last time. No hypo episodes. Some fatigue.

ROS: Denies fever, vision changes, chest pain, SOB, abdominal pain.
Mild back pain.

VS: BP 130/85, HR 75, BMI 30

PE: General: NAD
CV: RRR
Resp: Clear
Abd: Soft

Labs: A1c 7.2, Cr 1.0

A/P:
DM2 - continue metformin
HTN - continue lisinopril
FU 3 months
`,

  fair: `
Patient here for diabetes.

Has diabetes for 5 years. Feeling okay.
BP 135/90
Weight 200 lbs

Exam: Looks fine.
Heart regular.
Lungs clear.

Continue medications.
Come back in 3 months.
`,

  poor: `
Diabetes patient.
Okay.
BP normal.
Continue meds.
`,

  critical: `
DM check.
Fine.
`,

  withLabs: `
CHIEF COMPLAINT: Follow-up for diabetes management.

HPI: Patient reports stable blood sugars. Recent labs show A1c 7.5%.

LABS ORDERED: CBC, CMP, A1c, Lipid panel, Urinalysis.

ASSESSMENT: Diabetes mellitus type 2

PLAN: Adjust medications based on labs. Follow-up in 2 weeks.
`,

  withImaging: `
CHIEF COMPLAINT: Chest pain evaluation.

HPI: 55 yo male with substernal chest pain x2 days.

IMAGING ORDERED: Chest X-ray, EKG, Troponin.

ASSESSMENT: Chest pain, rule out cardiac etiology.

PLAN: Obtain imaging studies. Admit for observation if indicated.
`,

  withProcedures: `
CHIEF COMPLAINT: Joint pain.

HPI: Bilateral knee pain limiting ambulation.

PROCEDURE PERFORMED: Bilateral knee injections with 1% lidocaine and kenalog.

ASSESSMENT: Osteoarthritis knees

PLAN: Pain improved post-procedure. Follow-up PRN.
`,
};

// Generate synthetic training dataset
export function generateTrainingData(count: number = 100): TrainingExample[] {
  const examples: TrainingExample[] = [];

  for (let i = 0; i < count; i++) {
    // Randomly select template quality
    const qualities = ['excellent', 'good', 'fair', 'poor', 'critical'] as const;
    const quality = qualities[Math.floor(Math.random() * qualities.length)];

    // Get base template
    let text = MEDICAL_TEMPLATES[quality];

    // Add random variations
    if (Math.random() > 0.5) {
      // Add labs
      text += MEDICAL_TEMPLATES.withLabs;
    }
    if (Math.random() > 0.7) {
      // Add imaging
      text += MEDICAL_TEMPLATES.withImaging;
    }
    if (Math.random() > 0.8) {
      // Add procedures
      text += MEDICAL_TEMPLATES.withProcedures;
    }

    // Calculate quality score based on template
    const qualityScores = {
      excellent: 95 + Math.random() * 5,
      good: 75 + Math.random() * 15,
      fair: 50 + Math.random() * 20,
      poor: 20 + Math.random() * 20,
      critical: Math.random() * 20,
    };

    const score = qualityScores[quality];

    // Extract features
    const features = TextPreprocessor.preprocessText(text);

    // Generate gaps based on quality
    const gaps = generateGapsForQuality(quality, text);

    // Generate CPT codes
    const cptCodes = generateCPTCodes(text);

    examples.push({
      text,
      qualityScore: score,
      gaps,
      cptCodes,
      features,
    });
  }

  return examples;
}

function generateGapsForQuality(quality: string, text: string): string[] {
  const gaps: string[] = [];

  if (quality === 'critical' || quality === 'poor') {
    gaps.push('missing_chief_complaint', 'missing_assessment', 'missing_plan');
  } else if (quality === 'fair') {
    if (!text.includes('assessment')) gaps.push('missing_assessment');
    if (!text.includes('plan')) gaps.push('missing_plan');
  }

  // Add subtle gaps
  if (!text.includes('time') && Math.random() > 0.5) {
    gaps.push('missing_time');
  }

  if (!text.includes('vital') && Math.random() > 0.6) {
    gaps.push('missing_vitals');
  }

  return gaps;
}

function generateCPTCodes(text: string): string[] {
  const codes: string[] = [];

  // E/M codes based on complexity
  if (text.includes('comprehensive') || text.length > 2000) {
    codes.push('99215');
  } else if (text.includes('detailed') || text.length > 1500) {
    codes.push('99214');
  } else {
    codes.push('99213');
  }

  // Lab codes
  if (text.includes('a1c') || text.includes('hemoglobin')) {
    codes.push('83036');
  }
  if (text.includes('cbc')) {
    codes.push('85025');
  }
  if (text.includes('cmp') || text.includes('metabolic')) {
    codes.push('80053');
  }

  // Imaging codes
  if (text.includes('chest x-ray') || text.includes('cxr')) {
    codes.push('71045');
  }
  if (text.includes('ekg') || text.includes('electrocardiogram')) {
    codes.push('93000');
  }

  // Procedure codes
  if (text.includes('injection') || text.includes('joint injection')) {
    codes.push('20610');
  }

  return codes;
}

// Convert training examples to TensorFlow datasets
export function prepareTrainingData(examples: TrainingExample[]): ModelTrainingData {
  const qualityInputs: number[][] = [];
  const qualityOutputs: number[] = [];

  const gapInputs: number[][] = [];
  const gapOutputs: number[][] = [];

  const cptInputs: number[][] = [];
  const cptOutputs: number[][] = [];

  examples.forEach(example => {
    // Quality data
    qualityInputs.push(example.features);
    qualityOutputs.push(example.qualityScore / 100); // Normalize to 0-1

    // Gap data (simplified: binary classification for common gaps)
    gapInputs.push(example.features);
    const gapVector = [
      example.gaps.includes('missing_chief_complaint') ? 1 : 0,
      example.gaps.includes('missing_assessment') ? 1 : 0,
      example.gaps.includes('missing_plan') ? 1 : 0,
      example.gaps.includes('missing_time') ? 1 : 0,
      example.gaps.includes('missing_vitals') ? 1 : 0,
    ];
    gapOutputs.push(gapVector);

    // CPT data (multi-label classification)
    cptInputs.push(example.features);
    const cptVector = [
      example.cptCodes.includes('99215') ? 1 : 0,
      example.cptCodes.includes('99214') ? 1 : 0,
      example.cptCodes.includes('99213') ? 1 : 0,
      example.cptCodes.includes('83036') ? 1 : 0,
      example.cptCodes.includes('85025') ? 1 : 0,
      example.cptCodes.includes('71045') ? 1 : 0,
    ];
    cptOutputs.push(cptVector);
  });

  return {
    qualityData: {
      inputs: qualityInputs,
      outputs: qualityOutputs,
    },
    gapData: {
      inputs: gapInputs,
      outputs: gapOutputs,
    },
    cptData: {
      inputs: cptInputs,
      outputs: cptOutputs,
    },
  };
}

// Train quality prediction model
export async function trainQualityModel(data: ModelTrainingData): Promise<tf.LayersModel> {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [4], units: 32, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 16, activation: 'relu' }),
      tf.layers.dense({ units: 1, activation: 'sigmoid' }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mae'],
  });

  const xs = tf.tensor2d(data.qualityData.inputs);
  const ys = tf.tensor1d(data.qualityData.outputs);

  await model.fit(xs, ys, {
    epochs: 50,
    batchSize: 16,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 10 === 0) {
          console.log(`Quality Model - Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}`);
        }
      },
    },
  });

  xs.dispose();
  ys.dispose();

  return model;
}

// Train gap detection model
export async function trainGapModel(data: ModelTrainingData): Promise<tf.LayersModel> {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [4], units: 32, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 16, activation: 'relu' }),
      tf.layers.dense({ units: 5, activation: 'sigmoid' }), // 5 gap types
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  const xs = tf.tensor2d(data.gapData.inputs);
  const ys = tf.tensor2d(data.gapData.outputs);

  await model.fit(xs, ys, {
    epochs: 50,
    batchSize: 16,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 10 === 0) {
          console.log(`Gap Model - Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}`);
        }
      },
    },
  });

  xs.dispose();
  ys.dispose();

  return model;
}

// Train CPT code prediction model
export async function trainCPTModel(data: ModelTrainingData): Promise<tf.LayersModel> {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [4], units: 32, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 16, activation: 'relu' }),
      tf.layers.dense({ units: 6, activation: 'sigmoid' }), // 6 CPT code types
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  const xs = tf.tensor2d(data.cptData.inputs);
  const ys = tf.tensor2d(data.cptData.outputs);

  await model.fit(xs, ys, {
    epochs: 50,
    batchSize: 16,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 10 === 0) {
          console.log(`CPT Model - Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}`);
        }
      },
    },
  });

  xs.dispose();
  ys.dispose();

  return model;
}

// Main training function
export async function trainAllModels(): Promise<void> {
  console.log('Generating training data...');
  const examples = generateTrainingData(200);
  const trainingData = prepareTrainingData(examples);

  console.log('Training quality prediction model...');
  const qualityModel = await trainQualityModel(trainingData);

  console.log('Training gap detection model...');
  const gapModel = await trainGapModel(trainingData);

  console.log('Training CPT code prediction model...');
  const cptModel = await trainCPTModel(trainingData);

  console.log('Saving models to local storage...');
  await saveModelToStorage('billsaver_quality_model', qualityModel);
  await saveModelToStorage('billsaver_gap_model', gapModel);
  await saveModelToStorage('billsaver_cpt_model', cptModel);

  console.log('Model training completed!');
}

// Save model to localStorage (simplified - in production use IndexedDB)
async function saveModelToStorage(key: string, model: tf.LayersModel): Promise<void> {
  try {
    const modelJson = await model.toJSON();
    const modelArtifacts = await model.save('localstorage://' + key);

    localStorage.setItem(`${key}_json`, JSON.stringify(modelJson));
    localStorage.setItem(`${key}_artifacts`, JSON.stringify(modelArtifacts));
  } catch (error) {
    console.error('Failed to save model:', error);
  }
}
