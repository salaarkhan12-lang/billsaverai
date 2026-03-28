import { AppDataSource } from '../config/database';
import { AnalysisResult, AnalysisStatus } from '../entities/AnalysisResult';
import { Repository } from 'typeorm';

export class AnalysisResultService {
  private repo: Repository<AnalysisResult>;

  constructor() {
    this.repo = AppDataSource.getRepository(AnalysisResult);
  }

  async storeMetadataOnly(userId: string, metadata: Record<string, any>): Promise<AnalysisResult> {
    const entity = this.repo.create({
      userId,
      status: AnalysisStatus.COMPLETED,
      encryptedData: '',
      dataHash: '',
      encryptionKeySalt: '',
      encryptionIv: '',
      metadataSafe: metadata
    });
    return await this.repo.save(entity);
  }
}
