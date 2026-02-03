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
	] as LineData[],
	finalMobile: [
		{ size: 'medium', text: 'The fight against' },
		{ size: 'medium', text: 'Chronic Disease' },
		{ size: 'large', text: 'starts with you.' }
	] as LineData[]
};

export const ROLE_COPY: Record<string, { desc: string; placeholder: string }> = {
	'Public Figure': {
		desc: 'Influence the narrative. Use your platform to shift the culture from reactive disease management to proactive metabolic health.',
		placeholder: 'How do you want to amplify the message?'
	},
	Donor: {
		desc: 'Capital with a conscience. Accelerate high-impact, decentralized research that traditional institutions are too slow to fund.',
		placeholder: 'What areas of metabolic health ignite your interest?'
	},
	'Content Creator': {
		desc: 'Translate the complex language of biology into human stories. Help the world understand the urgency of the metabolic crisis.',
		placeholder: 'What kind of stories do you tell?'
	},
	Investor: {
		desc: "The transition from reactive care to proactive sensing is the most significant shift in the history of human health. Let's discuss scaling the infrastructure for the longevity economy.",
		placeholder: "Tell us about your fund's focus or investment criteria..."
	},
	'Health Player': {
		desc: 'Bridge the gap between clinical theory and real-time metabolic reality. Deploy high-fidelity monitoring and precision interventions.',
		placeholder: 'Tell us about your organization or practice...'
	},
	Policymaker: {
		desc: 'Architect the frameworks for a healthier society. We need regulations that incentivize prevention and reward metabolic resilience.',
		placeholder: 'What policy initiatives are you focused on?'
	},
	Patient: {
		desc: 'Your biological data is the foundational evidence for the next era of medicine. Together, we can architect your metabolic resilience and turn personal insights into global breakthroughs.',
		placeholder: "Tell us about your health goals or the specific challenges you're facing..."
	},
	'Family Member': {
		desc: 'You are the first line of defense. Be the advocate and steward for your loved ones, powered by real-time insights.',
		placeholder: 'Who are you fighting for?'
	},
	'Research Engineer': {
		desc: 'Access high-fidelity, continuous biomarker streams. Help us build the digital twin models that will define future outcomes.',
		placeholder: 'Tell us about your technical background or data needs...'
	},
	// Legacy / Fallbacks
	Clinician: {
		desc: 'Bridge the gap between clinical theory and real-time metabolic reality. Join our network to deploy high-fidelity monitoring and precision interventions directly to the bedside.',
		placeholder: 'Tell us about your specialization or how you want to integrate precision data...'
	},
	Researcher: {
		desc: 'Access the high-fidelity, continuous biomarker streams required to validate next-generation therapeutics. Help us refine the digital twin models that will define future outcomes.',
		placeholder: 'Tell us about your current research area or data requirements...'
	},
	default: {
		desc: 'The resolution of chronic disease requires a collective shift in how we sense, analyze, and act upon biological data. Join us in architecting a more resilient future.',
		placeholder: 'How can you help? Tell us about your unique background...'
	}
};

export const STAR_COORDINATES = {
	mobile: {
		top: { x: 23, y: 20 },
		bottom: { x: 23, y: 80 }
	},
	desktop: [
		{ x: 5, y: 15 },
		{ x: 75, y: 18 },
		{ x: 8, y: 85 },
		{ x: 75, y: 83 },
		{ x: 77, y: 80 }
	]
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
