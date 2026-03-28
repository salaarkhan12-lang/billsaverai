/**
 * MDM Requirements Database
 * 
 * Comprehensive database of Medical Decision Making (MDM) elements
 * for E/M code validation and upgrade guidance. Designed to be extensible
 * for adding new criteria, patterns, and clinical scenarios.
 * 
 * Based on 2021 E/M Guidelines (effective January 1, 2021)
 * 
 * Structure:
 * - Problem Complexity elements
 * - Data Reviewed elements  
 * - Risk Assessment elements
 * - Level thresholds and upgrade requirements
 */

// ============================================================================
// PROBLEM COMPLEXITY ELEMENTS
// Number and Complexity of Problems Addressed at the Encounter
// ============================================================================

export type ProblemComplexityLevel = 'minimal' | 'low' | 'moderate' | 'high';

export interface ProblemCriteria {
    id: string;
    description: string;
    level: ProblemComplexityLevel;
    patterns: string[];  // Regex patterns to detect in documentation
    examples: string[];  // Example phrases for documentation guidance
    weight: number;      // Relative importance (1-10)
}

export const PROBLEM_COMPLEXITY_CRITERIA: ProblemCriteria[] = [
    // ============================================================================
    // MINIMAL/SELF-LIMITED PROBLEMS
    // ============================================================================
    {
        id: 'self-limited-minor',
        description: 'Self-limited or minor problem',
        level: 'minimal',
        patterns: [
            'self.?limited',
            'minor\\s+(problem|issue|complaint)',
            'resolving',
            'mild\\s+(?:cold|cough|rash)',
        ],
        examples: [
            'Self-limited upper respiratory infection',
            'Minor skin irritation, resolving',
        ],
        weight: 1,
    },

    // ============================================================================
    // LOW COMPLEXITY PROBLEMS
    // ============================================================================
    {
        id: 'stable-chronic-single',
        description: 'Stable chronic illness (single condition)',
        level: 'low',
        patterns: [
            'stable\\s+(?:chronic|condition|disease)',
            'well.?controlled\\s+(?:diabetes|hypertension|htn)',
            'chronic\\s+\\w+\\s*,?\\s*stable',
            'controlled\\s+on\\s+(?:current|existing)\\s+(?:medication|regimen)',
        ],
        examples: [
            'Type 2 diabetes, well-controlled on current regimen',
            'Hypertension, stable on lisinopril',
            'Chronic stable condition, no changes needed',
        ],
        weight: 2,
    },
    {
        id: 'acute-uncomplicated',
        description: 'Acute uncomplicated illness or injury',
        level: 'low',
        patterns: [
            'acute\\s+(?:uncomplicated|simple)',
            'uncomplicated\\s+(?:uti|uri|otitis|pharyngitis|bronchitis)',
            'simple\\s+(?:laceration|sprain|strain)',
        ],
        examples: [
            'Acute uncomplicated urinary tract infection',
            'Uncomplicated acute bronchitis',
            'Simple ankle sprain, Grade I',
        ],
        weight: 2,
    },

    // ============================================================================
    // MODERATE COMPLEXITY PROBLEMS
    // ============================================================================
    {
        id: 'chronic-exacerbation',
        description: 'Chronic illness with mild exacerbation, progression, or side effects',
        level: 'moderate',
        patterns: [
            'mild\\s+exacerbation',
            'worsening',
            'progression\\s+of',
            'side\\s+effect',
            'uncontrolled',
            'poorly\\s+controlled',
            'suboptimal\\s+control',
            'exacerbation\\s+of\\s+(?:copd|asthma|chf|diabetes)',
        ],
        examples: [
            'Type 2 diabetes with mild exacerbation due to dietary indiscretion',
            'COPD with mild exacerbation',
            'Hypertension, poorly controlled, adjusting medications',
            'Chronic condition with progression noted',
        ],
        weight: 4,
    },
    {
        id: 'multiple-stable-chronic',
        description: 'Two or more chronic conditions, stable',
        level: 'moderate',
        patterns: [
            '(?:and|with|,)\\s+(?:also|additionally)',
            'multiple\\s+(?:chronic|comorbid)',
            'comorbidities',
        ],
        examples: [
            'Diabetes and hypertension, both stable',
            'Multiple chronic conditions managed',
            'Comorbidities reviewed and stable',
        ],
        weight: 4,
    },
    {
        id: 'acute-complicated',
        description: 'Acute illness with systemic symptoms',
        level: 'moderate',
        patterns: [
            'complicated\\s+(?:uti|uri|infection)',
            'systemic\\s+symptoms',
            'fever\\s+(?:with|and)',
            'acute\\s+(?:on\\s+chronic|exacerbation)',
        ],
        examples: [
            'Acute complicated UTI with fever',
            'Pneumonia with systemic symptoms',
            'Acute on chronic heart failure exacerbation',
        ],
        weight: 4,
    },
    {
        id: 'undiagnosed-new-uncertain',
        description: 'Undiagnosed new problem with uncertain prognosis',
        level: 'moderate',
        patterns: [
            'new\\s+(?:onset|symptom)',
            'undiagnosed',
            'uncertain\\s+(?:prognosis|etiology|diagnosis)',
            'workup\\s+(?:for|of)',
            'rule\\s+out',
            'differential\\s+(?:diagnosis|includes)',
        ],
        examples: [
            'New onset chest pain, uncertain etiology, workup initiated',
            'Undiagnosed weight loss, further evaluation needed',
            'Rule out malignancy',
        ],
        weight: 5,
    },

    // ============================================================================
    // HIGH COMPLEXITY PROBLEMS
    // ============================================================================
    {
        id: 'chronic-severe-exacerbation',
        description: 'Chronic illness with severe exacerbation, progression, or side effects',
        level: 'high',
        patterns: [
            'severe\\s+exacerbation',
            'significant\\s+(?:progression|worsening|decline)',
            'serious\\s+side\\s+effect',
            'acute\\s+decompensation',
            'emergent',
            'critical',
        ],
        examples: [
            'COPD with severe exacerbation requiring hospitalization consideration',
            'Heart failure with acute decompensation',
            'Diabetes with severe hypoglycemic episode',
        ],
        weight: 8,
    },
    {
        id: 'acute-life-threatening',
        description: 'Acute or chronic illness or injury that poses a threat to life or bodily function',
        level: 'high',
        patterns: [
            'life.?threatening',
            'threat\\s+to\\s+(?:life|limb)',
            'bodily\\s+function',
            'sepsis',
            'stroke',
            'myocardial\\s+infarction',
            'mi',
            'pe',
            'pulmonary\\s+embolism',
            'acute\\s+abdomen',
        ],
        examples: [
            'Suspected acute MI, activating STEMI protocol',
            'Possible stroke, time-sensitive evaluation',
            'Sepsis, initiating treatment protocol',
            'Condition threatening bodily function',
        ],
        weight: 10,
    },
];

// ============================================================================
// DATA REVIEWED ELEMENTS  
// Amount and/or Complexity of Data to be Reviewed and Analyzed
// ============================================================================

export type DataReviewLevel = 'minimal' | 'limited' | 'moderate' | 'extensive';

export interface DataCriteria {
    id: string;
    description: string;
    level: DataReviewLevel;
    category: 'tests' | 'records' | 'history' | 'discussion' | 'interpretation';
    patterns: string[];
    examples: string[];
    points: number;  // Points toward data level (per 2021 guidelines)
}

export const DATA_REVIEW_CRITERIA: DataCriteria[] = [
    // ============================================================================
    // TESTS ORDERED OR REVIEWED
    // ============================================================================
    {
        id: 'labs-ordered',
        description: 'Laboratory tests ordered',
        level: 'limited',
        category: 'tests',
        patterns: [
            'order(?:ed|ing)?\\s+(?:labs?|blood\\s*work|cbc|cmp|bmp|lipid|a1c|tsh)',
            'labs?\\s+ordered',
            'will\\s+(?:order|check|obtain)\\s+(?:labs?|blood)',
        ],
        examples: [
            'Ordered CBC, CMP, and lipid panel',
            'Labs ordered for follow-up',
            'Will check A1C and TSH',
        ],
        points: 1,
    },
    {
        id: 'labs-reviewed',
        description: 'Laboratory results reviewed',
        level: 'limited',
        category: 'tests',
        patterns: [
            'review(?:ed|ing)?\\s+(?:labs?|results?|blood\\s*work)',
            'labs?\\s+(?:show|reveal|indicate|demonstrate)',
            '(?:cbc|cmp|bmp|lipid|a1c|tsh)\\s*(?:is|was|were|shows?|=)',
            'result(?:s)?\\s+(?:reviewed|show|indicate)',
        ],
        examples: [
            'Reviewed today\'s lab results',
            'CBC shows WBC of 12,000',
            'A1C improved to 7.2%',
        ],
        points: 1,
    },
    {
        id: 'imaging-ordered',
        description: 'Imaging ordered',
        level: 'limited',
        category: 'tests',
        patterns: [
            'order(?:ed|ing)?\\s+(?:x-?ray|ct|mri|ultrasound|echo|imaging)',
            'imaging\\s+ordered',
            'will\\s+(?:order|obtain|get)\\s+(?:x-?ray|ct|mri)',
        ],
        examples: [
            'Ordered chest X-ray',
            'CT scan of abdomen ordered',
            'Will obtain MRI of lumbar spine',
        ],
        points: 1,
    },
    {
        id: 'imaging-reviewed',
        description: 'Imaging results reviewed',
        level: 'limited',
        category: 'tests',
        patterns: [
            'review(?:ed|ing)?\\s+(?:x-?ray|ct|mri|ultrasound|echo|imaging)',
            '(?:x-?ray|ct|mri|ultrasound)\\s+(?:shows?|reveals?|demonstrates?)',
            'radiology\\s+(?:report|results?)\\s+reviewed',
        ],
        examples: [
            'Reviewed chest X-ray, no acute findings',
            'CT shows 3mm kidney stone',
            'Radiology report reviewed',
        ],
        points: 1,
    },

    // ============================================================================
    // EXTERNAL RECORDS OR HISTORY
    // ============================================================================
    {
        id: 'external-records',
        description: 'External records reviewed (from external source)',
        level: 'moderate',
        category: 'records',
        patterns: [
            'external\\s+(?:records?|notes?)',
            'records?\\s+from\\s+(?:outside|another|prior)',
            'hospital\\s+(?:records?|discharge)',
            'specialist\\s+(?:notes?|report|consultation)',
            'reviewed\\s+(?:prior|outside|external)',
            'per\\s+(?:outside|prior|specialist)\\s+(?:notes?|records?)',
        ],
        examples: [
            'Reviewed external hospital records',
            'Obtained records from prior PCP',
            'Specialist consultation notes reviewed',
        ],
        points: 2,
    },
    {
        id: 'prior-encounter-review',
        description: 'Review of prior encounters/records (same clinician/system)',
        level: 'limited',
        category: 'records',
        patterns: [
            'review(?:ed)?\\s+(?:prior|previous)\\s+(?:notes?|encounters?|visits?)',
            'chart\\s+review',
            'reviewed\\s+(?:history|medical\\s+record)',
        ],
        examples: [
            'Reviewed prior encounter notes',
            'Chart reviewed for history',
            'Previous visit notes reviewed',
        ],
        points: 1,
    },
    {
        id: 'historian-other',
        description: 'History obtained from someone other than patient',
        level: 'moderate',
        category: 'history',
        patterns: [
            'history\\s+(?:from|obtained\\s+from|provided\\s+by)\\s+(?:family|spouse|caregiver|parent)',
            'collateral\\s+(?:history|information)',
            '(?:family|spouse|caregiver)\\s+(?:reports?|states?)',
        ],
        examples: [
            'History obtained from spouse',
            'Collateral information from caregiver',
            'Family member provided additional history',
        ],
        points: 2,
    },

    // ============================================================================
    // INDEPENDENT INTERPRETATION
    // ============================================================================
    {
        id: 'independent-interpretation',
        description: 'Independent interpretation of tests (not billed separately)',
        level: 'extensive',
        category: 'interpretation',
        patterns: [
            'independent(?:ly)?\\s+(?:interpret|review|read)',
            'personally\\s+reviewed\\s+(?:images?|films?|slides?|tracing)',
            '(?:i|personally)\\s+(?:reviewed?|interpreted|read)\\s+(?:the\\s+)?(?:ekg|ecg|x-?ray|ct|mri)',
            'my\\s+(?:interpretation|reading)\\s+of',
        ],
        examples: [
            'I independently interpreted the EKG',
            'Personally reviewed the CT images',
            'My interpretation of the chest X-ray shows...',
        ],
        points: 3,
    },

    // ============================================================================
    // DISCUSSION WITH EXTERNAL SOURCES
    // ============================================================================
    {
        id: 'discussion-external',
        description: 'Discussion with external physician or health care professional',
        level: 'moderate',
        category: 'discussion',
        patterns: [
            'discuss(?:ed|ion)?\\s+(?:with|case\\s+with)\\s+(?:dr|specialist|cardiologist|oncologist)',
            'consult(?:ed)?\\s+(?:with)?\\s+(?:dr|specialist)',
            'spoke\\s+(?:with|to)\\s+(?:dr|specialist|attending)',
            '(?:phone|telephone)\\s+(?:call|discussion)\\s+with\\s+(?:dr|specialist)',
        ],
        examples: [
            'Discussed case with Dr. Smith, cardiology',
            'Consulted with oncology regarding treatment plan',
            'Phone discussion with patient\'s specialist',
        ],
        points: 2,
    },
];

// ============================================================================
// RISK ASSESSMENT ELEMENTS
// Risk of Complications and/or Morbidity or Mortality of Patient Management
// ============================================================================

export type RiskLevel = 'minimal' | 'low' | 'moderate' | 'high';

export interface RiskCriteria {
    id: string;
    description: string;
    level: RiskLevel;
    category: 'diagnosis' | 'treatment' | 'surgery' | 'social';
    patterns: string[];
    examples: string[];
}

export const RISK_CRITERIA: RiskCriteria[] = [
    // ============================================================================
    // MINIMAL RISK
    // ============================================================================
    {
        id: 'minimal-testing',
        description: 'Minimal risk - Basic labs or imaging',
        level: 'minimal',
        category: 'diagnosis',
        patterns: [
            'routine\\s+(?:labs?|blood\\s*work|screening)',
            'screening\\s+(?:labs?|tests?)',
        ],
        examples: [
            'Routine screening labs ordered',
            'Annual wellness labs',
        ],
    },

    // ============================================================================
    // LOW RISK
    // ============================================================================
    {
        id: 'otc-medications',
        description: 'OTC medications prescribed',
        level: 'low',
        category: 'treatment',
        patterns: [
            'otc|over.?the.?counter',
            'tylenol|acetaminophen|ibuprofen|advil|motrin',
            'antihistamine|claritin|zyrtec|benadryl',
            'antacid|tums|pepto',
        ],
        examples: [
            'Recommended OTC ibuprofen for pain',
            'Take Tylenol as needed',
        ],
    },
    {
        id: 'minor-surgery-low',
        description: 'Minor surgery with no risk factors',
        level: 'low',
        category: 'surgery',
        patterns: [
            'minor\\s+(?:procedure|surgery)',
            '(?:I&D|incision\\s+and\\s+drainage)',
            'skin\\s+(?:biopsy|tag\\s+removal)',
        ],
        examples: [
            'Minor skin biopsy performed',
            'I&D of superficial abscess',
        ],
    },

    // ============================================================================
    // MODERATE RISK
    // ============================================================================
    {
        id: 'prescription-management',
        description: 'Prescription drug management',
        level: 'moderate',
        category: 'treatment',
        patterns: [
            'prescri(?:bed?|ption|bing)',
            'start(?:ed|ing)?\\s+(?:on\\s+)?\\w+\\s*\\d*\\s*mg',
            'continu(?:e|ed|ing)\\s+(?:current\\s+)?(?:medications?|regimen)',
            'adjust(?:ed|ing)?\\s+(?:dose|dosage|medication)',
            'increas(?:e|ed|ing)\\s+(?:dose|dosage)',
            'chang(?:e|ed|ing)\\s+(?:medication|to\\s+\\w+)',
            'new\\s+medication',
            'refill(?:ed)?',
        ],
        examples: [
            'Started metformin 500mg daily',
            'Increased lisinopril to 20mg',
            'Changed to new medication regimen',
            'Prescription refilled',
        ],
    },
    {
        id: 'decision-minor-surgery',
        description: 'Decision regarding minor surgery with identified patient risk factors',
        level: 'moderate',
        category: 'surgery',
        patterns: [
            'decision\\s+(?:for|regarding|about)\\s+(?:minor\\s+)?surgery',
            'elective\\s+(?:surgery|procedure)\\s+(?:discussed|planned)',
            'surgical\\s+(?:risk|candidacy)\\s+(?:factors|assessment)',
        ],
        examples: [
            'Discussed elective surgery with patient given their comorbidities',
            'Decision for minor surgery, noting patient risk factors',
        ],
    },
    {
        id: 'decision-diagnostic',
        description: 'Decision regarding diagnostic procedures with identified risk factors',
        level: 'moderate',
        category: 'diagnosis',
        patterns: [
            'decision\\s+(?:for|regarding)\\s+(?:invasive\\s+)?(?:procedure|test)',
            '(?:colonoscopy|endoscopy|biopsy)\\s+(?:scheduled|planned|discussed)',
            'risk(?:s)?\\s+(?:of|and)\\s+(?:procedure|biopsy)',
        ],
        examples: [
            'Scheduled colonoscopy, risks discussed',
            'Decision for cardiac catheterization given risk factors',
        ],
    },
    {
        id: 'iv-fluids-controlled',
        description: 'IV fluids with additives in controlled setting',
        level: 'moderate',
        category: 'treatment',
        patterns: [
            'iv\\s+(?:fluids?|hydration|therapy)',
            'intravenous\\s+(?:fluids?|medication)',
            'normal\\s+saline|lactated\\s+ringer',
        ],
        examples: [
            'IV fluids administered',
            'Started IV normal saline',
        ],
    },

    // ============================================================================
    // HIGH RISK
    // ============================================================================
    {
        id: 'drug-monitoring',
        description: 'Drug therapy requiring intensive monitoring',
        level: 'high',
        category: 'treatment',
        patterns: [
            'warfarin|coumadin',
            'anticoagula(?:nt|tion)',
            'chemotherapy',
            'immunosuppres(?:sant|sive|sion)',
            'high.?alert\\s+medication',
            'narrow\\s+therapeutic\\s+(?:index|window)',
            'inr\\s+(?:monitoring|check)',
        ],
        examples: [
            'Adjusted warfarin dose, INR monitoring needed',
            'Continuing immunosuppressive therapy',
            'High-risk medication requiring close monitoring',
        ],
    },
    {
        id: 'decision-hospitalization',
        description: 'Decision regarding hospitalization',
        level: 'high',
        category: 'treatment',
        patterns: [
            'decision\\s+(?:to|for|regarding)\\s+(?:hospitali|admit|observation)',
            'admit(?:ted)?\\s+(?:to|for)',
            'hospitali(?:zed|zation)',
            'inpatient\\s+(?:admission|care)',
            'observation\\s+status',
        ],
        examples: [
            'Decision to admit for observation',
            'Hospitalization required for treatment',
            'Admitted to inpatient care',
        ],
    },
    {
        id: 'decision-not-resuscitate',
        description: 'Decision regarding life-sustaining treatment (DNR, comfort care)',
        level: 'high',
        category: 'treatment',
        patterns: [
            'dnr|do\\s+not\\s+resuscitate',
            'comfort\\s+(?:care|measures)',
            'palliative',
            'hospice',
            'code\\s+status',
            'life.?sustaining',
            'withdrawal\\s+of\\s+(?:care|treatment)',
        ],
        examples: [
            'Discussed DNR status with family',
            'Transition to comfort care',
            'Code status discussed',
        ],
    },
    {
        id: 'decision-major-surgery',
        description: 'Decision regarding elective major surgery with identified patient risk factors',
        level: 'high',
        category: 'surgery',
        patterns: [
            '(?:major|elective)\\s+surgery\\s+(?:with|given)\\s+(?:risk|comorbid)',
            'pre.?op(?:erative)?\\s+(?:evaluation|assessment|clearance)',
            'surgical\\s+risk\\s+(?:stratification|assessment)',
            '(?:cabg|joint\\s+replacement|open\\s+surgery)\\s+(?:planned|discussed)',
        ],
        examples: [
            'Preoperative evaluation for major surgery with significant comorbidities',
            'Surgical risk assessment completed',
            'Discussed risks of elective major procedure',
        ],
    },
    {
        id: 'decision-emergency',
        description: 'Decision regarding emergency major surgery',
        level: 'high',
        category: 'surgery',
        patterns: [
            'emergent?\\s+(?:surgery|procedure|intervention)',
            'emergency\\s+(?:surgery|operation)',
            'urgent\\s+(?:surgical|operative)\\s+intervention',
            'immediate\\s+(?:surgery|intervention)',
        ],
        examples: [
            'Emergent surgery required',
            'Urgent surgical intervention indicated',
        ],
    },
    {
        id: 'parenteral-controlled',
        description: 'Parenteral controlled substances',
        level: 'high',
        category: 'treatment',
        patterns: [
            'parenteral\\s+(?:narcotic|opioid|controlled)',
            'iv\\s+(?:morphine|dilaudid|fentanyl)',
            'injectable\\s+(?:narcotic|opioid)',
        ],
        examples: [
            'IV morphine administered for pain control',
            'Parenteral opioid given',
        ],
    },
    {
        id: 'social-determinants',
        description: 'Social determinants of health significantly impacting management',
        level: 'high',
        category: 'social',
        patterns: [
            'social\\s+determinants?',
            'housing\\s+(?:insecurity|instability)',
            'food\\s+insecurity',
            'lack\\s+of\\s+(?:transportation|insurance|support)',
            'homeless',
            'unable\\s+to\\s+afford',
            'barriers?\\s+to\\s+care',
        ],
        examples: [
            'Housing insecurity affecting medication compliance',
            'Social determinants impacting treatment plan',
            'Barriers to care addressed',
        ],
    },
];

// ============================================================================
// E/M LEVEL THRESHOLDS
// MDM Table: What level each MDM element must meet for each E/M code
// ============================================================================

export interface EMThreshold {
    code: string;
    visitType: 'new' | 'established';
    displayName: string;
    mdmLevel: 'straightforward' | 'low' | 'moderate' | 'high';
    minimumProblems: ProblemComplexityLevel;
    minimumData: DataReviewLevel;
    minimumRisk: RiskLevel;
    timeThreshold?: number;  // Minutes for time-based billing
}

export const EM_THRESHOLDS: EMThreshold[] = [
    // Established Patient
    { code: '99212', visitType: 'established', displayName: 'Level 2 (Straightforward)', mdmLevel: 'straightforward', minimumProblems: 'minimal', minimumData: 'minimal', minimumRisk: 'minimal', timeThreshold: 10 },
    { code: '99213', visitType: 'established', displayName: 'Level 3 (Low)', mdmLevel: 'low', minimumProblems: 'low', minimumData: 'limited', minimumRisk: 'low', timeThreshold: 20 },
    { code: '99214', visitType: 'established', displayName: 'Level 4 (Moderate)', mdmLevel: 'moderate', minimumProblems: 'moderate', minimumData: 'moderate', minimumRisk: 'moderate', timeThreshold: 30 },
    { code: '99215', visitType: 'established', displayName: 'Level 5 (High)', mdmLevel: 'high', minimumProblems: 'high', minimumData: 'extensive', minimumRisk: 'high', timeThreshold: 40 },

    // New Patient
    { code: '99202', visitType: 'new', displayName: 'New Patient Level 2 (Straightforward)', mdmLevel: 'straightforward', minimumProblems: 'minimal', minimumData: 'minimal', minimumRisk: 'minimal', timeThreshold: 15 },
    { code: '99203', visitType: 'new', displayName: 'New Patient Level 3 (Low)', mdmLevel: 'low', minimumProblems: 'low', minimumData: 'limited', minimumRisk: 'low', timeThreshold: 30 },
    { code: '99204', visitType: 'new', displayName: 'New Patient Level 4 (Moderate)', mdmLevel: 'moderate', minimumProblems: 'moderate', minimumData: 'moderate', minimumRisk: 'moderate', timeThreshold: 45 },
    { code: '99205', visitType: 'new', displayName: 'New Patient Level 5 (High)', mdmLevel: 'high', minimumProblems: 'high', minimumData: 'extensive', minimumRisk: 'high', timeThreshold: 60 },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get threshold requirements for a specific E/M code
 */
export function getEMThreshold(code: string): EMThreshold | null {
    return EM_THRESHOLDS.find(t => t.code === code) || null;
}

/**
 * Get the next higher E/M code for a given code
 */
export function getNextHigherCode(code: string): string | null {
    const levels = {
        'established': ['99212', '99213', '99214', '99215'],
        'new': ['99202', '99203', '99204', '99205'],
    };

    for (const type of Object.values(levels)) {
        const index = type.indexOf(code);
        if (index !== -1 && index < type.length - 1) {
            return type[index + 1];
        }
    }
    return null;
}

/**
 * Get all problem criteria for a specific level or higher
 */
export function getProblemCriteriaForLevel(minLevel: ProblemComplexityLevel): ProblemCriteria[] {
    const levelOrder: ProblemComplexityLevel[] = ['minimal', 'low', 'moderate', 'high'];
    const minIndex = levelOrder.indexOf(minLevel);
    return PROBLEM_COMPLEXITY_CRITERIA.filter(c => levelOrder.indexOf(c.level) >= minIndex);
}

/**
 * Get all data criteria for a specific level or higher
 */
export function getDataCriteriaForLevel(minLevel: DataReviewLevel): DataCriteria[] {
    const levelOrder: DataReviewLevel[] = ['minimal', 'limited', 'moderate', 'extensive'];
    const minIndex = levelOrder.indexOf(minLevel);
    return DATA_REVIEW_CRITERIA.filter(c => levelOrder.indexOf(c.level) >= minIndex);
}

/**
 * Get all risk criteria for a specific level or higher
 */
export function getRiskCriteriaForLevel(minLevel: RiskLevel): RiskCriteria[] {
    const levelOrder: RiskLevel[] = ['minimal', 'low', 'moderate', 'high'];
    const minIndex = levelOrder.indexOf(minLevel);
    return RISK_CRITERIA.filter(c => levelOrder.indexOf(c.level) >= minIndex);
}

/**
 * Check if documented time conflicts with claimed code
 */
export function checkTimeConflict(documentedMinutes: number, claimedCode: string): {
    hasConflict: boolean;
    details?: string;
    supportedCode?: string;
} {
    const threshold = getEMThreshold(claimedCode);
    if (!threshold || !threshold.timeThreshold) {
        return { hasConflict: false };
    }

    if (documentedMinutes < threshold.timeThreshold) {
        // Find the code that the documented time actually supports
        const visitType = threshold.visitType;
        const relevantCodes = EM_THRESHOLDS.filter(t => t.visitType === visitType);

        for (const code of [...relevantCodes].reverse()) {
            if (code.timeThreshold && documentedMinutes >= code.timeThreshold) {
                return {
                    hasConflict: true,
                    details: `Documented time (${documentedMinutes} min) is below ${claimedCode} threshold (${threshold.timeThreshold} min)`,
                    supportedCode: code.code,
                };
            }
        }

        return {
            hasConflict: true,
            details: `Documented time (${documentedMinutes} min) does not support ${claimedCode} (requires ${threshold.timeThreshold} min)`,
            supportedCode: relevantCodes[0]?.code,
        };
    }

    return { hasConflict: false };
}
