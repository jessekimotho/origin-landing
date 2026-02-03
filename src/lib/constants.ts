export interface LineData {
	// Added 'small' to the hierarchy
	size: 'small' | 'medium' | 'large';
	text: string;
}

export const CLINICAL_FACTS = [
	'HbA1c > 6.5%',
	'Hypertension',
	'Dyslipidemia',
	'Insulin Resistance',
	'BMI > 30',
	'Chronic Inflammation',
	'Oxidative Stress',
	'Metabolic Syndrome',
	'Sedentary Behavior',
	'Glycemic Variability',
	'Beta-cell Failure',
	'Endothelial Dysfunction',
	'Atherosclerosis',
	'GFR < 60',
	'Neuropathy',
	'Retinopathy',
	'Cortisol Spikes',
	'Sleep Apnea'
];

export const NARRATIVE_CONTENT = {
	top: [
		{ size: 'medium', text: 'Chronic Disease' },
		{ size: 'small', text: 'lies in wait for all of us' },
		{ size: 'large', text: 'We all have the right to contribute' }
	] as LineData[],
	bottom: [
		{ size: 'medium', text: 'Breakthroughs are being made' },
		{ size: 'small', text: 'against chronic disease' },
		{ size: 'large', text: 'Together we can ensure they make it to patients' }
	] as LineData[],
	final: [
		{ size: 'medium', text: 'The fight against Chronic Disease' },
		{ size: 'large', text: 'starts with you' }
	] as LineData[]
};

export const PERSONAS = [
	{ label: 'Public Figure' },
	{ label: 'Donor' },
	{ label: 'Content Creator' },
	{ label: 'Investor' },
	{ label: 'Health Player' },
	{ label: 'Policymaker' },
	{ label: 'Patient' },
	{ label: 'Family Member' },
	{ label: 'Research Engineer' }
];

export const BREAKTHROUGHS = [
	{ title: 'Precision Editing', desc: 'CRISPR 2.0 targeting root genetic causes.' },
	{ title: 'Digital Twins', desc: 'AI models predicting patient outcomes.' },
	{ title: 'Continuous Sensing', desc: 'Wearables detecting biomarkers in real-time.' }
];
