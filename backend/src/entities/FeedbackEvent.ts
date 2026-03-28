import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('feedback_events')
@Index(['userId', 'createdAt'])
@Index(['analysisId', 'createdAt'])
export class FeedbackEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  analysisId?: string;

  @Column({ type: 'jsonb' })
  payload!: {
    gapId?: string;
    correct?: boolean;
    reasonCode?: string;
    note?: string;
  };

  @CreateDateColumn()
  createdAt!: Date;
}
