import * as tf from '@tensorflow/tfjs';

export class QualityPrediction {
  private model: tf.LayersModel | null = null;

  async init() {
    if (this.model) return;
    await tf.ready();
    this.model = tf.sequential();
    this.model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [256] }));
    this.model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    this.model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  }

  static getModel(): tf.LayersModel | null {
    return (qualityPredictor as any).model || null;
  }
}

export class TextPreprocessor {
  static preprocessText(text: string): number[] {
    const MAX_LEN = 256;
    const normalized = text.toLowerCase().slice(0, MAX_LEN);
    const arr = new Array(MAX_LEN).fill(0);
    for (let i = 0; i < normalized.length; i++) {
      arr[i] = normalized.charCodeAt(i) / 255;
    }
    return arr;
  }
}

export const qualityPredictor = new QualityPrediction();
