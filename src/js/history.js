// js/history.js
// 📜 Transaction History — full list of debits and credits

/**
 * renderHistory()
 * ───────────────
 * Called by navigate() each time the history screen is shown.
 * Renders all transactions in reverse-chronological order.
 */
function renderHistory() {
  const screen = document.getElementById("history-screen");
  if (!screen || !State.currentUser) return;

  const user = State.currentUser;
  // Newest transactions first
  const transactions = [...user.history].reverse();

  screen.innerHTML = `
    <div class="pb-28">
      <!-- Header -->
      <div class="flex items-center gap-3 bg-white shadow p-4 mb-4">
        <div class="w-10 h-10 rounded-full flex items-center justify-center"
          style="background:var(--clr-blue); color:white">
          <i class="bi bi-clock-history text-lg"></i>
        </div>
        <div>
          <h2 class="font-bold text-base" style="color:var(--clr-text)">Transaction History</h2>
          <p class="text-xs" style="color:var(--clr-text-faint)">${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <!-- Summary pills -->
      <div class="flex gap-3 px-4 mb-5">
        <div class="flex-1 rounded-2xl p-3 text-center" style="background:#DCFCE7">
          <p class="text-xs font-semibold" style="color:var(--clr-green-dk)">Total In</p>
          <p class="font-bold text-sm" style="color:var(--clr-green-dk)">${formatMoney(user.totalInflow)}</p>
        </div>
        <div class="flex-1 rounded-2xl p-3 text-center" style="background:#FEE2E2">
          <p class="text-xs font-semibold" style="color:var(--clr-red)">Total Out</p>
          <p class="font-bold text-sm" style="color:var(--clr-red)">${formatMoney(user.totalExpenses)}</p>
        </div>
      </div>

      <!-- Transactions List -->
      <div class="px-4 space-y-2">
        ${transactions.length === 0
          ? `<div class="text-center py-12">
              <div class="text-4xl mb-3">📭</div>
              <p class="font-semibold" style="color:var(--clr-text-muted)">No transactions yet</p>
              <p class="text-sm mt-1" style="color:var(--clr-text-faint)">Visit the shop to make your first purchase</p>
            </div>`
          : transactions.map((txn) => buildHistoryRow(txn)).join("")
        }
      </div>
    </div>
  `;
}

/**
 * buildHistoryRow(txn)
 * ────────────────────
 * Returns HTML for a single full-width transaction row.
 */
function buildHistoryRow(txn) {
  const isCredit    = txn.type === "credit";
  const amountText  = (isCredit ? "+" : "−") + formatMoney(txn.amount);
  const amountColor = isCredit ? "var(--clr-green-dk)" : "var(--clr-red)";
  const iconBg      = isCredit ? "#DCFCE7" : "#FEE2E2";
  const iconColor   = isCredit ? "var(--clr-green-dk)" : "var(--clr-red)";
  const icon        = isCredit ? "bi-arrow-down-left" : "bi-arrow-up-right";
  const typeBadge   = isCredit
    ? `<span class="text-xs px-2 py-0.5 rounded-full font-semibold" style="background:#DCFCE7;color:var(--clr-green-dk)">Credit</span>`
    : `<span class="text-xs px-2 py-0.5 rounded-full font-semibold" style="background:#FEE2E2;color:var(--clr-red)">Debit</span>`;

  return `
    <div class="section-card bg-white p-4 flex items-center gap-3">
      <!-- Icon -->
      <div class="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
        style="background:${iconBg}">
        <i class="bi ${icon} text-base" style="color:${iconColor}"></i>
      </div>
      <!-- Details -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-0.5">
          <p class="font-semibold text-sm truncate" style="color:var(--clr-text)">${txn.item}</p>
          ${typeBadge}
        </div>
        <p class="text-xs" style="color:var(--clr-text-faint)">${formatDate(txn.date)}</p>
      </div>
      <!-- Amount -->
      <span class="font-bold text-base flex-shrink-0" style="color:${amountColor}">
        ${amountText}
      </span>
    </div>
  `;
}