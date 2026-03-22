// js/auth.js — SkoolPocket Authentication
// ════════════════════════════════════════════════════════════════

function initAuth() {
  const btn = document.getElementById("checkinBtn");
  if (!btn) return;
  btn.addEventListener("click", function(e) {
    e.preventDefault();
    handleLogin();
  });
}

function handleLogin() {
  const accountInput  = document.getElementById("student-id");
  const passwordInput = document.getElementById("password");

  const accountNo = accountInput.value.trim().toUpperCase();
  const password  = passwordInput.value.trim();

  clearAuthError();

  if (!accountNo || !password) {
    showAuthError("Please fill in both fields.");
    return;
  }

  // Load student — always reads fresh from localStorage
  const student = StorageManager.loadStudent(accountNo);

  if (!student) {
    showAuthError("Account not found. Check your account number.");
    shakeLoginButton();
    return;
  }

  if (student.password !== password) {
    showAuthError("Incorrect password. Please try again.");
    shakeLoginButton();
    return;
  }

  // Set session
  State.currentUser     = student;
  State.isAuthenticated = true;
  State.cart            = [];

  accountInput.value  = "";
  passwordInput.value = "";

  console.log("LOGIN: " + student.accountNo + " | balance: " + student.balance + " | history: " + (student.history||[]).length);

  if (student.isAdmin) {
    navigate("admin");
  } else {
    navigate("home");
  }
}

function logout() {
  // ── CRITICAL: Save current state to localStorage BEFORE clearing session ──
  // This is a safety net in case any in-session changes weren't saved yet.
  if (State.currentUser && !State.currentUser.isAdmin) {
    StorageManager.saveStudent(State.currentUser);
    console.log("LOGOUT SAVE: " + State.currentUser.accountNo + " | balance: " + State.currentUser.balance);
  }

  State.currentUser     = null;
  State.isAuthenticated = false;
  State.cart            = [];

  // Close any open shop overlays
  ["cart-drawer","checkout-modal","clear-modal","success-overlay"].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  navigate("auth");
}

// ── UI helpers ────────────────────────────────────────────────────

function showAuthError(msg) {
  let el = document.getElementById("auth-error");
  if (!el) {
    el = document.createElement("p");
    el.id        = "auth-error";
    el.className = "text-red-500 text-sm text-center font-semibold mt-1 animate-fade-in";
    document.getElementById("checkIn-form").appendChild(el);
  }
  el.textContent = msg;
}

function clearAuthError() {
  const el = document.getElementById("auth-error");
  if (el) el.remove();
}

function shakeLoginButton() {
  const btn = document.getElementById("checkinBtn");
  if (!btn) return;
  btn.classList.add("shake");
  setTimeout(function() { btn.classList.remove("shake"); }, 600);
}