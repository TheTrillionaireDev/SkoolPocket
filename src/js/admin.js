// js/admin.js — SkoolPocket Admin Dashboard  v6
// ════════════════════════════════════════════════════════════════
//
// TABS:
//   overview     — stats cards + recent transactions
//   students     — full student list, searchable
//                  ✦ Add New Student
//                  ✦ Edit Profile (name, class, password, gender, daily limit)
//                  ✦ Top Up wallet
//                  ✦ Delete admin-created students
//   transactions — all transactions, filterable by student
//   products     — add / edit / delete canteen products
//
// All modals are injected into <body> (not inside admin-screen)
// so they always cover the full viewport at z-index 600+.
// ════════════════════════════════════════════════════════════════

let adminTab         = "overview";
let editingProductId = null;


// ═══════════════════════════════════════════════════════════════
// SECTION 1 — MAIN RENDER
// ═══════════════════════════════════════════════════════════════

function renderAdmin() {
  const screen = document.getElementById("admin-screen");
  if (!screen) return;

  if (!State.currentUser || !State.currentUser.isAdmin) {
    navigate("auth");
    return;
  }

  screen.innerHTML = `
    <div style="min-height:100%;background:var(--clr-bg)">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0B1E5B,#1D4ED8);
        padding:1.2rem 1rem 1rem;display:flex;align-items:center;
        justify-content:space-between;position:sticky;top:0;z-index:20">
        <div>
          <p style="color:rgba(147,197,253,.8);font-size:10px;font-weight:900;
            text-transform:uppercase;letter-spacing:.15em">SkoolPocket</p>
          <h1 style="color:#fff;font-weight:900;font-size:1.1rem">Admin Dashboard</h1>
        </div>
        <button onclick="logout()"
          style="background:rgba(255,255,255,.15);color:#fff;border:none;cursor:pointer;
            padding:8px 14px;border-radius:12px;font-size:.75rem;font-weight:800">
          <i class="bi bi-box-arrow-right"></i> Logout
        </button>
      </div>

      <!-- Tab nav -->
      <div style="display:flex;background:#fff;border-bottom:1px solid var(--clr-border);
        overflow-x:auto;position:sticky;top:52px;z-index:19" class="hide-scrollbar">
        ${["overview","students","transactions","products"].map(tab => `
          <button onclick="switchAdminTab('${tab}')" id="admin-tab-${tab}"
            style="flex-shrink:0;padding:12px 18px;border:none;cursor:pointer;
              font-size:.75rem;font-weight:900;white-space:nowrap;background:transparent;
              border-bottom:2.5px solid ${adminTab === tab ? "var(--clr-blue)" : "transparent"};
              color:${adminTab === tab ? "var(--clr-blue)" : "var(--clr-text-muted)"}">
            ${{ overview:"📊 Overview", students:"👥 Students",
                transactions:"📜 Transactions", products:"🛒 Products" }[tab]}
          </button>
        `).join("")}
      </div>

      <!-- Tab content -->
      <div id="admin-content" style="padding:1rem 1rem 5rem">
        ${buildAdminTabContent()}
      </div>
    </div>
  `;
}

function switchAdminTab(tab) {
  adminTab = tab;
  ["overview","students","transactions","products"].forEach(t => {
    const btn = document.getElementById("admin-tab-" + t);
    if (!btn) return;
    btn.style.borderBottomColor = t === tab ? "var(--clr-blue)"        : "transparent";
    btn.style.color             = t === tab ? "var(--clr-blue)"        : "var(--clr-text-muted)";
  });
  const content = document.getElementById("admin-content");
  if (content) content.innerHTML = buildAdminTabContent();
}

function buildAdminTabContent() {
  if (adminTab === "overview")     return buildOverviewTab();
  if (adminTab === "students")     return buildStudentsTab();
  if (adminTab === "transactions") return buildTransactionsTab();
  if (adminTab === "products")     return buildProductsTab();
  return "";
}


// ═══════════════════════════════════════════════════════════════
// SECTION 2 — OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════

function buildOverviewTab() {
  const all          = StorageManager.getAllStudents().filter(s => !s.isAdmin);
  const totalBalance = all.reduce((sum, s) => sum + s.balance, 0);
  const totalRevenue = all.reduce((sum, s) => sum + (s.totalExpenses || 0), 0);
  const recentTxns   = all
    .flatMap(s => (s.history || []).map(t => ({ ...t, studentName: s.name, accountNo: s.accountNo })))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
      ${adminStatCard("👥", "Students",      all.length,                       "#EFF6FF", "var(--clr-blue)")}
      ${adminStatCard("💰", "Total Wallets", formatMoney(totalBalance),         "#F0FDF4", "var(--clr-green-dk)")}
      ${adminStatCard("🛒", "Total Revenue", formatMoney(totalRevenue),         "#FEF3C7", "#D97706")}
      ${adminStatCard("🍛", "Products",      State.products.length,             "#FDF4FF", "#9333EA")}
    </div>

    <h3 style="font-weight:900;font-size:.85rem;color:var(--clr-text);margin-bottom:10px">
      Recent Transactions
    </h3>
    ${recentTxns.length === 0
      ? `<p style="color:var(--clr-text-faint);font-size:.8rem;text-align:center;padding:24px">
           No transactions yet
         </p>`
      : recentTxns.map(t => adminTxnRow(t)).join("")
    }
  `;
}

function adminStatCard(emoji, label, value, bg, color) {
  return `
    <div style="background:#fff;border-radius:16px;padding:16px;
      box-shadow:0 2px 12px rgba(30,58,138,.07)">
      <div style="font-size:1.5rem;margin-bottom:6px">${emoji}</div>
      <p style="font-size:.68rem;font-weight:700;color:var(--clr-text-muted);margin-bottom:3px">${label}</p>
      <p style="font-weight:900;font-size:1rem;color:${color}">${value}</p>
    </div>
  `;
}


// ═══════════════════════════════════════════════════════════════
// SECTION 3 — STUDENTS TAB
// ═══════════════════════════════════════════════════════════════

function buildStudentsTab() {
  const all = StorageManager.getAllStudents().filter(s => !s.isAdmin);

  return `
    <!-- Action bar: search + Add Student -->
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <div style="position:relative;flex:1">
        <i class="bi bi-search" style="position:absolute;left:12px;top:50%;
          transform:translateY(-50%);color:var(--clr-text-faint);font-size:.85rem"></i>
        <input id="student-search" type="text"
          placeholder="Search name or account…"
          oninput="filterStudentList(this.value)"
          style="width:100%;padding:10px 10px 10px 34px;border-radius:12px;
            border:1.5px solid var(--clr-border);background:var(--clr-bg);
            font-size:.8rem;font-weight:600;color:var(--clr-text);outline:none;
            box-sizing:border-box">
      </div>
      <button onclick="openAddStudentModal()"
        style="padding:10px 14px;border-radius:12px;border:none;cursor:pointer;
          background:linear-gradient(135deg,#1D4ED8,#3B82F6);color:#fff;
          font-size:.78rem;font-weight:900;white-space:nowrap;
          box-shadow:0 4px 12px rgba(29,78,216,.3);display:flex;align-items:center;gap:5px">
        <i class="bi bi-person-plus-fill"></i> Add
      </button>
    </div>

    <p style="font-size:.72rem;color:var(--clr-text-faint);margin-bottom:10px">
      ${all.length} students
      · <span style="color:var(--clr-blue)">${StorageManager.getExtraAccounts().length} admin-added</span>
    </p>

    <div id="student-list">
      ${buildStudentRows(all)}
    </div>
  `;
}

function buildStudentRows(students) {
  if (students.length === 0) {
    return `<p style="color:var(--clr-text-faint);text-align:center;padding:32px;font-size:.8rem">
      No students found
    </p>`;
  }

  return students.map((s, i) => {
    const isExtra = StorageManager.isExtraStudent(s.accountNo);

    return `
      <div style="background:#fff;border-radius:14px;padding:12px 14px;
        margin-bottom:8px;display:flex;align-items:center;gap:10px;
        box-shadow:0 1px 8px rgba(30,58,138,.06)">

        <!-- Index badge -->
        <div style="width:34px;height:34px;border-radius:10px;flex-shrink:0;
          background:${isExtra ? "#EFF6FF" : "var(--clr-bg)"};
          display:flex;align-items:center;justify-content:center;
          font-size:.7rem;font-weight:900;color:var(--clr-blue)">
          ${i + 1}
        </div>

        <!-- Name + account -->
        <div style="flex:1;min-width:0">
          <p style="font-weight:800;font-size:.8rem;color:var(--clr-text);
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${s.name}
            ${isExtra ? `<span style="font-size:.6rem;background:#EFF6FF;color:var(--clr-blue);
              padding:1px 6px;border-radius:999px;margin-left:4px;font-weight:900">NEW</span>` : ""}
          </p>
          <p style="font-size:.68rem;color:var(--clr-text-faint);margin-top:1px">
            ${s.accountNo} · ${s.class}
          </p>
        </div>

        <!-- Balance -->
        <div style="text-align:right;flex-shrink:0">
          <p style="font-weight:900;font-size:.82rem;color:var(--clr-blue)">
            ${formatMoney(s.balance)}
          </p>
          <p style="font-size:.62rem;color:var(--clr-text-faint)">
            ${(s.history || []).filter(t => t.type === "debit").length} purchases
          </p>
        </div>

        <!-- Action buttons -->
        <div style="display:flex;gap:5px;flex-shrink:0">
          <!-- Edit profile -->
          <button onclick="openEditStudentModal('${s.accountNo}')"
            title="Edit profile"
            style="width:30px;height:30px;border-radius:8px;border:none;cursor:pointer;
              background:#EFF6FF;display:flex;align-items:center;justify-content:center">
            <i class="bi bi-pencil-fill" style="color:var(--clr-blue);font-size:.75rem"></i>
          </button>
          <!-- Top up -->
          <button onclick="openTopUpModal('${s.accountNo}')"
            title="Top up wallet"
            style="width:30px;height:30px;border-radius:8px;border:none;cursor:pointer;
              background:#DCFCE7;display:flex;align-items:center;justify-content:center">
            <i class="bi bi-plus-circle-fill" style="color:var(--clr-green-dk);font-size:.75rem"></i>
          </button>
          <!-- Delete (only admin-added) -->
          ${isExtra ? `
          <button onclick="confirmDeleteStudent('${s.accountNo}')"
            title="Delete student"
            style="width:30px;height:30px;border-radius:8px;border:none;cursor:pointer;
              background:#FEE2E2;display:flex;align-items:center;justify-content:center">
            <i class="bi bi-trash3-fill" style="color:var(--clr-red);font-size:.75rem"></i>
          </button>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

function filterStudentList(query) {
  const q        = query.toLowerCase().trim();
  const students = StorageManager.getAllStudents().filter(s => !s.isAdmin);
  const filtered = q
    ? students.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.accountNo.toLowerCase().includes(q) ||
        (s.class || "").toLowerCase().includes(q)
      )
    : students;

  const list = document.getElementById("student-list");
  if (list) list.innerHTML = buildStudentRows(filtered);
}


// ═══════════════════════════════════════════════════════════════
// SECTION 4 — ADD STUDENT MODAL
// ═══════════════════════════════════════════════════════════════

function openAddStudentModal() {
  _removeModal("add-student-modal");

  const nextAcct = StorageManager.getNextAccountNo();

  const modal = document.createElement("div");
  modal.id = "add-student-modal";
  modal.style.cssText = "position:fixed;inset:0;z-index:600;display:block";
  modal.innerHTML = `
    <div onclick="_removeModal('add-student-modal')"
      style="position:absolute;inset:0;background:rgba(10,20,60,.6);
        backdrop-filter:blur(4px);z-index:0"></div>

    <div style="position:absolute;inset:0;display:flex;align-items:flex-end;
      justify-content:center;z-index:1;pointer-events:none">
      <div style="width:100%;max-width:480px;background:#fff;border-radius:28px 28px 0 0;
        padding:20px 20px 36px;max-height:92vh;overflow-y:auto;pointer-events:auto;
        box-shadow:0 -16px 60px rgba(30,58,138,.2)">

        <!-- Handle -->
        <div style="display:flex;justify-content:center;margin-bottom:16px">
          <div style="width:40px;height:4px;border-radius:999px;background:#E2E8F0"></div>
        </div>

        <!-- Title -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
          <div>
            <h3 style="font-weight:900;font-size:1rem;color:var(--clr-text)">Add New Student</h3>
            <p style="font-size:.72rem;color:var(--clr-text-faint);margin-top:2px">
              Account will be: <strong style="color:var(--clr-blue)">${nextAcct}</strong>
            </p>
          </div>
          <button onclick="_removeModal('add-student-modal')"
            style="width:32px;height:32px;border-radius:50%;background:#F1F5F9;
              border:none;cursor:pointer;font-size:1.1rem;color:var(--clr-text-muted)">
            ✕
          </button>
        </div>

        <!-- Form fields -->
        <div style="display:flex;flex-direction:column;gap:13px">

          ${_formField("Full Name", "as-name", "text", "", "e.g. Obi Emmanuel Chukwuemeka", true)}
          ${_formField("Class", "as-class", "select", "JSS 1A", "")}
          ${_formField("Gender", "as-gender", "select", "male", "")}
          ${_formField("Password", "as-password", "text", nextAcct.toLowerCase(), "Student's login password", true)}
          ${_formField("Starting Balance (₦)", "as-balance", "number", "50000", "Default: ₦50,000")}
          ${_formField("Daily Spending Limit (₦)", "as-dailylimit", "number", "5000", "Default: ₦5,000")}

          <!-- Error -->
          <p id="as-error" style="display:none;color:var(--clr-red);font-size:.78rem;
            font-weight:700;padding:8px 12px;background:#FEF2F2;border-radius:10px"></p>

          <!-- Buttons -->
          <div style="display:flex;gap:10px;margin-top:4px">
            <button onclick="_removeModal('add-student-modal')"
              style="flex:1;padding:13px;border-radius:14px;background:#F1F5F9;
                color:var(--clr-text-muted);font-weight:800;font-size:.9rem;border:none;cursor:pointer">
              Cancel
            </button>
            <button onclick="_submitAddStudent()"
              style="flex:2;padding:13px;border-radius:14px;color:#fff;font-weight:900;
                font-size:.9rem;border:none;cursor:pointer;
                background:linear-gradient(135deg,#1D4ED8,#3B82F6);
                display:flex;align-items:center;justify-content:center;gap:6px;
                box-shadow:0 4px 16px rgba(29,78,216,.35)">
              <i class="bi bi-person-plus-fill"></i> Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Populate class and gender selects
  _populateClassSelect("as-class");
  _populateGenderSelect("as-gender");

  // Focus the name field
  setTimeout(() => document.getElementById("as-name")?.focus(), 100);
}

function _submitAddStudent() {
  const name       = document.getElementById("as-name")?.value.trim();
  const cls        = document.getElementById("as-class")?.value;
  const gender     = document.getElementById("as-gender")?.value;
  const password   = document.getElementById("as-password")?.value.trim();
  const balance    = parseFloat(document.getElementById("as-balance")?.value) || 50000;
  const dailyLimit = parseFloat(document.getElementById("as-dailylimit")?.value) || 5000;
  const errEl      = document.getElementById("as-error");

  const result = StorageManager.addStudent({ name, cls, gender, password, balance, dailyLimit });

  if (!result.success) {
    if (errEl) { errEl.textContent = result.error; errEl.style.display = "block"; }
    return;
  }

  _removeModal("add-student-modal");
  showToast("✅ " + result.student.name.split(" ")[0] + " added! Account: " + result.student.accountNo);

  // Refresh the student list
  switchAdminTab("students");
}


// ═══════════════════════════════════════════════════════════════
// SECTION 5 — EDIT STUDENT PROFILE MODAL
// ═══════════════════════════════════════════════════════════════

function openEditStudentModal(accountNo) {
  const student = StorageManager.loadStudent(accountNo);
  if (!student) return;

  _removeModal("edit-student-modal");

  const modal = document.createElement("div");
  modal.id = "edit-student-modal";
  modal.style.cssText = "position:fixed;inset:0;z-index:600;display:block";
  modal.innerHTML = `
    <div onclick="_removeModal('edit-student-modal')"
      style="position:absolute;inset:0;background:rgba(10,20,60,.6);
        backdrop-filter:blur(4px);z-index:0"></div>

    <div style="position:absolute;inset:0;display:flex;align-items:flex-end;
      justify-content:center;z-index:1;pointer-events:none">
      <div style="width:100%;max-width:480px;background:#fff;border-radius:28px 28px 0 0;
        padding:20px 20px 36px;max-height:92vh;overflow-y:auto;pointer-events:auto;
        box-shadow:0 -16px 60px rgba(30,58,138,.2)">

        <!-- Handle -->
        <div style="display:flex;justify-content:center;margin-bottom:16px">
          <div style="width:40px;height:4px;border-radius:999px;background:#E2E8F0"></div>
        </div>

        <!-- Title + account badge -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px">
          <div>
            <h3 style="font-weight:900;font-size:1rem;color:var(--clr-text)">Edit Profile</h3>
            <p style="font-size:.72rem;color:var(--clr-text-faint);margin-top:2px">
              <span style="background:var(--clr-bg);padding:2px 8px;border-radius:999px;
                font-weight:800;color:var(--clr-blue)">${student.accountNo}</span>
            </p>
          </div>
          <button onclick="_removeModal('edit-student-modal')"
            style="width:32px;height:32px;border-radius:50%;background:#F1F5F9;
              border:none;cursor:pointer;font-size:1.1rem;color:var(--clr-text-muted)">
            ✕
          </button>
        </div>

        <!-- Student info strip -->
        <div style="background:var(--clr-bg);border-radius:14px;padding:12px;
          margin-bottom:16px;display:flex;align-items:center;gap:12px">
          <div style="width:42px;height:42px;border-radius:12px;
            background:linear-gradient(135deg,#1D4ED8,#3B82F6);
            display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="bi bi-person-fill" style="color:#fff;font-size:1.1rem"></i>
          </div>
          <div>
            <p style="font-weight:900;font-size:.85rem;color:var(--clr-text)">${student.name}</p>
            <p style="font-size:.7rem;color:var(--clr-text-faint)">
              Balance: <strong style="color:var(--clr-green-dk)">${formatMoney(student.balance)}</strong>
              · ${(student.history || []).length} transactions
            </p>
          </div>
        </div>

        <!-- Editable fields -->
        <div style="display:flex;flex-direction:column;gap:13px">

          ${_formField("Full Name", "es-name", "text", student.name, "Full student name", true)}
          ${_formField("Class", "es-class", "select", student.class, "")}
          ${_formField("Gender", "es-gender", "select", student.gender, "")}
          ${_formField("Password", "es-password", "text", student.password, "Login password", true)}
          ${_formField("Daily Spending Limit (₦)", "es-dailylimit", "number", student.dailyLimit || 5000, "Max spend per day")}

          <p id="es-error" style="display:none;color:var(--clr-red);font-size:.78rem;
            font-weight:700;padding:8px 12px;background:#FEF2F2;border-radius:10px"></p>

          <div style="display:flex;gap:10px;margin-top:4px">
            <button onclick="_removeModal('edit-student-modal')"
              style="flex:1;padding:13px;border-radius:14px;background:#F1F5F9;
                color:var(--clr-text-muted);font-weight:800;font-size:.9rem;border:none;cursor:pointer">
              Cancel
            </button>
            <button onclick="_submitEditStudent('${student.accountNo}')"
              style="flex:2;padding:13px;border-radius:14px;color:#fff;font-weight:900;
                font-size:.9rem;border:none;cursor:pointer;
                background:linear-gradient(135deg,#1D4ED8,#3B82F6);
                display:flex;align-items:center;justify-content:center;gap:6px;
                box-shadow:0 4px 16px rgba(29,78,216,.35)">
              <i class="bi bi-check2-circle"></i> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  _populateClassSelect("es-class", student.class);
  _populateGenderSelect("es-gender", student.gender);
  setTimeout(() => document.getElementById("es-name")?.focus(), 100);
}

function _submitEditStudent(accountNo) {
  const name       = document.getElementById("es-name")?.value.trim();
  const cls        = document.getElementById("es-class")?.value;
  const gender     = document.getElementById("es-gender")?.value;
  const password   = document.getElementById("es-password")?.value.trim();
  const dailyLimit = parseFloat(document.getElementById("es-dailylimit")?.value) || 5000;
  const errEl      = document.getElementById("es-error");

  // Basic validation
  if (!name || name.length < 2) {
    if (errEl) { errEl.textContent = "Name must be at least 2 characters."; errEl.style.display = "block"; }
    return;
  }
  if (!password || password.length < 4) {
    if (errEl) { errEl.textContent = "Password must be at least 4 characters."; errEl.style.display = "block"; }
    return;
  }

  const result = StorageManager.updateStudentProfile(accountNo, {
    name, cls, gender, password, dailyLimit
  });

  if (!result.success) {
    if (errEl) { errEl.textContent = result.error; errEl.style.display = "block"; }
    return;
  }

  _removeModal("edit-student-modal");
  showToast("✅ Profile updated for " + result.student.name.split(" ")[0]);

  // Refresh student list
  const list = document.getElementById("student-list");
  if (list) {
    const all = StorageManager.getAllStudents().filter(s => !s.isAdmin);
    list.innerHTML = buildStudentRows(all);
  }
}


// ═══════════════════════════════════════════════════════════════
// SECTION 6 — DELETE STUDENT
// ═══════════════════════════════════════════════════════════════

function confirmDeleteStudent(accountNo) {
  const student = StorageManager.loadStudent(accountNo);
  if (!student) return;

  // Only admin-created students can be deleted
  if (!StorageManager.isExtraStudent(accountNo)) {
    showToast("ℹ️ Seeded students cannot be deleted.");
    return;
  }

  showAdminConfirm(
    "Delete " + student.name.split(" ")[0] + "?",
    "Account " + accountNo + " and all their data will be permanently removed.",
    "Yes, Delete",
    "#FEF2F2",
    "var(--clr-red)",
    () => {
      StorageManager.removeExtraAccount(accountNo);
      showToast("🗑️ " + student.name.split(" ")[0] + " removed.");
      switchAdminTab("students");
    }
  );
}


// ═══════════════════════════════════════════════════════════════
// SECTION 7 — TOP UP MODAL (kept from v5, improved)
// ═══════════════════════════════════════════════════════════════

function openTopUpModal(accountNo) {
  const student = StorageManager.loadStudent(accountNo);
  if (!student) return;

  _removeModal("topup-modal");

  const modal = document.createElement("div");
  modal.id = "topup-modal";
  modal.style.cssText = "position:fixed;inset:0;z-index:600;display:block";
  modal.innerHTML = `
    <div onclick="_removeModal('topup-modal')"
      style="position:absolute;inset:0;background:rgba(10,20,60,.6);
        backdrop-filter:blur(4px);z-index:0"></div>

    <div style="position:absolute;inset:0;display:flex;align-items:flex-end;
      justify-content:center;z-index:1;pointer-events:none">
      <div style="width:100%;max-width:480px;background:#fff;border-radius:28px 28px 0 0;
        padding:20px 20px 36px;pointer-events:auto;
        box-shadow:0 -16px 60px rgba(30,58,138,.2)">

        <div style="display:flex;justify-content:center;margin-bottom:16px">
          <div style="width:40px;height:4px;border-radius:999px;background:#E2E8F0"></div>
        </div>

        <!-- Student strip -->
        <div style="background:var(--clr-bg);border-radius:14px;padding:12px;
          margin-bottom:16px;display:flex;align-items:center;gap:12px">
          <div style="width:40px;height:40px;border-radius:12px;
            background:linear-gradient(135deg,#16A34A,#22C55E);
            display:flex;align-items:center;justify-content:center">
            <i class="bi bi-wallet2" style="color:#fff;font-size:1rem"></i>
          </div>
          <div>
            <p style="font-weight:900;font-size:.85rem;color:var(--clr-text)">${student.name}</p>
            <p style="font-size:.72rem;color:var(--clr-text-faint)">
              ${student.accountNo} · Balance:
              <strong style="color:var(--clr-green-dk)">${formatMoney(student.balance)}</strong>
            </p>
          </div>
        </div>

        <h3 style="font-weight:900;font-size:.95rem;color:var(--clr-text);margin-bottom:14px">
          💰 Top Up Wallet
        </h3>

        <div style="margin-bottom:14px">
          <label style="font-size:9px;font-weight:900;text-transform:uppercase;
            letter-spacing:.12em;color:var(--clr-text-muted);display:block;margin-bottom:8px">
            Amount (₦)
          </label>
          <div style="position:relative">
            <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);
              font-weight:900;color:var(--clr-text-muted)">₦</span>
            <input type="number" id="topup-amount" min="100" step="100" placeholder="0"
              style="width:100%;padding:14px 14px 14px 28px;border-radius:14px;
                border:2px solid var(--clr-border);background:var(--clr-bg);
                color:var(--clr-text);font-weight:800;font-size:1.1rem;outline:none;
                box-sizing:border-box">
          </div>
          <div style="display:flex;gap:8px;margin-top:8px">
            ${[1000,2000,5000,10000].map(amt => `
              <button onclick="document.getElementById('topup-amount').value='${amt}'"
                style="flex:1;padding:7px 4px;border-radius:10px;border:1.5px solid var(--clr-border);
                  background:var(--clr-bg);font-size:.72rem;font-weight:800;color:var(--clr-blue);cursor:pointer">
                ₦${amt >= 1000 ? (amt/1000)+"k" : amt}
              </button>
            `).join("")}
          </div>
        </div>

        <p id="topup-error" style="display:none;color:var(--clr-red);font-size:.78rem;
          font-weight:700;margin-bottom:10px"></p>

        <div style="display:flex;gap:10px">
          <button onclick="_removeModal('topup-modal')"
            style="flex:1;padding:14px;border-radius:16px;background:#F1F5F9;
              color:var(--clr-text-muted);font-weight:800;font-size:.9rem;border:none;cursor:pointer">
            Cancel
          </button>
          <button onclick="_submitTopUp('${accountNo}')"
            style="flex:2;padding:14px;border-radius:16px;color:#fff;font-weight:900;
              font-size:.9rem;border:none;cursor:pointer;
              background:linear-gradient(135deg,#16A34A,#22C55E);
              display:flex;align-items:center;justify-content:center;gap:8px;
              box-shadow:0 6px 20px rgba(22,163,74,.35)">
            <i class="bi bi-wallet2"></i> Top Up
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => document.getElementById("topup-amount")?.focus(), 100);
}

function _submitTopUp(accountNo) {
  const amountEl = document.getElementById("topup-amount");
  const errEl    = document.getElementById("topup-error");
  const amount   = parseFloat(amountEl?.value);

  if (!amount || amount < 100) {
    if (errEl) { errEl.textContent = "Minimum top-up is ₦100."; errEl.style.display = "block"; }
    return;
  }

  const result = StorageManager.topUpStudent(accountNo, amount);
  if (!result.success) {
    if (errEl) { errEl.textContent = result.error; errEl.style.display = "block"; }
    return;
  }

  _removeModal("topup-modal");
  showToast("✅ ₦" + amount.toLocaleString() + " added to " + result.student.name.split(" ")[0] + "'s wallet");

  // Refresh student list
  const list = document.getElementById("student-list");
  if (list) {
    const all = StorageManager.getAllStudents().filter(s => !s.isAdmin);
    list.innerHTML = buildStudentRows(all);
  }

  // Update overview if on that tab
  if (adminTab === "overview") {
    const content = document.getElementById("admin-content");
    if (content) content.innerHTML = buildAdminTabContent();
  }
}


// ═══════════════════════════════════════════════════════════════
// SECTION 8 — TRANSACTIONS TAB
// ═══════════════════════════════════════════════════════════════

function buildTransactionsTab() {
  const all     = StorageManager.getAllStudents().filter(s => !s.isAdmin);
  const allTxns = all
    .flatMap(s => (s.history || []).map(t => ({ ...t, studentName: s.name, accountNo: s.accountNo })))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return `
    <div style="position:relative;margin-bottom:12px">
      <i class="bi bi-search" style="position:absolute;left:12px;top:50%;
        transform:translateY(-50%);color:var(--clr-text-faint);font-size:.85rem"></i>
      <input id="txn-search" type="text"
        placeholder="Filter by student name or account…"
        oninput="filterTransactionList(this.value)"
        style="width:100%;padding:10px 10px 10px 34px;border-radius:12px;
          border:1.5px solid var(--clr-border);background:var(--clr-bg);
          font-size:.8rem;font-weight:600;color:var(--clr-text);outline:none;box-sizing:border-box">
    </div>
    <p style="font-size:.72rem;color:var(--clr-text-faint);margin-bottom:10px">
      ${allTxns.length} total transactions
    </p>
    <div id="txn-list">${buildTxnRows(allTxns)}</div>
  `;
}

function buildTxnRows(txns) {
  if (txns.length === 0) {
    return `<p style="color:var(--clr-text-faint);text-align:center;padding:24px;font-size:.8rem">
      No transactions found
    </p>`;
  }
  return txns.map(t => adminTxnRow(t)).join("");
}

function adminTxnRow(t) {
  const isDebit = t.type === "debit";
  const color   = isDebit ? "var(--clr-red)" : "var(--clr-green-dk)";
  const iconBg  = isDebit ? "#FEE2E2" : "#DCFCE7";
  const icon    = isDebit ? "bi-arrow-up-right" : "bi-arrow-down-left";

  return `
    <div style="background:#fff;border-radius:14px;padding:10px 12px;margin-bottom:8px;
      display:flex;align-items:center;gap:10px;
      box-shadow:0 1px 8px rgba(30,58,138,.06)">
      <div style="width:34px;height:34px;border-radius:10px;background:${iconBg};
        display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="bi ${icon}" style="color:${color};font-size:.85rem"></i>
      </div>
      <div style="flex:1;min-width:0">
        <p style="font-weight:800;font-size:.78rem;color:var(--clr-text);
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.item}</p>
        <p style="font-size:.65rem;color:var(--clr-text-faint);margin-top:1px">
          ${t.studentName || ""} ${t.accountNo ? "· " + t.accountNo : ""} · ${formatDate(t.date)}
        </p>
      </div>
      <span style="font-weight:900;font-size:.82rem;color:${color};flex-shrink:0">
        ${(isDebit ? "−" : "+") + formatMoney(t.amount)}
      </span>
    </div>
  `;
}

function filterTransactionList(query) {
  const q       = query.toLowerCase().trim();
  const all     = StorageManager.getAllStudents().filter(s => !s.isAdmin);
  const allTxns = all
    .flatMap(s => (s.history || []).map(t => ({ ...t, studentName: s.name, accountNo: s.accountNo })))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = q
    ? allTxns.filter(t =>
        (t.studentName || "").toLowerCase().includes(q) ||
        (t.accountNo   || "").toLowerCase().includes(q)
      )
    : allTxns;

  const list = document.getElementById("txn-list");
  if (list) list.innerHTML = buildTxnRows(filtered);
}


// ═══════════════════════════════════════════════════════════════
// SECTION 9 — PRODUCTS TAB
// ═══════════════════════════════════════════════════════════════

function buildProductsTab() {
  return `
    <button onclick="openProductForm(null)"
      style="width:100%;padding:12px;border-radius:14px;border:2px dashed var(--clr-blue);
        background:transparent;color:var(--clr-blue);font-weight:900;font-size:.85rem;
        cursor:pointer;margin-bottom:14px;display:flex;align-items:center;
        justify-content:center;gap:8px">
      <i class="bi bi-plus-circle"></i> Add New Product
    </button>
    <div id="admin-product-list">
      ${buildAdminProductRows(State.products)}
    </div>
  `;
}

function buildAdminProductRows(products) {
  if (products.length === 0) {
    return `<p style="color:var(--clr-text-faint);text-align:center;padding:24px;font-size:.8rem">
      No products yet.
    </p>`;
  }
  return products.map(p => `
    <div style="background:#fff;border-radius:14px;padding:10px 12px;margin-bottom:8px;
      display:flex;align-items:center;gap:10px;box-shadow:0 1px 8px rgba(30,58,138,.06)">
      <div style="width:44px;height:44px;border-radius:10px;overflow:hidden;flex-shrink:0;
        background:#EFF6FF;display:flex;align-items:center;justify-content:center">
        <img src="${p.image}" alt="${p.name}"
          style="width:100%;height:100%;object-fit:cover"
          onerror="this.style.display='none';this.parentElement.innerHTML='<span style=font-size:1.4rem>${p.category==="food"?"🍛":"🥤"}</span>'">
      </div>
      <div style="flex:1;min-width:0">
        <p style="font-weight:800;font-size:.8rem;color:var(--clr-text);
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</p>
        <p style="font-size:.68rem;color:var(--clr-text-faint)">${p.category} · ${formatMoney(p.price)}</p>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button onclick="openProductForm('${p.id}')"
          style="width:30px;height:30px;border-radius:8px;border:none;cursor:pointer;
            background:#EFF6FF;display:flex;align-items:center;justify-content:center">
          <i class="bi bi-pencil-fill" style="color:var(--clr-blue);font-size:.75rem"></i>
        </button>
        <button onclick="deleteProduct('${p.id}')"
          style="width:30px;height:30px;border-radius:8px;border:none;cursor:pointer;
            background:#FEE2E2;display:flex;align-items:center;justify-content:center">
          <i class="bi bi-trash3-fill" style="color:var(--clr-red);font-size:.75rem"></i>
        </button>
      </div>
    </div>
  `).join("");
}

function openProductForm(productId) {
  editingProductId = productId;
  _removeModal("product-form-modal");

  const existing = productId ? State.products.find(p => p.id === productId) : null;

  const modal = document.createElement("div");
  modal.id = "product-form-modal";
  modal.style.cssText = "position:fixed;inset:0;z-index:600;display:block";
  modal.innerHTML = `
    <div onclick="closeProductForm()"
      style="position:absolute;inset:0;background:rgba(10,20,60,.6);
        backdrop-filter:blur(4px);z-index:0"></div>
    <div style="position:absolute;inset:0;display:flex;align-items:flex-end;
      justify-content:center;z-index:1;pointer-events:none">
      <div style="width:100%;max-width:480px;background:#fff;border-radius:28px 28px 0 0;
        padding:20px 20px 36px;max-height:90vh;overflow-y:auto;pointer-events:auto;
        box-shadow:0 -16px 60px rgba(30,58,138,.2)">
        <div style="display:flex;justify-content:center;margin-bottom:14px">
          <div style="width:40px;height:4px;border-radius:999px;background:#E2E8F0"></div>
        </div>
        <h3 style="font-weight:900;font-size:1rem;color:var(--clr-text);margin-bottom:16px">
          ${existing ? "Edit Product" : "Add New Product"}
        </h3>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${_formField("Product Name", "pf-name", "text", existing?.name || "", "e.g. Jollof Rice + Chicken", true)}
          ${_formField("Price (₦)", "pf-price", "number", existing?.price || "", "e.g. 650", true)}
          <div>
            <label style="font-size:9px;font-weight:900;text-transform:uppercase;
              letter-spacing:.1em;color:var(--clr-text-muted);display:block;margin-bottom:6px">
              Category
            </label>
            <select id="pf-category"
              style="width:100%;padding:12px;border-radius:12px;border:1.5px solid var(--clr-border);
                background:var(--clr-bg);color:var(--clr-text);font-size:.85rem;font-weight:600;
                outline:none;box-sizing:border-box">
              <option value="food"  ${existing?.category === "food"  ? "selected" : ""}>🍔 Food</option>
              <option value="drink" ${existing?.category === "drink" ? "selected" : ""}>🥤 Drink</option>
            </select>
          </div>
          ${_formField("Description", "pf-desc", "text", existing?.description || "", "Short description")}
          ${_formField("Image URL", "pf-image", "text", existing?.image || "", "https://...")}
          ${_formField("Tag (optional)", "pf-tag", "text", existing?.tag || "", "e.g. 🔥 Most Popular")}
          <div style="display:flex;align-items:center;gap:8px">
            <input type="checkbox" id="pf-popular" ${existing?.popular ? "checked" : ""}
              style="width:16px;height:16px;accent-color:var(--clr-blue)">
            <label for="pf-popular" style="font-size:.82rem;font-weight:700;color:var(--clr-text)">
              Show in "Top Picks" row
            </label>
          </div>
          <p id="pf-error" style="display:none;color:var(--clr-red);font-size:.78rem;font-weight:700"></p>
          <div style="display:flex;gap:10px;margin-top:4px">
            <button onclick="closeProductForm()"
              style="flex:1;padding:13px;border-radius:14px;background:#F1F5F9;
                color:var(--clr-text-muted);font-weight:800;font-size:.9rem;border:none;cursor:pointer">
              Cancel
            </button>
            <button onclick="saveProductForm()"
              style="flex:2;padding:13px;border-radius:14px;color:#fff;font-weight:900;
                font-size:.9rem;border:none;cursor:pointer;
                background:linear-gradient(135deg,#1D4ED8,#3B82F6);
                display:flex;align-items:center;justify-content:center;gap:6px">
              <i class="bi bi-check2-circle"></i> ${existing ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function closeProductForm() { _removeModal("product-form-modal"); editingProductId = null; }

function saveProductForm() {
  const name     = document.getElementById("pf-name")?.value.trim();
  const price    = parseFloat(document.getElementById("pf-price")?.value);
  const category = document.getElementById("pf-category")?.value;
  const desc     = document.getElementById("pf-desc")?.value.trim();
  const image    = document.getElementById("pf-image")?.value.trim();
  const tag      = document.getElementById("pf-tag")?.value.trim();
  const popular  = document.getElementById("pf-popular")?.checked;
  const errEl    = document.getElementById("pf-error");

  if (!name)           { if (errEl) { errEl.textContent = "Product name required."; errEl.style.display="block"; } return; }
  if (!price || price <= 0) { if (errEl) { errEl.textContent = "Enter a valid price."; errEl.style.display="block"; } return; }

  if (editingProductId) {
    const idx = State.products.findIndex(p => p.id === editingProductId);
    if (idx !== -1) {
      State.products[idx] = { ...State.products[idx], name, price, category, description: desc, image: image || State.products[idx].image, tag: tag || "", popular: !!popular };
    }
  } else {
    State.products.push({ id: "p-" + Date.now(), name, price, category, description: desc, image: image || "", tag: tag || "", popular: !!popular, calories: "" });
  }

  StorageManager.saveProducts(State.products);
  closeProductForm();
  showToast(editingProductId ? "✅ Product updated!" : "✅ Product added!");

  const list = document.getElementById("admin-product-list");
  if (list) list.innerHTML = buildAdminProductRows(State.products);
}

function deleteProduct(productId) {
  const product = State.products.find(p => p.id === productId);
  if (!product) return;

  showAdminConfirm(
    `Delete "${product.name}"?`,
    "This product will be removed from the canteen menu.",
    "Yes, Delete", "#FEF2F2", "var(--clr-red)",
    () => {
      State.products = State.products.filter(p => p.id !== productId);
      StorageManager.saveProducts(State.products);
      showToast("🗑️ Product deleted.");
      const list = document.getElementById("admin-product-list");
      if (list) list.innerHTML = buildAdminProductRows(State.products);
    }
  );
}


// ═══════════════════════════════════════════════════════════════
// SECTION 10 — SHARED HELPERS
// ═══════════════════════════════════════════════════════════════

/** Remove a modal by id if it exists */
function _removeModal(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/** Builds a labelled form field — supports text, number, select */
function _formField(label, id, type, value, placeholder, required) {
  const req = required ? `<span style="color:var(--clr-red)">*</span>` : "";
  return `
    <div>
      <label for="${id}" style="font-size:9px;font-weight:900;text-transform:uppercase;
        letter-spacing:.1em;color:var(--clr-text-muted);display:block;margin-bottom:6px">
        ${label} ${req}
      </label>
      <input type="${type}" id="${id}" value="${value || ""}" placeholder="${placeholder || ""}"
        style="width:100%;padding:12px;border-radius:12px;border:1.5px solid var(--clr-border);
          background:var(--clr-bg);color:var(--clr-text);font-size:.85rem;font-weight:600;
          outline:none;box-sizing:border-box;transition:border-color .2s">
    </div>
  `;
}

/** Populate class dropdown — replaces the input with a <select> */
function _populateClassSelect(id, selectedValue) {
  const el = document.getElementById(id);
  if (!el) return;

  const classes = [
    // Junior School — Year 7
    "Year 7 Abraham", "Year 7 Deborah", "Year 7 Noah", "Year 7 Joseph",
    // Junior School — Year 8
    "Year 8 Abraham", "Year 8 Deborah", "Year 8 Noah", "Year 8 Joseph",
    // Junior School — Year 9
    "Year 9 Abraham", "Year 9 Deborah", "Year 9 Noah", "Year 9 Joseph",
    // Senior School — Year 10
    "Year 10 Noah", "Year 10 Abraham", "Year 10 Joseph",
    // Senior School — Year 11
    "Year 11 Noah", "Year 11 Abraham", "Year 11 Joseph",
    // Senior School — Year 12
    "Year 12 Noah", "Year 12 Abraham", "Year 12 Joseph"
  ];

  const select = document.createElement("select");
  select.id    = id;
  select.style.cssText = el.style.cssText;
  select.style.cssText = "width:100%;padding:12px;border-radius:12px;border:1.5px solid var(--clr-border);background:var(--clr-bg);color:var(--clr-text);font-size:.85rem;font-weight:600;outline:none;box-sizing:border-box";

  classes.forEach(cls => {
    const opt      = document.createElement("option");
    opt.value      = cls;
    opt.textContent = cls;
    if (cls === selectedValue) opt.selected = true;
    select.appendChild(opt);
  });

  el.replaceWith(select);
}

/** Populate gender dropdown */
function _populateGenderSelect(id, selectedValue) {
  const el = document.getElementById(id);
  if (!el) return;

  const select = document.createElement("select");
  select.id    = id;
  select.style.cssText = "width:100%;padding:12px;border-radius:12px;border:1.5px solid var(--clr-border);background:var(--clr-bg);color:var(--clr-text);font-size:.85rem;font-weight:600;outline:none;box-sizing:border-box";

  [["male","👨 Male"], ["female","👩 Female"]].forEach(([val, label]) => {
    const opt      = document.createElement("option");
    opt.value      = val;
    opt.textContent = label;
    if (val === selectedValue) opt.selected = true;
    select.appendChild(opt);
  });

  el.replaceWith(select);
}

/**
 * showAdminConfirm(title, msg, confirmLabel, confirmBg, confirmColor, onConfirm)
 * Generic in-app confirm dialog.
 */
function showAdminConfirm(title, msg, confirmLabel, confirmBg, confirmColor, onConfirm) {
  _removeModal("admin-confirm-modal");

  const modal = document.createElement("div");
  modal.id = "admin-confirm-modal";
  modal.style.cssText = "position:fixed;inset:0;z-index:700;display:flex;align-items:center;justify-content:center;padding:1.5rem";

  modal.innerHTML = `
    <div onclick="_removeModal('admin-confirm-modal')"
      style="position:absolute;inset:0;background:rgba(10,20,60,.5);backdrop-filter:blur(4px)"></div>
    <div style="position:relative;background:#fff;border-radius:22px;padding:24px 20px;
      width:100%;max-width:300px;text-align:center;box-shadow:0 16px 60px rgba(0,0,0,.2);z-index:1">
      <div style="width:50px;height:50px;border-radius:14px;background:${confirmBg};
        margin:0 auto 12px;display:flex;align-items:center;justify-content:center">
        <i class="bi bi-exclamation-triangle-fill" style="color:${confirmColor};font-size:1.4rem"></i>
      </div>
      <h3 style="font-weight:900;font-size:.95rem;color:var(--clr-text);margin-bottom:6px">${title}</h3>
      <p style="font-size:.78rem;color:var(--clr-text-muted);margin-bottom:18px">${msg}</p>
      <div style="display:flex;gap:8px">
        <button onclick="_removeModal('admin-confirm-modal')"
          style="flex:1;padding:11px;border-radius:12px;background:#F1F5F9;
            color:var(--clr-text-muted);font-weight:800;font-size:.82rem;border:none;cursor:pointer">
          Cancel
        </button>
        <button id="admin-confirm-yes"
          style="flex:1;padding:11px;border-radius:12px;background:${confirmBg};
            color:${confirmColor};font-weight:900;font-size:.82rem;border:none;cursor:pointer">
          ${confirmLabel || "Confirm"}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById("admin-confirm-yes").addEventListener("click", () => {
    _removeModal("admin-confirm-modal");
    onConfirm();
  });
}