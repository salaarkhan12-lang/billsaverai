#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');

async function main() {
  const feedbackPath = path.join(process.cwd(), 'feedback.json');
  if (!fs.existsSync(feedbackPath)) {
    console.log('No feedback.json found; nothing to retrain.');
    return;
  }
  const data = JSON.parse(fs.readFileSync(feedbackPath, 'utf8'));
  if (!data.length) {
    console.log('No feedback entries.');
    return;
  }
  const xs = tf.tensor2d(data.map(d => d.features));
  const ys = tf.tensor1d(data.map(d => d.qualityScore / 100));
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [data[0].features.length] }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  await model.fit(xs, ys, { epochs: 2, batchSize: 8, shuffle: true });
  await model.save('file://.local-model');
  xs.dispose();
  ys.dispose();
  console.log('Retrain complete, model saved to .local-model');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
