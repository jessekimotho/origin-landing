export interface LineData {
	size: 'small' | 'medium' | 'large';
	text: string;
}

export const NARRATIVE_CONTENT = {
	top: [
		{ size: 'medium', text: 'Chronic Disease' },
		{ size: 'small', text: 'lies in wait for all of us.' },
		{ size: 'large', text: 'We all have the right to contribute.' }
	] as LineData[],
	bottom: [
		{ size: 'medium', text: 'Breakthroughs are being made' },
		{ size: 'small', text: 'against chronic disease.' },
		{ size: 'large', text: 'Together we can ensure they make it to patients.' }
	] as LineData[],
	final: [
		{ size: 'medium', text: 'The fight against Chronic Disease' },
		{ size: 'large', text: 'starts with you.' }
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

// Shunted from +page.svelte
export const FACT_POOLS = {
	burden: [
		'Chronic metabolic dysfunction now precedes clinical diagnosis by up to a decade.',
		'Insulin resistance often begins in the liver years before blood glucose levels spike.',
		'Chronic disease accounts for 71% of all deaths globally.',
		'Metabolic health is the primary driver of all-cause mortality in the modern age.',
		'Liver fat accumulation is the hidden driver of early metabolic decay.',
		'Cellular damage compounds long before it reflects in standard blood panels.',
		'Precision nutrition is impossible without real-time glucose monitoring.',
		'The biological cost of stress is measurable at the chromosomal level.'
	],
	breakthroughs: [
		'Precision CRISPR-Cas9 editing offers a permanent resolution to genetic drivers.',
		'Digital twins allow us to simulate therapeutic outcomes with high-fidelity.',
		'Wearable bio-interfaces detect systemic shifts 48 hours before symptoms appear.',
		'Continuous biomarker streams are replacing static annual blood panels.',
		'AI Digital Twins can now predict disease onset with 94% accuracy.',
		'Targeted gene therapies are moving from rare diseases to chronic care.',
		'Biosensors now track inflammation cycles with millisecond precision.',
		'Decentralized trials accelerate drug discovery by up to 5 years.'
	],
	final: [
		'Your biological data is the most valuable currency in the fight for longevity.',
		'Collective data contribution is the fastest path to metabolic resilience.',
		'Decentralized research puts the power of discovery back in your hands.',
		'The future of medicine is proactive, personalized, and patient-driven.'
	]
};
