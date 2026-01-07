// Training script for BillSaver ML models
// Run this in the browser console or as a Node.js script to train the models

import * as tf from '@tensorflow/tfjs';
import { generateTrainingData, prepareTrainingData, trainQualityModel, trainGapModel, trainCPTModel } from './src/lib/model-training.js';

async function trainModels() {
  console.log('🚀 Starting BillSaver ML Model Training...');

  try {
    // Generate training data
    console.log('📊 Generating training data...');
    const examples = generateTrainingData(200);
    console.log(`✅ Generated ${examples.length} training examples`);

    // Prepare data for TensorFlow
    console.log('🔄 Preparing training data...');
    const trainingData = prepareTrainingData(examples);
    console.log('✅ Training data prepared');

    // Train quality prediction model
    console.log('🧠 Training quality prediction model...');
    const qualityModel = await trainQualityModel(trainingData);
    console.log('✅ Quality model trained');

    // Train gap detection model
    console.log('🔍 Training gap detection model...');
    const gapModel = await trainGapModel(trainingData);
    console.log('✅ Gap detection model trained');

    // Train CPT code prediction model
    console.log('🏥 Training CPT code prediction model...');
    const cptModel = await trainCPTModel(trainingData);
    console.log('✅ CPT code model trained');

    // Save models to localStorage
    console.log('💾 Saving models...');
    await saveModelToStorage('billsaver_quality_model', qualityModel);
    await saveModelToStorage('billsaver_gap_model', gapModel);
    await saveModelToStorage('billsaver_cpt_model', cptModel);

    console.log('🎉 All models trained and saved successfully!');
    console.log('📈 Models are now ready for use in the application.');

  } catch (error) {
    console.error('❌ Training failed:', error);
  }
}

// Helper function to save models
async function saveModelToStorage(key, model) {
  try {
    const modelJson = await model.toJSON();
    const modelArtifacts = await model.save('localstorage://' + key);

    localStorage.setItem(`${key}_json`, JSON.stringify(modelJson));
    localStorage.setItem(`${key}_artifacts`, JSON.stringify(modelArtifacts));

    console.log(`💾 Model ${key} saved to localStorage`);
  } catch (error) {
    console.error(`❌ Failed to save model ${key}:`, error);
  }
}

// Run training if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.trainBillsaverModels = trainModels;
  console.log('💡 Training function available as window.trainBillsaverModels()');
  console.log('💡 Run this in the browser console to train the models');
} else {
  // Node.js environment
  trainModels();
}
