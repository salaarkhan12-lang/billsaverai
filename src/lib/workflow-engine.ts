// Workflow engine for QA processes and automated checks
// Handles quality assurance workflows and approval processes

import type { AnalysisResult } from "./billing-rules";

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  category: 'quality' | 'compliance' | 'revenue' | 'documentation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: (result: AnalysisResult) => boolean;
  action: (result: AnalysisResult) => WorkflowAction;
  enabled: boolean;
}

export interface WorkflowAction {
  type: 'flag' | 'approve' | 'reject' | 'review' | 'escalate';
  message: string;
  priority: number;
  suggestedActions?: string[];
  automatedFix?: (result: AnalysisResult) => AnalysisResult;
}

export interface WorkflowResult {
  passed: boolean;
  actions: WorkflowAction[];
  score: number;
  recommendations: string[];
  automatedFixes: AnalysisResult[];
}

export class WorkflowEngine {
  private rules: WorkflowRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  // Initialize default QA rules
  private initializeDefaultRules(): void {
    this.rules = [
      // Critical revenue rules
      {
        id: 'critical-revenue-loss',
        name: 'Critical Revenue Loss Detection',
        description: 'Flags documents with potential revenue loss over $500',
        category: 'revenue',
        severity: 'critical',
        enabled: true,
        condition: (result) => {
          const loss = this.extractRevenueAmount(result.totalPotentialRevenueLoss);
          return loss > 500;
        },
        action: (result) => ({
          type: 'escalate',
          message: `Critical revenue opportunity: ${result.totalPotentialRevenueLoss} potential loss detected`,
          priority: 10,
          suggestedActions: [
            'Immediate review by billing specialist',
            'Schedule provider education session',
            'Add to high-priority audit queue'
          ]
        })
      },

      // Documentation quality rules
      {
        id: 'missing-time-documentation',
        name: 'Missing Time Documentation',
        description: 'Flags E/M services without time documentation',
        category: 'documentation',
        severity: 'high',
        enabled: true,
        condition: (result) => !result.timeDocumented && parseInt(result.currentEMLevel) >= 3,
        action: (result) => ({
          type: 'flag',
          message: 'High-level E/M service missing time documentation',
          priority: 8,
          suggestedActions: [
            'Query provider for time spent',
            'Review supporting documentation',
            'Consider downcoding if time cannot be verified'
          ]
        })
      },

      {
        id: 'missing-meat-criteria',
        name: 'Missing MEAT Criteria',
        description: 'Flags services without sufficient MEAT criteria',
        category: 'documentation',
        severity: 'high',
        enabled: true,
        condition: (result) => !result.meatCriteriaMet,
        action: (result) => ({
          type: 'flag',
          message: 'Documentation lacks sufficient MEAT criteria for medical decision making',
          priority: 7,
          suggestedActions: [
            'Review for additional supporting documentation',
            'Query provider for missing elements',
            'Consider MDM downcoding'
          ]
        })
      },

      // Compliance rules
      {
        id: 'multiple-critical-gaps',
        name: 'Multiple Critical Documentation Gaps',
        description: 'Flags documents with 3+ critical documentation issues',
        category: 'compliance',
        severity: 'critical',
        enabled: true,
        condition: (result) => result.gaps.filter(gap => gap.category === 'critical').length >= 3,
        action: (result) => ({
          type: 'escalate',
          message: 'Multiple critical documentation deficiencies detected',
          priority: 9,
          suggestedActions: [
            'Immediate compliance review',
            'Provider education and training',
            'Consider temporary suspension of billing privileges'
          ]
        })
      },

      // Quality improvement rules
      {
        id: 'upcode-opportunity',
        name: 'Revenue Upcode Opportunity',
        description: 'Identifies potential for higher-level coding',
        category: 'revenue',
        severity: 'medium',
        enabled: true,
        condition: (result) => result.potentialUpcodeOpportunity === true,
        action: (result) => ({
          type: 'review',
          message: `Potential upcode opportunity from ${result.currentEMLevel} to ${result.suggestedEMLevel}`,
          priority: 5,
          suggestedActions: [
            'Review documentation for additional qualifying elements',
            'Query provider for missing information',
            'Consider supplemental documentation'
          ]
        })
      },

      // Low quality score rule
      {
        id: 'low-quality-score',
        name: 'Low Quality Score',
        description: 'Flags documents with quality scores below 60%',
        category: 'quality',
        severity: 'high',
        enabled: true,
        condition: (result) => result.overallScore < 60,
        action: (result) => ({
          type: 'flag',
          message: `Low documentation quality score: ${result.overallScore}/100`,
          priority: 6,
          suggestedActions: [
            'Comprehensive documentation review',
            'Provider feedback and education',
            'Template and documentation training'
          ]
        })
      }
    ];
  }

  // Add custom rule
  addRule(rule: WorkflowRule): void {
    this.rules.push(rule);
  }

  // Remove rule
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  // Enable/disable rule
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  // Execute workflow on analysis result
  executeWorkflow(result: AnalysisResult): WorkflowResult {
    const actions: WorkflowAction[] = [];
    let totalScore = 100;
    const recommendations: string[] = [];
    const automatedFixes: AnalysisResult[] = [];

    // Execute enabled rules
    for (const rule of this.rules.filter(r => r.enabled)) {
      if (rule.condition(result)) {
        const action = rule.action(result);
        actions.push(action);

        // Adjust score based on severity
        const scorePenalty = this.getScorePenalty(rule.severity);
        totalScore = Math.max(0, totalScore - scorePenalty);

        // Add recommendations
        if (action.suggestedActions) {
          recommendations.push(...action.suggestedActions);
        }

        // Apply automated fixes if available
        if (action.automatedFix) {
          const fixedResult = action.automatedFix(result);
          automatedFixes.push(fixedResult);
        }
      }
    }

    // Sort actions by priority
    actions.sort((a, b) => b.priority - a.priority);

    // Remove duplicate recommendations
    const uniqueRecommendations = [...new Set(recommendations)];

    const passed = actions.filter(a => a.type === 'reject' || a.type === 'escalate').length === 0;

    return {
      passed,
      actions,
      score: Math.round(totalScore),
      recommendations: uniqueRecommendations,
      automatedFixes
    };
  }

  // Batch workflow execution
  executeBatchWorkflow(results: AnalysisResult[]): WorkflowResult[] {
    return results.map(result => this.executeWorkflow(result));
  }

  // Get score penalty based on severity
  private getScorePenalty(severity: string): number {
    switch (severity) {
      case 'critical': return 25;
      case 'high': return 15;
      case 'medium': return 8;
      case 'low': return 3;
      default: return 0;
    }
  }

  // Extract revenue amount from string
  private extractRevenueAmount(revenueString: string): number {
    const match = revenueString.match(/\$?([\d,]+)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return 0;
  }

  // Get all rules
  getRules(): WorkflowRule[] {
    return [...this.rules];
  }

  // Get rules by category
  getRulesByCategory(category: WorkflowRule['category']): WorkflowRule[] {
    return this.rules.filter(rule => rule.category === category);
  }

  // Export workflow configuration
  exportConfiguration(): string {
    return JSON.stringify(this.rules, null, 2);
  }

  // Import workflow configuration
  importConfiguration(configJson: string): void {
    try {
      const importedRules = JSON.parse(configJson);
      if (Array.isArray(importedRules)) {
        this.rules = importedRules;
      }
    } catch (error) {
      throw new Error('Invalid workflow configuration format');
    }
  }
}

// Utility functions
export function createWorkflowEngine(): WorkflowEngine {
  return new WorkflowEngine();
}

export function executeQualityCheck(result: AnalysisResult): WorkflowResult {
  const engine = new WorkflowEngine();
  return engine.executeWorkflow(result);
}

export function getWorkflowSummary(results: WorkflowResult[]): {
  totalPassed: number;
  totalFailed: number;
  averageScore: number;
  topIssues: Array<{ issue: string; count: number }>;
} {
  const totalPassed = results.filter(r => r.passed).length;
  const totalFailed = results.length - totalPassed;
  const averageScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;

  // Count top issues
  const issueCounts = new Map<string, number>();
  results.forEach(result => {
    result.actions.forEach(action => {
      const count = issueCounts.get(action.message) || 0;
      issueCounts.set(action.message, count + 1);
    });
  });

  const topIssues = Array.from(issueCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue, count]) => ({ issue, count }));

  return {
    totalPassed,
    totalFailed,
    averageScore,
    topIssues
  };
}
