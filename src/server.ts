import { handleDashboard } from './dashboard/routes';
import { handleCallback } from './routes/callback';
import { handleInteraction } from './routes/interactions';
import { serveStatic } from './static';

/**
 * @author dop42
 * @method route
 * @description Dispatches every request the instance receives.
 * @remarks The two Discord- and 42-facing paths keep the URLs the Vercel deployment had, so
 * the endpoint registered in the Discord portal and the 42 redirect URI only change host.
 * `/health` answers without touching the database, for the container healthcheck.
 * @param request {Request}
 * @returns {Promise<Response>}
 */
export async function route(request: Request): Promise<Response> {
	const { pathname } = new URL(request.url);

	if (pathname === '/health') return new Response('ok');
	if (pathname === '/api/interactions') {
		if (request.method !== 'POST') return new Response(null, { status: 405 });
		return handleInteraction(request);
	}
	if (pathname === '/api/callback') return handleCallback(request);

	return (await handleDashboard(request)) ?? serveStatic(request);
}
