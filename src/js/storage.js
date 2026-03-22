// js/storage.js — SkoolPocket Persistent Storage  (Final Clean)
// ════════════════════════════════════════════════════════════════
//
// RULE: localStorage is the only source of truth at runtime.
//
// KEY: sp_student_SBIS001 → complete student object
//      (name, password, class, balance, history, everything)
//
// DATA FLOW:
//   1. First load  → seedStudents() writes defaults (skips existing keys)
//   2. Login       → loadStudent() reads from localStorage
//   3. Purchase    → confirmCheckout() calls saveStudent()
//   4. Logout      → logout() calls saveStudent() as safety net, then clears State
//   5. Re-login    → loadStudent() reads updated data from localStorage
//
// DATA NEVER RESETS because:
//   • seedStudents() has a per-key guard: only writes if key MISSING
//   • logout() only clears State (in-memory), not localStorage
//   • Only StorageManager.clearAll() or StorageManager.reseed() resets data
// ════════════════════════════════════════════════════════════════

var StorageManager = {

  SEEDED_KEY:      "sp_seeded_v3",
  PRODUCTS_KEY:    "sp_products",
  EXTRA_ACCTS_KEY: "sp_extra_accounts",

  // Returns the localStorage key for any student account number
  studentKey: function(accountNo) {
    return "sp_student_" + String(accountNo).toUpperCase();
  },


  // ── SEED (first boot only) ────────────────────────────────────

  seedStudents: function() {
    var self = this;
    var count = 0;

    for (var i = 0; i < STUDENTS.length; i++) {
      var s   = STUDENTS[i];
      var key = self.studentKey(s.accountNo);

      // THE GUARD: if a record already exists, NEVER overwrite it
      if (localStorage.getItem(key) !== null) {
        continue; // skip — preserve existing balance + history
      }

      // No record yet — write the default for this student
      localStorage.setItem(key, JSON.stringify({
        accountNo:     s.accountNo,
        name:          s.name,
        class:         s.class,
        password:      s.password,
        gender:        s.gender   || "male",
        isAdmin:       s.isAdmin  || false,
        balance:       s.balance       !== undefined ? s.balance       : 50000,
        totalInflow:   s.totalInflow   !== undefined ? s.totalInflow   : 50000,
        totalExpenses: s.totalExpenses !== undefined ? s.totalExpenses : 0,
        dailyLimit:    s.dailyLimit    !== undefined ? s.dailyLimit    : 5000,
        spentToday:    0,
        lastSpendDate: "",
        history:       []
      }));
      count++;
    }

    localStorage.setItem(this.SEEDED_KEY, "true");
    if (count > 0) {
      console.log("SkoolPocket: wrote " + count + " new student record(s) to localStorage");
    }
  },


  // ── LOAD ─────────────────────────────────────────────────────

  loadStudent: function(accountNo) {
    var key = String(accountNo).toUpperCase();
    var raw = null;

    // Step 1: read from localStorage
    try {
      raw = localStorage.getItem(this.studentKey(key));
    } catch(e) {
      console.error("loadStudent: localStorage read error", e);
      return null;
    }

    if (raw !== null) {
      // Parse and return the stored object
      var student = null;
      try {
        student = JSON.parse(raw);
      } catch(e) {
        console.error("loadStudent: JSON.parse failed for", key, e);
        raw = null; // fall through to re-seed below
      }

      if (student) {
        // Ensure history is always an array
        if (!Array.isArray(student.history)) {
          student.history = [];
        }

        // If old format (no password field), patch from STUDENTS array
        if (!student.password) {
          for (var i = 0; i < STUDENTS.length; i++) {
            if (STUDENTS[i].accountNo.toUpperCase() === key) {
              student.password = STUDENTS[i].password;
              student.name     = student.name   || STUDENTS[i].name;
              student.class    = student.class  || STUDENTS[i].class;
              student.gender   = student.gender || STUDENTS[i].gender || "male";
              student.isAdmin  = STUDENTS[i].isAdmin || false;
              // Write the patched version back immediately
              localStorage.setItem(this.studentKey(key), JSON.stringify(student));
              console.log("SkoolPocket: patched old-format record for", key);
              break;
            }
          }
          if (!student.password) {
            console.warn("loadStudent: no password for", key);
            return null;
          }
        }

        // Auto-reset spentToday on a new calendar day
        var today = new Date().toISOString().slice(0, 10);
        if (student.lastSpendDate && student.lastSpendDate !== today) {
          student.spentToday    = 0;
          student.lastSpendDate = today;
          localStorage.setItem(this.studentKey(key), JSON.stringify(student));
        }

        return student;
      }
    }

    // Step 2: not in localStorage — seed from STUDENTS array
    for (var j = 0; j < STUDENTS.length; j++) {
      if (STUDENTS[j].accountNo.toUpperCase() === key) {
        var s = STUDENTS[j];
        var fresh = {
          accountNo:     s.accountNo,
          name:          s.name,
          class:         s.class,
          password:      s.password,
          gender:        s.gender  || "male",
          isAdmin:       s.isAdmin || false,
          balance:       s.balance       !== undefined ? s.balance       : 50000,
          totalInflow:   s.totalInflow   !== undefined ? s.totalInflow   : 50000,
          totalExpenses: s.totalExpenses !== undefined ? s.totalExpenses : 0,
          dailyLimit:    s.dailyLimit    !== undefined ? s.dailyLimit    : 5000,
          spentToday:    0,
          lastSpendDate: "",
          history:       []
        };
        localStorage.setItem(this.studentKey(key), JSON.stringify(fresh));
        return fresh;
      }
    }

    return null; // unknown account number
  },


  // ── SAVE ─────────────────────────────────────────────────────

  saveStudent: function(user) {
    if (!user || !user.accountNo) {
      console.error("saveStudent: invalid user object", user);
      return false;
    }

    try {
      if (!Array.isArray(user.history)) user.history = [];

      // Record today's date for spentToday auto-reset
      user.lastSpendDate = new Date().toISOString().slice(0, 10);

      var key  = this.studentKey(user.accountNo);
      var json = JSON.stringify(user);

      localStorage.setItem(key, json);

      // Verify the write succeeded by reading it back
      var written = localStorage.getItem(key);
      if (!written) {
        console.error("saveStudent: write verification failed for", user.accountNo);
        return false;
      }

      var parsed = JSON.parse(written);
      if (parsed.balance !== user.balance) {
        console.error("saveStudent: balance mismatch —",
          "wrote:", user.balance, "| read back:", parsed.balance);
        return false;
      }

      console.log("SAVED " + user.accountNo
        + " | balance: ₦" + user.balance.toLocaleString()
        + " | history: " + user.history.length + " txns");
      return true;

    } catch(e) {
      console.error("saveStudent: exception for", user.accountNo, e);
      return false;
    }
  },


  // ── WALLET ACTIONS ────────────────────────────────────────────

  topUpStudent: function(accountNo, amount) {
    var student = this.loadStudent(accountNo);
    if (!student)               return { success: false, error: "Student not found." };
    if (!amount || amount <= 0) return { success: false, error: "Invalid amount." };

    student.balance    += amount;
    student.totalInflow = (student.totalInflow || 0) + amount;
    if (!Array.isArray(student.history)) student.history = [];
    student.history.push({
      id: "txn-topup-" + Date.now(), type: "credit",
      item: "Admin Top-up", amount: amount,
      date: new Date().toISOString(), icon: "bi-arrow-down-circle"
    });

    this.saveStudent(student);
    return { success: true, student: student };
  },

  deductStudent: function(accountNo, amount, reason) {
    var student = this.loadStudent(accountNo);
    if (!student)                 return { success: false, error: "Student not found." };
    if (!amount || amount <= 0)   return { success: false, error: "Invalid amount." };
    if (student.balance < amount) return { success: false, error: "Insufficient balance." };

    student.balance      -= amount;
    student.totalExpenses = (student.totalExpenses || 0) + amount;
    if (!Array.isArray(student.history)) student.history = [];
    student.history.push({
      id: "txn-deduct-" + Date.now(), type: "debit",
      item: reason || "Admin Deduction", amount: amount,
      date: new Date().toISOString(), icon: "bi-dash-circle"
    });

    this.saveStudent(student);
    return { success: true, student: student };
  },


  // ── ADMIN: ALL STUDENTS ───────────────────────────────────────

  getAllStudents: function() {
    var self = this;
    var all  = [];
    var seen = {};

    for (var i = 0; i < STUDENTS.length; i++) {
      var s = self.loadStudent(STUDENTS[i].accountNo);
      if (s) { all.push(s); seen[s.accountNo.toUpperCase()] = true; }
    }

    var extras = this.getExtraAccounts();
    for (var j = 0; j < extras.length; j++) {
      if (!seen[extras[j].toUpperCase()]) {
        var e = self.loadStudent(extras[j]);
        if (e) all.push(e);
      }
    }

    return all;
  },

  getExtraAccounts: function() {
    try {
      var raw = localStorage.getItem(this.EXTRA_ACCTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  },

  addExtraAccount: function(accountNo) {
    var list = this.getExtraAccounts();
    var key  = String(accountNo).toUpperCase();
    if (list.indexOf(key) === -1) {
      list.push(key);
      localStorage.setItem(this.EXTRA_ACCTS_KEY, JSON.stringify(list));
    }
  },

  removeExtraAccount: function(accountNo) {
    var key  = String(accountNo).toUpperCase();
    var list = this.getExtraAccounts().filter(function(a) { return a !== key; });
    localStorage.setItem(this.EXTRA_ACCTS_KEY, JSON.stringify(list));
    localStorage.removeItem(this.studentKey(key));
  },

  isExtraStudent: function(accountNo) {
    return this.getExtraAccounts().indexOf(String(accountNo).toUpperCase()) !== -1;
  },

  getNextAccountNo: function() {
    var all = STUDENTS.map(function(s) { return s.accountNo; })
                .concat(this.getExtraAccounts());
    var max = 100;
    for (var i = 0; i < all.length; i++) {
      var m = String(all[i]).match(/^SBIS(\d+)$/i);
      if (m && parseInt(m[1]) > max) max = parseInt(m[1]);
    }
    return "SBIS" + String(max + 1).padStart(3, "0");
  },


  // ── ADMIN: ADD / EDIT STUDENTS ───────────────────────────────

  addStudent: function(profileData) {
    var name       = profileData.name;
    var cls        = profileData.cls;
    var gender     = profileData.gender;
    var password   = profileData.password;
    var balance    = profileData.balance;
    var dailyLimit = profileData.dailyLimit;

    if (!name || name.trim().length < 2)
      return { success: false, error: "Name required (min 2 characters)." };
    if (!password || password.trim().length < 4)
      return { success: false, error: "Password must be at least 4 characters." };

    var accountNo    = this.getNextAccountNo();
    var startBalance = (typeof balance === "number" && balance >= 0) ? balance : 50000;

    var student = {
      accountNo: accountNo, name: name.trim(),
      class: cls || "Year 7 Abraham", password: password.trim(),
      gender: gender || "male", isAdmin: false,
      balance: startBalance, totalInflow: startBalance,
      totalExpenses: 0,
      dailyLimit: (typeof dailyLimit === "number" && dailyLimit > 0) ? dailyLimit : 5000,
      spentToday: 0, lastSpendDate: "", history: []
    };

    this.saveStudent(student);
    this.addExtraAccount(accountNo);
    return { success: true, student: student };
  },

  updateStudentProfile: function(accountNo, updates) {
    var student = this.loadStudent(accountNo);
    if (!student) return { success: false, error: "Student not found." };

    if (updates.name       !== undefined) student.name       = updates.name.trim();
    if (updates.cls        !== undefined) student.class      = updates.cls;
    if (updates.password   !== undefined) student.password   = updates.password.trim();
    if (updates.gender     !== undefined) student.gender     = updates.gender;
    if (updates.dailyLimit !== undefined) student.dailyLimit = Number(updates.dailyLimit);

    this.saveStudent(student);

    if (State.currentUser && State.currentUser.accountNo === accountNo) {
      State.currentUser.name       = student.name;
      State.currentUser.class      = student.class;
      State.currentUser.password   = student.password;
      State.currentUser.gender     = student.gender;
      State.currentUser.dailyLimit = student.dailyLimit;
    }

    return { success: true, student: student };
  },


  // ── PRODUCTS ─────────────────────────────────────────────────

  loadProducts: function() {
    try {
      var raw = localStorage.getItem(this.PRODUCTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return JSON.parse(JSON.stringify(PRODUCTS));
  },

  saveProducts: function(arr) {
    try { localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(arr)); } catch(e) {}
  },

  resetProducts: function() { localStorage.removeItem(this.PRODUCTS_KEY); },


  // ── DEBUG & ADMIN TOOLS ───────────────────────────────────────

  // Call from browser console: StorageManager.debug('SBIS001')
  debug: function(accountNo) {
    var key = this.studentKey(accountNo || "SBIS001");
    var raw = localStorage.getItem(key);
    if (!raw) { console.log("No data for", key); return null; }
    var d = JSON.parse(raw);
    console.table({
      accountNo: d.accountNo, name: d.name, balance: "₦" + (d.balance||0).toLocaleString(),
      history: (d.history||[]).length + " transactions",
      lastSaved: d.lastSpendDate || "(never)"
    });
    return d;
  },

  // Call from browser console: StorageManager.debugAll()
  debugAll: function() {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.startsWith("sp_student_")) keys.push(k);
    }
    console.log("=== SkoolPocket: " + keys.length + " student records ===");
    keys.forEach(function(k) {
      try {
        var d = JSON.parse(localStorage.getItem(k));
        console.log(k + " | balance: ₦" + (d.balance||0).toLocaleString()
          + " | history: " + (d.history||[]).length
          + " | password: " + (d.password ? "✓" : "MISSING"));
      } catch(e) { console.log(k, "PARSE ERROR"); }
    });
  },

  // Wipe ALL SkoolPocket data — only call this to do a full reset
  clearAll: function() {
    var keys = [];
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var k = localStorage.key(i);
      if (k && k.startsWith("sp_")) keys.push(k);
    }
    keys.forEach(function(k) { localStorage.removeItem(k); });
    console.log("Cleared " + keys.length + " SkoolPocket keys.");
  },

  reseed: function() {
    this.clearAll();
    this.seedStudents();
    console.log("Reseeded. Refresh the page.");
  },

  exportData: function() {
    var self     = this;
    var students = this.getAllStudents().filter(function(s) { return !s.isAdmin; });
    return JSON.stringify(students.map(function(s) {
      return {
        accountNo: s.accountNo, name: s.name, class: s.class,
        balance: s.balance, txnCount: (s.history||[]).length,
        source: self.isExtraStudent(s.accountNo) ? "admin-added" : "seeded"
      };
    }), null, 2);
  }
};