// js/utils.js
// 🛠️ Utility functions — shared helpers used by all modules

/**
 * formatMoney(amount)
 * ────────────────────
 * Converts a number to a Nigerian Naira string.
 * e.g. 12450 → "₦12,450.00"
 */
function formatMoney(amount) {
  return "₦" + Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * formatDate(isoString)
 * ──────────────────────
 * Converts an ISO date string to a readable format.
 * e.g. "2025-07-10T12:30:00" → "Jul 10, 2025 · 12:30 PM"
 */
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-NG", {
    month: "short",
    day:   "numeric",
    year:  "numeric"
  }) + " · " + date.toLocaleTimeString("en-NG", {
    hour:   "2-digit",
    minute: "2-digit"
  });
}

/**
 * showToast(message, duration)
 * ─────────────────────────────
 * Shows a temporary notification toast at the top of the screen.
 * Auto-dismisses after `duration` ms (default 2500).
 */
function showToast(message, duration = 2500) {
  // Remove any existing toast
  const existing = document.getElementById("sp-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "sp-toast";
  toast.className = "fixed top-5 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-lg animate-fade-in";
  toast.style.background = "var(--clr-blue)";
  toast.style.maxWidth = "90vw";
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.4s";
    setTimeout(() => toast.remove(), 400);
  }, duration);
}