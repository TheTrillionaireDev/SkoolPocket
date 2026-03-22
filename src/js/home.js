// js/home.js
// 🏠 Home Screen — renders the dashboard with balance, spending limits, and recent transactions

/**
 * renderHome()
 * ────────────
 * Called by navigate() each time the home screen is shown.
 * Pulls data from State.currentUser and renders it into the DOM.
 */
function renderHome() {
  const user = State.currentUser;
  if (!user) return;

  // --- Greeting ---
  const greetingEl = document.getElementById("home-greeting");
  const usernameEl = document.getElementById("home-username");

  if (greetingEl) greetingEl.textContent = getGreeting();
  if (usernameEl) usernameEl.textContent = user.name.split(" ")[0] + " 👋";

  // --- Balance ---
  const balanceEl = document.getElementById("home-balance");
  if (balanceEl) balanceEl.textContent = formatMoney(user.balance);

  // --- Inflow & Expenses ---
  const inflowEl   = document.getElementById("home-inflow");
  const expenseEl  = document.getElementById("home-expenses");
  if (inflowEl)  inflowEl.textContent  = formatMoney(user.totalInflow);
  if (expenseEl) expenseEl.textContent = formatMoney(user.totalExpenses);

  // --- Spending Limit Bar ---
  renderSpendingLimits(user);

  // --- Recent Transactions (last 3) ---
  renderRecentTransactions(user);
}

/**
 * getGreeting()
 * ─────────────
 * Returns a time-appropriate greeting string.
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
}

/**
 * renderSpendingLimits(user)
 * ──────────────────────────
 * Renders a daily spending progress bar.
 */
function renderSpendingLimits(user) {
  const container = document.getElementById("spending-limits-container");
  if (!container) return;

  const percent     = Math.min((user.spentToday / user.dailyLimit) * 100, 100);
  const remaining   = user.dailyLimit - user.spentToday;
  const isOverLimit = user.spentToday >= user.dailyLimit;

  container.innerHTML = `
    <div>
      <div class="flex justify-between text-xs mb-1" style="color:var(--clr-text-muted)">
        <span>Daily Limit: ${formatMoney(user.dailyLimit)}</span>
        <span style="color:${isOverLimit ? 'var(--clr-red)' : 'var(--clr-green)'}">
          ${isOverLimit ? "Limit reached" : formatMoney(remaining) + " left"}
        </span>
      </div>
      <div class="w-full rounded-full h-2.5" style="background:var(--clr-border)">
        <div class="h-2.5 rounded-full transition-all duration-500"
          style="width:${percent}%; background:${isOverLimit ? 'var(--clr-red)' : 'var(--clr-blue)'}">
        </div>
      </div>
      <p class="text-xs mt-1" style="color:var(--clr-text-faint)">
        ₦${user.spentToday.toLocaleString()} spent today
      </p>
    </div>
  `;
}

/**
 * renderRecentTransactions(user)
 * ──────────────────────────────
 * Shows the 3 most recent transactions on the home screen.
 */
function renderRecentTransactions(user) {
  const container = document.getElementById("home-transactions");
  if (!container) return;

  // Get last 3 transactions (newest first)
  const recent = [...user.history].reverse().slice(0, 3);

  if (recent.length === 0) {
    container.innerHTML = `
      <p class="text-sm text-center py-4" style="color:var(--clr-text-faint)">
        No transactions yet
      </p>
    `;
    return;
  }

  container.innerHTML = recent.map((txn) => buildTransactionCard(txn)).join("");
}

/**
 * buildTransactionCard(txn)
 * ─────────────────────────
 * Returns HTML string for a single transaction row.
 */
function buildTransactionCard(txn) {
  const isCredit   = txn.type === "credit";
  const amountText = (isCredit ? "+" : "−") + formatMoney(txn.amount);
  const amountColor = isCredit ? "var(--clr-green)" : "var(--clr-red)";
  const iconBg      = isCredit ? "#DCFCE7" : "#FEE2E2";
  const iconColor   = isCredit ? "var(--clr-green-dk)" : "var(--clr-red)";
  const icon        = isCredit ? "bi-arrow-down-left" : "bi-arrow-up-right";

  return `
    <div class="section-card bg-white p-3 flex items-center gap-3">
      <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style="background:${iconBg}">
        <i class="bi ${icon} text-base" style="color:${iconColor}"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm truncate" style="color:var(--clr-text)">${txn.item}</p>
        <p class="text-xs" style="color:var(--clr-text-faint)">${formatDate(txn.date)}</p>
      </div>
      <span class="font-bold text-sm flex-shrink-0" style="color:${amountColor}">
        ${amountText}
      </span>
    </div>
  `;
}