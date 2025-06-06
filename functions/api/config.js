export async function onRequest({ env }) {
  return new Response(
    JSON.stringify({
      VITE_CONVEX_URL: env.VITE_CONVEX_URL,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
} 