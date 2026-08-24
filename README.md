# ZhuzhuMoney 🐷 | Sisters Finance & Piggy Bank Tracker

A delightful, lightweight, and visual finance tracking web app for two girls, featuring dual-account management:
1. 💵 **Cash Account (Notebook Ledger)**: Parent-managed pocket money, allowances, chore earnings, and day-to-day spending with custom item descriptions and emoji categories.
2. 🏦 **Custodial Savings Account (Real Bank)**: Statement balance checkpoints with timestamps, tracking long-term savings growth, interest, and milestones.

---

## 🌟 Key Features

### 🌈 1. Cute Kid View
- **Interactive Piggy Bank**: Tap the piggy to drop animated coins, hear cheerful chimes, and celebrate with confetti!
- **Playful Balance Badges**:
  - 💵 *Pocket Money* (Spendable cash on hand)
  - 🏦 *Big Savings Vault* (Real bank custodial balance)
  - 🌟 *Total Treasure* (Combined net worth)
- **Illustrated Story Timeline**: Visual bubble history of earnings and expenses with cheerful category icons.
- **Wishlist & Savings Goals**: Progress meters for dream toys and games with unlocked badges when ready to buy.
- **Personalized Themes**: Customizable names, avatars, and pastel color themes (Strawberry Pink, Lavender Dream, Mint Green, Peach Sun, Sky Blue).

### 🔒 2. Parent Bookkeeping Mode (PIN Protected)
- **Cash Ledger**:
  - Add deposits (Allowance, Chores, Gifts, Tooth Fairy, Star Work).
  - Add expenses with categories and custom item descriptions (e.g., "Strawberry boba tea with friends 🍦").
  - Search, filter by category/type, and edit/delete entries anytime.
- **Custodial Savings Tracker**:
  - Record balance snapshots with date stamps and statement notes.
  - Automatic growth calculation (% gain and dollar growth).
  - Timeline of all historical bank statement checkpoints.
- **Goals Manager**: Set target costs and custom notes for wishlist items.

### ☁️ 3. Multi-Device Sync (Google Sheets as Backend)
- Connect a private Google Sheet in 2 minutes using Google Apps Script.
- Updates made on your phone or laptop immediately sync to the girls' iPad!
- 100% Free & Zero Server Maintenance.

### 💾 4. Data Safety & Export
- Automatic browser storage persistence.
- One-click JSON backup export & restore.

---

## 🚀 Getting Started

### 1. Run Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Open your browser at `http://localhost:5173`.

### 2. Build for Production
```bash
npm run build
```

---

## 📄 Deploy to GitHub Pages (Free)

1. Push this repository to GitHub.
2. In your GitHub repository:
   - Go to **Settings ➔ Pages**.
   - Under **Build and deployment > Source**, select **GitHub Actions**.
3. Pushing changes to `main` will automatically build and publish your site!

---

## 📊 Google Sheets Sync Setup (Option B)

1. Create a new Google Spreadsheet in your Google Drive.
2. Click **Extensions ➔ Apps Script**.
3. In ZhuzhuMoney, open **Settings ⚙️ ➔ Google Sheets Sync ➔ View Instructions ➔ Copy Script Code**.
4. Paste into the Apps Script editor and click **Save**.
5. Click **Deploy ➔ New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the **Web app URL** and paste it into ZhuzhuMoney Settings!
