// js/profile.js
// 👤 Profile Screen — student details and logout

/**
 * renderProfile()
 * ───────────────
 * Called by navigate() each time the profile screen is shown.
 * Displays student info and a logout button.
 */
function renderProfile() {
  const screen = document.getElementById("profile-screen");
  if (!screen || !State.currentUser) return;

  const user      = State.currentUser;
  const firstName = user.name.split(" ")[0];
  const isMale    = user.gender === "male";

  // Avatar path based on gender
  const avatar = isMale
    ? "/src/assets/image/Male Avatar.jpg"
    : "/src/assets/image/Female Avatar.jpg";

  screen.innerHTML = `
    <div class="pb-28">
      <!-- Header -->
      <div class="bg-white shadow p-4 mb-4">
        <h2 class="font-bold text-base" style="color:var(--clr-text)">My Profile</h2>
      </div>

      <!-- Avatar + Name card -->
      <div class="mx-4 mb-4 section-card bg-white p-6 flex flex-col items-center gap-3">
        <div class="relative">
          <img src="${avatar}" alt="${user.name}"
            class="w-20 h-20 rounded-full object-cover"
            style="border: 3px solid var(--clr-blue)"
            onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1D4ED8&color=fff&size=80'">
          <span class="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
            style="background:var(--clr-green)">
            <i class="bi bi-check2"></i>
          </span>
        </div>
        <div class="text-center">
          <h3 class="font-bold text-lg" style="color:var(--clr-text)">${user.name}</h3>
          <p class="text-sm" style="color:var(--clr-text-muted)">${user.class}</p>
        </div>
        <!-- Balance pill -->
        <div class="px-5 py-2 rounded-full text-white text-sm font-bold"
          style="background:var(--clr-blue)">
          Balance: ${formatMoney(user.balance)}
        </div>
      </div>

      <!-- Details card -->
      <div class="mx-4 mb-4 section-card bg-white overflow-hidden">
        ${buildProfileRow("bi-person-badge", "Account Number", user.accountNo)}
        ${buildProfileRow("bi-mortarboard", "Class", user.class)}
        ${buildProfileRow("bi-wallet2", "Current Balance", formatMoney(user.balance))}
        ${buildProfileRow("bi-graph-up-arrow", "Total Inflow", formatMoney(user.totalInflow))}
        ${buildProfileRow("bi-graph-down-arrow", "Total Expenses", formatMoney(user.totalExpenses))}
      </div>

      <!-- Stats row -->
      <div class="mx-4 mb-6 flex gap-3">
        <div class="flex-1 section-card bg-white p-4 text-center">
          <p class="font-bold text-lg" style="color:var(--clr-blue)">${user.history.filter(t => t.type === 'debit').length}</p>
          <p class="text-xs" style="color:var(--clr-text-faint)">Purchases</p>
        </div>
        <div class="flex-1 section-card bg-white p-4 text-center">
          <p class="font-bold text-lg" style="color:var(--clr-green)">${user.history.filter(t => t.type === 'credit').length}</p>
          <p class="text-xs" style="color:var(--clr-text-faint)">Top-ups</p>
        </div>
        <div class="flex-1 section-card bg-white p-4 text-center">
          <p class="font-bold text-lg" style="color:var(--clr-text)">${user.history.length}</p>
          <p class="text-xs" style="color:var(--clr-text-faint)">Total Txns</p>
        </div>
      </div>

      <!-- Logout button -->
      <div class="mx-4">
        <button onclick="logout()"
          class="w-full py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
          style="background:#FEE2E2; color:var(--clr-red)">
          <i class="bi bi-box-arrow-right text-lg"></i>
          Sign Out
        </button>
      </div>

      <!-- App version -->
      <p class="text-center text-xs mt-6" style="color:var(--clr-text-faint)">
        SkoolPocket by SBIS &nbsp;·&nbsp; v1.0.0
      </p>
    </div>
  `;
}

/**
 * buildProfileRow(icon, label, value)
 * ────────────────────────────────────
 * Returns HTML for one detail row in the profile card.
 */
function buildProfileRow(icon, label, value) {
  return `
    <div class="flex items-center gap-3 px-4 py-3.5 border-b last:border-b-0"
      style="border-color:var(--clr-border)">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style="background:var(--clr-bg)">
        <i class="bi ${icon} text-base" style="color:var(--clr-blue)"></i>
      </div>
      <div class="flex-1">
        <p class="text-xs" style="color:var(--clr-text-faint)">${label}</p>
        <p class="font-semibold text-sm" style="color:var(--clr-text)">${value}</p>
      </div>
    </div>
  `;
}