(() => {
  'use strict';

  const ADMIN_API = '/api/admin';
  const STATE_API = '/api/state';

  const TOKEN_KEY = 'ktv_admin_token_v11';
  const EXPIRES_KEY = 'ktv_admin_expires_v11';

  let adminToken = sessionStorage.getItem(TOKEN_KEY) || '';
  let adminExpiresAt = Number(sessionStorage.getItem(EXPIRES_KEY) || 0);

  function isAdmin() {
    if (!adminToken) return false;

    if (!adminExpiresAt || Date.now() >= adminExpiresAt) {
      clearAdminSession();
      return false;
    }

    return true;
  }

  function clearAdminSession() {
    adminToken = '';
    adminExpiresAt = 0;

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EXPIRES_KEY);
  }

  /* =========================
     BẢO VỆ API GHI DỮ LIỆU
  ========================== */

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function(input, init = {}) {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof Request
          ? input.url
          : String(input);

    const method = String(
      init.method ||
      (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();

    const isStateWrite =
      method === 'POST' &&
      (
        url === STATE_API ||
        url.endsWith('/api/state')
      );

    if (isStateWrite) {
      if (!isAdmin()) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'Chỉ Admin mới có quyền sửa dữ liệu giải đấu.'
          }),
          {
            status: 401,
            headers: {
              'content-type': 'application/json; charset=utf-8'
            }
          }
        );
      }

      const headers = new Headers(
        init.headers ||
        (input instanceof Request ? input.headers : undefined)
      );

      headers.set(
        'authorization',
        `Bearer ${adminToken}`
      );

      init = {
        ...init,
        headers
      };
    }

    return originalFetch(input, init);
  };

  /* =========================
     CÁC CONTROL CHỈ ADMIN
  ========================== */

  const ADMIN_ONLY_SELECTORS = [
    '[data-edit-slot]',
    '[data-edit-team-direct]',
    '[data-open-slot-manager]',

    '#resetTeamsBtn',

    '#spinWheel1',
    '#spinWheel2',
    '#spinWheel3',
    '#spinAllBtn',
    '#resetDrawBtn',
    '#applyDrawDataBtn',
    '#loadSampleBtn',

    '#pairLockEnabled',
    '#pairLockLt1Index',
    '#pairLockLt2Index',

    '#inputLt1',
    '#inputLt2',
    '#inputPositions',

    '#teamEditForm',
    '#slotEditForm',

    '#clearSlotAssignment',
    '#resetSlotAssignments'
  ];

  function elementNeedsAdmin(element) {
    if (!element || !(element instanceof Element)) {
      return false;
    }

    return ADMIN_ONLY_SELECTORS.some((selector) => {
      try {
        return (
          element.matches(selector) ||
          Boolean(element.closest(selector))
        );
      } catch (_) {
        return false;
      }
    });
  }

  function protectElement(el) {
    if (!el) return;

    el.classList.add('admin-protected-control');

    if (!isAdmin()) {
      el.classList.add('admin-locked-control');

      if (
        el.matches(
          'button,input,textarea,select'
        )
      ) {
        el.setAttribute(
          'data-admin-original-disabled',
          el.disabled ? '1' : '0'
        );

        el.disabled = true;
      }

      el.setAttribute(
        'title',
        'Chỉ Admin mới có quyền chỉnh sửa'
      );
    } else {
      el.classList.remove('admin-locked-control');

      if (
        el.matches(
          'button,input,textarea,select'
        )
      ) {
        if (
          el.getAttribute(
            'data-admin-original-disabled'
          ) !== '1'
        ) {
          el.disabled = false;
        }
      }

      el.removeAttribute('title');
    }
  }

  function refreshProtectedControls() {
    ADMIN_ONLY_SELECTORS.forEach((selector) => {
      document
        .querySelectorAll(selector)
        .forEach(protectElement);
    });

    document.body.classList.toggle(
      'admin-mode',
      isAdmin()
    );

    document.body.classList.toggle(
      'viewer-mode',
      !isAdmin()
    );

    updateAdminButton();
  }

  /* =========================
     CHẶN CLICK / SUBMIT
  ========================== */

  document.addEventListener(
    'click',
    (event) => {
      if (isAdmin()) return;

      if (elementNeedsAdmin(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();

        showToast(
          '🔒 Chỉ Admin mới có quyền chỉnh sửa.'
        );
      }
    },
    true
  );

  document.addEventListener(
    'submit',
    (event) => {
      if (isAdmin()) return;

      if (elementNeedsAdmin(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();

        showToast(
          '🔒 Chỉ Admin mới có quyền lưu thay đổi.'
        );
      }
    },
    true
  );

  /* =========================
     STYLE
  ========================== */

  function installStyles() {
    const style = document.createElement('style');

    style.textContent = `
      #ktvAdminButton {
        position: fixed;
        right: 22px;
        bottom: 22px;
        z-index: 99990;
        border: 1px solid rgba(190,255,40,.38);
        background: #09160f;
        color: #c7ff31;
        border-radius: 12px;
        min-height: 42px;
        padding: 0 16px;
        font: 700 13px "Be Vietnam Pro", sans-serif;
        cursor: pointer;
        box-shadow: 0 12px 32px rgba(0,0,0,.32);
      }

      #ktvAdminButton:hover {
        border-color: #c7ff31;
      }

      body.admin-mode #ktvAdminButton {
        background: #c7ff31;
        color: #07120b;
      }

      body.viewer-mode .admin-locked-control {
        cursor: not-allowed !important;
        opacity: .38 !important;
      }

      body.viewer-mode .editable-participant.admin-locked-control {
        pointer-events: none !important;
      }

      #ktvAdminOverlay {
        position: fixed;
        inset: 0;
        z-index: 99998;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(0,0,0,.72);
        backdrop-filter: blur(8px);
      }

      #ktvAdminOverlay.open {
        display: flex;
      }

      .ktv-admin-modal {
        width: min(420px, 100%);
        background: #09170f;
        border: 1px solid rgba(199,255,49,.3);
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 30px 90px rgba(0,0,0,.55);
        color: #fff;
        font-family: "Be Vietnam Pro", sans-serif;
      }

      .ktv-admin-modal h2 {
        margin: 0 0 8px;
        font-size: 24px;
      }

      .ktv-admin-modal p {
        margin: 0 0 20px;
        color: #91aa9c;
        font-size: 13px;
        line-height: 1.6;
      }

      .ktv-admin-modal input {
        box-sizing: border-box;
        width: 100%;
        min-height: 48px;
        border: 1px solid #274436;
        border-radius: 10px;
        padding: 0 14px;
        background: #06110b;
        color: #fff;
        outline: none;
        font-size: 15px;
      }

      .ktv-admin-modal input:focus {
        border-color: #c7ff31;
      }

      .ktv-admin-actions {
        display: flex;
        gap: 10px;
        margin-top: 18px;
      }

      .ktv-admin-actions button {
        flex: 1;
        min-height: 44px;
        border-radius: 10px;
        border: 1px solid #294538;
        cursor: pointer;
        font-weight: 700;
      }

      #ktvAdminLogin {
        background: #c7ff31;
        color: #07120b;
        border-color: #c7ff31;
      }

      #ktvAdminCancel {
        background: transparent;
        color: #fff;
      }

      #ktvAdminError {
        display: none;
        margin-top: 12px;
        color: #ff7373;
        font-size: 13px;
      }

      #ktvAdminToast {
        position: fixed;
        left: 50%;
        bottom: 80px;
        z-index: 99999;
        transform: translate(-50%, 12px);
        background: #101c15;
        color: #fff;
        border: 1px solid #345342;
        border-radius: 10px;
        padding: 11px 16px;
        font: 600 13px "Be Vietnam Pro", sans-serif;
        opacity: 0;
        pointer-events: none;
        transition: .2s ease;
      }

      #ktvAdminToast.show {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    `;

    document.head.appendChild(style);
  }

  /* =========================
     GIAO DIỆN LOGIN
  ========================== */

  function installAdminUI() {
    const button = document.createElement('button');
    button.id = 'ktvAdminButton';
    button.type = 'button';

    document.body.appendChild(button);

    const overlay = document.createElement('div');
    overlay.id = 'ktvAdminOverlay';

    overlay.innerHTML = `
      <div class="ktv-admin-modal">
        <h2>🔒 Đăng nhập Admin</h2>

        <p>
          Khách truy cập chỉ có quyền xem.
          Nhập mật khẩu Admin để mở quyền chỉnh sửa giải đấu.
        </p>

        <input
          id="ktvAdminPassword"
          type="password"
          autocomplete="current-password"
          placeholder="Mật khẩu Admin"
        >

        <div id="ktvAdminError"></div>

        <div class="ktv-admin-actions">
          <button
            type="button"
            id="ktvAdminCancel"
          >
            Hủy
          </button>

          <button
            type="button"
            id="ktvAdminLogin"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const toast = document.createElement('div');
    toast.id = 'ktvAdminToast';
    document.body.appendChild(toast);

    button.addEventListener('click', () => {
      if (isAdmin()) {
        const confirmed = confirm(
          'Đăng xuất khỏi chế độ Admin?'
        );

        if (!confirmed) return;

        clearAdminSession();
        refreshProtectedControls();

        showToast(
          '🔒 Đã chuyển sang chế độ chỉ xem.'
        );

        return;
      }

      openLogin();
    });

    document
      .getElementById('ktvAdminCancel')
      .addEventListener(
        'click',
        closeLogin
      );

    document
      .getElementById('ktvAdminLogin')
      .addEventListener(
        'click',
        loginAdmin
      );

    document
      .getElementById('ktvAdminPassword')
      .addEventListener(
        'keydown',
        (event) => {
          if (event.key === 'Enter') {
            loginAdmin();
          }
        }
      );

    overlay.addEventListener(
      'click',
      (event) => {
        if (event.target === overlay) {
          closeLogin();
        }
      }
    );

    updateAdminButton();
  }

  function updateAdminButton() {
    const button =
      document.getElementById('ktvAdminButton');

    if (!button) return;

    button.textContent = isAdmin()
      ? '🔓 Admin • Đăng xuất'
      : '🔒 Admin';
  }

  function openLogin() {
    const overlay =
      document.getElementById('ktvAdminOverlay');

    const input =
      document.getElementById('ktvAdminPassword');

    const error =
      document.getElementById('ktvAdminError');

    error.style.display = 'none';
    error.textContent = '';

    input.value = '';

    overlay.classList.add('open');

    setTimeout(() => input.focus(), 50);
  }

  function closeLogin() {
    document
      .getElementById('ktvAdminOverlay')
      ?.classList.remove('open');
  }

  async function loginAdmin() {
    const input =
      document.getElementById('ktvAdminPassword');

    const loginButton =
      document.getElementById('ktvAdminLogin');

    const error =
      document.getElementById('ktvAdminError');

    const password = input.value;

    if (!password) {
      error.textContent =
        'Vui lòng nhập mật khẩu.';
      error.style.display = 'block';
      return;
    }

    loginButton.disabled = true;
    loginButton.textContent = 'Đang kiểm tra…';

    error.style.display = 'none';

    try {
      const response = await originalFetch(
        ADMIN_API,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            password
          })
        }
      );

      const result = await response.json();

      if (
        !response.ok ||
        !result.ok ||
        !result.token
      ) {
        throw new Error(
          result.error ||
          'Không thể đăng nhập Admin.'
        );
      }

      adminToken = result.token;

      adminExpiresAt =
        Number(result.expiresAt) ||
        Date.now() + 12 * 60 * 60 * 1000;

      sessionStorage.setItem(
        TOKEN_KEY,
        adminToken
      );

      sessionStorage.setItem(
        EXPIRES_KEY,
        String(adminExpiresAt)
      );

      closeLogin();
      refreshProtectedControls();

      showToast(
        '🔓 Đã mở quyền Admin.'
      );
    } catch (loginError) {
      error.textContent =
        loginError?.message ||
        'Không thể đăng nhập Admin.';

      error.style.display = 'block';
    } finally {
      loginButton.disabled = false;
      loginButton.textContent = 'Đăng nhập';
    }
  }

  let toastTimer = null;

  function showToast(message) {
    const toast =
      document.getElementById('ktvAdminToast');

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  /* =========================
     THEO DÕI UI ĐƯỢC RENDER LẠI
  ========================== */

  function watchDynamicControls() {
    const observer = new MutationObserver(() => {
      refreshProtectedControls();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function start() {
    installStyles();
    installAdminUI();
    refreshProtectedControls();
    watchDynamicControls();
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      start,
      { once: true }
    );
  } else {
    start();
  }
})();
