// Applies the theme chosen on a previous visit before the first paint, so a dark choice
// never flashes white. Kept outside the bundle: the CSP forbids inline scripts.
try {
	const theme = localStorage.getItem('theme');
	if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch {
	// Storage blocked: the system preference applies.
}
