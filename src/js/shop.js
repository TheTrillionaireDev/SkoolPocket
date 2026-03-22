// js/shop.js — SkoolPocket Canteen  v5
// ═══════════════════════════════════════════════════════════════════
//
//  BUG FIXES in this version:
//  ──────────────────────────
//  FIX 1 · All overlays (cart drawer, checkout modal, clear modal,
//           success receipt) are appended to <body> — NOT inside the
//           scrollable #shop-screen. This prevents the overflow:auto
//           stacking context from clipping fixed-position overlays
//           behind the footer.
//
//  FIX 2 · Success receipt is a proper full-screen overlay with a
//           receipt card, itemised list, timestamp, and two action
//           buttons. It animates in after checkout and is dismissed
//           cleanly before navigating.
//
//  FIX 3 · Balance and transaction history are persisted to
//           localStorage so they survive logout and page refresh.
//           On login, saved data is rehydrated into the student
//           object before State.currentUser is set.
//
//  SECTION GUIDE
//  ─────────────
//   1 · renderShop()           Builds shop content only (no overlays)
//   2 · ensureOverlays()       Injects overlay HTML into <body> once
//   3 · buildPopularRow()      Horizontal "Top Picks" strip
//   4 · buildTabBtn / Grid     Category tabs + 2-col product grid
//   5 · buildProductCard()     Individual card
//   6 · Cart Management        addToCart, removeFromCart, getters
//   7 · UI Sync                badge, floating bar, card refresh
//   8 · Cart Drawer            toggleCartDrawer, updateCartDrawer
//   9 · Clear Cart Modal       openClearModal / confirmClearCart
//  10 · Checkout Modal         openCheckoutModal, confirmCheckout
//  11 · Success Receipt        showSuccessReceipt, dismissSuccess
//  12 · Persistence            saveStudentData, loadStudentData
//
// ═══════════════════════════════════════════════════════════════════

// ─── Module-level state ──────────────────────────────────────────
let activeCategory = "all";        // "all" | "food" | "drink"
let overlaysReady  = false;        // ensures overlays are only injected once


// ═══════════════════════════════════════════════════════════════════
// SECTION 1 — MAIN RENDER
// Builds ONLY the scrollable shop content into #shop-screen.
// Overlays are handled separately by ensureOverlays().
// ═══════════════════════════════════════════════════════════════════

function renderShop() {
  const screen = document.getElementById("shop-screen");
  if (!screen || !State.currentUser) return;

  // Inject overlays into <body> once (first call only)
  ensureOverlays();

  screen.innerHTML = `

  <!-- Scrollable shop content -->
  <div id="shop-wrapper" style="padding-bottom:8rem">

    <!-- ── HERO HEADER ──────────────────────────────── -->
    <div style="
      position:relative;overflow:hidden;
      background:linear-gradient(145deg,#0B1E5B 0%,#1D4ED8 50%,#0EA5E9 100%);
      padding:1.25rem 1rem 4.5rem">

      <div style="position:absolute;width:260px;height:260px;border-radius:50%;
        background:rgba(255,255,255,.05);top:-80px;right:-60px;pointer-events:none"></div>
      <div style="position:absolute;width:160px;height:160px;border-radius:50%;
        background:rgba(255,255,255,.04);bottom:-40px;left:-30px;pointer-events:none"></div>

      <!-- Title + cart button -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;position:relative;z-index:2">
        <div>
          <p style="color:rgba(147,197,253,.85);font-size:10px;font-weight:900;
            text-transform:uppercase;letter-spacing:.15em;margin-bottom:4px">
            SBIS School Canteen
          </p>
          <h2 style="color:#fff;font-weight:900;font-size:1.2rem;line-height:1.35">
            What are you<br>having today? 🍽️
          </h2>
        </div>

        <button id="cart-toggle-btn" onclick="toggleCartDrawer()"
          style="position:relative;width:48px;height:48px;border-radius:14px;
            background:rgba(255,255,255,.18);backdrop-filter:blur(10px);
            box-shadow:0 4px 16px rgba(0,0,0,.2);border:none;cursor:pointer;
            display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i class="bi bi-cart3" style="color:#fff;font-size:1.25rem"></i>
          <span id="cart-badge" class="hidden"
            style="position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;
              padding:0 4px;border-radius:999px;background:#EF4444;color:#fff;
              font-size:10px;font-weight:900;display:flex;align-items:center;
              justify-content:center;box-shadow:0 2px 8px rgba(239,68,68,.6)">
            0
          </span>
        </button>
      </div>

      <!-- Balance chip -->
      <div style="position:relative;z-index:2;margin-top:12px;display:inline-flex;
        align-items:center;gap:8px;padding:8px 14px;border-radius:999px;
        background:rgba(255,255,255,.13);backdrop-filter:blur(8px)">
        <i class="bi bi-wallet2" style="color:rgba(147,197,253,.9);font-size:.85rem"></i>
        <span style="color:rgba(191,219,254,.9);font-size:.7rem;font-weight:700">Balance</span>
        <span id="shop-balance-chip"
          style="color:#fff;font-size:.75rem;font-weight:900;font-family:monospace">
          ${formatMoney(State.currentUser.balance)}
        </span>
      </div>
    </div>


    <!-- ── CATEGORY TABS ──────────────────────────── -->
    <div style="position:relative;padding:0 1rem;margin-top:-2.2rem;z-index:10;margin-bottom:1.1rem">
      <div id="tab-row"
        style="display:flex;gap:8px;padding:6px;border-radius:20px;
          background:#fff;box-shadow:0 8px 32px rgba(30,58,138,.18)">
        ${buildTabBtn("all",   "🍽️", "All Items")}
        ${buildTabBtn("food",  "🍔", "Food")}
        ${buildTabBtn("drink", "🥤", "Drinks")}
      </div>
    </div>


    <!-- ── POPULAR PICKS ─────────────────────────── -->
    ${buildPopularRow()}


    <!-- ── SECTION LABEL ─────────────────────────── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:0 1rem 10px">
      <h3 style="font-weight:900;font-size:.85rem;color:var(--clr-text);
        display:flex;align-items:center;gap:6px">
        <span style="width:3px;height:16px;background:var(--clr-blue);
          border-radius:999px;display:inline-block"></span>
        <span id="grid-label">All Items</span>
      </h3>
      <span id="grid-count"
        style="font-size:.65rem;font-weight:800;padding:3px 10px;
          border-radius:999px;background:var(--clr-bg);color:var(--clr-text-muted)">
        ${State.products.length} items
      </span>
    </div>


    <!-- ── PRODUCT GRID ──────────────────────────── -->
    <div style="padding:0 1rem">
      <div id="product-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${buildFilteredGrid()}
      </div>
    </div>

  </div><!-- end shop-wrapper -->


  <!-- ── FLOATING "VIEW ORDER" BAR ────────────────
       Positioned relative to the viewport via body-level overlay,
       but this bar sits inside the shop screen — it's above the
       footer because of its z-index. The overlays that need to
       cover the footer are in ensureOverlays() appended to <body>.
  ─────────────────────────────────────────────── -->
  <div id="floating-cart-bar" class="${State.cart.length === 0 ? "hidden" : ""}"
    style="position:fixed;bottom:5.5rem;left:0;right:0;z-index:55;padding:0 1rem;
      max-width:480px;margin:0 auto;left:50%;transform:translateX(-50%)">
    <button onclick="toggleCartDrawer()"
      style="width:100%;display:flex;align-items:center;justify-content:space-between;
        padding:14px 18px;border-radius:18px;border:none;cursor:pointer;color:#fff;
        background:linear-gradient(135deg,#1D4ED8,#2563EB);
        box-shadow:0 8px 28px rgba(29,78,216,.5)">
      <div style="display:flex;align-items:center;gap:10px">
        <span id="float-badge"
          style="width:30px;height:30px;border-radius:10px;background:rgba(255,255,255,.2);
            display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:900">
          ${State.cart.reduce((s,c) => s + c.quantity, 0)}
        </span>
        <span style="font-weight:900;font-size:.85rem">View Order</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span id="float-total" style="font-weight:900;font-size:.85rem;font-family:monospace">
          ${formatMoney(getCartTotal())}
        </span>
        <i class="bi bi-chevron-up" style="font-size:.8rem"></i>
      </div>
    </button>
  </div>

  `;

  syncCartBadge();
  syncFloatingBar();
}


// ═══════════════════════════════════════════════════════════════════
// SECTION 2 — ensureOverlays()
//
// THE KEY FIX: All overlay HTML (cart drawer, clear modal, checkout
// modal, success receipt) is injected directly into <body>.
// This means they are NOT children of any scrollable container,
// so position:fixed works correctly and they appear above EVERYTHING
// including the footer (which is z-50 / z-index:50).
//
// We use z-index values 200–500 so nothing can hide them.
// Called once per session — the overlaysReady flag prevents
// duplicate injection.
// ═══════════════════════════════════════════════════════════════════

function ensureOverlays() {
  if (overlaysReady) return;
  overlaysReady = true;

  const container = document.createElement("div");
  container.id = "shop-overlays";

  // ── KEY RULES applied here ────────────────────────────────────────
  // 1. ALL modals start with style="display:none" — NOT class="hidden".
  //    Tailwind's hidden (display:none !important) conflicts with any
  //    inline display:flex on the same element; inline always wins in
  //    some browsers, causing the modal to appear on load.
  //    Controlling display purely via JS style.display is bulletproof.
  //
  // 2. Backdrops use pointer-events:none by default, z-index:-1 relative
  //    to the dialog card. This ensures button clicks always reach the
  //    card and never get swallowed by the backdrop layer.
  // ─────────────────────────────────────────────────────────────────

  container.innerHTML = `

    <!-- ═══ CART DRAWER (z:200) ═══════════════════════════════════ -->
    <div id="cart-drawer"
      style="display:none;position:fixed;inset:0;z-index:200">

      <div id="cart-backdrop" onclick="toggleCartDrawer()"
        style="position:absolute;inset:0;background:rgba(10,20,60,.55);
          backdrop-filter:blur(4px);opacity:0;transition:opacity .28s ease;z-index:0">
      </div>

      <div id="cart-panel"
        style="position:absolute;bottom:0;left:0;right:0;background:#fff;
          border-radius:28px 28px 0 0;display:flex;flex-direction:column;
          max-height:88vh;transform:translateY(100%);z-index:1;
          transition:transform .32s cubic-bezier(.32,.72,0,1);
          box-shadow:0 -20px 60px rgba(30,58,138,.22)">

        <div style="display:flex;justify-content:center;padding:12px 0 4px">
          <div style="width:40px;height:4px;border-radius:999px;background:#E2E8F0"></div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;
          padding:10px 20px 14px;border-bottom:1px solid #E2E8F0;flex-shrink:0">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:34px;height:34px;border-radius:12px;
              background:linear-gradient(135deg,#1D4ED8,#3B82F6);
              display:flex;align-items:center;justify-content:center">
              <i class="bi bi-cart3" style="color:#fff;font-size:.9rem"></i>
            </div>
            <span style="font-weight:900;font-size:.95rem;color:var(--clr-text)">Your Order</span>
            <span id="cart-count-label"
              style="background:var(--clr-blue);color:#fff;font-size:.65rem;
                font-weight:900;padding:3px 10px;border-radius:999px">0</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <button onclick="openClearModal()"
              style="font-size:.7rem;font-weight:800;padding:4px 10px;border-radius:999px;
                background:#FEF2F2;color:var(--clr-red);border:none;cursor:pointer">
              Clear
            </button>
            <button onclick="toggleCartDrawer()"
              style="width:32px;height:32px;border-radius:50%;background:#F1F5F9;
                border:none;cursor:pointer;display:flex;align-items:center;justify-content:center">
              <i class="bi bi-x" style="font-size:1.1rem;color:var(--clr-text-muted)"></i>
            </button>
          </div>
        </div>

        <div id="cart-items"
          style="overflow-y:auto;flex:1;padding:12px 16px;display:flex;flex-direction:column;gap:10px">
        </div>
        <div id="cart-footer"
          style="flex-shrink:0;padding:12px 16px 24px;border-top:1px solid #E2E8F0">
        </div>
      </div>
    </div>


    <!-- ═══ CLEAR CART MODAL (z:300) ══════════════════════════════ -->
    <div id="clear-modal"
      style="display:none;position:fixed;inset:0;z-index:300">

      <!-- Backdrop sits BEHIND the card (z-index:0) -->
      <div onclick="closeClearModal()"
        style="position:absolute;inset:0;background:rgba(10,20,60,.5);
          backdrop-filter:blur(4px);z-index:0">
      </div>

      <!-- Card sits IN FRONT of backdrop (z-index:1, position:relative) -->
      <div style="position:absolute;inset:0;display:flex;align-items:center;
        justify-content:center;padding:1.5rem;pointer-events:none;z-index:1">
        <div style="background:#fff;border-radius:24px;padding:28px 24px;
          width:100%;max-width:320px;box-shadow:0 20px 60px rgba(0,0,0,.2);
          text-align:center;pointer-events:auto">
          <div style="width:56px;height:56px;border-radius:16px;background:#FEF2F2;
            margin:0 auto 14px;display:flex;align-items:center;justify-content:center">
            <i class="bi bi-trash3-fill" style="color:var(--clr-red);font-size:1.5rem"></i>
          </div>
          <h3 style="font-weight:900;font-size:1rem;color:var(--clr-text);margin-bottom:6px">
            Clear entire order?
          </h3>
          <p style="font-size:.8rem;color:var(--clr-text-muted);margin-bottom:20px">
            All items will be removed. This can't be undone.
          </p>
          <div style="display:flex;gap:10px">
            <button onclick="closeClearModal()"
              style="flex:1;padding:12px;border-radius:14px;background:#F1F5F9;
                color:var(--clr-text-muted);font-weight:800;font-size:.85rem;
                border:none;cursor:pointer">
              Keep It
            </button>
            <button onclick="confirmClearCart()"
              style="flex:1;padding:12px;border-radius:14px;background:#FEF2F2;
                color:var(--clr-red);font-weight:900;font-size:.85rem;
                border:none;cursor:pointer">
              Yes, Clear
            </button>
          </div>
        </div>
      </div>
    </div>


    <!-- ═══ CHECKOUT MODAL (z:400) ═════════════════════════════════ -->
    <div id="checkout-modal"
      style="display:none;position:fixed;inset:0;z-index:400">

      <!-- Backdrop (z:0, behind card) -->
      <div onclick="closeCheckoutModal()"
        style="position:absolute;inset:0;background:rgba(10,20,60,.65);
          backdrop-filter:blur(6px);z-index:0">
      </div>

      <!-- Card (z:1, in front) -->
      <div id="checkout-card"
        style="position:absolute;bottom:0;left:0;right:0;background:#fff;
          border-radius:28px 28px 0 0;padding:20px 20px 32px;z-index:1;
          transform:translateY(100%);
          transition:transform .32s cubic-bezier(.32,.72,0,1);
          box-shadow:0 -20px 60px rgba(30,58,138,.25)">

        <div style="display:flex;justify-content:center;margin-bottom:16px">
          <div style="width:40px;height:4px;border-radius:999px;background:#E2E8F0"></div>
        </div>

        <div style="text-align:center;margin-bottom:18px">
          <div style="width:60px;height:60px;border-radius:18px;margin:0 auto 12px;
            background:linear-gradient(135deg,#0B1E5B,#1D4ED8,#3B82F6);
            display:flex;align-items:center;justify-content:center">
            <i class="bi bi-shield-lock-fill" style="color:#fff;font-size:1.6rem"></i>
          </div>
          <h3 style="font-weight:900;font-size:1.1rem;color:var(--clr-text);margin-bottom:4px">
            Confirm Payment
          </h3>
          <p style="font-size:.75rem;color:var(--clr-text-faint)">
            Enter your wallet password to authorise
          </p>
        </div>

        <div style="background:var(--clr-bg);border-radius:16px;padding:14px;margin-bottom:16px">
          <p style="font-size:9px;font-weight:900;text-transform:uppercase;
            letter-spacing:.12em;color:var(--clr-text-faint);margin-bottom:10px">
            Order Summary
          </p>
          <div id="modal-order-lines"
            style="display:flex;flex-direction:column;gap:7px;max-height:130px;overflow-y:auto;margin-bottom:12px">
          </div>
          <div style="height:1px;background:var(--clr-border);margin-bottom:10px"></div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:700;font-size:.85rem;color:var(--clr-text)">Total to Pay</span>
            <span id="modal-total"
              style="font-weight:900;font-size:1.1rem;color:var(--clr-blue);font-family:monospace">
              \u20a60
            </span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:5px">
            <span style="font-size:.72rem;color:var(--clr-text-faint)">Balance after payment</span>
            <span id="modal-balance-after"
              style="font-size:.72rem;font-weight:800;color:var(--clr-green)">
              \u20a60
            </span>
          </div>
        </div>

        <div style="margin-bottom:14px">
          <label style="font-size:9px;font-weight:900;text-transform:uppercase;
            letter-spacing:.12em;color:var(--clr-text-muted);display:block;margin-bottom:8px">
            Wallet Password
          </label>
          <div style="position:relative">
            <i class="bi bi-lock"
              style="position:absolute;left:14px;top:50%;transform:translateY(-50%);
                color:var(--clr-text-faint);font-size:1rem"></i>
            <input type="password" id="checkout-password"
              placeholder="Enter your password"
              autocomplete="current-password"
              style="width:100%;padding:14px 14px 14px 42px;border-radius:14px;
                background:var(--clr-bg);color:var(--clr-text);font-weight:700;
                font-size:.85rem;border:2px solid var(--clr-border);outline:none;
                box-sizing:border-box;transition:border-color .2s">
          </div>
          <p id="checkout-error"
            style="display:none;font-size:.75rem;font-weight:800;color:var(--clr-red);
              margin-top:8px;flex-direction:row;align-items:center;gap:5px">
            <i class="bi bi-exclamation-circle-fill"></i>
            <span id="checkout-error-text"></span>
          </p>
        </div>

        <div style="display:flex;gap:10px">
          <button onclick="closeCheckoutModal()"
            style="flex:1;padding:14px;border-radius:16px;background:#F1F5F9;
              color:var(--clr-text-muted);font-weight:800;font-size:.9rem;border:none;cursor:pointer">
            Cancel
          </button>
          <button id="confirm-pay-btn" onclick="confirmCheckout()"
            style="flex:2;padding:14px;border-radius:16px;color:#fff;font-weight:900;
              font-size:.9rem;border:none;cursor:pointer;
              background:linear-gradient(135deg,#1D4ED8,#3B82F6);
              box-shadow:0 6px 24px rgba(29,78,216,.45);
              display:flex;align-items:center;justify-content:center;gap:8px">
            <i class="bi bi-shield-check" style="font-size:1rem"></i>
            Pay Now
          </button>
        </div>
      </div>
    </div>


    <!-- ═══ SUCCESS RECEIPT (z:500) ════════════════════════════════ -->
    <div id="success-overlay"
      style="display:none;position:fixed;inset:0;z-index:500;overflow-y:auto;
        background:linear-gradient(160deg,#0B1E5B 0%,#1D4ED8 55%,#0EA5E9 100%)">

      <div style="min-height:100%;display:flex;flex-direction:column;
        align-items:center;justify-content:center;padding:2rem 1.25rem">

        <div style="width:90px;height:90px;border-radius:50%;
          background:rgba(255,255,255,.15);
          box-shadow:0 0 0 14px rgba(255,255,255,.07);
          display:flex;align-items:center;justify-content:center;margin-bottom:20px">
          <i class="bi bi-check2" style="color:#fff;font-size:2.8rem"></i>
        </div>

        <h2 style="color:#fff;font-weight:900;font-size:1.5rem;margin-bottom:6px;text-align:center">
          Order Placed! \uD83C\uDF89
        </h2>
        <p id="success-message"
          style="color:rgba(147,197,253,.9);font-size:.85rem;font-weight:600;
            text-align:center;margin-bottom:24px;padding:0 1rem">
          Payment successful.
        </p>

        <div style="width:100%;max-width:340px;background:rgba(255,255,255,.1);
          backdrop-filter:blur(8px);border-radius:22px;padding:18px;margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <span style="color:rgba(191,219,254,.8);font-size:.72rem;font-weight:900;
              text-transform:uppercase;letter-spacing:.1em">Receipt</span>
            <span id="receipt-time" style="color:rgba(191,219,254,.7);font-size:.7rem;font-weight:600"></span>
          </div>
          <div id="success-items" style="display:flex;flex-direction:column;gap:7px;margin-bottom:14px"></div>
          <div style="border-top:1.5px dashed rgba(255,255,255,.2);margin-bottom:12px"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="color:rgba(191,219,254,.8);font-size:.8rem;font-weight:700">Total Paid</span>
            <span id="receipt-total"
              style="color:#fff;font-size:1.1rem;font-weight:900;font-family:monospace">\u20a60</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:rgba(191,219,254,.7);font-size:.75rem;font-weight:600">New Wallet Balance</span>
            <span id="success-new-balance"
              style="color:#4ADE80;font-size:.9rem;font-weight:900;font-family:monospace">\u20a60</span>
          </div>
        </div>

        <div style="display:flex;gap:10px;width:100%;max-width:340px">
          <button onclick="dismissSuccess(); navigate('home')"
            style="flex:1;padding:14px;border-radius:16px;background:#fff;
              color:var(--clr-blue);font-weight:900;font-size:.85rem;border:none;cursor:pointer">
            Go Home
          </button>
          <button onclick="dismissSuccess()"
            style="flex:1;padding:14px;border-radius:16px;background:rgba(255,255,255,.18);
              color:#fff;font-weight:900;font-size:.85rem;border:none;cursor:pointer">
            Order More
          </button>
        </div>
      </div>
    </div>

  `;

  document.body.appendChild(container);
}
// ═══════════════════════════════════════════════════════════════════
// SECTION 3 — POPULAR PICKS ROW
// ═══════════════════════════════════════════════════════════════════

function buildPopularRow() {
  const popular = State.products.filter((p) => p.popular === true);
  if (popular.length === 0) return "";

  const cards = popular.map((p) => {
    const qty = getCartItem(p.id) ? getCartItem(p.id).quantity : 0;
    return `
      <div style="flex-shrink:0;width:140px;border-radius:18px;overflow:hidden;
        background:#fff;box-shadow:0 2px 14px rgba(30,58,138,.1)">
        <div style="height:78px;background:#EFF6FF;position:relative">
          <img src="${p.image}" alt="${p.name}"
            style="width:100%;height:100%;object-fit:cover" loading="lazy"
            onerror="this.style.display='none'">
          ${qty > 0 ? `
            <span style="position:absolute;top:5px;right:5px;width:20px;height:20px;
              border-radius:50%;background:var(--clr-blue);color:#fff;
              font-size:9px;font-weight:900;display:flex;align-items:center;justify-content:center">
              ${qty}
            </span>` : ""}
        </div>
        <div style="padding:8px 8px 10px">
          <p style="font-weight:800;font-size:.68rem;color:var(--clr-text);line-height:1.3;
            margin-bottom:6px;overflow:hidden;display:-webkit-box;
            -webkit-line-clamp:2;-webkit-box-orient:vertical">
            ${p.name}
          </p>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-weight:900;font-size:.78rem;color:var(--clr-blue)">
              ₦${p.price.toLocaleString()}
            </span>
            <button onclick="addToCart('${p.id}')"
              style="width:24px;height:24px;border-radius:50%;background:var(--clr-blue);
                color:#fff;border:none;cursor:pointer;font-size:.9rem;font-weight:900;
                display:flex;align-items:center;justify-content:center;
                box-shadow:0 2px 8px rgba(29,78,216,.35)">
              +
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  return `
    <div style="margin-bottom:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 1rem 8px">
        <h3 style="font-weight:900;font-size:.85rem;color:var(--clr-text)">🔥 Top Picks</h3>
        <span style="font-size:.65rem;font-weight:700;color:var(--clr-text-faint)">${popular.length} items</span>
      </div>
      <div class="hide-scrollbar" style="display:flex;gap:10px;padding:0 1rem 4px;overflow-x:auto">
        ${cards}
      </div>
    </div>
  `;
}


// ═══════════════════════════════════════════════════════════════════
// SECTION 4 — TABS & PRODUCT GRID
// ═══════════════════════════════════════════════════════════════════

function buildTabBtn(value, icon, label) {
  const isActive = activeCategory === value;
  const count    = value === "all"
    ? State.products.length
    : State.products.filter((p) => p.category === value).length;

  return `
    <button onclick="switchTab('${value}')"
      style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;
        padding:10px 4px;border-radius:13px;border:none;cursor:pointer;
        font-weight:900;font-size:.75rem;
        ${isActive
          ? "background:linear-gradient(135deg,#1D4ED8,#3B82F6);color:#fff;box-shadow:0 4px 14px rgba(29,78,216,.35)"
          : "color:var(--clr-text-muted);background:transparent"}">
      <span>${icon}</span>
      <span>${label}</span>
      <span style="font-size:9px;font-weight:900;padding:2px 6px;border-radius:999px;
        ${isActive
          ? "background:rgba(255,255,255,.25);color:#fff"
          : "background:var(--clr-bg);color:var(--clr-text-faint)"}">
        ${count}
      </span>
    </button>
  `;
}

function switchTab(category) {
  activeCategory = category;

  const tabRow = document.getElementById("tab-row");
  if (tabRow) {
    tabRow.innerHTML =
      buildTabBtn("all",   "🍽️", "All Items") +
      buildTabBtn("food",  "🍔", "Food")      +
      buildTabBtn("drink", "🥤", "Drinks");
  }

  const labelEl  = document.getElementById("grid-label");
  const countEl  = document.getElementById("grid-count");
  const labels   = { all: "All Items", food: "Food", drink: "Drinks" };
  const filtered = category === "all"
    ? State.products
    : State.products.filter((p) => p.category === category);

  if (labelEl) labelEl.textContent = labels[category] || "Items";
  if (countEl) countEl.textContent = `${filtered.length} items`;

  const grid = document.getElementById("product-grid");
  if (grid) grid.innerHTML = buildFilteredGrid();
}

function buildFilteredGrid() {
  const visible = State.products.filter((p) =>
    activeCategory === "all" ? true : p.category === activeCategory
  );

  if (visible.length === 0) {
    return `
      <div style="grid-column:span 2;text-align:center;padding:48px 0">
        <p style="font-size:2rem;margin-bottom:8px">🍽️</p>
        <p style="font-weight:700;font-size:.85rem;color:var(--clr-text-muted)">Nothing here yet</p>
      </div>
    `;
  }

  return visible.map((p) => buildProductCard(p)).join("");
}


// ═══════════════════════════════════════════════════════════════════
// SECTION 5 — PRODUCT CARD
// ═══════════════════════════════════════════════════════════════════

function buildProductCard(product) {
  const cartItem      = getCartItem(product.id);
  const qty           = cartItem ? cartItem.quantity : 0;
  const fallbackEmoji = product.category === "food" ? "🍛" : "🥤";

  return `
    <div class="product-card" data-id="${product.id}"
      style="background:#fff;border-radius:18px;overflow:hidden;display:flex;
        flex-direction:column;box-shadow:0 2px 16px rgba(30,58,138,.09)">

      <div style="position:relative;height:110px;background:#EFF6FF;flex-shrink:0">
        <img src="${product.image}" alt="${product.name}"
          style="width:100%;height:100%;object-fit:cover" loading="lazy"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div style="display:none;position:absolute;inset:0;align-items:center;
          justify-content:center;font-size:2.2rem;background:var(--clr-bg)">
          ${fallbackEmoji}
        </div>
        ${product.tag ? `
          <span style="position:absolute;top:7px;left:7px;font-size:9px;font-weight:900;
            padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.93);
            color:var(--clr-blue);box-shadow:0 2px 8px rgba(0,0,0,.12);
            white-space:nowrap;max-width:75%;overflow:hidden;text-overflow:ellipsis">
            ${product.tag}
          </span>` : ""}
        ${qty > 0 ? `
          <span style="position:absolute;top:7px;right:7px;min-width:22px;height:22px;
            padding:0 4px;border-radius:999px;background:var(--clr-blue);color:#fff;
            font-size:10px;font-weight:900;display:flex;align-items:center;
            justify-content:center;box-shadow:0 2px 10px rgba(29,78,216,.4)">
            ${qty}
          </span>` : ""}
      </div>

      <div style="padding:10px;display:flex;flex-direction:column;gap:5px;flex:1">
        <p style="font-weight:800;font-size:.75rem;color:var(--clr-text);line-height:1.3;
          overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">
          ${product.name}
        </p>
        <p style="font-size:.65rem;color:var(--clr-text-faint);line-height:1.4;
          overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical">
          ${product.description}
        </p>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:6px">
          <span style="font-weight:900;font-size:.85rem;color:var(--clr-blue)">
            ₦${product.price.toLocaleString()}
          </span>
          ${qty === 0 ? `
            <button onclick="addToCart('${product.id}')"
              style="width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;
                background:var(--clr-blue);color:#fff;font-size:1.1rem;font-weight:900;
                display:flex;align-items:center;justify-content:center;
                box-shadow:0 3px 10px rgba(29,78,216,.4)">
              +
            </button>
          ` : `
            <div style="display:flex;align-items:center;gap:6px">
              <button onclick="removeFromCart('${product.id}')"
                style="width:26px;height:26px;border-radius:50%;border:none;cursor:pointer;
                  background:var(--clr-red);color:#fff;font-size:.9rem;font-weight:700;
                  display:flex;align-items:center;justify-content:center">−</button>
              <span style="font-weight:900;font-size:.85rem;min-width:16px;text-align:center;color:var(--clr-text)">
                ${qty}
              </span>
              <button onclick="addToCart('${product.id}')"
                style="width:26px;height:26px;border-radius:50%;border:none;cursor:pointer;
                  background:var(--clr-blue);color:#fff;font-size:.9rem;font-weight:700;
                  display:flex;align-items:center;justify-content:center">+</button>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}


// ═══════════════════════════════════════════════════════════════════
// SECTION 6 — CART MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

function addToCart(productId) {
  const product  = State.products.find((p) => p.id === productId);
  if (!product) return;

  const existing = getCartItem(productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    State.cart.push({
      id:       product.id,
      name:     product.name,
      price:    product.price,
      image:    product.image,
      category: product.category,
      calories: product.calories || "",
      quantity: 1
    });
  }

  syncCartBadge();
  syncFloatingBar();
  refreshProductCard(productId);

  const drawer = document.getElementById("cart-drawer");
  if (drawer && drawer.style.display !== "none" && drawer.style.display !== "") updateCartDrawer();
}

function removeFromCart(productId) {
  const index = State.cart.findIndex((c) => c.id === productId);
  if (index === -1) return;

  if (State.cart[index].quantity > 1) {
    State.cart[index].quantity -= 1;
  } else {
    State.cart.splice(index, 1);
  }

  syncCartBadge();
  syncFloatingBar();
  refreshProductCard(productId);

  const drawer = document.getElementById("cart-drawer");
  if (drawer && drawer.style.display !== "none" && drawer.style.display !== "") updateCartDrawer();
}

function getCartItem(productId) {
  return State.cart.find((c) => c.id === productId);
}

function getCartTotal() {
  return State.cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
}

function getCartItemCount() {
  return State.cart.reduce((sum, c) => sum + c.quantity, 0);
}


// ═══════════════════════════════════════════════════════════════════
// SECTION 7 — UI SYNC HELPERS
// ═══════════════════════════════════════════════════════════════════

function syncCartBadge() {
  const badge      = document.getElementById("cart-badge");
  const countLabel = document.getElementById("cart-count-label");
  const count      = getCartItemCount();

  if (badge) {
    badge.textContent = count;
    count > 0 ? badge.classList.remove("hidden") : badge.classList.add("hidden");
  }
  if (countLabel) countLabel.textContent = count;
}

function syncFloatingBar() {
  const bar     = document.getElementById("floating-cart-bar");
  const badgeEl = document.getElementById("float-badge");
  const totalEl = document.getElementById("float-total");
  const count   = getCartItemCount();

  if (!bar) return;
  if (count > 0) {
    bar.classList.remove("hidden");
    if (badgeEl) badgeEl.textContent = count;
    if (totalEl) totalEl.textContent = formatMoney(getCartTotal());
  } else {
    bar.classList.add("hidden");
  }
}

function refreshProductCard(productId) {
  const product = State.products.find((p) => p.id === productId);
  if (!product) return;

  const card = document.querySelector(`.product-card[data-id="${productId}"]`);
  if (card) {
    card.outerHTML = buildProductCard(product);
  } else {
    const grid = document.getElementById("product-grid");
    if (grid) grid.innerHTML = buildFilteredGrid();
  }
}


// ═══════════════════════════════════════════════════════════════════
// SECTION 8 — CART DRAWER
// ═══════════════════════════════════════════════════════════════════

function toggleCartDrawer() {
  const drawer   = document.getElementById("cart-drawer");
  const panel    = document.getElementById("cart-panel");
  const backdrop = document.getElementById("cart-backdrop");
  if (!drawer || !panel) return;

  const isHidden = drawer.style.display === "none" || drawer.style.display === "";

  if (isHidden) {
    drawer.style.display = "block";
    requestAnimationFrame(() => {
      panel.style.transform  = "translateY(0)";
      backdrop.style.opacity = "1";
    });
    updateCartDrawer();
  } else {
    panel.style.transform  = "translateY(100%)";
    backdrop.style.opacity = "0";
    setTimeout(() => { drawer.style.display = "none"; }, 300);
  }
}

function updateCartDrawer() {
  const itemsEl  = document.getElementById("cart-items");
  const footerEl = document.getElementById("cart-footer");
  if (!itemsEl || !footerEl) return;

  syncCartBadge();
  syncFloatingBar();

  if (State.cart.length === 0) {
    itemsEl.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;
        justify-content:center;padding:40px 0;gap:12px">
        <div style="width:64px;height:64px;border-radius:18px;background:var(--clr-bg);
          display:flex;align-items:center;justify-content:center;font-size:1.8rem">🛒</div>
        <p style="font-weight:800;font-size:.85rem;color:var(--clr-text-muted);text-align:center">
          Your cart is empty
        </p>
        <p style="font-size:.75rem;color:var(--clr-text-faint);text-align:center">
          Tap + on any item to start your order
        </p>
      </div>
    `;
    footerEl.innerHTML = "";
    return;
  }

  itemsEl.innerHTML = State.cart.map((entry) => {
    const lineTotal = entry.price * entry.quantity;
    const emoji     = entry.category === "food" ? "🍛" : "🥤";

    return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;
        border-radius:16px;background:var(--clr-bg)">
        <div style="width:50px;height:50px;border-radius:12px;overflow:hidden;
          flex-shrink:0;background:#E2E8F0;display:flex;align-items:center;justify-content:center">
          <img src="${entry.image}" alt="${entry.name}"
            style="width:100%;height:100%;object-fit:cover"
            onerror="this.style.display='none';this.parentElement.innerHTML='<span style=font-size:1.4rem>${emoji}</span>'">
        </div>
        <div style="flex:1;min-width:0">
          <p style="font-weight:800;font-size:.78rem;color:var(--clr-text);
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${entry.name}
          </p>
          <p style="font-size:.68rem;color:var(--clr-text-faint);margin-top:2px">
            ₦${entry.price.toLocaleString()} each
            ${entry.calories ? ` · ${entry.calories}` : ""}
          </p>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <button onclick="removeFromCart('${entry.id}'); updateCartDrawer();"
            style="width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;
              background:var(--clr-red);color:#fff;font-size:.9rem;font-weight:700;
              display:flex;align-items:center;justify-content:center">−</button>
          <span style="font-weight:900;font-size:.85rem;min-width:18px;text-align:center;color:var(--clr-text)">
            ${entry.quantity}
          </span>
          <button onclick="addToCart('${entry.id}'); updateCartDrawer();"
            style="width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;
              background:var(--clr-blue);color:#fff;font-size:.9rem;font-weight:700;
              display:flex;align-items:center;justify-content:center">+</button>
        </div>
        <span style="font-weight:900;font-size:.82rem;flex-shrink:0;min-width:52px;
          text-align:right;color:var(--clr-text)">
          ₦${lineTotal.toLocaleString()}
        </span>
      </div>
    `;
  }).join("");

  const total      = getCartTotal();
  const itemCount  = getCartItemCount();
  const user       = State.currentUser;
  const hasBalance = user.balance >= total;

  footerEl.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between">
        <span style="font-size:.78rem;font-weight:700;color:var(--clr-text-muted)">
          Subtotal (${itemCount} item${itemCount !== 1 ? "s" : ""})
        </span>
        <span style="font-size:.85rem;font-weight:800;color:var(--clr-text)">
          ₦${total.toLocaleString()}
        </span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span style="font-size:.75rem;font-weight:600;color:var(--clr-text-muted)">Your Wallet</span>
        <span style="font-size:.78rem;font-weight:800;color:${hasBalance ? "var(--clr-green)" : "var(--clr-red)"}">
          ${formatMoney(user.balance)}
        </span>
      </div>
    </div>

    ${!hasBalance ? `
      <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;
        border-radius:12px;background:#FEF2F2;margin-bottom:12px">
        <i class="bi bi-exclamation-triangle-fill"
          style="color:var(--clr-red);font-size:.9rem;flex-shrink:0"></i>
        <p style="font-size:.75rem;font-weight:700;color:var(--clr-red)">
          Insufficient balance. Please top up your wallet.
        </p>
      </div>
    ` : ""}

    <button onclick="openCheckoutModal()"
      ${!hasBalance ? "disabled" : ""}
      style="width:100%;padding:15px;border-radius:16px;border:none;cursor:pointer;
        color:#fff;font-weight:900;font-size:.9rem;
        display:flex;align-items:center;justify-content:center;gap:8px;
        ${!hasBalance
          ? "background:#CBD5E1;cursor:not-allowed"
          : "background:linear-gradient(135deg,#1D4ED8,#3B82F6);box-shadow:0 8px 24px rgba(29,78,216,.45)"}">
      <i class="bi bi-shield-check" style="font-size:1rem"></i>
      Checkout · ${formatMoney(total)}
    </button>
  `;
}


// ═══════════════════════════════════════════════════════════════════
// SECTION 9 — CLEAR CART MODAL
// ═══════════════════════════════════════════════════════════════════

function openClearModal() {
  const m = document.getElementById("clear-modal");
  if (m) m.style.display = "block";
}

function closeClearModal() {
  const m = document.getElementById("clear-modal");
  if (m) m.style.display = "none";
}

function confirmClearCart() {
  State.cart = [];
  closeClearModal();
  syncCartBadge();
  syncFloatingBar();
  updateCartDrawer();
  renderShop();
}


// ═══════════════════════════════════════════════════════════════════
// SECTION 10 — CHECKOUT MODAL (Secure Password Confirm)
// ═══════════════════════════════════════════════════════════════════

function openCheckoutModal() {
  if (State.cart.length === 0) {
    showToast("🛒 Add some items before checking out.", 2000);
    return;
  }

  const total = getCartTotal();
  if (State.currentUser.balance < total) {
    showToast("❌ Not enough wallet balance for this order.", 2200);
    return;
  }

  // Close cart drawer first
  toggleCartDrawer();

  // Populate order lines
  const linesEl  = document.getElementById("modal-order-lines");
  const totalEl  = document.getElementById("modal-total");
  const balAfter = document.getElementById("modal-balance-after");

  if (linesEl) {
    linesEl.innerHTML = State.cart.map((entry) => `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:.8rem;color:var(--clr-text-muted)">
          ${entry.name}
          ${entry.quantity > 1 ? `<strong style="color:var(--clr-text)"> ×${entry.quantity}</strong>` : ""}
        </span>
        <span style="font-size:.8rem;font-weight:800;color:var(--clr-text)">
          ₦${(entry.price * entry.quantity).toLocaleString()}
        </span>
      </div>
    `).join("");
  }

  if (totalEl)  totalEl.textContent  = formatMoney(total);
  if (balAfter) balAfter.textContent = formatMoney(State.currentUser.balance - total);

  // Reset inputs
  const passEl    = document.getElementById("checkout-password");
  const errEl     = document.getElementById("checkout-error");
  const errTextEl = document.getElementById("checkout-error-text");

  if (passEl)    { passEl.value = ""; passEl.style.borderColor = "var(--clr-border)"; }
  if (errEl)     errEl.style.display = "none";
  if (errTextEl) errTextEl.textContent = "";

  // Animate modal in
  const modal = document.getElementById("checkout-modal");
  const card  = document.getElementById("checkout-card");
  if (!modal || !card) return;

  modal.style.display = "block";
  requestAnimationFrame(() => { card.style.transform = "translateY(0)"; });

  setTimeout(() => { if (passEl) passEl.focus(); }, 360);

  if (passEl) {
    passEl.onkeydown = (e) => { if (e.key === "Enter") confirmCheckout(); };
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById("checkout-modal");
  const card  = document.getElementById("checkout-card");
  if (!modal || !card) return;
  card.style.transform = "translateY(100%)";
  setTimeout(() => { modal.style.display = "none"; }, 300);
}

/**
 * confirmCheckout()
 * Validates password, deducts balance, saves to localStorage,
 * clears cart, and shows the receipt overlay.
 */
function confirmCheckout() {
  const passEl  = document.getElementById("checkout-password");
  const entered = passEl ? passEl.value.trim() : "";

  // Guard: empty password
  if (!entered) {
    showCheckoutError("Please enter your password to continue.");
    return;
  }

  // Guard: wrong password
  if (entered !== State.currentUser.password) {
    showCheckoutError("Incorrect password. Please try again.");
    shakeEl("checkout-password");
    if (passEl) passEl.style.borderColor = "var(--clr-red)";
    return;
  }

  // Guard: balance re-check
  const total = getCartTotal();
  const user  = State.currentUser;
  if (user.balance < total) {
    showCheckoutError("Insufficient balance. Cannot complete order.");
    return;
  }

  // ── PROCESS PAYMENT ─────────────────────────────────────────

  // Snapshot items before clearing
  const purchased = State.cart.map((entry) => ({
    name:     entry.name,
    quantity: entry.quantity,
    amount:   entry.price * entry.quantity,
    emoji:    entry.category === "food" ? "🍛" : "🥤"
  }));

  // Deduct balance and update stats
  user.balance        -= total;
  user.totalExpenses   = (user.totalExpenses || 0) + total;
  user.spentToday      = (user.spentToday    || 0) + total;

  // Record transactions in history using forEach()
  const now = new Date().toISOString();
  State.cart.forEach((entry) => {
    user.history.push({
      id:     "txn-" + Date.now() + "-" + Math.random().toString(36).slice(2, 5),
      type:   "debit",
      item:   entry.name + (entry.quantity > 1 ? " (×" + entry.quantity + ")" : ""),
      amount: entry.price * entry.quantity,
      date:   now,
      icon:   "bi-bag"
    });
  });

  // ── FIX 3: Persist updated balance & history to localStorage ──
  saveStudentData(user);

  // Clear cart
  State.cart = [];

  // Close modal
  closeCheckoutModal();

  // Show receipt (after modal slides away)
  setTimeout(() => showSuccessReceipt(total, user.balance, purchased), 350);

  // Reset shop product cards
  setTimeout(() => renderShop(), 370);
}

function showCheckoutError(message) {
  const errEl     = document.getElementById("checkout-error");
  const errTextEl = document.getElementById("checkout-error-text");
  if (!errEl) return;
  if (errTextEl) errTextEl.textContent = message;
  errEl.style.display = "flex";
}

function shakeEl(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.style.animation = "none";
  el.offsetHeight;
  el.style.animation = "shake 0.5s ease";
  setTimeout(() => { el.style.animation = ""; }, 600);
}


// ═══════════════════════════════════════════════════════════════════
// SECTION 11 — SUCCESS RECEIPT OVERLAY
// ═══════════════════════════════════════════════════════════════════

function showSuccessReceipt(amountPaid, newBalance, items = []) {
  const overlay   = document.getElementById("success-overlay");
  const msgEl     = document.getElementById("success-message");
  const itemsEl   = document.getElementById("success-items");
  const totalEl   = document.getElementById("receipt-total");
  const balanceEl = document.getElementById("success-new-balance");
  const timeEl    = document.getElementById("receipt-time");

  if (!overlay) return;

  if (msgEl) {
    msgEl.textContent = `₦${amountPaid.toLocaleString()} paid — enjoy your meal! 🎉`;
  }

  if (timeEl) {
    timeEl.textContent = new Date().toLocaleTimeString("en-NG", {
      hour: "2-digit", minute: "2-digit"
    });
  }

  if (itemsEl) {
    itemsEl.innerHTML = items.map((item) => `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="color:rgba(255,255,255,.85);font-size:.78rem;font-weight:600;
          display:flex;align-items:center;gap:6px">
          ${item.emoji}
          ${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}
        </span>
        <span style="color:rgba(147,197,253,.9);font-size:.78rem;font-weight:800">
          ₦${item.amount.toLocaleString()}
        </span>
      </div>
    `).join("");
  }

  if (totalEl)   totalEl.textContent   = formatMoney(amountPaid);
  if (balanceEl) balanceEl.textContent = formatMoney(newBalance);

  overlay.style.display = "block";
}

function dismissSuccess() {
  const overlay = document.getElementById("success-overlay");
  if (overlay) overlay.style.display = "none";
}


// ═══════════════════════════════════════════════════════════════════
// SECTION 12 — PERSISTENCE (localStorage)
//
// FIX 3: Balance and transaction history survive logout + refresh.
//
// How it works:
//  · saveStudentData(user) — called after every payment.
//    Stores balance, totalExpenses, spentToday, and history
//    under the key "skoolpocket_<accountNo>".
//
//  · loadStudentData(student) — called in handleLogin() before
//    setting State.currentUser. Rehydrates saved fields back
//    onto the student object, overwriting the defaults from
//    students.js.
//
// This means: data is tied to the account number, survives
// logout, survives page refresh, and works for multiple
// student accounts independently.
// ═══════════════════════════════════════════════════════════════════

/**
 * saveStudentData(user)
 * Persists wallet state for this student to localStorage.
 */
function saveStudentData(user) {
  try {
    const key  = "skoolpocket_" + user.accountNo;
    const data = {
      balance:        user.balance,
      totalExpenses:  user.totalExpenses,
      totalInflow:    user.totalInflow,
      spentToday:     user.spentToday,
      history:        user.history
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // localStorage may be unavailable in some environments — fail silently
    console.warn("SkoolPocket: Could not save to localStorage:", e);
  }
}

/**
 * loadStudentData(student)
 * Rehydrates saved wallet state from localStorage onto the student object.
 * Called during login, before State.currentUser is assigned.
 */
function loadStudentData(student) {
  try {
    const key   = "skoolpocket_" + student.accountNo;
    const saved = localStorage.getItem(key);
    if (!saved) return;  // no saved data — use defaults from students.js

    const data = JSON.parse(saved);

    // Overwrite relevant fields with persisted values
    if (data.balance        !== undefined) student.balance        = data.balance;
    if (data.totalExpenses  !== undefined) student.totalExpenses  = data.totalExpenses;
    if (data.totalInflow    !== undefined) student.totalInflow    = data.totalInflow;
    if (data.spentToday     !== undefined) student.spentToday     = data.spentToday;
    if (data.history        !== undefined) student.history        = data.history;
  } catch (e) {
    console.warn("SkoolPocket: Could not load from localStorage:", e);
  }
}