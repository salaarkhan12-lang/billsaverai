// Advanced filtering and prioritization utilities
// Provides smart filtering and sorting of analysis results

import type { AnalysisResult } from "./billing-rules";

export interface FilterCriteria {
  // Quality filters
  minScore?: number;
  maxScore?: number;
  documentationLevel?: string[];
  emLevel?: string[];

  // Revenue filters
  minRevenueLoss?: number;
  maxRevenueLoss?: number;
  hasRevenueOpportunity?: boolean;

  // Issue filters
  gapCategories?: string[];
  minGapCount?: number;
  maxGapCount?: number;
  hasCriticalGaps?: boolean;
  hasMajorGaps?: boolean;

  // Content filters
  hasTimeDocumentation?: boolean;
  hasMeatCriteria?: boolean;
  hasUpcodeOpportunity?: boolean;

  // Text search
  searchText?: string;

  // Date filters
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SortOption {
  field: 'score' | 'revenueLoss' | 'gapCount' | 'emLevel' | 'date';
  direction: 'asc' | 'desc';
  priority?: number; // For multi-field sorting
}

export interface FilterResult {
  results: AnalysisResult[];
  totalCount: number;
  filteredCount: number;
  appliedFilters: string[];
  sortOrder: SortOption[];
}

export interface PrioritizationRule {
  id: string;
  name: string;
  description: string;
  condition: (result: AnalysisResult) => number; // Returns priority score (higher = more important)
  enabled: boolean;
  weight: number; // Multiplier for the priority score
}

export class AdvancedFilter {
  private prioritizationRules: PrioritizationRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  // Initialize default prioritization rules
  private initializeDefaultRules(): void {
    this.prioritizationRules = [
      {
        id: 'critical-revenue',
        name: 'Critical Revenue Loss',
        description: 'Prioritize documents with high revenue loss potential',
        enabled: true,
        weight: 10,
        condition: (result) => {
          const loss = this.extractRevenueAmount(result.totalPotentialRevenueLoss);
          if (loss > 1000) return 100;
          if (loss > 500) return 75;
          if (loss > 200) return 50;
          return 0;
        }
      },
      {
        id: 'critical-gaps',
        name: 'Critical Documentation Gaps',
        description: 'Prioritize documents with critical compliance issues',
        enabled: true,
        weight: 8,
        condition: (result) => {
          const criticalCount = result.gaps.filter(gap => gap.category === 'critical').length;
          return Math.min(criticalCount * 25, 100);
        }
      },
      {
        id: 'low-quality-score',
        name: 'Low Quality Score',
        description: 'Prioritize documents with poor quality scores',
        enabled: true,
        weight: 6,
        condition: (result) => {
          const score = result.overallScore;
          if (score < 40) return 100;
          if (score < 60) return 75;
          if (score < 80) return 50;
          return 0;
        }
      },
      {
        id: 'upcode-opportunity',
        name: 'Revenue Upcode Opportunity',
        description: 'Prioritize documents with upcoding potential',
        enabled: true,
        weight: 7,
        condition: (result) => result.potentialUpcodeOpportunity ? 80 : 0
      },
      {
        id: 'missing-time-doc',
        name: 'Missing Time Documentation',
        description: 'Prioritize high-level E/M without time documentation',
        enabled: true,
        weight: 5,
        condition: (result) => {
          const emLevel = parseInt(result.currentEMLevel);
          return (!result.timeDocumented && emLevel >= 3) ? 60 : 0;
        }
      },
      {
        id: 'missing-meat',
        name: 'Missing MEAT Criteria',
        description: 'Prioritize documents lacking medical decision making criteria',
        enabled: true,
        weight: 4,
        condition: (result) => !result.meatCriteriaMet ? 40 : 0
      }
    ];
  }

  // Apply filters to results
  filterResults(results: AnalysisResult[], criteria: FilterCriteria): FilterResult {
    let filteredResults = [...results];
    const appliedFilters: string[] = [];

    // Quality filters
    if (criteria.minScore !== undefined) {
      filteredResults = filteredResults.filter(r => r.overallScore >= criteria.minScore!);
      appliedFilters.push(`Score ≥ ${criteria.minScore}`);
    }

    if (criteria.maxScore !== undefined) {
      filteredResults = filteredResults.filter(r => r.overallScore <= criteria.maxScore!);
      appliedFilters.push(`Score ≤ ${criteria.maxScore}`);
    }

    if (criteria.documentationLevel?.length) {
      filteredResults = filteredResults.filter(r => criteria.documentationLevel!.includes(r.documentationLevel));
      appliedFilters.push(`Documentation Level: ${criteria.documentationLevel.join(', ')}`);
    }

    if (criteria.emLevel?.length) {
      filteredResults = filteredResults.filter(r => criteria.emLevel!.includes(r.currentEMLevel));
      appliedFilters.push(`E/M Level: ${criteria.emLevel.join(', ')}`);
    }

    // Revenue filters
    if (criteria.minRevenueLoss !== undefined) {
      filteredResults = filteredResults.filter(r => {
        const loss = this.extractRevenueAmount(r.totalPotentialRevenueLoss);
        return loss >= criteria.minRevenueLoss!;
      });
      appliedFilters.push(`Revenue Loss ≥ $${criteria.minRevenueLoss}`);
    }

    if (criteria.maxRevenueLoss !== undefined) {
      filteredResults = filteredResults.filter(r => {
        const loss = this.extractRevenueAmount(r.totalPotentialRevenueLoss);
        return loss <= criteria.maxRevenueLoss!;
      });
      appliedFilters.push(`Revenue Loss ≤ $${criteria.maxRevenueLoss}`);
    }

    if (criteria.hasRevenueOpportunity) {
      filteredResults = filteredResults.filter(r => r.potentialUpcodeOpportunity);
      appliedFilters.push('Has Revenue Opportunity');
    }

    // Issue filters
    if (criteria.gapCategories?.length) {
      filteredResults = filteredResults.filter(r =>
        r.gaps.some(gap => criteria.gapCategories!.includes(gap.category))
      );
      appliedFilters.push(`Gap Categories: ${criteria.gapCategories.join(', ')}`);
    }

    if (criteria.minGapCount !== undefined) {
      filteredResults = filteredResults.filter(r => r.gaps.length >= criteria.minGapCount!);
      appliedFilters.push(`Gaps ≥ ${criteria.minGapCount}`);
    }

    if (criteria.maxGapCount !== undefined) {
      filteredResults = filteredResults.filter(r => r.gaps.length <= criteria.maxGapCount!);
      appliedFilters.push(`Gaps ≤ ${criteria.maxGapCount}`);
    }

    if (criteria.hasCriticalGaps) {
      filteredResults = filteredResults.filter(r =>
        r.gaps.some(gap => gap.category === 'critical')
      );
      appliedFilters.push('Has Critical Gaps');
    }

    if (criteria.hasMajorGaps) {
      filteredResults = filteredResults.filter(r =>
        r.gaps.some(gap => gap.category === 'major')
      );
      appliedFilters.push('Has Major Gaps');
    }

    // Content filters
    if (criteria.hasTimeDocumentation !== undefined) {
      filteredResults = filteredResults.filter(r => r.timeDocumented === criteria.hasTimeDocumentation);
      appliedFilters.push(criteria.hasTimeDocumentation ? 'Has Time Documentation' : 'Missing Time Documentation');
    }

    if (criteria.hasMeatCriteria !== undefined) {
      filteredResults = filteredResults.filter(r => r.meatCriteriaMet === criteria.hasMeatCriteria);
      appliedFilters.push(criteria.hasMeatCriteria ? 'Has MEAT Criteria' : 'Missing MEAT Criteria');
    }

    if (criteria.hasUpcodeOpportunity !== undefined) {
      filteredResults = filteredResults.filter(r => r.potentialUpcodeOpportunity === criteria.hasUpcodeOpportunity);
      appliedFilters.push(criteria.hasUpcodeOpportunity ? 'Has Upcode Opportunity' : 'No Upcode Opportunity');
    }

    // Text search
    if (criteria.searchText) {
      const searchLower = criteria.searchText.toLowerCase();
      filteredResults = filteredResults.filter(r =>
        r.gaps.some(gap =>
          gap.title.toLowerCase().includes(searchLower) ||
          gap.description.toLowerCase().includes(searchLower) ||
          gap.category.toLowerCase().includes(searchLower)
        )
      );
      appliedFilters.push(`Search: "${criteria.searchText}"`);
    }

    return {
      results: filteredResults,
      totalCount: results.length,
      filteredCount: filteredResults.length,
      appliedFilters,
      sortOrder: []
    };
  }

  // Sort results
  sortResults(results: AnalysisResult[], sortOptions: SortOption[]): AnalysisResult[] {
    if (sortOptions.length === 0) return results;

    return [...results].sort((a, b) => {
      for (const sortOption of sortOptions) {
        let comparison = 0;

        switch (sortOption.field) {
          case 'score':
            comparison = a.overallScore - b.overallScore;
            break;
          case 'revenueLoss':
            comparison = this.extractRevenueAmount(a.totalPotentialRevenueLoss) -
                        this.extractRevenueAmount(b.totalPotentialRevenueLoss);
            break;
          case 'gapCount':
            comparison = a.gaps.length - b.gaps.length;
            break;
          case 'emLevel':
            comparison = parseInt(a.currentEMLevel) - parseInt(b.currentEMLevel);
            break;
          case 'date':
            // Assuming results have a date field, otherwise skip
            break;
        }

        if (comparison !== 0) {
          return sortOption.direction === 'desc' ? -comparison : comparison;
        }
      }

      return 0;
    });
  }

  // Apply prioritization
  prioritizeResults(results: AnalysisResult[]): Array<AnalysisResult & { priorityScore: number }> {
    return results.map(result => {
      let totalScore = 0;

      for (const rule of this.prioritizationRules.filter(r => r.enabled)) {
        const ruleScore = rule.condition(result);
        totalScore += ruleScore * rule.weight;
      }

      return {
        ...result,
        priorityScore: Math.min(totalScore, 1000) // Cap at 1000
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // Combined filter, sort, and prioritize
  processResults(
    results: AnalysisResult[],
    criteria: FilterCriteria,
    sortOptions: SortOption[] = [],
    prioritize: boolean = false
  ): FilterResult & { prioritizedResults?: Array<AnalysisResult & { priorityScore: number }> } {
    // First filter
    const filterResult = this.filterResults(results, criteria);

    // Then sort
    const sortedResults = this.sortResults(filterResult.results, sortOptions);

    // Then prioritize if requested
    const prioritizedResults = prioritize ? this.prioritizeResults(sortedResults) : undefined;

    return {
      ...filterResult,
      results: sortedResults,
      sortOrder: sortOptions,
      prioritizedResults
    };
  }

  // Get filter presets
  getFilterPresets(): Record<string, FilterCriteria> {
    return {
      'high-priority': {
        minRevenueLoss: 200,
        hasCriticalGaps: true,
        minScore: 0,
        maxScore: 70
      },
      'revenue-focus': {
        minRevenueLoss: 100,
        hasRevenueOpportunity: true
      },
      'compliance-critical': {
        hasCriticalGaps: true,
        gapCategories: ['critical']
      },
      'quality-improvement': {
        maxScore: 75,
        hasUpcodeOpportunity: true
      },
      'time-documentation': {
        hasTimeDocumentation: false,
        emLevel: ['3', '4', '5']
      }
    };
  }

  // Add custom prioritization rule
  addPrioritizationRule(rule: PrioritizationRule): void {
    this.prioritizationRules.push(rule);
  }

  // Remove prioritization rule
  removePrioritizationRule(ruleId: string): void {
    this.prioritizationRules = this.prioritizationRules.filter(r => r.id !== ruleId);
  }

  // Get all prioritization rules
  getPrioritizationRules(): PrioritizationRule[] {
    return [...this.prioritizationRules];
  }

  // Export filter configuration
  exportConfiguration(): string {
    return JSON.stringify({
      prioritizationRules: this.prioritizationRules
    }, null, 2);
  }

  // Import filter configuration
  importConfiguration(jsonData: string): void {
    try {
      const config = JSON.parse(jsonData);
      if (config.prioritizationRules) {
        this.prioritizationRules = config.prioritizationRules;
      }
    } catch (error) {
      throw new Error('Invalid filter configuration format');
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
}

// Utility functions
export function createAdvancedFilter(): AdvancedFilter {
  return new AdvancedFilter();
}

export function quickFilter(results: AnalysisResult[], type: 'urgent' | 'revenue' | 'quality' | 'compliance'): AnalysisResult[] {
  const filter = new AdvancedFilter();

  switch (type) {
    case 'urgent':
      return filter.filterResults(results, {
        hasCriticalGaps: true,
        minRevenueLoss: 300
      }).results;

    case 'revenue':
      return filter.filterResults(results, {
        minRevenueLoss: 100,
        hasRevenueOpportunity: true
      }).results;

    case 'quality':
      return filter.filterResults(results, {
        maxScore: 70,
        hasUpcodeOpportunity: true
      }).results;

    case 'compliance':
      return filter.filterResults(results, {
        hasCriticalGaps: true,
        hasMajorGaps: true
      }).results;

    default:
      return results;
  }
}

export function getFilterStats(results: AnalysisResult[]): {
  totalResults: number;
  averageScore: number;
  totalRevenueLoss: number;
  criticalIssues: number;
  majorIssues: number;
  upcodeOpportunities: number;
} {
  const totalResults = results.length;
  const averageScore = totalResults > 0
    ? Math.round(results.reduce((sum, r) => sum + r.overallScore, 0) / totalResults)
    : 0;

  const totalRevenueLoss = results.reduce((sum, r) => {
    const match = r.totalPotentialRevenueLoss.match(/\$?([\d,]+)/);
    return match ? sum + parseFloat(match[1].replace(/,/g, '')) : sum;
  }, 0);

  const criticalIssues = results.reduce((sum, r) =>
    sum + r.gaps.filter(g => g.category === 'critical').length, 0
  );

  const majorIssues = results.reduce((sum, r) =>
    sum + r.gaps.filter(g => g.category === 'major').length, 0
  );

  const upcodeOpportunities = results.filter(r => r.potentialUpcodeOpportunity).length;

  return {
    totalResults,
    averageScore,
    totalRevenueLoss,
    criticalIssues,
    majorIssues,
    upcodeOpportunities
  };
}
