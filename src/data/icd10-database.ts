/**
 * Comprehensive ICD-10 Clinical Modification Database
 * Curated list of 300+ common diagnoses for accurate fuzzy matching
 * Uses @lowlysre/icd-10-cm for validation and lookup
 */

import { getICD10Description } from '@lowlysre/icd-10-cm';

export interface ICD10Code {
    code: string;
    description: string;
    category: 'chronic' | 'acute' | 'symptom';
    isHCC?: boolean;
    source?: 'documented' | 'recommended';
}

export const ICD10_DATABASE: Record<string, ICD10Code> = {};
export const ICD10_SEARCH_ARRAY: ICD10Code[] = [];

// Helper functions
function categorizeCode(code: string, description: string): 'chronic' | 'acute' | 'symptom' {
    const desc = description.toLowerCase();
    if (desc.includes('acute') || desc.includes('encounter for') || code.startsWith('Z')) return 'acute';
    if (code.startsWith('R') || desc.includes('pain') || desc.includes('symptom')) return 'symptom';
    return 'chronic';
}

function isHCCCode(code: string): boolean {
    const HCC_PATTERNS = [
        /^E1[01]/, /^I50/, /^I48/, /^I25/, /^N18\.[3-6]/,
        /^F3[1-3]/, /^F43\.1/, /^F1[0-1]/, /^F19/, /^A41/, /^C/, /^E66/
    ];
    return HCC_PATTERNS.some(pattern => pattern.test(code));
}

/**
 * Common ICD-10 codes mapped to medical conditions
 * Format: [code, searchable terms/description]
 */
const COMMON_ICD10_CODES = [
    // Diabetes & Endocrine (E00-E89)
    ['E11.9', 'Type 2 diabetes mellitus without complications'],
    ['E11.65', 'Type 2 diabetes mellitus with hyperglycemia'],
    ['E11.21', 'Type 2 diabetes mellitus with diabetic nephropathy'],
    ['E11.22', 'Type 2 diabetes mellitus with diabetic chronic kidney disease'],
    ['E11.40', 'Type 2 diabetes mellitus with diabetic neuropathy unspecified'],
    ['E11.51', 'Type 2 diabetes mellitus with diabetic peripheral angiopathy without gangrene'],
    ['E11.59', 'Type 2 diabetes mellitus with other circulatory complications'],
    ['E11.610', 'Type 2 diabetes mellitus with diabetic neuropathic arthropathy'],
    ['E11.618', 'Type 2 diabetes mellitus with other diabetic arthropathy'],
    ['E11.69', 'Type 2 diabetes mellitus with other specified complication'],
    ['E10.9', 'Type 1 diabetes mellitus without complications'],
    ['E10.65', 'Type 1 diabetes mellitus with hyperglycemia'],
    ['E78.5', 'Hyperlipidemia unspecified'],
    ['E78.0', 'Pure hypercholesterolemia'],
    ['E78.1', 'Pure hyperglyceridemia'],
    ['E78.2', 'Mixed hyperlipidemia'],
    ['E03.9', 'Hypothyroidism unspecified'],
    ['E05.90', 'Thyrotoxicosis unspecified'],
    ['E66.9', 'Obesity unspecified'],
    ['E66.01', 'Morbid (severe) obesity due to excess calories'],
    ['E66.3', 'Overweight'],
    ['E55.9', 'Vitamin D deficiency unspecified'],
    ['E83.42', 'Hypomagnesemia'],

    // Mental Health & Behavioral (F00-F99)
    ['F31.9', 'Bipolar disorder unspecified'],
    ['F31.81', 'Bipolar II disorder'],
    ['F31.0', 'Bipolar disorder, current episode hypomanic'],
    ['F31.1', 'Bipolar disorder current episode manic without psychotic features'],
    ['F33.0', 'Major depressive disorder recurrent mild'],
    ['F33.1', 'Major depressive disorder recurrent moderate'],
    ['F33.2', 'Major depressive disorder recurrent severe without psychotic features'],
    ['F32.9', 'Major depressive disorder single episode unspecified'],
    ['F41.1', 'Generalized anxiety disorder'],
    ['F41.9', 'Anxiety disorder unspecified'],
    ['F43.10', 'Post-traumatic stress disorder unspecified'],
    ['F43.12', 'Post-traumatic stress disorder chronic'],
    ['F90.0', 'Attention-deficit hyperactivity disorder predominantly inattentive type'],
    ['F90.1', 'Attention-deficit hyperactivity disorder predominantly hyperactive type'],
    ['F90.2', 'Attention-deficit hyperactivity disorder combined type'],
    ['F90.9', 'Attention-deficit hyperactivity disorder unspecified type'],
    ['F10.20', 'Alcohol dependence uncomplicated'],
    ['F17.210', 'Nicotine dependence cigarettes uncomplicated'],
    ['F81.89', 'Other developmental disorders of scholastic skills'],
    ['F81.9', 'Developmental disorder of scholastic skills unspecified'],

    // Cardiovascular/Circulatory (I00-I99)
    ['I10', 'Essential (primary) hypertension'],
    ['I11.0', 'Hypertensive heart disease with heart failure'],
    ['I11.9', 'Hypertensive heart disease without heart failure'],
    ['I12.9', 'Hypertensive chronic kidney disease'],
    ['I13.0', 'Hypertensive heart and chronic kidney disease with heart failure'],
    ['I13.10', 'Hypertensive heart and chronic kidney disease without heart failure'],
    ['I25.10', 'Atherosclerotic heart disease of native coronary artery without angina pectoris'],
    ['I25.119', 'Atherosclerotic heart disease of native coronary artery with unspecified angina pectoris'],
    ['I48.91', 'Unspecified atrial fibrillation'],
    ['I48.0', 'Paroxysmal atrial fibrillation'],
    ['I48.1', 'Persistent atrial fibrillation'],
    ['I48.2', 'Chronic atrial fibrillation'],
    ['I50.9', 'Heart failure unspecified'],
    ['I50.23', 'Acute on chronic systolic (congestive) heart failure'],
    ['I50.33', 'Acute on chronic diastolic (congestive) heart failure'],
    ['I50.43', 'Acute on chronic combined systolic and diastolic heart failure'],
    ['I73.9', 'Peripheral vascular disease unspecified'],
    ['I63.9', 'Cerebral infarction unspecified'],
    ['I69.354', 'Hemiplegia and hemiparesis following cerebral infarction affecting left non-dominant side'],

    // Respiratory (J00-J99)
    ['J44.1', 'Chronic obstructive pulmonary disease with (acute) exacerbation'],
    ['J44.0', 'Chronic obstructive pulmonary disease with acute lower respiratory infection'],
    ['J44.9', 'Chronic obstructive pulmonary disease unspecified'],
    ['J45.909', 'Unspecified asthma uncomplicated'],
    ['J45.40', 'Moderate persistent asthma uncomplicated'],
    ['J18.9', 'Pneumonia unspecified organism'],
    ['J06.9', 'Acute upper respiratory infection unspecified'],
    ['J20.9', 'Acute bronchitis unspecified'],
    ['J32.9', 'Chronic sinusitis unspecified'],

    // Digestive/GI (K00-K95)
    ['K21.9', 'Gastro-esophageal reflux disease without esophagitis'],
    ['K21.0', 'Gastro-esophageal reflux disease with esophagitis'],
    ['K58.9', 'Irritable bowel syndrome without diarrhea'],
    ['K58.0', 'Irritable bowel syndrome with diarrhea'],
    ['K59.00', 'Constipation unspecified'],
    ['K27.9', 'Peptic ulcer site unspecified'],
    ['K25.9', 'Gastric ulcer'],
    ['K26.9', 'Duodenal ulcer'],
    ['K76.0', 'Fatty (change of) liver not elsewhere classified'],
    ['K80.20', 'Calculus of gallbladder without cholecystitis without obstruction'],
    ['K92.1', 'Melena'],
    ['K92.2', 'Gastrointestinal hemorrhage unspecified'],

    // Skin (L00-L99)
    ['L73.2', 'Hidradenitis suppurativa'],
    ['L30.9', 'Dermatitis unspecified'],
    ['L20.9', 'Atopic dermatitis unspecified'],
    ['L50.9', 'Urticaria unspecified'],
    ['L70.0', 'Acne vulgaris'],
    ['L60.0', 'Ingrowing nail'],

    // Musculoskeletal (M00-M99)
    ['M79.3', 'Panniculitis unspecified'],
    ['M79.645', 'Pain in left finger(s)'],
    ['M79.646', 'Pain in right finger(s)'],
    ['M79.651', 'Pain in right thigh'],
    ['M79.652', 'Pain in left thigh'],
    ['M79.661', 'Pain in right lower leg'],
    ['M79.662', 'Pain in left lower leg'],
    ['M54.2', 'Cervicalgia'],
    ['M54.50', 'Low back pain unspecified'],
    ['M54.6', 'Pain in thoracic spine'],
    ['M54.9', 'Dorsalgia unspecified'],
    ['M25.511', 'Pain in right shoulder'],
    ['M25.512', 'Pain in left shoulder'],
    ['M25.551', 'Pain in right hip'],
    ['M25.552', 'Pain in left hip'],
    ['M25.561', 'Pain in right knee'],
    ['M25.562', 'Pain in left knee'],
    ['M19.90', 'Unspecified osteoarthritis unspecified site'],
    ['M19.011', 'Primary osteoarthritis right shoulder'],
    ['M19.012', 'Primary osteoarthritis left shoulder'],
    ['M17.11', 'Unilateral primary osteoarthritis right knee'],
    ['M17.12', 'Unilateral primary osteoarthritis left knee'],
    ['M16.11', 'Unilateral primary osteoarthritis right hip'],
    ['M16.12', 'Unilateral primary osteoarthritis left hip'],
    ['M67.842', 'Other specified disorders of synovium left wrist'],
    ['M67.841', 'Other specified disorders of synovium right wrist'],
    ['M75.100', 'Unspecified rotator cuff tear or rupture of unspecified shoulder not specified as traumatic'],

    // Genitourinary/Renal (N00-N99)
    ['N18.1', 'Chronic kidney disease stage 1'],
    ['N18.2', 'Chronic kidney disease stage 2 (mild)'],
    ['N18.3', 'Chronic kidney disease stage 3 (moderate)'],
    ['N18.4', 'Chronic kidney disease stage 4 (severe)'],
    ['N18.5', 'Chronic kidney disease stage 5'],
    ['N18.6', 'End stage renal disease'],
    ['N18.9', 'Chronic kidney disease unspecified'],
    ['N19', 'Unspecified kidney failure'],
    ['N39.0', 'Urinary tract infection site not specified'],
    ['N40.0', 'Benign prostatic hyperplasia without lower urinary tract symptoms'],
    ['N40.1', 'Benign prostatic hyperplasia with lower urinary tract symptoms'],
    ['N95.1', 'Menopausal and female climacteric states'],
    ['N64.82', 'Cystic changes of breast'],

    // Symptoms, Signs & Abnormal Findings (R00-R99)
    ['R07.9', 'Chest pain unspecified'],
    ['R07.89', 'Other chest pain'],
    ['R07.1', 'Chest pain on breathing'],
    ['R06.02', 'Shortness of breath'],
    ['R06.00', 'Dyspnea unspecified'],
    ['R11.0', 'Nausea'],
    ['R11.10', 'Vomiting unspecified'],
    ['R11.2', 'Nausea with vomiting unspecified'],
    ['R10.9', 'Unspecified abdominal pain'],
    ['R10.13', 'Epigastric pain'],
    ['R10.30', 'Lower abdominal pain unspecified'],
    ['R51.9', 'Headache unspecified'],
    ['R51.0', 'Headache with orthostatic component not elsewhere classified'],
    ['R42', 'Dizziness and giddiness'],
    ['R53.83', 'Other fatigue'],
    ['R63.4', 'Abnormal weight loss'],
    ['R63.5', 'Abnormal weight gain'],
    ['R73.09', 'Other prediabetes'],
    ['R73.03', 'Prediabetes'],
    ['R50.9', 'Fever unspecified'],

    // Factors Influencing Health Status (Z00-Z99)
    ['Z23', 'Encounter for immunization'],
    ['Z00.00', 'Encounter for general adult medical examination without abnormal findings'],
    ['Z00.01', 'Encounter for general adult medical examination with abnormal findings'],
    ['Z08', 'Encounter for follow-up examination after completed treatment for malignant neoplasm'],
    ['Z09', 'Encounter for follow-up examination after completed treatment for conditions other than malignant neoplasm'],
    ['Z12.31', 'Encounter for screening mammogram for malignant neoplasm of breast'],
    ['Z12.11', 'Encounter for screening for malignant neoplasm of colon'],
    ['Z13.228', 'Encounter for screening for other metabolic disorders'],
    ['Z68.21', 'Body mass index [BMI] 21.0-21.9 adult'],
    ['Z68.25', 'Body mass index [BMI] 25.0-25.9 adult'],
    ['Z68.30', 'Body mass index [BMI] 30.0-30.9 adult'],
    ['Z68.35', 'Body mass index [BMI] 35.0-35.9 adult'],
    ['Z68.41', 'Body mass index [BMI] 40.0-44.9 adult'],
    ['Z79.4', 'Long term (current) use of insulin'],
    ['Z79.84', 'Long term (current) use of oral hypoglycemic drugs'],
    ['Z79.899', 'Other long term (current) drug therapy'],
    ['Z79.01', 'Long term (current) use of anticoagulants'],
    ['Z79.02', 'Long term (current) use of antithrombotics/antiplatelets'],
    ['Z79.82', 'Long term (current) use of aspirin'],
    ['Z79.83', 'Long term (current) use of bisphosphonates'],
    ['Z87.891', 'Personal history of nicotine dependence'],
    ['Z88.0', 'Allergy status to penicillin'],
    ['Z88.1', 'Allergy status to other antibiotic agents'],
    ['Z88.7', 'Allergy status to serum and vaccine'],
    ['Z91.19', 'Patients noncompliance with other medical treatment and regimen'],
    ['Z59.819', 'Housing instability housed unspecified'],

    // Sleep Disorders (G47.x)
    ['G47.00', 'Insomnia unspecified'],
    ['G47.30', 'Sleep apnea unspecified'],
    ['G47.33', 'Obstructive sleep apnea (adult) (pediatric)'],
    ['G47.8', 'Other sleep disorders'],
    ['G47.9', 'Sleep disorder unspecified'],

    // Infectious Diseases (A00-B99)
    ['A41.9', 'Sepsis unspecified organism'],
    ['A09', 'Infectious gastroenteritis and colitis unspecified'],
    ['B18.2', 'Chronic viral hepatitis C'],
    ['B20', 'Human immunodeficiency virus [HIV] disease'],

    // Injuries & Trauma (S00-T88)
    ['S60.412S', 'Contusion of left middle finger with damage to nail sequela'],
    ['S60.411S', 'Contusion of right middle finger with damage to nail sequela'],
    ['S93.401A', 'Sprain of unspecified ligament of right ankle initial encounter'],
    ['S93.402A', 'Sprain of unspecified ligament of left ankle initial encounter'],

    // Additional Diabetes Codes
    ['E11.8', 'Type 2 diabetes mellitus with unspecified complications'],
    ['E11.319', 'Type 2 diabetes mellitus with unspecified diabetic retinopathy without macular edema'],
    ['E11.36', 'Type 2 diabetes mellitus with diabetic cataract'],
    ['E11.42', 'Type 2 diabetes mellitus with diabetic polyneuropathy'],
    ['E11.620', 'Type 2 diabetes mellitus with diabetic dermatitis'],
    ['E11.630', 'Type 2 diabetes mellitus with periodontal disease'],

    // Additional Hypertension & Cardiac Codes
    ['I15.0', 'Renovascular hypertension'],
    ['I15.9', 'Secondary hypertension unspecified'],
    ['I25.2', 'Old myocardial infarction'],
    ['I25.5', 'Ischemic cardiomyopathy'],
    ['I25.700', 'Atherosclerosis of coronary artery bypass graft(s) unspecified'],
    ['I50.1', 'Left ventricular failure unspecified'],
    ['I50.20', 'Unspecified systolic (congestive) heart failure'],
    ['I50.30', 'Unspecified diastolic (congestive) heart failure'],
    ['I50.40', 'Unspecified combined systolic (congestive) and diastolic (congestive) heart failure'],
    ['I51.9', 'Heart disease unspecified'],

    // Additional Mental Health Codes
    ['F32.0', 'Major depressive disorder single episode mild'],
    ['F32.1', 'Major depressive disorder single episode moderate'],
    ['F32.2', 'Major depressive disorder single episode severe without psychotic features'],
    ['F33.9', 'Major depressive disorder recurrent unspecified'],
    ['F40.00', 'Agoraphobia unspecified'],
    ['F40.10', 'Social phobia unspecified'],
    ['F41.0', 'Panic disorder [episodic paroxysmal anxiety]'],
    ['F41.3', 'Other mixed anxiety disorders'],
    ['F42.2', 'Mixed obsessional thoughts and acts'],
    ['F43.0', 'Acute stress reaction'],
    ['F43.20', 'Adjustment disorder unspecified'],
    ['F43.21', 'Adjustment disorder with depressed mood'],
    ['F43.22', 'Adjustment disorder with anxiety'],
    ['F43.23', 'Adjustment disorder with mixed anxiety and depressed mood'],
    ['F60.3', 'Borderline personality disorder'],
    ['F84.0', 'Autistic disorder'],

    // Additional Respiratory Codes
    ['J30.9', 'Allergic rhinitis unspecified'],
    ['J40', 'Bronchitis not specified as acute or chronic'],
    ['J41.0', 'Simple chronic bronchitis'],
    ['J42', 'Unspecified chronic bronchitis'],
    ['J43.9', 'Emphysema unspecified'],
    ['J44.89', 'Other specified chronic obstructive pulmonary disease'],
    ['J45.20', 'Mild intermittent asthma uncomplicated'],
    ['J45.30', 'Mild persistent asthma uncomplicated'],
    ['J45.41', 'Moderate persistent asthma with (acute) exacerbation'],
    ['J45.50', 'Severe persistent asthma uncomplicated'],
    ['J96.90', 'Respiratory failure unspecified whether with hypoxia or hypercapnia'],

    // Additional GI/Digestive Codes
    ['K29.00', 'Acute gastritis without bleeding'],
    ['K29.70', 'Gastritis unspecified without bleeding'],
    ['K30', 'Functional dyspepsia'],
    ['K31.89', 'Other diseases of stomach and duodenum'],
    ['K50.90', 'Crohns disease unspecified without complications'],
    ['K51.90', 'Ulcerative colitis unspecified without complications'],
    ['K57.30', 'Diverticulosis of large intestine without perforation or abscess without bleeding'],
    ['K57.32', 'Diverticulitis of large intestine without perforation or abscess without bleeding'],
    ['K63.5', 'Polyp of colon'],
    ['K70.30', 'Alcoholic cirrhosis of liver without ascites'],
    ['K74.60', 'Unspecified cirrhosis of liver'],

    // Additional Renal/Genitourinary Codes
    ['N17.9', 'Acute kidney failure unspecified'],
    ['N20.0', 'Calculus of kidney'],
    ['N30.00', 'Acute cystitis without hematuria'],
    ['N30.90', 'Cystitis unspecified without hematuria'],
    ['N81.2', 'Incomplete uterovaginal prolapse'],
    ['N92.0', 'Excessive and frequent menstruation with regular cycle'],
    ['N94.6', 'Dysmenorrhea unspecified'],
    ['N95.0', 'Postmenopausal bleeding'],

    // Additional Musculoskeletal Codes
    ['M06.9', 'Rheumatoid arthritis unspecified'],
    ['M10.00', 'Idiopathic gout unspecified site'],
    ['M10.9', 'Gout unspecified'],
    ['M15.0', 'Primary generalized (osteo)arthritis'],
    ['M15.9', 'Polyosteoarthritis unspecified'],
    ['M41.9', 'Scoliosis unspecified'],
    ['M47.816', 'Spondylosis without myelopathy or radiculopathy lumbar region'],
    ['M48.06', 'Spinal stenosis lumbar region'],
    ['M51.06', 'Intervertebral disc disorders with myelopathy lumbar region'],
    ['M51.26', 'Other intervertebral disc displacement lumbar region'],
    ['M51.36', 'Other intervertebral disc degeneration lumbar region'],
    ['M53.3', 'Sacro-coccygeal disorders not elsewhere classified'],
    ['M62.830', 'Muscle spasm of back'],
    ['M72.0', 'Palmar fascial fibromatosis [Dupuytren]'],
    ['M79.1', 'Myalgia'],
    ['M79.606', 'Pain in leg unspecified'],
    ['M79.671', 'Pain in right foot'],
    ['M79.672', 'Pain in left foot'],
    ['M81.0', 'Age-related osteoporosis without current pathological fracture'],

    // Additional Neurological Codes
    ['G20', 'Parkinsons disease'],
    ['G30.9', 'Alzheimers disease unspecified'],
    ['G35', 'Multiple sclerosis'],
    ['G40.909', 'Epilepsy unspecified not intractable without status epilepticus'],
    ['G43.909', 'Migraine unspecified not intractable without status migrainosus'],
    ['G44.209', 'Tension-type headache unspecified not intractable'],
    ['G45.9', 'Transient cerebral ischemic attack unspecified'],
    ['G50.0', 'Trigeminal neuralgia'],
    ['G51.0', 'Bells palsy'],
    ['G56.00', 'Carpal tunnel syndrome unspecified upper limb'],
    ['G56.90', 'Unspecified mononeuropathy of unspecified upper limb'],
    ['G62.9', 'Polyneuropathy unspecified'],
    ['G89.29', 'Other chronic pain'],
    ['G89.3', 'Neoplasm related pain (acute) (chronic)'],
    ['G90.9', 'Disorder of autonomic nervous system unspecified'],

    // Additional Endocrine Codes  
    ['E04.9', 'Nontoxic goiter unspecified'],
    ['E06.3', 'Autoimmune thyroiditis'],
    ['E27.40', 'Unspecified adrenocortical insufficiency'],
    ['E28.2', 'Polycystic ovarian syndrome'],
    ['E29.1', 'Testicular hypofunction'],
    ['E66.8', 'Other obesity'],
    ['E87.6', 'Hypokalemia'],
    ['E87.70', 'Fluid overload unspecified'],
    ['E88.81', 'Metabolic syndrome'],

    // Additional Dermatology Codes
    ['L02.91', 'Cutaneous abscess unspecified'],
    ['L03.90', 'Cellulitis unspecified'],
    ['L08.9', 'Local infection of the skin and subcutaneous tissue unspecified'],
    ['L29.9', 'Pruritus unspecified'],
    ['L40.0', 'Psoriasis vulgaris'],
    ['L40.9', 'Psoriasis unspecified'],
    ['L57.0', 'Actinic keratosis'],
    ['L82.1', 'Other seborrheic keratosis'],
    ['L98.9', 'Disorder of the skin and subcutaneous tissue unspecified'],

    // Additional Blood/Hematology Codes
    ['D50.9', 'Iron deficiency anemia unspecified'],
    ['D51.0', 'Vitamin B12 deficiency anemia due to intrinsic factor deficiency'],
    ['D64.9', 'Anemia unspecified'],
    ['D68.9', 'Coagulation defect unspecified'],
    ['D72.829', 'Elevated white blood cell count unspecified'],

    // Additional Cancer Screening/Surveillance
    ['Z85.038', 'Personal history of other malignant neoplasm of large intestine'],
    ['Z85.3', 'Personal history of malignant neoplasm of breast'],
    ['Z86.010', 'Personal history of colonic polyps'],
] as const;

console.log('📦 Building comprehensive ICD-10 database...');

// Populate database from curated list
let loaded = 0;
for (const [code, baseDescription] of COMMON_ICD10_CODES) {
    // Get official description from package
    const officialDescription = getICD10Description(code);
    const description = officialDescription || baseDescription;

    if (description) {
        const category = categorizeCode(code, description);
        const isHCC = isHCCCode(code);

        const codeInfo: ICD10Code = { code, description, category, isHCC };
        ICD10_DATABASE[code] = codeInfo;
        ICD10_SEARCH_ARRAY.push(codeInfo);
        loaded++;
    }
}

console.log(`✅ Loaded ${loaded} ICD-10 codes from curated medical database`);

