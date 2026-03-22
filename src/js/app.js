// js/app.js — SkoolPocket App Entry Point  v5
// ════════════════════════════════════════════════════════════════

function init() {
  // 1. Seed students to localStorage on first-ever load
  StorageManager.seedStudents();

  // 2. Load student list into State (wallet data hydrated at login time)
  State.students = STUDENTS;

  // 3. Load product catalogue from localStorage (admin edits persist)
  State.products = StorageManager.loadProducts();

  // 4. Wire up footer navigation
  initNavigation();

  // 5. Wire up login form
  initAuth();

  // 6. Splash → login
  navigate("splash");
  setTimeout(() => navigate("auth"), 2000);
}

document.addEventListener("DOMContentLoaded", init);