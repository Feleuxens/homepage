import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = () =>
    new Response(
        JSON.stringify({ status: 'ok', ts: new Date().toISOString() }),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
            },
        }
    );