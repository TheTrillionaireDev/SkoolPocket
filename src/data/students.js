// data/students.js — SkoolPocket  (Definitive)
// ════════════════════════════════════════════════════════════════
//
// 100 student accounts + 1 admin account.
//
// ACCOUNT FORMAT:  SBIS001 – SBIS100
// DEFAULT PASSWORD: "sbis" + zero-padded number  (e.g. sbis001)
// ADMIN LOGIN:  accountNo="ADMIN"  password="admin2024"
//
// HOW PERSISTENCE WORKS:
//   This file is the DEFAULT seed only.
//   On first-ever page load, StorageManager.seedStudents() writes
//   every student's wallet data (balance, history, etc.) to
//   localStorage under the key "sp_student_SBIS001".
//   All subsequent logins read from localStorage, so balance
//   changes from purchases are permanent across sessions.
//
// TO RESET A STUDENT:  StorageManager.clearAll() in the console.
// ════════════════════════════════════════════════════════════════

// ─── School class structure ─────────────────────────────────────
// Junior School: Year 7–9 (4 houses: Abraham, Deborah, Noah, Joseph)
// Senior School: Year 10–12 (3 houses: Noah, Abraham, Joseph)
var CLASSES = [
  // Year 7
  "Year 7 Abraham", "Year 7 Deborah", "Year 7 Noah", "Year 7 Joseph",
  // Year 8
  "Year 8 Abraham", "Year 8 Deborah", "Year 8 Noah", "Year 8 Joseph",
  // Year 9
  "Year 9 Abraham", "Year 9 Deborah", "Year 9 Noah", "Year 9 Joseph",
  // Year 10
  "Year 10 Noah",   "Year 10 Abraham", "Year 10 Joseph",
  // Year 11
  "Year 11 Noah",   "Year 11 Abraham", "Year 11 Joseph",
  // Year 12
  "Year 12 Noah",   "Year 12 Abraham", "Year 12 Joseph"
];

// Assign a class deterministically by index (so SBIS001 always = Year 7 Abraham)
function _assignClass(i) { return CLASSES[i % CLASSES.length]; }

// Generate default password from account number
function _makePassword(num) { return "sbis" + String(num).padStart(3, "0"); }

// Simple gender alternation (can be refined later)
function _assignGender(i) { return i % 2 === 0 ? "male" : "female"; }

// ─── Real student names from uploaded class register ─────────────
// Names 1–19 are from the screenshots.
// Names 20–100 are realistic Nigerian names to complete the roster.
var _NAMES = [
  /* 1  */ "Abazie Clarence Chidubem",
  /* 2  */ "Achisim-Anthony Kamsi Samara",
  /* 3  */ "Aginwa Anitta Ifeoma",
  /* 4  */ "Akim-Daniel Kaosisochukwu Bernadine",
  /* 5  */ "Chidozie Flourish Chizaram",
  /* 6  */ "Chilaka Wisdom Chimaobim",
  /* 7  */ "Chukwueze Kayla",
  /* 8  */ "Ekechi Joseph",
  /* 9  */ "Emeribe Favour",
  /* 10 */ "Emeribe Nnaemeka Elvis",
  /* 11 */ "Eric Promise",
  /* 12 */ "Ezema Chijioke Jeffrey",
  /* 13 */ "Ezenna Michael Nnagoziem",
  /* 14 */ "Igwe Justine Chidera",
  /* 15 */ "Nnachebe-Uhiara Adaeze Urenna",
  /* 16 */ "Nsonwu Norah Chizitere",
  /* 17 */ "Nwokorie Trinity",
  /* 18 */ "Obiefule Ugomax",
  /* 19 */ "Okwuchukwu Jovani Chimdiebube",
  // ── Generated to reach 100 ──────────────────────────────────
  /* 20 */ "Okafor David Chukwuemeka",
  /* 21 */ "Obi Amara Chidinma",
  /* 22 */ "Eze Emmanuel Chukwuka",
  /* 23 */ "Nwosu Blessing Adaeze",
  /* 24 */ "Orji Kevin Chinedu",
  /* 25 */ "Mbah Sandra Ugochi",
  /* 26 */ "Igwe Collins Ifeanyi",
  /* 27 */ "Onuoha Grace Chioma",
  /* 28 */ "Nnadi Victor Obiora",
  /* 29 */ "Agu Peace Chiamaka",
  /* 30 */ "Okeke Daniel Emeka",
  /* 31 */ "Chukwu Faith Adaora",
  /* 32 */ "Nwachukwu Samuel Ike",
  /* 33 */ "Okonkwo Rita Ngozi",
  /* 34 */ "Aneke Michael Olisa",
  /* 35 */ "Ugwu Patience Ezinne",
  /* 36 */ "Nnaji Charles Tobechukwu",
  /* 37 */ "Asogwa Joy Chidera",
  /* 38 */ "Okafor Chibuike Nnanna",
  /* 39 */ "Ezike Vera Adaora",
  /* 40 */ "Nwoke Paul Ifeanyi",
  /* 41 */ "Ogbu Helen Amara",
  /* 42 */ "Uchenna Francis Obioma",
  /* 43 */ "Mba Angela Chiagoziem",
  /* 44 */ "Nweke Philip Chukwudi",
  /* 45 */ "Agbo Mercy Adanna",
  /* 46 */ "Onah Stephen Uchenna",
  /* 47 */ "Enendu Stella Obiageli",
  /* 48 */ "Ugwuanyi Emeka Johnbosco",
  /* 49 */ "Eze Benita Chizoba",
  /* 50 */ "Obi Dennis Chukwueloka",
  /* 51 */ "Nweze Ruth Chisom",
  /* 52 */ "Ani Chibundo Emmanuel",
  /* 53 */ "Chukwueke Ada Nkechi",
  /* 54 */ "Nze Kenneth Obiechina",
  /* 55 */ "Egwu Lilian Chimaeze",
  /* 56 */ "Okafor Jerome Ikenna",
  /* 57 */ "Nwosu Irene Chidinma",
  /* 58 */ "Ihejirika Collins Obinna",
  /* 59 */ "Ogbonnaya Juliet Adaeze",
  /* 60 */ "Okoro Godwin Chukwuemeka",
  /* 61 */ "Nwachukwu Agnes Ngozi",
  /* 62 */ "Onyeka Peter Olisa",
  /* 63 */ "Abara Comfort Chisom",
  /* 64 */ "Nnodu Victor Chidebe",
  /* 65 */ "Umeh Florence Amarachi",
  /* 66 */ "Ogbueli Mark Ifeanyi",
  /* 67 */ "Asadu Regina Chioma",
  /* 68 */ "Nwofor Anthony Emeka",
  /* 69 */ "Egbuniwe Janet Adaora",
  /* 70 */ "Mgbemena Pius Chukwudi",
  /* 71 */ "Agwu Esther Nkechi",
  /* 72 */ "Okoye Lawrence Chukwuebuka",
  /* 73 */ "Nwokedi Bridget Amara",
  /* 74 */ "Ogbuike Stanley Ike",
  /* 75 */ "Nwankwo Patricia Obioma",
  /* 76 */ "Alozie Benedict Chizaram",
  /* 77 */ "Okafor Cynthia Adanna",
  /* 78 */ "Eze Martin Uchenna",
  /* 79 */ "Nwoye Sarah Chiagoziem",
  /* 80 */ "Okeke Raymond Nnanna",
  /* 81 */ "Igwe Veronica Adaeze",
  /* 82 */ "Obinna George Chukwuemeka",
  /* 83 */ "Nwachukwu Catherine Ngozi",
  /* 84 */ "Uche Henry Olisa",
  /* 85 */ "Obi Josephine Chisom",
  /* 86 */ "Nweze Albert Ikenna",
  /* 87 */ "Agu Christiana Chidinma",
  /* 88 */ "Orji Francis Obinna",
  /* 89 */ "Mba Theresa Adaora",
  /* 90 */ "Nnadi Joseph Emeka",
  /* 91 */ "Asogwa Dorothy Chioma",
  /* 92 */ "Ugwu Augustine Chukwudi",
  /* 93 */ "Nweke Monica Nkechi",
  /* 94 */ "Agbo Julius Uchenna",
  /* 95 */ "Enendu Anastasia Obiageli",
  /* 96 */ "Okafor Bartholomew Chizoba",
  /* 97 */ "Eze Philomena Chimaeze",
  /* 98 */ "Nwoke Ignatius Olisa",
  /* 99 */ "Ogbu Perpetua Amara",
  /* 100 */ "Chukwu Cyprian Nnanna",
];

// Build 100 student records
var STUDENTS = _NAMES.map((name, i) => {
  const num = i + 1;
  return {
    accountNo:     "SBIS" + String(num).padStart(3, "0"),
    password:      _makePassword(num),
    name:          name,
    class:         _assignClass(i),
    gender:        _assignGender(i),
    balance:       50000,
    totalInflow:   50000,
    totalExpenses: 0,
    dailyLimit:    5000,
    spentToday:    0,
    history:       [],
    isAdmin:       false
  };
});

// ── ADMIN ACCOUNT ────────────────────────────────────────────────
// This account routes to the admin dashboard (isAdmin: true).
// Login: accountNo = "ADMIN"  password = "admin2024"
STUDENTS.push({
  accountNo:     "ADMIN",
  password:      "admin2024",
  name:          "System Administrator",
  class:         "—",
  gender:        "male",
  balance:       0,
  totalInflow:   0,
  totalExpenses: 0,
  dailyLimit:    0,
  spentToday:    0,
  history:       [],
  isAdmin:       true
});