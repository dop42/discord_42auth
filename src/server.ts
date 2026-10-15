import { handleDashboard } from './dashboard/routes';
import { finishLinkedRoles, startLinkedRoles } from './linkedRoles';
import { handleCallback } from './routes/callback';
import { limit } from './ratelimit';
import { handleInteraction } from './routes/interactions';
import { serveStatic } from './static';

/**
 * Dispatches every request the instance receives.
 * @remarks `/api/interactions` and `/api/callback` are the URLs registered in the Discord
 * portal and the 42 application; `/linked-roles` is the portal's Linked Roles verification URL. `/health` answers without touching the database, for the
 * deploy script and the Docker healthcheck. Every other path goes through the per-address
 * rate limit first.
 */
export async function route(request: Request): Promise<Response> {
	const { pathname } = new URL(request.url);

	if (pathname === '/health') return new Response('ok');
	const refused = limit(request);
	if (refused) return refused;
	if (pathname === '/api/interactions') {
		if (request.method !== 'POST') return new Response(null, { status: 405 });
		return handleInteraction(request);
	}
	if (pathname === '/api/callback') return handleCallback(request);
	if (pathname === '/linked-roles' && request.method === 'GET') return startLinkedRoles();
	if (pathname === '/linked-roles/callback' && request.method === 'GET') return finishLinkedRoles(request);

	return (await handleDashboard(request)) ?? serveStatic(request);
}
