// js/qr.js — SkoolPocket QR Code Scanner & Generator
// ════════════════════════════════════════════════════════════════
//
// QR PAYLOAD FORMAT:
//   Each student's QR code encodes a JSON string:
//   {"a":"SBIS001","p":"sbis001"}
//   where "a" = accountNo and "p" = password
//
//   Scanning a QR code automatically logs the student in —
//   no typing required.
//
// FEATURES:
//   • Login via QR scan (uses device camera)
//   • Admin can generate + print QR cards for all students
//   • Works on mobile and desktop browsers
//
// DEPENDS ON:
//   • html5-qrcode (CDN) — camera-based QR scanning
//   • qrcodejs (CDN)     — QR code image generation
//   • StorageManager, State, handleLoginDirect (auth.js)
// ════════════════════════════════════════════════════════════════

// ── Module state ──────────────────────────────────────────────
var qrScanner      = null;   // html5-qrcode instance
var qrScanActive   = false;  // is scanner currently running?


// ═══════════════════════════════════════════════════════════════
// SECTION 1 — LOGIN TAB SWITCHER
// ═══════════════════════════════════════════════════════════════

/**
 * showLoginTab(tab)
 * Switches between "manual" (form) and "qr" (camera) login panels.
 * Called by the tab buttons on the auth screen.
 */
function showLoginTab(tab) {
  var manualPanel = document.getElementById("login-manual");
  var qrPanel     = document.getElementById("login-qr");
  var tabManual   = document.getElementById("tab-manual");
  var tabQR       = document.getElementById("tab-qr");

  if (!manualPanel || !qrPanel) return;

  if (tab === "qr") {
    // Show QR panel, hide manual
    manualPanel.style.display = "none";
    qrPanel.style.display     = "block";

    // Style active tab
    tabQR.style.background   = "var(--clr-blue)";
    tabQR.style.color        = "#fff";
    tabQR.style.boxShadow    = "0 2px 8px rgba(29,78,216,.3)";
    tabManual.style.background = "transparent";
    tabManual.style.color    = "var(--clr-text-muted)";
    tabManual.style.boxShadow = "none";

    // Auto-start the scanner
    startQRScanner();

  } else {
    // Show manual form, hide QR
    manualPanel.style.display = "block";
    qrPanel.style.display     = "none";

    // Style active tab
    tabManual.style.background = "var(--clr-blue)";
    tabManual.style.color      = "#fff";
    tabManual.style.boxShadow  = "0 2px 8px rgba(29,78,216,.3)";
    tabQR.style.background     = "transparent";
    tabQR.style.color          = "var(--clr-text-muted)";
    tabQR.style.boxShadow      = "none";

    // Stop scanner if it was running
    stopQRScanner();
  }
}


// ═══════════════════════════════════════════════════════════════
// SECTION 2 — QR SCANNER (camera → read QR → auto login)
// ═══════════════════════════════════════════════════════════════

/**
 * startQRScanner()
 * Initialises the html5-qrcode scanner on the #qr-reader element.
 * Requests camera permission and begins scanning.
 */
function startQRScanner() {
  if (qrScanActive) return; // already running

  // Check if html5-qrcode is loaded
  if (typeof Html5Qrcode === "undefined") {
    setQRStatus("error", "QR library not loaded. Check your internet connection.");
    return;
  }

  setQRStatus("scanning", "Point camera at student QR code...");

  try {
    qrScanner    = new Html5Qrcode("qr-reader");
    qrScanActive = true;

    var config = {
      fps:            10,          // scans per second
      qrbox:          { width: 200, height: 200 },
      aspectRatio:    1.0,
      disableFlip:    false
    };

    qrScanner.start(
      { facingMode: "environment" }, // use back camera on mobile
      config,
      onQRSuccess,                   // called when QR is decoded
      onQRError                      // called on each failed frame (silent)
    ).catch(function(err) {
      qrScanActive = false;
      console.warn("QR scanner start error:", err);

      // Common cause: user denied camera permission
      if (String(err).toLowerCase().includes("permission")) {
        setQRStatus("error",
          "Camera access denied. Please allow camera in your browser settings.");
      } else {
        setQRStatus("error",
          "Could not start camera. Try the manual login instead.");
      }
    });

  } catch(e) {
    qrScanActive = false;
    console.error("QR scanner init error:", e);
    setQRStatus("error", "Scanner error. Please use manual login.");
  }
}

/**
 * stopQRScanner()
 * Cleanly stops the camera and releases resources.
 */
function stopQRScanner() {
  if (!qrScanner || !qrScanActive) return;

  qrScanActive = false;

  qrScanner.stop().then(function() {
    qrScanner = null;
    console.log("QR scanner stopped.");
  }).catch(function(e) {
    qrScanner = null;
    console.warn("QR scanner stop error:", e);
  });
}

/**
 * onQRSuccess(decodedText)
 * Called by html5-qrcode when a QR code is successfully decoded.
 * Parses the payload and attempts to log the student in.
 *
 * Expected payload: {"a":"SBIS001","p":"sbis001"}
 */
function onQRSuccess(decodedText) {
  // Stop scanning immediately — prevent multiple triggers
  stopQRScanner();
  setQRStatus("processing", "QR detected — logging in...");

  var accountNo = null;
  var password  = null;

  // Try to parse as JSON payload
  try {
    var data = JSON.parse(decodedText);
    accountNo = (data.a || data.accountNo || data.account || "").trim().toUpperCase();
    password  = (data.p || data.password || "").trim();
  } catch(e) {
    // Not JSON — treat the raw string as accountNo (legacy QR or plain text)
    accountNo = decodedText.trim().toUpperCase();
  }

  if (!accountNo) {
    setQRStatus("error", "Invalid QR code. Not a SkoolPocket student card.");
    // Restart scanner after 2 seconds
    setTimeout(function() {
      setQRStatus("scanning", "Point camera at student QR code...");
      startQRScanner();
    }, 2500);
    return;
  }

  // If no password in QR (plain accountNo only), need to ask for password
  if (!password) {
    setQRStatus("needs-password", accountNo);
    return;
  }

  // Attempt login with QR credentials
  handleLoginDirect(accountNo, password, "qr");
}

/**
 * onQRError(errorMessage)
 * Called on every frame that fails to decode a QR.
 * This fires constantly — we silence it (no UI update needed).
 */
function onQRError(errorMessage) {
  // Silent — this fires on every non-QR frame, which is normal
}

/**
 * handleLoginDirect(accountNo, password, source)
 * Logs a student in directly without reading form inputs.
 * Used by QR scanner. source = "qr" | "manual"
 */
function handleLoginDirect(accountNo, password, source) {
  clearAuthError();

  var student = StorageManager.loadStudent(accountNo);

  if (!student) {
    if (source === "qr") {
      setQRStatus("error", "Account " + accountNo + " not found.");
      setTimeout(function() {
        setQRStatus("scanning", "Point camera at student QR code...");
        startQRScanner();
      }, 2500);
    } else {
      showAuthError("Account not found.");
    }
    return;
  }

  if (student.password !== password) {
    if (source === "qr") {
      setQRStatus("error", "QR code credentials are incorrect.");
      setTimeout(function() {
        setQRStatus("scanning", "Point camera at student QR code...");
        startQRScanner();
      }, 2500);
    } else {
      showAuthError("Incorrect password.");
    }
    return;
  }

  // ✅ Login success
  State.currentUser     = student;
  State.isAuthenticated = true;
  State.cart            = [];

  console.log("QR LOGIN: " + student.accountNo + " | balance: " + student.balance);

  // Brief success feedback before navigating
  if (source === "qr") {
    setQRStatus("success", "Welcome, " + student.name.split(" ")[0] + "! 👋");
    setTimeout(function() {
      if (student.isAdmin) {
        navigate("admin");
      } else {
        navigate("home");
      }
    }, 800);
  } else {
    if (student.isAdmin) {
      navigate("admin");
    } else {
      navigate("home");
    }
  }
}

/**
 * setQRStatus(type, message)
 * Updates the status bar under the camera view.
 * type: "scanning" | "processing" | "success" | "error" | "needs-password"
 */
function setQRStatus(type, message) {
  var statusEl = document.getElementById("qr-status");
  if (!statusEl) return;

  var configs = {
    scanning:       { bg: "var(--clr-bg)",  color: "var(--clr-text-muted)", icon: "bi-camera" },
    processing:     { bg: "#EFF6FF",         color: "var(--clr-blue)",       icon: "bi-arrow-repeat" },
    success:        { bg: "#DCFCE7",         color: "var(--clr-green-dk)",   icon: "bi-check-circle-fill" },
    error:          { bg: "#FEF2F2",         color: "var(--clr-red)",        icon: "bi-exclamation-circle-fill" },
    "needs-password": { bg: "#FEF3C7",       color: "#D97706",               icon: "bi-lock-fill" }
  };

  var cfg = configs[type] || configs.scanning;

  if (type === "needs-password") {
    // Special case: show password input for QR codes without embedded password
    statusEl.innerHTML =
      '<p style="font-size:.8rem;font-weight:800;color:#D97706;margin-bottom:8px">' +
      '<i class="bi bi-person-check"></i> Account found: <strong>' + message + '</strong></p>' +
      '<input type="password" id="qr-password-input" placeholder="Enter your password" ' +
      'style="width:100%;padding:10px;border-radius:10px;border:1.5px solid var(--clr-border);' +
      'background:#fff;font-size:.85rem;font-weight:600;outline:none;box-sizing:border-box;margin-bottom:8px">' +
      '<button onclick="submitQRPassword(\'' + message + '\')" ' +
      'style="width:100%;padding:10px;border-radius:10px;background:var(--clr-blue);' +
      'color:#fff;font-weight:800;font-size:.85rem;border:none;cursor:pointer">' +
      '<i class="bi bi-box-arrow-in-right"></i> Sign In</button>';
    statusEl.style.background = cfg.bg;
    return;
  }

  statusEl.style.background = cfg.bg;
  statusEl.innerHTML =
    '<p style="font-size:.82rem;font-weight:700;color:' + cfg.color + '">' +
    '<i class="bi ' + cfg.icon + '"></i> ' + message + '</p>';
}

/**
 * submitQRPassword(accountNo)
 * Used when a QR code contains only accountNo (no password).
 * Reads the password from the injected input field.
 */
function submitQRPassword(accountNo) {
  var pwEl = document.getElementById("qr-password-input");
  var pw   = pwEl ? pwEl.value.trim() : "";
  if (!pw) { return; }
  handleLoginDirect(accountNo, pw, "qr");
}


// ═══════════════════════════════════════════════════════════════
// SECTION 3 — QR CODE GENERATOR (for admin dashboard)
// Generates a QR image for each student containing their
// accountNo + password encoded as JSON.
// ═══════════════════════════════════════════════════════════════

/**
 * buildQRPayload(student)
 * Returns the JSON string that gets encoded into the QR code.
 * {"a":"SBIS001","p":"sbis001"}
 */
function buildQRPayload(student) {
  return JSON.stringify({ a: student.accountNo, p: student.password });
}

/**
 * renderQRCode(elementId, student)
 * Generates a QR code image inside the given DOM element.
 * Uses the qrcodejs library.
 */
function renderQRCode(elementId, student) {
  var el = document.getElementById(elementId);
  if (!el || typeof QRCode === "undefined") return;

  el.innerHTML = ""; // clear previous

  new QRCode(el, {
    text:         buildQRPayload(student),
    width:        160,
    height:       160,
    colorDark:    "#1D4ED8",
    colorLight:   "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
}

/**
 * openQRCardsModal()
 * Opens the admin QR cards modal — shows all students with their
 * generated QR codes ready to print or download.
 */
function openQRCardsModal() {
  var existing = document.getElementById("qr-cards-modal");
  if (existing) existing.remove();

  var students = StorageManager.getAllStudents().filter(function(s) { return !s.isAdmin; });

  var modal = document.createElement("div");
  modal.id   = "qr-cards-modal";
  modal.style.cssText = "position:fixed;inset:0;z-index:600;background:rgba(10,20,60,.65);backdrop-filter:blur(4px);overflow-y:auto;display:flex;flex-direction:column";

  modal.innerHTML =
    '<div style="position:sticky;top:0;background:linear-gradient(135deg,#0B1E5B,#1D4ED8);' +
    'padding:14px 16px;display:flex;align-items:center;justify-content:space-between;z-index:1">' +
      '<div>' +
        '<p style="color:rgba(147,197,253,.8);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.15em">Admin</p>' +
        '<h3 style="color:#fff;font-weight:900;font-size:1rem">Student QR Cards</h3>' +
      '</div>' +
      '<div style="display:flex;gap:8px">' +
        '<button onclick="printQRCards()" ' +
        'style="padding:8px 14px;border-radius:10px;background:rgba(255,255,255,.2);' +
        'color:#fff;font-weight:800;font-size:.78rem;border:none;cursor:pointer">' +
        '<i class="bi bi-printer"></i> Print All</button>' +
        '<button onclick="document.getElementById(\'qr-cards-modal\').remove()" ' +
        'style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.15);' +
        'color:#fff;border:none;cursor:pointer;font-size:1rem">✕</button>' +
      '</div>' +
    '</div>' +
    '<div id="qr-cards-grid" style="padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px"></div>';

  document.body.appendChild(modal);

  // Build each card
  var grid = document.getElementById("qr-cards-grid");

  students.forEach(function(s, idx) {
    var cardId  = "qr-card-" + idx;
    var qrDivId = "qr-img-"  + idx;

    var card = document.createElement("div");
    card.id   = cardId;
    card.style.cssText =
      "background:#fff;border-radius:16px;padding:14px;text-align:center;" +
      "box-shadow:0 2px 12px rgba(30,58,138,.12)";

    card.innerHTML =
      // School name header
      '<div style="background:linear-gradient(135deg,#1D4ED8,#3B82F6);border-radius:10px;' +
      'padding:6px 4px;margin-bottom:10px">' +
        '<p style="color:#fff;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.1em">SkoolPocket · SBIS</p>' +
      '</div>' +
      // QR code container
      '<div id="' + qrDivId + '" style="display:flex;justify-content:center;margin-bottom:8px"></div>' +
      // Student info
      '<p style="font-weight:900;font-size:.72rem;color:var(--clr-text);line-height:1.3;margin-bottom:3px">' +
        s.name +
      '</p>' +
      '<p style="font-size:.65rem;color:var(--clr-blue);font-weight:800;margin-bottom:2px">' +
        s.accountNo +
      '</p>' +
      '<p style="font-size:.62rem;color:var(--clr-text-faint)">' +
        s.class +
      '</p>';

    grid.appendChild(card);

    // Render QR code inside the card
    // Use setTimeout so DOM is ready before QRCode runs
    (function(divId, student) {
      setTimeout(function() {
        renderQRCode(divId, student);
      }, 50 * idx); // stagger renders to avoid blocking
    })(qrDivId, s);
  });
}

/**
 * printQRCards()
 * Opens a print-friendly window with all QR cards.
 */
function printQRCards() {
  var grid = document.getElementById("qr-cards-grid");
  if (!grid) return;

  var printWin = window.open("", "_blank");
  printWin.document.write(
    "<!DOCTYPE html><html><head>" +
    "<title>SkoolPocket QR Cards</title>" +
    "<style>" +
    "body{font-family:sans-serif;margin:0;padding:16px;background:#fff}" +
    ".grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}" +
    ".card{border:1px solid #E2E8F0;border-radius:12px;padding:12px;text-align:center;break-inside:avoid}" +
    ".header{background:#1D4ED8;color:#fff;border-radius:8px;padding:4px;font-size:8px;font-weight:900;text-transform:uppercase;margin-bottom:8px}" +
    ".qr-wrap{display:flex;justify-content:center;margin-bottom:6px}" +
    ".name{font-size:9px;font-weight:700;margin-bottom:2px}" +
    ".acct{font-size:8px;color:#1D4ED8;font-weight:800}" +
    ".cls{font-size:7px;color:#94A3B8}" +
    "@media print{body{padding:0}.grid{grid-template-columns:repeat(4,1fr)}}" +
    "</style></head><body><div class='grid'>" +
    grid.innerHTML +
    "</div></body></html>"
  );
  printWin.document.close();
  printWin.focus();
  setTimeout(function() { printWin.print(); }, 500);
}


// ═══════════════════════════════════════════════════════════════
// SECTION 4 — SINGLE STUDENT QR CARD (for edit modal)
// ═══════════════════════════════════════════════════════════════

/**
 * openStudentQRCard(accountNo)
 * Shows a single large QR card for one student.
 * Called from the student list "QR" button in admin dashboard.
 */
function openStudentQRCard(accountNo) {
  var student = StorageManager.loadStudent(accountNo);
  if (!student) return;

  var existing = document.getElementById("single-qr-modal");
  if (existing) existing.remove();

  var modal = document.createElement("div");
  modal.id   = "single-qr-modal";
  modal.style.cssText =
    "position:fixed;inset:0;z-index:600;display:flex;align-items:center;" +
    "justify-content:center;padding:1.5rem";

  modal.innerHTML =
    '<div onclick="document.getElementById(\'single-qr-modal\').remove()" ' +
    'style="position:absolute;inset:0;background:rgba(10,20,60,.6);backdrop-filter:blur(4px)"></div>' +
    '<div style="position:relative;background:#fff;border-radius:24px;padding:24px;' +
    'width:100%;max-width:300px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.2)">' +
      '<div style="background:linear-gradient(135deg,#1D4ED8,#3B82F6);border-radius:14px;' +
      'padding:8px;margin-bottom:16px">' +
        '<p style="color:#fff;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.15em">' +
        'SkoolPocket · SBIS Student Card</p>' +
      '</div>' +
      '<div id="single-qr-img" style="display:flex;justify-content:center;margin-bottom:14px"></div>' +
      '<p style="font-weight:900;font-size:.95rem;color:var(--clr-text);margin-bottom:4px">' +
        student.name +
      '</p>' +
      '<p style="font-size:.82rem;color:var(--clr-blue);font-weight:900;margin-bottom:2px">' +
        student.accountNo +
      '</p>' +
      '<p style="font-size:.75rem;color:var(--clr-text-muted);margin-bottom:16px">' +
        student.class +
      '</p>' +
      '<p style="font-size:.7rem;color:var(--clr-text-faint);margin-bottom:16px">' +
        'Scan this code at the canteen to log in' +
      '</p>' +
      '<div style="display:flex;gap:8px">' +
        '<button onclick="document.getElementById(\'single-qr-modal\').remove()" ' +
        'style="flex:1;padding:11px;border-radius:12px;background:#F1F5F9;' +
        'color:var(--clr-text-muted);font-weight:800;font-size:.82rem;border:none;cursor:pointer">' +
        'Close</button>' +
        '<button onclick="window.print()" ' +
        'style="flex:1;padding:11px;border-radius:12px;background:var(--clr-blue);' +
        'color:#fff;font-weight:800;font-size:.82rem;border:none;cursor:pointer">' +
        '<i class="bi bi-printer"></i> Print</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);

  // Render the QR code
  setTimeout(function() {
    renderQRCode("single-qr-img", student);
  }, 100);
}


// ═══════════════════════════════════════════════════════════════
// SECTION 5 — STOP SCANNER ON NAVIGATION
// Ensure camera is released when leaving the auth screen
// ═══════════════════════════════════════════════════════════════

/**
 * stopQROnNavigate()
 * Called by navigation.js before navigating away from auth screen.
 * Ensures the camera is properly released.
 */
function stopQROnNavigate() {
  if (qrScanActive) {
    stopQRScanner();
  }
}