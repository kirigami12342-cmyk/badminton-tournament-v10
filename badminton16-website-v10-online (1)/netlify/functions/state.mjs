import { createHmac, timingSafeEqual } from 'node:crypto';
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

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && timingSafeEqual(left, right);
}

function verifyAdminToken(token) {
  const secret = process.env.ADMIN_TOKEN_SECRET || '';
  if (!secret || !token || !token.includes('.')) return false;

  const [payload, signature] = token.split('.');
  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');

  if (!safeEqual(signature, expected)) return false;

  try {
    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    );

    return (
      data?.role === 'admin' &&
      Number(data?.exp || 0) > Math.floor(Date.now() / 1000)
    );
  } catch (_) {
    return false;
  }
}

function isAdminRequest(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ')
    ? auth.slice(7).trim()
    : '';

  return verifyAdminToken(token);
}

export default async (req) => {
  const store = getStore({
    name: STORE_NAME,
    consistency: 'strong'
  });

  if (req.method === 'GET') {
    const state = await store.get(STATE_KEY, {
      type: 'json',
      consistency: 'strong'
    });

    return json({
      ok: true,
      exists: Boolean(state),
      state: state || null
    });
  }

  if (req.method === 'POST') {
    if (
      !process.env.ADMIN_PASSWORD ||
      !process.env.ADMIN_TOKEN_SECRET
    ) {
      return json(
        {
          ok: false,
          error: 'Admin chưa được cấu hình trên Netlify.'
        },
        503
      );
    }

    if (!isAdminRequest(req)) {
      return json(
        {
          ok: false,
          error: 'Chỉ Admin mới có quyền sửa dữ liệu giải đấu.'
        },
        401
      );
    }

    try {
      const body = await req.json();
      const incoming = body?.state;

      if (
        !incoming ||
        typeof incoming !== 'object' ||
        Array.isArray(incoming)
      ) {
        return json(
          {
            ok: false,
            error: 'Invalid state payload'
          },
          400
        );
      }

      const state = {
        ...incoming,
        meta: {
          ...(incoming.meta || {}),
          version: 11,
          updatedAt: Date.now()
        }
      };

      await store.setJSON(STATE_KEY, state);

      return json({
        ok: true,
        state
      });
    } catch (error) {
      return json(
        {
          ok: false,
          error: error?.message || 'Could not save state'
        },
        500
      );
    }
  }

  return json(
    {
      ok: false,
      error: 'Method not allowed'
    },
    405
  );
};
