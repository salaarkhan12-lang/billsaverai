import { AppDataSource } from '../config/database';
import { AnalysisResult as AnalysisResultEntity, AnalysisStatus } from '../entities/AnalysisResult';
import { User } from '../entities/User';
import { Document } from '../entities/Document';
import { EncryptionService } from './EncryptionService';
import type { AnalysisResult } from '../types/analysis-types';

export interface CreateAnalysisResultRequest {
  result: AnalysisResult;
  fileName?: string;
  documentId?: string;
  encryptedData?: {
    encryptedResult: string;
    dataHash: string;
    encryptionIv: string;
    encryptionKeySalt: string;
    encryptionAuthTag?: string;
  };
}

export interface AnalysisResultResponse {
  id: string;
  fileName: string;
  createdAt: string;
  result: AnalysisResult; // Decrypted result
  documentId?: string;
}

export class AnalysisResultService {
  private encryptionService = new EncryptionService();

  /**
   * Creates a new analysis result
   */
  async createAnalysisResult(
    userId: string,
    request: CreateAnalysisResultRequest
  ): Promise<AnalysisResultEntity> {
    const { result, fileName, documentId, encryptedData } = request;

    // If encrypted data is provided, use it directly
    if (encryptedData) {
      return this.encryptionService.storeEncryptedAnalysisResult(userId, documentId, encryptedData, {
        overallScore: result.overallScore,
        documentationLevel: result.documentationLevel,
        totalPotentialRevenueLoss: result.totalPotentialRevenueLoss,
        suggestedEMLevel: result.suggestedEMLevel,
      });
    }

    // Otherwise, we need to encrypt the result (but we don't have the password)
    // For now, store as plain JSON (this should be changed to require encryption)
    const resultJson = JSON.stringify(result);
    const mockEncryptedData = {
      encryptedResult: Buffer.from(resultJson).toString('base64'), // Mock encryption
      dataHash: await this.encryptionService.computeDataHash(resultJson),
      encryptionIv: Buffer.from('mockiv123456789012').toString('base64'),
      encryptionKeySalt: Buffer.from('mocksalt123456789012').toString('base64'),
    };

    return this.encryptionService.storeEncryptedAnalysisResult(userId, documentId, mockEncryptedData, {
      overallScore: result.overallScore,
      documentationLevel: result.documentationLevel,
      totalPotentialRevenueLoss: result.totalPotentialRevenueLoss,
      suggestedEMLevel: result.suggestedEMLevel,
    });
  }

  /**
   * Gets analysis results for a user
   */
  async getUserAnalysisResults(userId: string): Promise<AnalysisResultResponse[]> {
    const results = await this.encryptionService.listUserAnalysisResults(userId);

    // Decrypt and transform results
    const responses: AnalysisResultResponse[] = [];

    for (const entity of results) {
      try {
        // Mock decryption (should use proper decryption with user password)
        const decryptedJson = Buffer.from(entity.encryptedData, 'base64').toString('utf8');
        const result: AnalysisResult = JSON.parse(decryptedJson);

        responses.push({
          id: entity.id,
          fileName: entity.document?.originalFileName || 'Unknown File',
          createdAt: entity.createdAt.toISOString(),
          result,
          documentId: entity.documentId || undefined,
        });
      } catch (error) {
        console.error(`Failed to decrypt analysis result ${entity.id}:`, error);
        // Skip corrupted results
      }
    }

    return responses;
  }

  /**
   * Gets a specific analysis result
   */
  async getAnalysisResult(userId: string, resultId: string): Promise<AnalysisResultResponse | null> {
    const entity = await this.encryptionService.retrieveEncryptedAnalysisResult(userId, resultId);
    if (!entity) return null;

    try {
      // Mock decryption
      const decryptedJson = Buffer.from(entity.encryptedData, 'base64').toString('utf8');
      const result: AnalysisResult = JSON.parse(decryptedJson);

      return {
        id: entity.id,
        fileName: entity.document?.originalFileName || 'Unknown File',
        createdAt: entity.createdAt.toISOString(),
        result,
        documentId: entity.documentId || undefined,
      };
    } catch (error) {
      console.error(`Failed to decrypt analysis result ${resultId}:`, error);
      return null;
    }
  }

  /**
   * Deletes an analysis result
   */
  async deleteAnalysisResult(userId: string, resultId: string): Promise<boolean> {
    return this.encryptionService.deleteAnalysisResult(userId, resultId);
  }

  /**
   * Exports analysis results as JSON
   */
  async exportAnalysisResults(userId: string, format: string = 'json'): Promise<string> {
    const results = await this.getUserAnalysisResults(userId);
    return JSON.stringify(results, null, 2);
  }

  /**
   * Imports analysis results from JSON
   */
  async importAnalysisResults(userId: string, data: AnalysisResultResponse[]): Promise<number> {
    let importedCount = 0;

    for (const item of data) {
      try {
        await this.createAnalysisResult(userId, {
          result: item.result,
          fileName: item.fileName,
          documentId: item.documentId,
        });
        importedCount++;
      } catch (error) {
        console.error(`Failed to import analysis result ${item.id}:`, error);
      }
    }

    return importedCount;
  }
}
