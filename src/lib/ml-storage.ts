// ML Model Storage using IndexedDB
// Provides persistent storage for trained TensorFlow.js models

interface ModelStorageData {
  modelJson: any;
  modelArtifacts: any;
  metadata: {
    version: string;
    createdAt: Date;
    trainingDataSize: number;
    accuracy?: number;
  };
}

class MLModelStorage {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'BillSaverML';
  private readonly dbVersion = 1;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.warn('IndexedDB not available, falling back to localStorage');
        resolve(); // Don't reject, just warn
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models', { keyPath: 'modelKey' });
        }
      };
    });
  }

  async saveModel(
    modelKey: string,
    modelJson: any,
    modelArtifacts: any,
    metadata: Partial<ModelStorageData['metadata']> = {}
  ): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      // Fallback to localStorage
      return this.saveToLocalStorage(modelKey, modelJson, modelArtifacts, metadata);
    }

    const data: ModelStorageData = {
      modelJson,
      modelArtifacts,
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        trainingDataSize: 0,
        ...metadata,
      },
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['models'], 'readwrite');
      const store = transaction.objectStore('models');

      const request = store.put({ modelKey, ...data });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadModel(modelKey: string): Promise<ModelStorageData | null> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      // Fallback to localStorage
      return this.loadFromLocalStorage(modelKey);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['models'], 'readonly');
      const store = transaction.objectStore('models');

      const request = store.get(modelKey);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteModel(modelKey: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      // Fallback to localStorage
      this.deleteFromLocalStorage(modelKey);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['models'], 'readwrite');
      const store = transaction.objectStore('models');

      const request = store.delete(modelKey);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async listModels(): Promise<string[]> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      // Fallback to localStorage
      return this.listLocalStorageModels();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['models'], 'readonly');
      const store = transaction.objectStore('models');

      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageStats(): Promise<{
    totalModels: number;
    totalSize: number;
    models: Array<{ key: string; size: number; createdAt: Date }>;
  }> {
    const models = await this.listModels();
    let totalSize = 0;
    const modelDetails: Array<{ key: string; size: number; createdAt: Date }> = [];

    for (const key of models) {
      const model = await this.loadModel(key);
      if (model) {
        const size = JSON.stringify(model).length;
        totalSize += size;
        modelDetails.push({
          key,
          size,
          createdAt: model.metadata.createdAt,
        });
      }
    }

    return {
      totalModels: models.length,
      totalSize,
      models: modelDetails,
    };
  }

  // Fallback methods for localStorage
  private saveToLocalStorage(
    modelKey: string,
    modelJson: any,
    modelArtifacts: any,
    metadata: Partial<ModelStorageData['metadata']>
  ): void {
    try {
      const data: ModelStorageData = {
        modelJson,
        modelArtifacts,
        metadata: {
          version: '1.0.0',
          createdAt: new Date(),
          trainingDataSize: 0,
          ...metadata,
        },
      };

      localStorage.setItem(`ml_model_${modelKey}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save model to localStorage:', error);
    }
  }

  private loadFromLocalStorage(modelKey: string): ModelStorageData | null {
    try {
      const stored = localStorage.getItem(`ml_model_${modelKey}`);
      if (!stored) return null;

      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load model from localStorage:', error);
      return null;
    }
  }

  private deleteFromLocalStorage(modelKey: string): void {
    localStorage.removeItem(`ml_model_${modelKey}`);
  }

  private listLocalStorageModels(): string[] {
    const models: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('ml_model_')) {
        models.push(key.replace('ml_model_', ''));
      }
    }
    return models;
  }

  // Clear all stored models (for testing/admin purposes)
  async clearAllModels(): Promise<void> {
    const models = await this.listModels();
    await Promise.all(models.map(key => this.deleteModel(key)));
    console.log(`Cleared ${models.length} stored models`);
  }
}

// Singleton instance
export const modelStorage = new MLModelStorage();

// Initialize storage on module load
modelStorage.initialize().catch(console.error);

// Utility functions for model management
export async function saveTrainedModel(
  modelKey: string,
  model: any, // TensorFlow model
  metadata: Partial<ModelStorageData['metadata']> = {}
): Promise<void> {
  try {
    const modelJson = await model.toJSON();
    const modelArtifacts = await model.save('downloads://temp'); // Temporary save to get artifacts

    await modelStorage.saveModel(modelKey, modelJson, modelArtifacts, metadata);
    console.log(`Model ${modelKey} saved successfully`);
  } catch (error) {
    console.error(`Failed to save model ${modelKey}:`, error);
    throw error;
  }
}

export async function loadTrainedModel(modelKey: string): Promise<any | null> {
  try {
    const storedData = await modelStorage.loadModel(modelKey);
    if (!storedData) return null;

    // Reconstruct TensorFlow model from stored data
    const model = await tf.models.modelFromJSON(storedData.modelJson);

    // Load weights if available
    if (storedData.modelArtifacts && storedData.modelArtifacts.weightData) {
      model.setWeights(storedData.modelArtifacts.weightData);
    }

    console.log(`Model ${modelKey} loaded successfully`);
    return model;
  } catch (error) {
    console.error(`Failed to load model ${modelKey}:`, error);
    return null;
  }
}

// Import tf here to avoid circular dependencies
import * as tf from '@tensorflow/tfjs';
