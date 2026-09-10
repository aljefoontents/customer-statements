# Al Jefoon Tents – Customer Statements

A modern, mobile-friendly customer statement and transaction management system for **Al Jefoon Tents**.

The application is designed to keep customer balances, transactions, payments, and cheque information organized in one simple system.

---

## 🏢 Business

**Al Jefoon Tents**

Customer Statements & Accounts Management

**Founded:** 2002 – UAE

---

## ✨ Features

### 📊 Dashboard

The dashboard provides a quick overview of:

* Total customers
* Total receivables
* Total payments
* Outstanding balances
* Pending cheques
* Cheques approaching clearance
* Recent transactions

---

### 👥 Customer Management

Create and manage customer accounts with:

* Customer name
* Company name
* Contact person
* Phone number
* Email
* Address
* Opening balance
* Notes

Each customer has their own complete statement.

---

### 📒 Customer Statements

View a complete transaction history for each customer.

Each statement can contain:

* Opening balance
* Credit purchases
* Payments
* Debit adjustments
* Credit adjustments
* Running balance
* Transaction dates
* Transaction references
* Notes

The customer balance is automatically calculated from the transaction history.

---

### 💰 Transactions

Record different types of transactions:

#### Credit Purchase

Used when a customer receives goods or services on credit.

#### Payment

Used when money is received from a customer.

#### Debit Adjustment

Used for additional amounts added to the customer's balance.

#### Credit Adjustment

Used for reducing the customer's balance.

---

## 💳 Payment Methods

Payments can be recorded using:

* Cash
* Cheque
* Bank Transfer
* BOTIM Transfer
* Other

---

## 🧾 Cheque Register

Cheque payments can contain complete cheque information.

### Cheque Details

* Cheque number
* Cheque date
* Expected clearance date
* Bank name
* Account / drawer name
* Payee
* Amount
* Status
* Actual clearing date
* Notes

### Cheque Status

* Issued
* Deposited
* Cleared
* Returned / Bounced
* Cancelled

---

## 🔔 Cheque Clearance Alerts

The system monitors upcoming cheque clearance dates.

Cheques approaching their expected clearance date can be highlighted when they are:

* Due today
* Due within 5 days
* Already overdue

This makes it easier to follow up on pending cheques.

> **Note:** Browser notifications depend on browser permissions and device support. Reliable background notifications on Android can be added later using native Capacitor notifications.

---

## 🖨️ Printing Statements

Statements can be prepared for printing or PDF export.

You can select:

* One customer
* Multiple customers
* All customers

Each customer statement is formatted separately for easy printing and filing.

---

## 🌙 Dark Mode

The application supports:

* Light mode
* Dark mode

The selected theme is saved on the device.

---

## 📱 Mobile Friendly

The interface is designed to work on:

* Desktop
* Laptop
* Tablet
* Mobile phone

The sidebar automatically adapts to smaller screens.

---

## 💾 Local Data Storage

The first version stores application data locally in the browser/device using `localStorage`.

Data includes:

* Customers
* Transactions
* Cheques
* Application settings
* Theme preference

The main storage key is:

```text
alJefoonCustomerStatementsV1
```

Theme preference is stored separately.

---

## 🔐 Data Backup

The application supports local JSON backup and restore.

### Backup

Export the complete application data to a JSON file.

### Restore

Import a previously created JSON backup.

This allows the data to be moved between devices or restored after accidental deletion.

---

## ☁️ Google Sheets Backup

Google Sheets integration is planned as the next synchronization feature.

The planned system will allow application data to be backed up to Google Sheets.

The planned structure will contain separate sheets for:

```text
Customers
Transactions
Cheques
```

A Google Apps Script Web App can be used as the connection between the application and Google Sheets.

---

## 📁 Project Structure

```text
AlJefoonCustomerStatements/
│
├── index.html
├── style.css
├── script.js
├── manifest.json
├── sw.js
└── README.md
```

---

## 🛠️ Main Files

### `index.html`

Contains the application structure and interface.

Includes:

* Sidebar
* Dashboard
* Customer screens
* Statement screens
* Transaction forms
* Cheque register
* Print interface
* Settings
* Modals

---

### `style.css`

Contains the complete visual design.

Main brand colors:

```text
Black: #080808
Gold:  #fcc224
```

The stylesheet also contains:

* Responsive layouts
* Cards
* Buttons
* Tables
* Forms
* Dark mode
* Mobile navigation
* Print styles

---

### `script.js`

Contains the application logic.

Responsible for:

* Customer management
* Transactions
* Balance calculations
* Cheque management
* Clearance alerts
* Printing
* Backup and restore
* Local storage
* Theme settings
* Dashboard calculations

---

### `manifest.json`

Defines the application as a Progressive Web App.

It allows the application to be installed on supported devices.

---

### `sw.js`

Contains the service worker used for:

* Application caching
* Offline support
* PWA functionality

---

## 🧮 Balance Calculation

The customer balance is calculated from the account ledger.

The basic principle is:

```text
Opening Balance
+ Credit Purchases
+ Debit Adjustments
- Payments
- Credit Adjustments
= Current Balance
```

The system keeps the transaction history rather than simply storing a manually edited balance.

This makes statements easier to review and reconcile.

---

## 🧾 Recommended Transaction Workflow

### When a customer buys on credit

Record:

```text
Transaction Type: Credit Purchase
Amount: AED XXXX
```

The customer's outstanding balance increases.

---

### When a customer pays cash

Record:

```text
Transaction Type: Payment
Payment Method: Cash
Amount: AED XXXX
```

The customer's outstanding balance decreases.

---

### When a customer pays by bank transfer

Record:

```text
Transaction Type: Payment
Payment Method: Bank Transfer
Amount: AED XXXX
```

---

### When a customer gives a cheque

Record:

```text
Transaction Type: Payment
Payment Method: Cheque
```

Then enter the complete cheque information.

The cheque remains visible in the Cheque Register until its status is updated.

---

## 🔎 Cheque Follow-Up

A typical workflow is:

```text
Issued
   ↓
Deposited
   ↓
Cleared
```

If the cheque is not honored:

```text
Issued
   ↓
Deposited
   ↓
Returned / Bounced
```

Cancelled cheques can be marked:

```text
Cancelled
```

---

## 🖨️ Statement Filing

Printed statements can be used for:

* Customer account reconciliation
* Payment follow-up
* Outstanding balance review
* Internal accounting records
* Customer confirmation
* Monthly account filing

---

## 🎨 Branding

The application follows the Al Jefoon Tents visual identity.

### Primary Colors

```text
Gold:  #fcc224
Black: #080808
```

The sidebar uses the Al Jefoon Tents branding:

```text
AL JEFOON TENTS
Customer Statements
```

---

## 🔄 Future Improvements

Planned improvements include:

* Google Sheets automatic backup
* Automatic synchronization
* Advanced customer search
* Customer balance aging
* 30 / 60 / 90+ day reports
* Monthly statements
* Payment receipt printing
* Cheque deposit tracking
* Cheque clearance history
* Returned cheque tracking
* Customer statement PDF generation
* WhatsApp sharing
* Excel export
* More detailed reports
* Native Android notifications
* User access/login system

---

## ⚠️ Data Safety

Because the current version uses local browser storage:

**Always maintain regular backups.**

Recommended practice:

```text
Use Application
      ↓
Create Backup
      ↓
Store JSON Backup Safely
      ↓
Continue Using Application
```

Google Sheets synchronization will provide an additional backup option once implemented.

---

## 🚀 Installation

### GitHub Pages

Upload the project files to a GitHub repository:

```text
index.html
style.css
script.js
manifest.json
sw.js
README.md
```

Enable GitHub Pages from the repository settings.

The application can then be accessed from the published GitHub Pages address.

---

## 📌 Current Version

```text
Al Jefoon Customer Statements
Version 1.0
```

Initial version includes:

* Customer accounts
* Opening balances
* Transactions
* Payments
* Cheque register
* Cheque details
* Clearance alerts
* Statements
* Printing
* Dashboard
* Dark mode
* Local backup and restore
* Responsive mobile interface

---

## 📞 Al Jefoon Tents

**Mr. Ali:** 0581045322

**Email:** [aljefoontens@gmail.com](mailto:aljefoontentsshj@gmail.com)

**Website:** [www.aljefoontents.com](http://www.aljefoontents.com)

---

## © Al Jefoon Tents

Customer Statements & Accounts Management System

© 2026 Al Jefoon Tents. All rights reserved.
