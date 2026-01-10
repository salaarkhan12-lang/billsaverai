/**
 * Loading Tips Database for v1.6.0
 * Educational tips displayed during document processing
 */

export interface LoadingTip {
    id: number;
    icon: string;
    text: string;
    category: 'revenue' | 'documentation' | 'coding' | 'value' | 'compliance';
}

export const LOADING_TIPS: LoadingTip[] = [
    {
        id: 1,
        icon: '💰',
        text: 'On average, practices lose $47,000 annually from incomplete documentation',
        category: 'revenue'
    },
    {
        id: 2,
        icon: '📋',
        text: 'MEAT criteria: Monitored, Evaluated, Assessed, Treated - essential for HCC coding',
        category: 'documentation'
    },
    {
        id: 3,
        icon: '⏱️',
        text: 'Time-based coding can support higher E/M levels when counseling exceeds 50% of visit time',
        category: 'coding'
    },
    {
        id: 4,
        icon: '🔒',
        text: 'BillSaver processes your documents 100% locally - no data leaves your browser',
        category: 'value'
    },
    {
        id: 5,
        icon: '📈',
        text: 'Each E/M level upgrade represents approximately $35-75 additional revenue per visit',
        category: 'revenue'
    },
    {
        id: 6,
        icon: '✨',
        text: 'Complete HCC documentation can add $1,000+ per patient annually to your practice',
        category: 'revenue'
    },
    {
        id: 7,
        icon: '🎯',
        text: 'Proper HPI documentation requires at least 4 elements for comprehensive history',
        category: 'documentation'
    },
    {
        id: 8,
        icon: '💊',
        text: 'Review of Systems covering 10+ organ systems qualifies for comprehensive ROS',
        category: 'compliance'
    },
    {
        id: 9,
        icon: '🔍',
        text: 'CPT codes 99213-99215 represent 70% of office visit billing opportunities',
        category: 'coding'
    },
    {
        id: 10,
        icon: '⚡',
        text: 'Providers spend an average of 40 minutes per chart review - BillSaver does it in 60 seconds',
        category: 'value'
    }
];

/**
 * Get a random tip from the database
 */
export function getRandomTip(): LoadingTip {
    const randomIndex = Math.floor(Math.random() * LOADING_TIPS.length);
    return LOADING_TIPS[randomIndex];
}

/**
 * Get tips by category
 */
export function getTipsByCategory(category: LoadingTip['category']): LoadingTip[] {
    return LOADING_TIPS.filter(tip => tip.category === category);
}
