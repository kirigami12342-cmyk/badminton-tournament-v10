import { getStore } from '@netlify/blobs';

const STORE_NAME = 'ktv-tournament-v10';
const STATE_KEY = 'shared-state';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export default async (req) => {
  const store = getStore({ name: STORE_NAME, consistency: 'strong' });

  if (req.method === 'GET') {
    const state = await store.get(STATE_KEY, { type: 'json', consistency: 'strong' });
    return json({ ok: true, exists: Boolean(state), state: state || null });
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const incoming = body?.state;
      if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
        return json({ ok: false, error: 'Invalid state payload' }, 400);
      }

      const state = {
        ...incoming,
        meta: {
          ...(incoming.meta || {}),
          version: 10,
          updatedAt: Date.now()
        }
      };

      await store.setJSON(STATE_KEY, state);
      return json({ ok: true, state });
    } catch (error) {
      return json({ ok: false, error: error?.message || 'Could not save state' }, 500);
    }
  }

  return json({ ok: false, error: 'Method not allowed' }, 405);
};
