# SkoolPocket
SkoolPocket is a student wallet web application that enables schools to manage internal food purchases, track student spending, and simulate a closed-loop cashless system using a modern mobile-first interface.

# 🎓 SkoolPocket — Student Wallet System

SkoolPocket is a mobile-first web application designed for schools to manage a **closed-loop student wallet system**.

It allows students to log in, view their balance, purchase food items from a school shop, and track their transaction history — all within a clean, app-like interface.

---

## 🚀 Features

### 🔐 Authentication
- Student login using **Account Number + Password**
- Session-based access control
- Multi-user support (different students on different devices)

---

### 💳 Wallet System
- Each student has a **personal wallet**
- Default balance initialized (₦50,000)
- Balance updates after every purchase
- Persistent data using localStorage (simulating backend)

---

### 🛒 Shop & Cart
- Browse items (Food & Drinks)
- Add items to cart
- Quantity management
- Secure checkout with password confirmation
- Automatic balance deduction

---

### 📜 Transaction History
- Tracks all student purchases
- Shows:
  - Items purchased
  - Total amount
  - Date & time
  - Transaction type (debit)

---

### 👤 Profile
- View student details:
  - Name
  - Account Number
  - Class
  - Wallet Balance

---

### 🏫 Academic Structure
Students are grouped using a structured academic format:

**Junior School**
- Year 7 (Abraham, Deborah, Noah, Joseph)
- Year 8 (Abraham, Deborah, Noah, Joseph)
- Year 9 (Abraham, Deborah, Noah, Joseph)

**Senior School**
- Year 10 (Noah, Abraham, Joseph)
- Year 11 (Noah, Abraham, Joseph)
- Year 12 (Noah, Abraham, Joseph)

---

### 🧠 Data Persistence
- Uses **localStorage** to simulate a backend
- Student balances and transaction history:
  - Persist after logout
  - Persist after page refresh
- No data reset between sessions

---

### 🧑‍💼 Admin Dashboard (In Progress / Optional)
- Add/edit/delete shop products
- View student balances
- Monitor all transactions

---

## 🏗 Tech Stack

- HTML5
- TailwindCSS
- Vanilla JavaScript (No frameworks)
- LocalStorage (Simulated backend)

---

## 📱 Design Philosophy

- Mobile-first UI (optimized for phones)
- App-like experience (SPA — Single Page Application)
- Clean, modern interface using:
  - Cards
  - Shadows
  - Rounded layouts
  - Smooth transitions

---

## 🧩 Architecture

The app is built using a **modular JavaScript structure**:

js/
├── app.js
├── state.js
├── auth.js
├── navigation.js
├── shop.js
├── history.js
├── profile.js
└── admin.js


---

## 🌍 Future Improvements

- Real backend (Firebase / Node.js)
- QR code payments
- Real-time database sync across devices
- Admin analytics dashboard
- Payment notifications

---

## 🎯 Project Goal

This project was built as a **real-world school solution** and an **educational project** to demonstrate:

- State management in JavaScript
- SPA architecture without frameworks
- Frontend system design
- Wallet and transaction logic

---

## 👨‍💻 Author

Built by [Your Name]

---

## 📄 License

This project is for educational and internal school use.
