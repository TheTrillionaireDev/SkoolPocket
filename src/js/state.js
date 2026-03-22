// js/state.js — SkoolPocket Global State  v5
// ════════════════════════════════════════════════════════════════
// Single source of truth for the entire app.
// Admin support: if currentUser.isAdmin === true, navigation
// routes to the admin dashboard screen instead of home.
// ════════════════════════════════════════════════════════════════

var State = {
  // Currently logged-in student/admin. null when logged out.
  currentUser: null,

  // Is any user authenticated right now?
  isAuthenticated: false,

  // Active SPA screen name.
  // Student: 'splash' | 'auth' | 'home' | 'shop' | 'history' | 'profile'
  // Admin:   'admin'
  currentScreen: "splash",

  // Shopping cart — cleared on logout.
  // Shape: [{ id, name, price, image, category, calories, quantity }]
  cart: [],

  // Master student list — loaded at boot from STUDENTS (students.js).
  // Individual wallet fields are hydrated from localStorage per login.
  students: [],

  // Product catalogue — from localStorage (admin edits persist)
  // or default PRODUCTS from products.js.
  products: [],
};