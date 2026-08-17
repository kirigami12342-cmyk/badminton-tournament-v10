import { createHmac, timingSafeEqual } from 'node:crypto';

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

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function makeAdminToken() {
  const secret = process.env.ADMIN_TOKEN_SECRET || '';

  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60
    })
  ).toString('base64url');

  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json(
      {
        ok: false,
        error: 'Method not allowed'
      },
      405
    );
  }

  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const tokenSecret = process.env.ADMIN_TOKEN_SECRET || '';

  if (!adminPassword || !tokenSecret) {
    return json(
      {
        ok: false,
        error: 'Admin chưa được cấu hình trên Netlify.'
      },
      503
    );
  }

  try {
    const body = await req.json();
    const password = String(body?.password || '');

    if (!password) {
      return json(
        {
          ok: false,
          error: 'Vui lòng nhập mật khẩu Admin.'
        },
        400
      );
    }

    if (!safeEqual(password, adminPassword)) {
      return json(
        {
          ok: false,
          error: 'Sai mật khẩu Admin.'
        },
        401
      );
    }

    const token = makeAdminToken();

    return json({
      ok: true,
      token,
      expiresAt: Date.now() + 12 * 60 * 60 * 1000
    });
  } catch (error) {
    console.error('Admin login error:', error);

    return json(
      {
        ok: false,
        error: 'Không thể đăng nhập Admin.'
      },
      500
    );
  }
}
