import { writable, derived } from 'svelte/store';
import { spring } from 'svelte/motion';

// 1. THEME STATE
export const theme = writable<'dark' | 'light'>('dark');

// 2. MOUSE PHYSICS
// Initial position at NE (0.5, -0.5) as requested
export const mouseCoords = spring(
	{ x: 0.5, y: -0.5 },
	{
		stiffness: 0.05,
		damping: 0.25
	}
);

// 3. THEME TOGGLE PHYSICS
// Controls the "magnetic" feel of the theme button
export const toggleSpring = spring(
	{ scale: 0.63, opacity: 0.5 },
	{
		stiffness: 0.1,
		damping: 0.25
	}
);

// 4. GLOBAL MOUSE HANDLER
// This drives the Origin logo, the background cloud, and the interactive blob
export function handleGlobalMouseMove(e: MouseEvent) {
	if (typeof window === 'undefined') return;

	// Standard parallax coords (-0.5 to 0.5)
	const x = e.clientX / window.innerWidth - 0.5;
	const y = e.clientY / window.innerHeight - 0.5;
	mouseCoords.set({ x, y });

	// Handle Theme Toggle Proximity (Optional but adds 'Juice')
	// You'll call a specific function for this in the component,
	// but the state lives here.
}

// 5. HELPER: ARTICLE LOGIC
// Moved here so it's a "Global Utility" accessible by any component
export const getArticle = (word: string): string => {
	return /^[aeiou]/i.test(word) ? 'an' : 'a';
};
