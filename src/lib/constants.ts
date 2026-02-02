export interface LineData {
	size: 'medium' | 'larger';
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
		{ size: 'medium', text: 'lies in wait for all of us' },
		{ size: 'larger', text: 'We all have the right to contribute' }
	] as LineData[],
	bottom: [
		{ size: 'medium', text: 'Breakthroughs are being made' },
		{ size: 'medium', text: 'against chronic disease' },
		{ size: 'larger', text: 'Together we can ensure they make it to patients' }
	] as LineData[],
	final: [
		{ size: 'medium', text: 'The fight against Chronic Disease' },
		{ size: 'larger', text: 'starts with you' }
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
	{ title: 'Continuous Sensing', desc: 'Wearables detecting biomarkers in real-time.' },
	{ title: 'mRNA Therapeutics', desc: 'Programmable medicine for immune response.' },
	{ title: 'Microbiome Mapping', desc: 'Gut flora analysis for metabolic health.' },
	{ title: 'Neural Interfaces', desc: 'Brain-computer bridges for restoration.' }
];
