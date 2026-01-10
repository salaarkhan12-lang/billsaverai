/**
 * Progress Tracker Utility for v1.6.0
 * Manages multi-stage progress tracking with real-time updates and time estimation
 */

export interface ProgressStage {
    id: number;
    name: string;
    message: string;
    icon: string;
    range: [number, number]; // [min%, max%]
}

export interface ProgressUpdate {
    currentStage: ProgressStage;
    overallPercent: number;
    message: string;
    icon: string;
    estimatedTimeRemaining?: number; // seconds
}

export const PROGRESS_STAGES: ProgressStage[] = [
    {
        id: 1,
        name: "init",
        message: "Initializing document processor...",
        icon: "📄",
        range: [0, 15]
    },
    {
        id: 2,
        name: "extract",
        message: "Extracting text from PDF...",
        icon: "🔍",
        range: [15, 35]
    },
    {
        id: 3,
        name: "ocr",
        message: "Running OCR on scanned pages...",
        icon: "👁️",
        range: [35, 60]
    },
    {
        id: 4,
        name: "analyze",
        message: "Analyzing documentation quality...",
        icon: "📊",
        range: [60, 75]
    },
    {
        id: 5,
        name: "codes",
        message: "Extracting billing codes...",
        icon: "💊",
        range: [75, 85]
    },
    {
        id: 6,
        name: "revenue",
        message: "Calculating revenue impact...",
        icon: "💰",
        range: [85, 95]
    },
    {
        id: 7,
        name: "finalize",
        message: "Finalizing analysis...",
        icon: "✨",
        range: [95, 100]
    }
];

export class ProgressTracker {
    private stages: ProgressStage[];
    private currentStageIndex: number = 0;
    private startTime: number = 0;
    private onUpdate: (update: ProgressUpdate) => void;

    constructor(onUpdate: (update: ProgressUpdate) => void) {
        this.stages = PROGRESS_STAGES;
        this.onUpdate = onUpdate;
    }

    /**
     * Start progress tracking
     */
    start() {
        this.startTime = Date.now();
        this.currentStageIndex = 0;
        this.emitUpdate(0);
    }

    /**
     * Move to specific stage by name
     */
    setStage(stageName: string, percentInStage: number = 0) {
        const stageIndex = this.stages.findIndex(s => s.name === stageName);
        if (stageIndex !== -1) {
            this.currentStageIndex = stageIndex;
            this.emitUpdate(percentInStage);
        }
    }

    /**
     * Update progress within current stage
     * @param percentInStage 0-100 representing progress within the current stage
     */
    updateProgress(percentInStage: number) {
        this.emitUpdate(Math.min(Math.max(percentInStage, 0), 100));
    }

    /**
     * Mark as complete
     */
    complete() {
        this.currentStageIndex = this.stages.length - 1;
        this.emitUpdate(100);
    }

    /**
     * Calculate overall progress percentage
     */
    private calculateOverallPercent(percentInStage: number): number {
        const stage = this.stages[this.currentStageIndex];
        if (!stage) return 0;

        const [min, max] = stage.range;
        const stageRange = max - min;
        const stageProgress = (percentInStage / 100) * stageRange;

        return Math.min(Math.round(min + stageProgress), 100);
    }

    /**
     * Estimate time remaining based on elapsed time
     */
    private estimateTimeRemaining(currentPercent: number): number | undefined {
        if (currentPercent <= 0 || !this.startTime) return undefined;

        const elapsed = (Date.now() - this.startTime) / 1000; // seconds
        const totalEstimated = (elapsed / currentPercent) * 100;
        const remaining = Math.max(0, totalEstimated - elapsed);

        // Return in whole seconds, max 60 seconds
        return Math.min(Math.round(remaining), 60);
    }

    /**
     * Emit progress update to callback
     */
    private emitUpdate(percentInStage: number) {
        const stage = this.stages[this.currentStageIndex];
        if (!stage) return;

        const overallPercent = this.calculateOverallPercent(percentInStage);
        const estimatedTimeRemaining = this.estimateTimeRemaining(overallPercent);

        this.onUpdate({
            currentStage: stage,
            overallPercent,
            message: stage.message,
            icon: stage.icon,
            estimatedTimeRemaining
        });
    }
}
