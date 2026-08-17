(() => {
  'use strict';

  /* =========================================================
     KTV BADMINTON — ADMIN LOCK v11.1
     - Khách: chỉ xem
     - Admin: được chỉnh sửa + lưu dữ liệu online
     - Không tạo vòng lặp MutationObserver
     ========================================================= */

  const ADMIN_API = '/api/admin';
  const STATE_API = '/api/state';

  const TOKEN_KEY = 'ktv_admin_token_v11';
  const EXPIRES_KEY = 'ktv_admin_expires_v11';

  const CONTROL_SELECTOR =
    'button,input,textarea,select';

  /*
    Các thành phần chỉ Admin được thao tác.
    Giữ data-* để các phần được render động vẫn tự khóa.
  */
  const ADMIN_ONLY_SELECTORS = [
    '[data-admin-only]',
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

  let adminToken =
    sessionStorage.getItem(TOKEN_KEY) || '';

  let adminExpiresAt =
    Number(
      sessionStorage.getItem(EXPIRES_KEY) || 0
    );

  let toastTimer = null;
  let refreshQueued = false;

  /* =========================================================
     ADMIN SESSION
     ========================================================= */

  function clearAdminSession() {
    adminToken = '';
    adminExpiresAt = 0;

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EXPIRES_KEY);
  }

  function isAdmin() {
    if (!adminToken) {
      return false;
    }

    if (
      !adminExpiresAt ||
      Date.now() >= adminExpiresAt
    ) {
      clearAdminSession();
      return false;
    }

    return true;
  }

  /* =========================================================
     BẢO VỆ API LƯU DỮ LIỆU
     ========================================================= */

  const originalFetch =
    window.fetch.bind(window);

  window.fetch = async function protectedFetch(
    input,
    init = {}
  ) {
    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof Request
          ? input.url
          : String(input);

    const method = String(
      init.method ||
        (
          input instanceof Request
            ? input.method
            : 'GET'
        )
    ).toUpperCase();

    let pathname = rawUrl;

    try {
      pathname = new URL(
        rawUrl,
        window.location.origin
      ).pathname;
    } catch (_) {}

    const isStateWrite =
      method === 'POST' &&
      pathname === STATE_API;

    /*
      Người chưa đăng nhập Admin:
      tuyệt đối không được POST dữ liệu giải đấu.
    */
    if (isStateWrite) {
      if (!isAdmin()) {
        return new Response(
          JSON.stringify({
            ok: false,
            error:
              'Chỉ Admin mới có quyền sửa dữ liệu giải đấu.'
          }),
          {
            status: 401,
            headers: {
              'content-type':
                'application/json; charset=utf-8',
              'cache-control': 'no-store'
            }
          }
        );
      }

      /*
        Admin đã đăng nhập:
        gắn token vào Authorization.
      */
      const headers = new Headers(
        init.headers ||
          (
            input instanceof Request
              ? input.headers
              : undefined
          )
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

  /* =========================================================
     NHẬN DIỆN CONTROL ADMIN
     ========================================================= */

  function elementNeedsAdmin(element) {
    if (
      !element ||
      !(element instanceof Element)
    ) {
      return false;
    }

    return ADMIN_ONLY_SELECTORS.some(
      (selector) => {
        try {
          return (
            element.matches(selector) ||
            Boolean(
              element.closest(selector)
            )
          );
        } catch (_) {
          return false;
        }
      }
    );
  }

  /* =========================================================
     KHÓA / MỞ CONTROL
     ========================================================= */

  function protectElement(el) {
    if (
      !el ||
      !(el instanceof Element)
    ) {
      return;
    }

    const admin = isAdmin();

    el.classList.add(
      'admin-protected-control'
    );

    /*
      VIEWER MODE
    */
    if (!admin) {
      el.classList.add(
        'admin-locked-control'
      );

      el.setAttribute(
        'title',
        'Chỉ Admin mới có quyền chỉnh sửa'
      );

      /*
        Chỉ disable control HTML thực sự.
        Form sẽ được chặn bằng submit listener.
      */
      if (el.matches(CONTROL_SELECTOR)) {
        if (
          !el.hasAttribute(
            'data-admin-original-disabled'
          )
        ) {
          el.setAttribute(
            'data-admin-original-disabled',
            el.disabled ? '1' : '0'
          );
        }

        el.disabled = true;
      }

      return;
    }

    /*
      ADMIN MODE
    */
    el.classList.remove(
      'admin-locked-control'
    );

    el.removeAttribute('title');

    if (el.matches(CONTROL_SELECTOR)) {
      const originalDisabled =
        el.getAttribute(
          'data-admin-original-disabled'
        );

      if (originalDisabled !== null) {
        el.disabled =
          originalDisabled === '1';

        el.removeAttribute(
          'data-admin-original-disabled'
        );
      }
    }
  }

  /* =========================================================
     NÚT ADMIN
     ========================================================= */

  function updateAdminButton() {
    const button =
      document.getElementById(
        'ktvAdminButton'
      );

    if (!button) {
      return;
    }

    const newText = isAdmin()
      ? '🔓 Admin • Đăng xuất'
      : '🔒 Admin';

    /*
      QUAN TRỌNG:
      Chỉ đổi DOM nếu text thực sự khác.
      Tránh MutationObserver tự kích hoạt liên tục.
    */
    if (
      button.textContent !== newText
    ) {
      button.textContent = newText;
    }
  }

  /* =========================================================
     REFRESH QUYỀN
     ========================================================= */

  function refreshProtectedControls() {
    ADMIN_ONLY_SELECTORS.forEach(
      (selector) => {
        document
          .querySelectorAll(selector)
          .forEach(protectElement);
      }
    );

    const admin = isAdmin();

    document.body.classList.toggle(
      'admin-mode',
      admin
    );

    document.body.classList.toggle(
      'viewer-mode',
      !admin
    );

    updateAdminButton();
  }

  function scheduleRefresh() {
    if (refreshQueued) {
      return;
    }

    refreshQueued = true;

    requestAnimationFrame(() => {
      refreshQueued = false;
      refreshProtectedControls();
    });
  }

  /* =========================================================
     CHẶN CLICK CỦA VIEWER
     ========================================================= */

  document.addEventListener(
    'click',
    (event) => {
      if (isAdmin()) {
        return;
      }

      if (
        elementNeedsAdmin(
          event.target
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        showToast(
          '🔒 Chỉ Admin mới có quyền chỉnh sửa.'
        );
      }
    },
    true
  );

  /* =========================================================
     CHẶN SUBMIT CỦA VIEWER
     ========================================================= */

  document.addEventListener(
    'submit',
    (event) => {
      if (isAdmin()) {
        return;
      }

      if (
        elementNeedsAdmin(
          event.target
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        showToast(
          '🔒 Chỉ Admin mới có quyền lưu thay đổi.'
        );
      }
    },
    true
  );

  /* =========================================================
     CSS
     ========================================================= */

  function installStyles() {
    if (
      document.getElementById(
        'ktvAdminLockStyles'
      )
    ) {
      return;
    }

    const style =
      document.createElement('style');

    style.id = 'ktvAdminLockStyles';

    style.textContent = `
      #ktvAdminButton {
        position: fixed;
        right: 22px;
        bottom: 22px;
        z-index: 99990;

        min-height: 42px;
        padding: 0 16px;

        border: 1px solid rgba(190,255,40,.40);
        border-radius: 12px;

        background: #09160f;
        color: #c7ff31;

        font-family: "Be Vietnam Pro", Arial, sans-serif;
        font-size: 13px;
        font-weight: 800;

        cursor: pointer;

        box-shadow:
          0 12px 32px rgba(0,0,0,.35);

        transition:
          transform .15s ease,
          border-color .15s ease,
          background .15s ease;
      }

      #ktvAdminButton:hover {
        border-color: #c7ff31;
        transform: translateY(-1px);
      }

      body.admin-mode #ktvAdminButton {
        background: #c7ff31;
        color: #07120b;
        border-color: #c7ff31;
      }

      body.viewer-mode
      .admin-locked-control {
        cursor: not-allowed !important;
        opacity: .42 !important;
      }

      body.viewer-mode
      .editable-participant.admin-locked-control {
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
        -webkit-backdrop-filter: blur(8px);
      }

      #ktvAdminOverlay.open {
        display: flex;
      }

      .ktv-admin-modal {
        width: min(420px, 100%);
        box-sizing: border-box;

        padding: 24px;

        border:
          1px solid rgba(199,255,49,.30);

        border-radius: 20px;

        background: #09170f;
        color: #fff;

        box-shadow:
          0 30px 90px rgba(0,0,0,.55);

        font-family:
          "Be Vietnam Pro",
          Arial,
          sans-serif;
      }

      .ktv-admin-modal h2 {
        margin: 0 0 8px;

        color: #ffffff;

        font-size: 24px;
        font-weight: 800;
      }

      .ktv-admin-modal p {
        margin: 0 0 20px;

        color: #91aa9c;

        font-size: 13px;
        line-height: 1.6;
      }

      .ktv-admin-modal input {
        width: 100%;
        min-height: 48px;

        box-sizing: border-box;

        padding: 0 14px;

        border: 1px solid #274436;
        border-radius: 10px;

        background: #06110b;
        color: #fff;

        outline: none;

        font-size: 15px;
      }

      .ktv-admin-modal input:focus {
        border-color: #c7ff31;

        box-shadow:
          0 0 0 3px rgba(199,255,49,.08);
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

        font-weight: 800;
      }

      #ktvAdminLogin {
        background: #c7ff31;
        color: #07120b;
        border-color: #c7ff31;
      }

      #ktvAdminLogin:disabled {
        opacity: .6;
        cursor: wait;
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
        line-height: 1.5;
      }

      #ktvAdminToast {
        position: fixed;

        left: 50%;
        bottom: 80px;

        z-index: 99999;

        max-width:
          calc(100vw - 32px);

        transform:
          translate(-50%, 12px);

        padding: 11px 16px;

        border: 1px solid #345342;
        border-radius: 10px;

        background: #101c15;
        color: #fff;

        font-family:
          "Be Vietnam Pro",
          Arial,
          sans-serif;

        font-size: 13px;
        font-weight: 700;

        text-align: center;

        opacity: 0;

        pointer-events: none;

        transition:
          opacity .2s ease,
          transform .2s ease;
      }

      #ktvAdminToast.show {
        opacity: 1;

        transform:
          translate(-50%, 0);
      }

      @media (max-width: 600px) {
        #ktvAdminButton {
          right: 12px;
          bottom: 12px;
        }

        #ktvAdminToast {
          bottom: 68px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* =========================================================
     TẠO GIAO DIỆN LOGIN
     ========================================================= */

  function installAdminUI() {
    if (
      document.getElementById(
        'ktvAdminButton'
      )
    ) {
      return;
    }

    /*
      Floating Admin button
    */
    const button =
      document.createElement('button');

    button.id = 'ktvAdminButton';
    button.type = 'button';

    document.body.appendChild(button);

    /*
      Modal
    */
    const overlay =
      document.createElement('div');

    overlay.id = 'ktvAdminOverlay';

    overlay.innerHTML = `
      <div
        class="ktv-admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ktvAdminTitle"
      >
        <h2 id="ktvAdminTitle">
          🔒 Đăng nhập Admin
        </h2>

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

    /*
      Toast
    */
    const toast =
      document.createElement('div');

    toast.id = 'ktvAdminToast';

    document.body.appendChild(toast);

    /*
      Admin button click
    */
    button.addEventListener(
      'click',
      () => {
        /*
          Nếu đang là Admin → logout.
        */
        if (isAdmin()) {
          const confirmed =
            window.confirm(
              'Đăng xuất khỏi chế độ Admin?'
            );

          if (!confirmed) {
            return;
          }

          clearAdminSession();

          refreshProtectedControls();

          showToast(
            '🔒 Đã chuyển sang chế độ chỉ xem.'
          );

          return;
        }

        /*
          Viewer → mở login.
        */
        openLogin();
      }
    );

    /*
      Cancel
    */
    document
      .getElementById(
        'ktvAdminCancel'
      )
      .addEventListener(
        'click',
        closeLogin
      );

    /*
      Login
    */
    document
      .getElementById(
        'ktvAdminLogin'
      )
      .addEventListener(
        'click',
        loginAdmin
      );

    /*
      Keyboard
    */
    document
      .getElementById(
        'ktvAdminPassword'
      )
      .addEventListener(
        'keydown',
        (event) => {
          if (event.key === 'Enter') {
            loginAdmin();
          }

          if (event.key === 'Escape') {
            closeLogin();
          }
        }
      );

    /*
      Click nền để đóng modal.
    */
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

  /* =========================================================
     OPEN/CLOSE LOGIN
     ========================================================= */

  function openLogin() {
    const overlay =
      document.getElementById(
        'ktvAdminOverlay'
      );

    const input =
      document.getElementById(
        'ktvAdminPassword'
      );

    const error =
      document.getElementById(
        'ktvAdminError'
      );

    if (
      !overlay ||
      !input ||
      !error
    ) {
      return;
    }

    error.style.display = 'none';
    error.textContent = '';

    input.value = '';

    overlay.classList.add('open');

    setTimeout(
      () => {
        input.focus();
      },
      50
    );
  }

  function closeLogin() {
    document
      .getElementById(
        'ktvAdminOverlay'
      )
      ?.classList.remove('open');
  }

  /* =========================================================
     LOGIN ADMIN
     ========================================================= */

  async function loginAdmin() {
    const input =
      document.getElementById(
        'ktvAdminPassword'
      );

    const loginButton =
      document.getElementById(
        'ktvAdminLogin'
      );

    const error =
      document.getElementById(
        'ktvAdminError'
      );

    if (
      !input ||
      !loginButton ||
      !error
    ) {
      return;
    }

    const password =
      input.value;

    if (!password) {
      error.textContent =
        'Vui lòng nhập mật khẩu Admin.';

      error.style.display = 'block';

      return;
    }

    loginButton.disabled = true;

    loginButton.textContent =
      'Đang kiểm tra…';

    error.style.display = 'none';
    error.textContent = '';

    try {
      const response =
        await originalFetch(
          ADMIN_API,
          {
            method: 'POST',

            headers: {
              'content-type':
                'application/json'
            },

            body:
              JSON.stringify({
                password
              })
          }
        );

      let result = null;

      try {
        result =
          await response.json();
      } catch (_) {
        result = null;
      }

      if (
        !response.ok ||
        !result?.ok ||
        !result?.token
      ) {
        throw new Error(
          result?.error ||
            `Không thể đăng nhập Admin (HTTP ${response.status}).`
        );
      }

      adminToken =
        result.token;

      adminExpiresAt =
        Number(
          result.expiresAt
        ) ||
        (
          Date.now() +
          12 *
          60 *
          60 *
          1000
        );

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
      console.error(
        'Admin login failed:',
        loginError
      );

      error.textContent =
        loginError?.message ||
        'Không thể đăng nhập Admin.';

      error.style.display =
        'block';
    } finally {
      loginButton.disabled =
        false;

      loginButton.textContent =
        'Đăng nhập';
    }
  }

  /* =========================================================
     TOAST
     ========================================================= */

  function showToast(message) {
    const toast =
      document.getElementById(
        'ktvAdminToast'
      );

    if (!toast) {
      return;
    }

    toast.textContent = message;

    toast.classList.add('show');

    clearTimeout(toastTimer);

    toastTimer =
      setTimeout(
        () => {
          toast.classList.remove(
            'show'
          );
        },
        2200
      );
  }

  /* =========================================================
     MUTATION OBSERVER AN TOÀN
     ========================================================= */

  function nodeContainsProtectedControl(
    node
  ) {
    /*
      Text node do đổi button.textContent
      sẽ bị bỏ qua → không tạo vòng lặp.
    */
    if (
      !(node instanceof Element)
    ) {
      return false;
    }

    return ADMIN_ONLY_SELECTORS.some(
      (selector) => {
        try {
          return (
            node.matches(selector) ||
            Boolean(
              node.querySelector(
                selector
              )
            )
          );
        } catch (_) {
          return false;
        }
      }
    );
  }

  function watchDynamicControls() {
    const observer =
      new MutationObserver(
        (mutations) => {
          /*
            Chỉ refresh khi APP thêm mới
            thành phần có quyền Admin.

            Không refresh khi chính admin-lock
            đổi text/class.
          */
          const needsRefresh =
            mutations.some(
              (mutation) =>
                Array
                  .from(
                    mutation.addedNodes
                  )
                  .some(
                    nodeContainsProtectedControl
                  )
            );

          if (needsRefresh) {
            scheduleRefresh();
          }
        }
      );

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );
  }

  /* =========================================================
     THEO DÕI HẾT HẠN TOKEN
     ========================================================= */

  function startExpiryWatcher() {
    setInterval(
      () => {
        /*
          Giữ trạng thái trước khi gọi isAdmin,
          vì isAdmin sẽ tự clear token khi hết hạn.
        */
        const hadToken =
          Boolean(adminToken);

        const admin =
          isAdmin();

        if (
          hadToken &&
          !admin
        ) {
          refreshProtectedControls();

          showToast(
            '🔒 Phiên Admin đã hết hạn. Vui lòng đăng nhập lại.'
          );
        }
      },
      30000
    );
  }

  /* =========================================================
     START
     ========================================================= */

  function start() {
    try {
      installStyles();

      installAdminUI();

      refreshProtectedControls();

      watchDynamicControls();

      startExpiryWatcher();

      console.log(
        'KTV Admin Lock v11.1 ready'
      );
    } catch (error) {
      /*
        Quan trọng:
        nếu Admin Lock có vấn đề,
        không làm web chính bị treo.
      */
      console.error(
        'KTV Admin Lock failed:',
        error
      );
    }
  }

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      start,
      {
        once: true
      }
    );
  } else {
    start();
  }
})();
