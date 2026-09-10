/* =========================================================
   AL JEFOON TENTS
   CUSTOMER STATEMENTS
   APPLICATION ENGINE
========================================================= */

"use strict";


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY =
    "alJefoonCustomerStatementsV1";

const THEME_KEY =
    "alJefoonCustomerStatementsTheme";


/* =========================================================
   APPLICATION STATE
========================================================= */

let appData = loadData();

let currentView = "dashboard";

let selectedCustomerId = null;

let transactionFilter = "all";

let chequeFilter = "all";

let printSelectedCustomers = new Set();

let toastTimer = null;


/* =========================================================
   DEFAULT DATA
========================================================= */

function createEmptyData() {

    return {
        customers: [],
        transactions: [],
        cheques: [],

        settings: {
            companyName: "Al Jefoon Tents",
            currency: "AED",
            notificationDays: 5
        }
    };
}


/* =========================================================
   LOAD DATA
========================================================= */

function loadData() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return createEmptyData();
        }

        const parsed =
            JSON.parse(saved);

        const defaults =
            createEmptyData();

        return {

            customers:
                Array.isArray(parsed.customers)
                    ? parsed.customers
                    : [],

            transactions:
                Array.isArray(parsed.transactions)
                    ? parsed.transactions
                    : [],

            cheques:
                Array.isArray(parsed.cheques)
                    ? parsed.cheques
                    : [],

            settings:
                {
                    ...defaults.settings,
                    ...(parsed.settings || {})
                }
        };

    } catch (error) {

        console.error(
            "Could not load application data:",
            error
        );

        return createEmptyData();
    }
}


/* =========================================================
   SAVE DATA
========================================================= */

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(appData)
    );

    updateAlertBadges();
}


/* =========================================================
   ID GENERATOR
========================================================= */

function makeId(prefix) {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {

        return (
            prefix +
            "_" +
            window.crypto.randomUUID()
        );
    }

    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );
}


/* =========================================================
   DOM ELEMENTS
========================================================= */

const appContent =
    document.getElementById("appContent");

const pageTitle =
    document.getElementById("pageTitle");

const pageSubtitle =
    document.getElementById("pageSubtitle");

const modalOverlay =
    document.getElementById("modalOverlay");

const modal =
    document.getElementById("modal");

const modalTitle =
    document.getElementById("modalTitle");

const modalSubtitle =
    document.getElementById("modalSubtitle");

const modalBody =
    document.getElementById("modalBody");

const modalClose =
    document.getElementById("modalClose");

const toast =
    document.getElementById("toast");

const toastIcon =
    document.getElementById("toastIcon");

const toastMessage =
    document.getElementById("toastMessage");

const sidebar =
    document.getElementById("sidebar");

const mobileOverlay =
    document.getElementById("mobileOverlay");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const themeToggle =
    document.getElementById("themeToggle");

const themeIcon =
    document.getElementById("themeIcon");

const themeText =
    document.getElementById("themeText");

const quickAddButton =
    document.getElementById("quickAddButton");

const notificationButton =
    document.getElementById("notificationButton");

const notificationBadge =
    document.getElementById("notificationBadge");

const chequeAlertBadge =
    document.getElementById("chequeAlertBadge");


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);


function initializeApp() {

    loadTheme();

    setupNavigation();

    setupGlobalButtons();

    updateAlertBadges();

    renderView("dashboard");

    checkChequeNotifications();
}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const view =
                        button.dataset.view;

                    if (!view) return;

                    renderView(view);

                    closeMobileMenu();
                }
            );
        });
}


/* =========================================================
   GLOBAL BUTTONS
========================================================= */

function setupGlobalButtons() {

    modalClose.addEventListener(
        "click",
        closeModal
    );

    modalOverlay.addEventListener(
        "click",
        event => {

            if (
                event.target === modalOverlay
            ) {

                closeModal();
            }
        }
    );


    quickAddButton.addEventListener(
        "click",
        () => openTransactionModal()
    );


    notificationButton.addEventListener(
        "click",
        () => renderView("cheques")
    );


    themeToggle.addEventListener(
        "click",
        toggleTheme
    );


    mobileMenuButton.addEventListener(
        "click",
        openMobileMenu
    );


    mobileOverlay.addEventListener(
        "click",
        closeMobileMenu
    );


    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeModal();

                closeMobileMenu();
            }
        }
    );
}


/* =========================================================
   RENDER VIEW
========================================================= */

function renderView(view) {

    currentView = view;

    updateNavigation(view);

    const config =
        getViewConfig(view);

    pageTitle.textContent =
        config.title;

    pageSubtitle.textContent =
        config.subtitle;


    switch (view) {

        case "dashboard":
            renderDashboard();
            break;

        case "customers":
            renderCustomers();
            break;

        case "statements":
            renderStatements();
            break;

        case "transactions":
            renderTransactions();
            break;

        case "cheques":
            renderCheques();
            break;

        case "print":
            renderPrintStatements();
            break;

        case "reports":
            renderReports();
            break;

        case "backup":
            renderBackup();
            break;

        case "settings":
            renderSettings();
            break;

        case "customer":
            renderCustomerStatement(
                selectedCustomerId
            );
            break;

        default:
            renderDashboard();
    }
}


/* =========================================================
   VIEW CONFIGURATION
========================================================= */

function getViewConfig(view) {

    const configs = {

        dashboard: {
            title: "Dashboard",
            subtitle: "Customer accounts overview"
        },

        customers: {
            title: "Customers",
            subtitle: "Manage your customer accounts"
        },

        statements: {
            title: "Statements",
            subtitle: "View customer account statements"
        },

        transactions: {
            title: "Transactions",
            subtitle: "All customer account transactions"
        },

        cheques: {
            title: "Cheque Register",
            subtitle: "Track issued and received cheques"
        },

        print: {
            title: "Print Statements",
            subtitle: "Select customer statements to print"
        },

        reports: {
            title: "Reports",
            subtitle: "Customer account summaries"
        },

        backup: {
            title: "Backup & Sync",
            subtitle: "Protect and export your account data"
        },

        settings: {
            title: "Settings",
            subtitle: "Application preferences"
        },

        customer: {
            title: "Customer Statement",
            subtitle: "Account transaction history"
        }
    };

    return (
        configs[view] ||
        configs.dashboard
    );
}


/* =========================================================
   UPDATE NAVIGATION
========================================================= */

function updateNavigation(view) {

    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.view === view
            );
        });
}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

    const customers =
        appData.customers;

    const transactions =
        appData.transactions;

    const balances =
        customers.map(
            customer =>
                getCustomerBalance(customer.id)
        );

    const totalReceivable =
        balances
            .filter(value => value > 0)
            .reduce(
                (sum, value) => sum + value,
                0
            );

    const totalCredit =
        balances
            .filter(value => value < 0)
            .reduce(
                (sum, value) => sum + Math.abs(value),
                0
            );

    const outstandingCheques =
        appData.cheques.filter(
            cheque =>
                ![
                    "Cleared",
                    "Returned/Bounced",
                    "Cancelled"
                ].includes(cheque.status)
        );

    const alerts =
        getChequeAlerts();


    const recentTransactions =
        [...transactions]
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            )
            .slice(0, 8);


    appContent.innerHTML = `

        <div class="page-header">

            <div>
                <h1>Dashboard</h1>

                <p>
                    Overview of your customer accounts
                    and outstanding cheques.
                </p>
            </div>

            <div class="page-header-actions">

                <button
                    class="primary-button"
                    id="dashboardAddCustomer"
                >
                    + Add Customer
                </button>

                <button
                    class="secondary-button"
                    id="dashboardAddTransaction"
                >
                    + Transaction
                </button>

            </div>

        </div>


        <div class="stats-grid">

            ${statCard(
                "Customers",
                customers.length,
                "♙",
                "Active customer accounts"
            )}

            ${statCard(
                "Receivable",
                formatMoney(totalReceivable),
                "◉",
                "Customers owing Al Jefoon"
            )}

            ${statCard(
                "Customer Credits",
                formatMoney(totalCredit),
                "↙",
                "Credit balances"
            )}

            ${statCard(
                "Outstanding Cheques",
                formatMoney(
                    outstandingCheques.reduce(
                        (sum, cheque) =>
                            sum +
                            Number(cheque.amount || 0),
                        0
                    )
                ),
                "▭",
                `${outstandingCheques.length} cheque(s)`
            )}

        </div>


        ${
            alerts.length
                ? `
                    <div class="card card-padding">

                        <div class="card-header"
                             style="margin:-21px -21px 18px;">

                            <div>
                                <div class="card-title">
                                    Cheque Alerts
                                </div>

                                <div class="card-subtitle">
                                    Cheques requiring attention
                                </div>
                            </div>

                            <button
                                class="secondary-button"
                                id="viewChequeAlerts"
                            >
                                View All
                            </button>

                        </div>

                        ${alerts
                            .slice(0, 5)
                            .map(
                                alert =>
                                    alertHTML(alert)
                            )
                            .join("")
                        }

                    </div>
                `
                : ""
        }


        <div class="dashboard-grid"
             style="margin-top:20px;">

            <div class="card">

                <div class="card-header">

                    <div>
                        <div class="card-title">
                            Recent Transactions
                        </div>

                        <div class="card-subtitle">
                            Latest customer account activity
                        </div>
                    </div>

                    <button
                        class="secondary-button"
                        id="viewAllTransactions"
                    >
                        View All
                    </button>

                </div>

                ${
                    recentTransactions.length
                        ? transactionTableHTML(
                            recentTransactions
                        )
                        : emptyStateHTML(
                            "No Transactions",
                            "Add your first customer transaction."
                        )
                }

            </div>


            <div class="card">

                <div class="card-header">

                    <div>
                        <div class="card-title">
                            Customer Balances
                        </div>

                        <div class="card-subtitle">
                            Accounts with outstanding balances
                        </div>
                    </div>

                </div>

                ${
                    customers.length
                        ? customerBalanceListHTML(
                            customers
                                .map(customer => ({
                                    customer,
                                    balance:
                                        getCustomerBalance(
                                            customer.id
                                        )
                                }))
                                .filter(
                                    item =>
                                        item.balance !== 0
                                )
                                .sort(
                                    (a, b) =>
                                        Math.abs(
                                            b.balance
                                        ) -
                                        Math.abs(
                                            a.balance
                                        )
                                )
                                .slice(0, 8)
                        )
                        : emptyStateHTML(
                            "No Customers",
                            "Add customers to start tracking statements."
                        )
                }

            </div>

        </div>
    `;


    document
        .getElementById("dashboardAddCustomer")
        ?.addEventListener(
            "click",
            () => openCustomerModal()
        );

    document
        .getElementById("dashboardAddTransaction")
        ?.addEventListener(
            "click",
            () => openTransactionModal()
        );

    document
        .getElementById("viewAllTransactions")
        ?.addEventListener(
            "click",
            () => renderView("transactions")
        );

    document
        .getElementById("viewChequeAlerts")
        ?.addEventListener(
            "click",
            () => renderView("cheques")
        );
}


/* =========================================================
   STAT CARD
========================================================= */

function statCard(
    label,
    value,
    icon,
    small
) {

    return `

        <div class="card stat-card">

            <div class="stat-top">

                <div class="stat-label">
                    ${escapeHTML(label)}
                </div>

                <div class="stat-icon">
                    ${icon}
                </div>

            </div>

            <div class="stat-value">
                ${escapeHTML(String(value))}
            </div>

            <div class="stat-small">
                ${escapeHTML(small)}
            </div>

        </div>
    `;
}


/* =========================================================
   CUSTOMER BALANCE
========================================================= */

function getCustomerBalance(customerId) {

    const customer = getCustomer(customerId);

    if (!customer) {
        return 0;
    }

    let balance = Number(customer.openingBalance || 0);

    appData.transactions
        .filter(transaction =>
            transaction.customerId === customerId
        )
        .forEach(transaction => {

            const amount = Number(transaction.amount || 0);

            switch (transaction.type) {

                case "sale":
                    // Customer owes Al Jefoon
                    balance += amount;
                    break;

                case "payment_received":
                    // Customer paid Al Jefoon
                    balance -= amount;
                    break;

                case "purchase":
                    // Al Jefoon owes supplier
                    balance -= amount;
                    break;

                case "payment_made":
                    // Al Jefoon paid supplier
                    balance += amount;
                    break;

                case "debit":
                    balance += amount;
                    break;

                case "credit":
                    balance -= amount;
                    break;
            }
        });

    return balance;
}
/* =========================================================
   CUSTOMER BALANCE LIST
========================================================= */

function customerBalanceListHTML(items) {

    if (!items.length) {

        return emptyStateHTML(
            "All Clear",
            "There are currently no outstanding customer balances."
        );
    }

    return `

        <div style="padding:5px 0;">

            ${items.map(
                item => {

                    const balance =
                        item.balance;

                    return `

                        <button
                            class="customer-balance-row"
                            data-customer-id="${item.customer.id}"
                            style="
                                width:100%;
                                border:0;
                                border-bottom:1px solid var(--border);
                                background:transparent;
                                color:var(--text);
                                padding:13px 18px;
                                display:flex;
                                align-items:center;
                                justify-content:space-between;
                                gap:10px;
                                text-align:left;
                            "
                        >

                            <span>

                                <strong>
                                    ${escapeHTML(
                                        item.customer.name
                                    )}
                                </strong>

                                <small
                                    style="
                                        display:block;
                                        margin-top:3px;
                                        color:var(--muted);
                                    "
                                >
                                    ${escapeHTML(
                                        item.customer.phone ||
                                        "No phone"
                                    )}
                                </small>

                            </span>

                            <span
                                class="amount ${
                                    balance > 0
                                        ? "positive"
                                        : balance < 0
                                            ? "negative"
                                            : "neutral"
                                }"
                            >
                                ${formatMoney(
                                    Math.abs(balance)
                                )}
                            </span>

                        </button>
                    `;
                }
            ).join("")}

        </div>
    `;

}


/* =========================================================
   CUSTOMER BALANCE CLICK
========================================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".customer-balance-row"
            );

        if (!button) return;

        const customerId =
            button.dataset.customerId;

        openCustomerStatement(
            customerId
        );
    }
);


/* =========================================================
   CUSTOMERS
========================================================= */

function renderCustomers() {

    const customers =
        appData.customers;

    appContent.innerHTML = `

        <div class="page-header">

            <div>
                <h1>Customers</h1>

                <p>
                    Manage customer accounts,
                    opening balances and contact details.
                </p>
            </div>

            <div class="page-header-actions">

                <button
                    class="primary-button"
                    id="addCustomerButton"
                >
                    + Add Customer
                </button>

            </div>

        </div>


        <div class="card filter-bar">

            <div class="search-box">

                <span class="search-icon">
                    ⌕
                </span>

                <input
                    id="customerSearch"
                    type="search"
                    placeholder="Search customers..."
                >

            </div>

        </div>


        <div
            id="customerGrid"
            class="customer-grid"
        >

            ${
                customers.length
                    ? customersHTML(customers)
                    : emptyStateHTML(
                        "No Customers Yet",
                        "Add your first customer to begin keeping account statements."
                    )
            }

        </div>
    `;


    document
        .getElementById("addCustomerButton")
        ?.addEventListener(
            "click",
            () => openCustomerModal()
        );


    document
        .getElementById("customerSearch")
        ?.addEventListener(
            "input",
            filterCustomers
        );


    setupCustomerCardButtons();
}


/* =========================================================
   CUSTOMER CARDS
========================================================= */

function customersHTML(customers) {

    return customers
        .map(customer => {

            const balance =
                getCustomerBalance(
                    customer.id
                );

            const initials =
                getInitials(customer.name);

            return `

                <div class="card customer-card">

                    <div class="customer-card-top">

                        <div class="customer-avatar">
                            ${escapeHTML(initials)}
                        </div>

                        ${
                            balance > 0
                                ? `
                                    <span class="badge badge-danger">
                                        Outstanding
                                    </span>
                                `
                                : balance < 0
                                    ? `
                                        <span class="badge badge-success">
                                            Credit
                                        </span>
                                    `
                                    : `
                                        <span class="badge badge-neutral">
                                            Settled
                                        </span>
                                    `
                        }

                    </div>


                    <div class="customer-name">
                        ${escapeHTML(customer.name)}
                    </div>


                    <div class="customer-detail">
                        ${
                            customer.phone
                                ? "☎ " +
                                  escapeHTML(customer.phone)
                                : "No phone number"
                        }
                    </div>


                    <div class="customer-detail">
                        ${
                            customer.email
                                ? "✉ " +
                                  escapeHTML(customer.email)
                                : "No email"
                        }
                    </div>


                    <div class="customer-balance">

                        <div>

                            <div class="balance-label">
                                Current Balance
                            </div>

                            <div
                                class="balance-value ${
                                    balance > 0
                                        ? "amount positive"
                                        : balance < 0
                                            ? "amount negative"
                                            : ""
                                }"
                            >
                                ${formatMoney(
                                    Math.abs(balance)
                                )}
                            </div>

                        </div>

                    </div>


                    <div class="customer-actions">

                        <button
                            class="secondary-button"
                            data-action="statement"
                            data-id="${customer.id}"
                        >
                            Statement
                        </button>

                        <button
                            class="primary-button"
                            data-action="transaction"
                            data-id="${customer.id}"
                        >
                            + Entry
                        </button>

                    </div>

                </div>
            `;
        })
        .join("");
}


/* =========================================================
   CUSTOMER CARD BUTTONS
========================================================= */

function setupCustomerCardButtons() {

    document
        .querySelectorAll(
            '[data-action="statement"]'
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    openCustomerStatement(
                        button.dataset.id
                    )
            );
        });


    document
        .querySelectorAll(
            '[data-action="transaction"]'
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    openTransactionModal(
                        button.dataset.id
                    )
            );
        });
}


/* =========================================================
   FILTER CUSTOMERS
========================================================= */

function filterCustomers(event) {

    const query =
        event.target.value
            .trim()
            .toLowerCase();

    const filtered =
        appData.customers.filter(
            customer =>
                customer.name
                    .toLowerCase()
                    .includes(query) ||

                (customer.phone || "")
                    .toLowerCase()
                    .includes(query) ||

                (customer.email || "")
                    .toLowerCase()
                    .includes(query)
        );


    const grid =
        document.getElementById(
            "customerGrid"
        );

    if (!grid) return;

    grid.innerHTML =
        filtered.length
            ? customersHTML(filtered)
            : emptyStateHTML(
                "No Matches",
                "No customers match your search."
            );

    setupCustomerCardButtons();
}


/* =========================================================
   ADD CUSTOMER MODAL
========================================================= */

function openCustomerModal() {

    openModal(
        "Add Customer",
        "Create a new customer account",
        `

        <form id="customerForm">

            <div class="form-grid">

                <div class="form-group full">

                    <label class="form-label">
                        Customer Name
                        <span class="required">*</span>
                    </label>

                    <input
                        class="form-control"
                        id="customerName"
                        required
                        placeholder="Enter customer / company name"
                    >

                </div>


                <div class="form-group">

                    <label class="form-label">
                        Phone
                    </label>

                    <input
                        class="form-control"
                        id="customerPhone"
                        type="tel"
                        placeholder="Phone number"
                    >

                </div>


                <div class="form-group">

                    <label class="form-label">
                        Email
                    </label>

                    <input
                        class="form-control"
                        id="customerEmail"
                        type="email"
                        placeholder="Email address"
                    >

                </div>


                <div class="form-group full">

                    <label class="form-label">
                        Opening Balance
                    </label>

                    <input
                        class="form-control"
                        id="customerOpeningBalance"
                        type="number"
                        min="0"
                        step="0.01"
                        value="0"
                    >

                    <div class="form-help">
                        Enter the amount outstanding at the beginning
                        of your records.
                    </div>

                </div>


                <div class="form-group full">

                    <label class="form-label">
                        Address
                    </label>

                    <textarea
                        class="form-control"
                        id="customerAddress"
                        placeholder="Customer address"
                    ></textarea>

                </div>


                <div class="form-group full">

                    <label class="form-label">
                        Notes
                    </label>

                    <textarea
                        class="form-control"
                        id="customerNotes"
                        placeholder="Optional notes"
                    ></textarea>

                </div>

            </div>


            <div class="modal-footer">

                <button
                    type="button"
                    class="secondary-button"
                    id="cancelCustomer"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="primary-button"
                >
                    Save Customer
                </button>

            </div>

        </form>
        `
    );


    document
        .getElementById("customerForm")
        .addEventListener(
            "submit",
            saveCustomer
        );


    document
        .getElementById("cancelCustomer")
        .addEventListener(
            "click",
            closeModal
        );
}


/* =========================================================
   SAVE CUSTOMER
========================================================= */

function saveCustomer(event) {

    event.preventDefault();

    const name =
        document
            .getElementById("customerName")
            .value
            .trim();

    if (!name) {

        showToast(
            "Please enter the customer name.",
            "!"
        );

        return;
    }


    const customer = {

        id:
            makeId("customer"),

        name,

        phone:
            document
                .getElementById("customerPhone")
                .value
                .trim(),

        email:
            document
                .getElementById("customerEmail")
                .value
                .trim(),

        address:
            document
                .getElementById("customerAddress")
                .value
                .trim(),

        notes:
            document
                .getElementById("customerNotes")
                .value
                .trim(),

        openingBalance:
            Number(
                document
                    .getElementById(
                        "customerOpeningBalance"
                    )
                    .value || 0
            ),

        createdAt:
            new Date().toISOString()
    };


    appData.customers.push(customer);

    saveData();

    closeModal();

    showToast(
        "Customer added successfully."
    );

    renderView("customers");
}


/* =========================================================
   TRANSACTION MODAL
========================================================= */

function openTransactionModal(
    preselectedCustomerId = null
) {

    const defaultCustomer =
        preselectedCustomerId ||
        selectedCustomerId ||
        "";


    openModal(
        "Add Transaction",
        "Record a customer account entry",
        transactionFormHTML(
            defaultCustomer
        )
    );


    setupTransactionForm();
}


/* =========================================================
   TRANSACTION FORM
========================================================= */

function transactionFormHTML(
    customerId
) {

    return `

        <form id="transactionForm">

            <div class="form-group">

                <label class="form-label">
                    Customer
                    <span class="required">*</span>
                </label>

                <select
                    class="form-control"
                    id="transactionCustomer"
                    required
                >

                    <option value="">
                        Select customer
                    </option>

                    ${appData.customers
                        .map(
                            customer =>
                                `
                                <option
                                    value="${customer.id}"
                                    ${
                                        customer.id ===
                                        customerId
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${escapeHTML(
                                        customer.name
                                    )}
                                </option>
                                `
                        )
                        .join("")
                    }

                </select>

            </div>


            <div class="form-section">

                <div class="form-section-title">
                    Transaction Type
                </div>


                <div class="transaction-types">

    ${transactionTypeButton(
        "sale",
        "↑",
        "Credit Sale",
        "Customer owes Al Jefoon"
    )}

    ${transactionTypeButton(
        "payment_received",
        "↓",
        "Payment Received",
        "Payment received from customer"
    )}

    ${transactionTypeButton(
        "purchase",
        "▤",
        "Credit Purchase",
        "Al Jefoon owes supplier"
    )}

    ${transactionTypeButton(
        "payment_made",
        "↓",
        "Payment Made",
        "Payment made to supplier"
    )}

</div>

                <input
    type="hidden"
    id="transactionType"
    value="sale"
>
            </div>


            <div class="form-grid"
                 style="margin-top:18px;">

                <div class="form-group">

                    <label class="form-label">
                        Date
                        <span class="required">*</span>
                    </label>

                    <input
                        class="form-control"
                        id="transactionDate"
                        type="date"
                        value="${todayISO()}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label class="form-label">
                        Amount (AED)
                        <span class="required">*</span>
                    </label>

                    <input
                        class="form-control"
                        id="transactionAmount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        placeholder="0.00"
                    >

                </div>


                <div class="form-group full">

                    <label class="form-label">
                        Description
                        <span class="required">*</span>
                    </label>

                    <input
                        class="form-control"
                        id="transactionDescription"
                        required
                        placeholder="e.g. Tent rental, invoice payment, advance..."
                    >

                </div>

            </div>


            <div id="paymentDetails">

                <div class="form-section">

                    <div class="form-section-title">
                        Payment Details
                    </div>


                    <div class="form-group">

                        <label class="form-label">
                            Payment Method
                        </label>

                        <select
                            class="form-control"
                            id="paymentMethod"
                        >

                            <option value="Cash">
                                Cash
                            </option>

                            <option value="Cheque">
                                Cheque
                            </option>

                            <option value="Bank Transfer">
                                Bank Transfer
                            </option>

                            <option value="BOTIM Transfer">
                                BOTIM Transfer
                            </option>

                            <option value="Other">
                                Other
                            </option>

                        </select>

                    </div>


                    <div
                        id="chequeDetails"
                        class="cheque-panel hidden"
                    >

                        <div class="cheque-panel-title">
                            ▭ Cheque Details
                        </div>


                        <div class="form-grid">

                            <div class="form-group">

                                <label class="form-label">
                                    Cheque Number
                                    <span class="required">*</span>
                                </label>

                                <input
                                    class="form-control"
                                    id="chequeNumber"
                                    placeholder="Cheque number"
                                >

                            </div>


                            <div class="form-group">

                                <label class="form-label">
                                    Bank Name
                                </label>

                                <input
                                    class="form-control"
                                    id="chequeBank"
                                    placeholder="Bank name"
                                >

                            </div>


                            <div class="form-group">

                                <label class="form-label">
                                    Cheque Date
                                </label>

                                <input
                                    class="form-control"
                                    id="chequeDate"
                                    type="date"
                                    value="${todayISO()}"
                                >

                            </div>


                            <div class="form-group">

                                <label class="form-label">
                                    Expected Clearance
                                </label>

                                <input
                                    class="form-control"
                                    id="chequeClearanceDate"
                                    type="date"
                                >

                                <div class="form-help">
                                    The app will alert you 5 days before this date.
                                </div>

                            </div>


                            <div class="form-group">

                                <label class="form-label">
                                    Drawer / Account Name
                                </label>

                                <input
                                    class="form-control"
                                    id="chequeDrawer"
                                    placeholder="Name on cheque"
                                >

                            </div>


                            <div class="form-group">

                                <label class="form-label">
                                    Cheque Status
                                </label>

                                <select
                                    class="form-control"
                                    id="chequeStatus"
                                >

                                    <option value="Issued">
                                        Issued
                                    </option>

                                    <option value="Deposited">
                                        Deposited
                                    </option>

                                    <option value="Cleared">
                                        Cleared
                                    </option>

                                    <option value="Returned/Bounced">
                                        Returned / Bounced
                                    </option>

                                    <option value="Cancelled">
                                        Cancelled
                                    </option>

                                </select>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            <div class="form-group"
                 style="margin-top:18px;">

                <label class="form-label">
                    Reference / Notes
                </label>

                <textarea
                    class="form-control"
                    id="transactionNotes"
                    placeholder="Invoice number, receipt number, additional notes..."
                ></textarea>

            </div>


            <div class="modal-footer">

                <button
                    type="button"
                    class="secondary-button"
                    id="cancelTransaction"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="primary-button"
                >
                    Save Transaction
                </button>

            </div>

        </form>
    `;
}


/* =========================================================
   TRANSACTION TYPE BUTTON
========================================================= */

function transactionTypeButton(
    type,
    icon,
    title,
    description
) {

    return `

        <button
            type="button"
            class="transaction-type ${
                type === "sale"
                    ? "selected"
                    : ""
            }"
            data-transaction-type="${type}"
        >

            <div class="transaction-type-icon">
                ${icon}
            </div>

            <div class="transaction-type-title">
                ${escapeHTML(title)}
            </div>

            <div class="transaction-type-description">
                ${escapeHTML(description)}
            </div>

        </button>
    `;
}

/* =========================================================
   SETUP TRANSACTION FORM
========================================================= */

function setupTransactionForm() {

    document
        .querySelectorAll(
            "[data-transaction-type]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            "[data-transaction-type]"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "selected"
                                )
                        );

                    button.classList.add(
                        "selected"
                    );

                    document
                        .getElementById(
                            "transactionType"
                        )
                        .value =
                        button.dataset
                            .transactionType;

                    updatePaymentVisibility();
                }
            );
        });


    document
        .getElementById("paymentMethod")
        ?.addEventListener(
            "change",
            updateChequeVisibility
        );


    document
        .getElementById("transactionForm")
        ?.addEventListener(
            "submit",
            saveTransaction
        );


    document
        .getElementById("cancelTransaction")
        ?.addEventListener(
            "click",
            closeModal
        );


    updatePaymentVisibility();
}


/* =========================================================
   PAYMENT VISIBILITY
========================================================= */

function updatePaymentVisibility() {

    const type =
        document.getElementById(
            "transactionType"
        )?.value;

    const paymentDetails =
        document.getElementById(
            "paymentDetails"
        );

    if (!paymentDetails) return;

    paymentDetails.classList.toggle(
        "hidden",
        type !== "payment"
    );


    if (type !== "payment") {

        const chequeDetails =
            document.getElementById(
                "chequeDetails"
            );

        chequeDetails?.classList.add(
            "hidden"
        );
    }
}


/* =========================================================
   CHEQUE VISIBILITY
========================================================= */

function updateChequeVisibility() {

    const method =
        document.getElementById(
            "paymentMethod"
        )?.value;

    const panel =
        document.getElementById(
            "chequeDetails"
        );

    if (!panel) return;

    panel.classList.toggle(
        "hidden",
        method !== "Cheque"
    );
}


/* =========================================================
   SAVE TRANSACTION
========================================================= */

function saveTransaction(event) {

    event.preventDefault();

    const customerId =
        document.getElementById(
            "transactionCustomer"
        ).value;

    const type =
        document.getElementById(
            "transactionType"
        ).value;

    const amount =
        Number(
            document.getElementById(
                "transactionAmount"
            ).value
        );

    const date =
        document.getElementById(
            "transactionDate"
        ).value;

    const description =
        document.getElementById(
            "transactionDescription"
        ).value
        .trim();


    if (!customerId) {

        showToast(
            "Please select a customer.",
            "!"
        );

        return;
    }


    if (
        !amount ||
        amount <= 0
    ) {

        showToast(
            "Please enter a valid amount.",
            "!"
        );

        return;
    }


    if (!date) {

        showToast(
            "Please select a date.",
            "!"
        );

        return;
    }


    if (!description) {

        showToast(
            "Please enter a description.",
            "!"
        );

        return;
    }


    const transaction = {

        id:
            makeId("transaction"),

        customerId,

        type,

        amount,

        date,

        description,

        paymentMethod:
            type === "payment"
                ? document.getElementById(
                    "paymentMethod"
                ).value
                : "",

        notes:
            document.getElementById(
                "transactionNotes"
            ).value
            .trim(),

        createdAt:
            new Date().toISOString()
    };


    appData.transactions.push(
        transaction
    );


    /* -----------------------------------------------------
       CHEQUE
    ----------------------------------------------------- */

    if (
        type === "payment" &&
        transaction.paymentMethod ===
            "Cheque"
    ) {

        const chequeNumber =
            document.getElementById(
                "chequeNumber"
            ).value
            .trim();


        if (!chequeNumber) {

            showToast(
                "Please enter the cheque number.",
                "!"
            );

            appData.transactions.pop();

            return;
        }


        const cheque = {

            id:
                makeId("cheque"),

            transactionId:
                transaction.id,

            customerId,

            amount,

            chequeNumber,

            bank:
                document.getElementById(
                    "chequeBank"
                ).value
                .trim(),

            chequeDate:
                document.getElementById(
                    "chequeDate"
                ).value,

            clearanceDate:
                document.getElementById(
                    "chequeClearanceDate"
                ).value,

            drawer:
                document.getElementById(
                    "chequeDrawer"
                ).value
                .trim(),

            status:
                document.getElementById(
                    "chequeStatus"
                ).value,

            createdAt:
                new Date().toISOString()
        };


        appData.cheques.push(
            cheque
        );
    }


    saveData();

    closeModal();

    showToast(
        "Transaction saved successfully."
    );


    if (
        currentView === "customer" &&
        selectedCustomerId === customerId
    ) {

        renderCustomerStatement(
            customerId
        );

    } else {

        renderView(
            currentView
        );
    }
}


/* =========================================================
   STATEMENTS
========================================================= */

function renderStatements() {

    const customers =
        appData.customers;


    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h1>Customer Statements</h1>

                <p>
                    Select a customer to view the complete account statement.
                </p>

            </div>

            <div class="page-header-actions">

                <button
                    class="primary-button"
                    id="statementPrintButton"
                >
                    ⎙ Print Statements
                </button>

            </div>

        </div>


        <div class="card filter-bar">

            <div class="search-box">

                <span class="search-icon">
                    ⌕
                </span>

                <input
                    id="statementSearch"
                    type="search"
                    placeholder="Search customer statements..."
                >

            </div>

        </div>


        <div
            id="statementCustomerGrid"
            class="customer-grid"
        >

            ${
                customers.length
                    ? customersHTML(customers)
                    : emptyStateHTML(
                        "No Customers",
                        "Add customers before creating statements."
                    )
            }

        </div>
    `;


    document
        .getElementById(
            "statementPrintButton"
        )
        ?.addEventListener(
            "click",
            () => renderView("print")
        );


    document
        .getElementById(
            "statementSearch"
        )
        ?.addEventListener(
            "input",
            event => {

                const query =
                    event.target.value
                        .toLowerCase()
                        .trim();

                const filtered =
                    customers.filter(
                        customer =>
                            customer.name
                                .toLowerCase()
                                .includes(query)
                    );

                const grid =
                    document.getElementById(
                        "statementCustomerGrid"
                    );

                grid.innerHTML =
                    filtered.length
                        ? customersHTML(filtered)
                        : emptyStateHTML(
                            "No Matches",
                            "No customer statements match your search."
                        );

                setupCustomerCardButtons();
            }
        );

    setupCustomerCardButtons();
}


/* =========================================================
   OPEN CUSTOMER STATEMENT
========================================================= */

function openCustomerStatement(
    customerId
) {

    selectedCustomerId =
        customerId;

    renderView("customer");
}


/* =========================================================
   CUSTOMER STATEMENT
========================================================= */

function renderCustomerStatement(
    customerId
) {

    const customer =
        getCustomer(customerId);


    if (!customer) {

        renderView("customers");

        return;
    }


    const transactions =
        getCustomerTransactions(
            customerId
        );


    const balance =
        getCustomerBalance(
            customerId
        );


    const purchases =
        transactions
            .filter(
                t =>
                    t.type === "purchase" ||
                    t.type === "debit"
            )
            .reduce(
                (sum, t) =>
                    sum + Number(t.amount || 0),
                0
            );


    const payments =
        transactions
            .filter(
                t =>
                    t.type === "payment" ||
                    t.type === "credit"
            )
            .reduce(
                (sum, t) =>
                    sum + Number(t.amount || 0),
                0
            );


    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <button
                    class="back-button"
                    id="statementBackButton"
                >
                    ← Back
                </button>

            </div>

            <div class="page-header-actions">

                <button
                    class="secondary-button"
                    id="statementAddEntry"
                >
                    + Add Entry
                </button>

                <button
                    class="primary-button"
                    id="statementPrintSingle"
                >
                    ⎙ Print
                </button>

            </div>

        </div>


        <div class="card">

            <div class="statement-header">

                <div>

                    <div class="statement-company">
                        Al Jefoon Tents
                    </div>

                    <div class="statement-title">
                        Customer Account Statement
                    </div>

                </div>


                <div class="statement-customer">

                    <div class="statement-customer-name">
                        ${escapeHTML(customer.name)}
                    </div>

                    <div class="statement-customer-info">

                        ${
                            customer.phone
                                ? escapeHTML(
                                    customer.phone
                                )
                                : ""
                        }

                        ${
                            customer.email
                                ? "<br>" +
                                  escapeHTML(
                                      customer.email
                                  )
                                : ""
                        }

                    </div>

                </div>

            </div>


            <div class="balance-grid">

                <div class="balance-box">

                    <div class="balance-box-label">
                        Opening Balance
                    </div>

                    <div class="balance-box-value">
                        ${formatMoney(
                            customer.openingBalance || 0
                        )}
                    </div>

                </div>


                <div class="balance-box">

                    <div class="balance-box-label">
                        Total Activity
                    </div>

                    <div class="balance-box-value">
                        ${formatMoney(
                            purchases + payments
                        )}
                    </div>

                </div>


                <div class="balance-box">

                    <div class="balance-box-label">
                        Current Balance
                    </div>

                    <div
                        class="balance-box-value ${
                            balance > 0
                                ? "amount positive"
                                : balance < 0
                                    ? "amount negative"
                                    : ""
                        }"
                    >
                        ${formatMoney(
                            Math.abs(balance)
                        )}
                    </div>

                </div>

            </div>


            <div class="table-wrap">

                ${
                    transactions.length
                        ? statementTableHTML(
                            customer,
                            transactions
                        )
                        : emptyStateHTML(
                            "No Transactions",
                            "There is no transaction activity for this customer yet."
                        )
                }

            </div>

        </div>
    `;


    document
        .getElementById(
            "statementBackButton"
        )
        ?.addEventListener(
            "click",
            () => renderView("statements")
        );


    document
        .getElementById(
            "statementAddEntry"
        )
        ?.addEventListener(
            "click",
            () =>
                openTransactionModal(
                    customerId
                )
        );


    document
        .getElementById(
            "statementPrintSingle"
        )
        ?.addEventListener(
            "click",
            () =>
                printStatements(
                    [customerId]
                )
        );
}


/* =========================================================
   STATEMENT TABLE
========================================================= */

function statementTableHTML(
    customer,
    transactions
) {

    let runningBalance =
        Number(
            customer.openingBalance || 0
        );


    let rows = `

        <table class="data-table">

            <thead>

                <tr>

                    <th>Date</th>
                    <th>Description</th>
                    <th>Method</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Balance</th>

                </tr>

            </thead>

            <tbody>
    `;


    rows += `

        <tr>

            <td>
                ${formatDate(customer.createdAt)}
            </td>

            <td>
                <strong>Opening Balance</strong>
            </td>

            <td>
                <span class="badge badge-neutral">
                    Opening
                </span>
            </td>

            <td>
                ${
                    runningBalance > 0
                        ? formatMoney(
                            runningBalance
                        )
                        : "—"
                }
            </td>

            <td>
                ${
                    runningBalance < 0
                        ? formatMoney(
                            Math.abs(
                                runningBalance
                            )
                        )
                        : "—"
                }
            </td>

            <td>
                <strong>
                    ${formatMoney(
                        Math.abs(
                            runningBalance
                        )
                    )}
                </strong>
            </td>

        </tr>
    `;


    const sorted =
        [...transactions]
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );


    sorted.forEach(
        transaction => {

            const amount =
                Number(
                    transaction.amount || 0
                );


            const isDebit =
                transaction.type ===
                    "purchase" ||
                transaction.type ===
                    "debit";


            if (isDebit) {

                runningBalance += amount;

            } else {

                runningBalance -= amount;
            }


            rows += `

                <tr>

                    <td>
                        ${formatDate(
                            transaction.date
                        )}
                    </td>

                    <td>

                        <strong>
                            ${escapeHTML(
                                transaction.description
                            )}
                        </strong>

                        ${
                            transaction.notes
                                ? `
                                    <div
                                        style="
                                            margin-top:4px;
                                            color:var(--muted);
                                            font-size:10px;
                                        "
                                    >
                                        ${escapeHTML(
                                            transaction.notes
                                        )}
                                    </div>
                                `
                                : ""
                        }

                    </td>

                    <td>
                        ${
                            transaction.paymentMethod
                                ? `
                                    <span class="badge badge-neutral">
                                        ${escapeHTML(
                                            transaction.paymentMethod
                                        )}
                                    </span>
                                `
                                : `
                                    <span class="badge badge-gold">
                                        ${
                                            isDebit
                                                ? "Purchase"
                                                : "Adjustment"
                                        }
                                    </span>
                                `
                        }
                    </td>

                    <td>

                        ${
                            isDebit
                                ? `
                                    <span class="amount positive">
                                        ${formatMoney(amount)}
                                    </span>
                                `
                                : "—"
                        }

                    </td>

                    <td>

                        ${
                            !isDebit
                                ? `
                                    <span class="amount negative">
                                        ${formatMoney(amount)}
                                    </span>
                                `
                                : "—"
                        }

                    </td>

                    <td>

                        <strong>
                            ${formatMoney(
                                Math.abs(
                                    runningBalance
                                )
                            )}
                        </strong>

                    </td>

                </tr>
            `;
        }
    );


    rows += `

            </tbody>

        </table>
    `;

    return rows;
}


/* =========================================================
   TRANSACTIONS
========================================================= */

function renderTransactions() {

    const transactions =
        getFilteredTransactions();


    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h1>Transactions</h1>

                <p>
                    View and manage all customer account entries.
                </p>

            </div>

            <div class="page-header-actions">

                <button
                    class="primary-button"
                    id="transactionAddButton"
                >
                    + Add Transaction
                </button>

            </div>

        </div>


        <div class="card filter-bar">

            <div class="search-box">

                <span class="search-icon">
                    ⌕
                </span>

                <input
                    id="transactionSearch"
                    type="search"
                    placeholder="Search customer or description..."
                >

            </div>


            <select
                class="filter-select"
                id="transactionTypeFilter"
            >

                <option value="all">
                    All Types
                </option>

                <option value="purchase">
                    Credit Purchases
                </option>

                <option value="payment">
                    Payments
                </option>

                <option value="debit">
                    Debit Adjustments
                </option>

                <option value="credit">
                    Credit Adjustments
                </option>

            </select>

        </div>


        <div
            class="card"
            id="transactionsTableCard"
        >

            ${
                transactions.length
                    ? transactionTableHTML(
                        transactions
                    )
                    : emptyStateHTML(
                        "No Transactions",
                        "No transactions match the current filters."
                    )
            }

        </div>
    `;


    document
        .getElementById(
            "transactionAddButton"
        )
        ?.addEventListener(
            "click",
            () => openTransactionModal()
        );


    document
        .getElementById(
            "transactionSearch"
        )
        ?.addEventListener(
            "input",
            filterTransactionTable
        );


    document
        .getElementById(
            "transactionTypeFilter"
        )
        ?.addEventListener(
            "change",
            event => {

                transactionFilter =
                    event.target.value;

                renderTransactions();
            }
        );
}


/* =========================================================
   FILTERED TRANSACTIONS
========================================================= */

function getFilteredTransactions() {

    let transactions =
        [...appData.transactions];


    if (
        transactionFilter !==
        "all"
    ) {

        transactions =
            transactions.filter(
                transaction =>
                    transaction.type ===
                    transactionFilter
            );
    }


    return transactions.sort(
        (a, b) =>
            new Date(b.date) -
            new Date(a.date)
    );
}


/* =========================================================
   FILTER TRANSACTION TABLE
========================================================= */

function filterTransactionTable(event) {

    const query =
        event.target.value
            .toLowerCase()
            .trim();


    const filtered =
        getFilteredTransactions()
            .filter(transaction => {

                const customer =
                    getCustomer(
                        transaction.customerId
                    );

                return (

                    (
                        customer?.name ||
                        ""
                    )
                        .toLowerCase()
                        .includes(query)

                    ||

                    transaction.description
                        .toLowerCase()
                        .includes(query)

                    ||

                    (
                        transaction.paymentMethod ||
                        ""
                    )
                        .toLowerCase()
                        .includes(query)
                );
            });


    const card =
        document.getElementById(
            "transactionsTableCard"
        );

    if (!card) return;


    card.innerHTML =
        filtered.length
            ? transactionTableHTML(
                filtered
            )
            : emptyStateHTML(
                "No Matches",
                "No transactions match your search."
            );
}


/* =========================================================
   TRANSACTION TABLE
========================================================= */

function transactionTableHTML(
    transactions
) {

    return `

        <div class="table-wrap">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>Date</th>
                        <th>Customer</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Method</th>
                        <th>Amount</th>

                    </tr>

                </thead>

                <tbody>

                    ${transactions
                        .map(
                            transaction => {

                                const customer =
                                    getCustomer(
                                        transaction.customerId
                                    );

                                const isDebit =
                                    transaction.type ===
                                        "purchase" ||
                                    transaction.type ===
                                        "debit";


                                return `

                                    <tr>

                                        <td>
                                            ${formatDate(
                                                transaction.date
                                            )}
                                        </td>

                                        <td>

                                            <strong>
                                                ${
                                                    customer
                                                        ? escapeHTML(
                                                            customer.name
                                                        )
                                                        : "Unknown"
                                                }
                                            </strong>

                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                transaction.description
                                            )}
                                        </td>

                                        <td>
                                            ${transactionTypeBadge(
                                                transaction.type
                                            )}
                                        </td>

                                        <td>
                                            ${
                                                transaction.paymentMethod
                                                    ? `
                                                        <span class="badge badge-neutral">
                                                            ${escapeHTML(
                                                                transaction.paymentMethod
                                                            )}
                                                        </span>
                                                    `
                                                    : "—"
                                            }
                                        </td>

                                        <td>

                                            <span
                                                class="amount ${
                                                    isDebit
                                                        ? "positive"
                                                        : "negative"
                                                }"
                                            >
                                                ${
                                                    isDebit
                                                        ? "+"
                                                        : "-"
                                                }
                                                ${formatMoney(
                                                    transaction.amount
                                                )}
                                            </span>

                                        </td>

                                    </tr>
                                `;
                            }
                        )
                        .join("")
                    }

                </tbody>

            </table>

        </div>
    `;
}


/* =========================================================
   TRANSACTION TYPE BADGE
========================================================= */

function transactionTypeBadge(type) {

    const labels = {

        purchase:
            ["Credit Purchase", "badge-danger"],

        payment:
            ["Payment", "badge-success"],

        debit:
            ["Debit", "badge-warning"],

        credit:
            ["Credit", "badge-success"]
    };


    const item =
        labels[type] ||
        ["Other", "badge-neutral"];


    return `

        <span class="badge ${item[1]}">
            ${item[0]}
        </span>
    `;
}


/* =========================================================
   CHEQUE REGISTER
========================================================= */

function renderCheques() {

    const cheques =
        getFilteredCheques();


    const outstanding =
        appData.cheques.filter(
            cheque =>
                ![
                    "Cleared",
                    "Returned/Bounced",
                    "Cancelled"
                ].includes(
                    cheque.status
                )
        );


    const dueSoon =
        getChequeAlerts();


    const cleared =
        appData.cheques.filter(
            cheque =>
                cheque.status ===
                "Cleared"
        );


    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h1>Cheque Register</h1>

                <p>
                    Track cheque numbers, banks, dates and clearance status.
                </p>

            </div>

        </div>


        <div class="cheque-summary">

            ${chequeSummaryCard(
                "Outstanding",
                outstanding.length,
                formatMoney(
                    outstanding.reduce(
                        (sum, cheque) =>
                            sum +
                            Number(
                                cheque.amount || 0
                            ),
                        0
                    )
                )
            )}

            ${chequeSummaryCard(
                "Due Soon",
                dueSoon.length,
                "Within 5 days"
            )}

            ${chequeSummaryCard(
                "Cleared",
                cleared.length,
                formatMoney(
                    cleared.reduce(
                        (sum, cheque) =>
                            sum +
                            Number(
                                cheque.amount || 0
                            ),
                        0
                    )
                )
            )}

            ${chequeSummaryCard(
                "Total Cheques",
                appData.cheques.length,
                "All recorded cheques"
            )}

        </div>


        ${
            dueSoon.length
                ? `
                    <div class="card card-padding"
                         style="margin-bottom:18px;">

                        <div
                            class="card-title"
                            style="margin-bottom:12px;"
                        >
                            🔔 Clearance Alerts
                        </div>

                        ${dueSoon
                            .map(
                                alert =>
                                    alertHTML(alert)
                            )
                            .join("")
                        }

                    </div>
                `
                : ""
        }


        <div class="card filter-bar">

            <div class="search-box">

                <span class="search-icon">
                    ⌕
                </span>

                <input
                    id="chequeSearch"
                    type="search"
                    placeholder="Search cheque number, bank or customer..."
                >

            </div>


            <select
                class="filter-select"
                id="chequeStatusFilter"
            >

                <option value="all">
                    All Statuses
                </option>

                <option value="Issued">
                    Issued
                </option>

                <option value="Deposited">
                    Deposited
                </option>

                <option value="Cleared">
                    Cleared
                </option>

                <option value="Returned/Bounced">
                    Returned / Bounced
                </option>

                <option value="Cancelled">
                    Cancelled
                </option>

            </select>

        </div>


        <div
            class="card"
            id="chequeTableCard"
        >

            ${
                cheques.length
                    ? chequeTableHTML(
                        cheques
                    )
                    : emptyStateHTML(
                        "No Cheques",
                        "Cheque payments will appear here automatically."
                    )
            }

        </div>
    `;


    document
        .getElementById(
            "chequeSearch"
        )
        ?.addEventListener(
            "input",
            filterChequeTable
        );


    document
        .getElementById(
            "chequeStatusFilter"
        )
        ?.addEventListener(
            "change",
            event => {

                chequeFilter =
                    event.target.value;

                renderCheques();
            }
        );
}


/* =========================================================
   CHEQUE SUMMARY
========================================================= */

function chequeSummaryCard(
    label,
    value,
    small
) {

    return `

        <div class="card cheque-summary-card">

            <div class="cheque-summary-label">
                ${escapeHTML(label)}
            </div>

            <div class="cheque-summary-value">
                ${escapeHTML(String(value))}
            </div>

            <div class="stat-small">
                ${escapeHTML(String(small))}
            </div>

        </div>
    `;
}


/* =========================================================
   FILTERED CHEQUES
========================================================= */

function getFilteredCheques() {

    let cheques =
        [...appData.cheques];


    if (
        chequeFilter !==
        "all"
    ) {

        cheques =
            cheques.filter(
                cheque =>
                    cheque.status ===
                    chequeFilter
            );
    }


    return cheques.sort(
        (a, b) =>
            new Date(
                a.clearanceDate ||
                a.chequeDate ||
                a.createdAt
            ) -
            new Date(
                b.clearanceDate ||
                b.chequeDate ||
                b.createdAt
            )
    );
}


/* =========================================================
   FILTER CHEQUE TABLE
========================================================= */

function filterChequeTable(event) {

    const query =
        event.target.value
            .toLowerCase()
            .trim();


    const filtered =
        getFilteredCheques()
            .filter(cheque => {

                const customer =
                    getCustomer(
                        cheque.customerId
                    );

                return (

                    cheque.chequeNumber
                        .toLowerCase()
                        .includes(query)

                    ||

                    (
                        cheque.bank ||
                        ""
                    )
                        .toLowerCase()
                        .includes(query)

                    ||

                    (
                        cheque.drawer ||
                        ""
                    )
                        .toLowerCase()
                        .includes(query)

                    ||

                    (
                        customer?.name ||
                        ""
                    )
                        .toLowerCase()
                        .includes(query)
                );
            });


    const card =
        document.getElementById(
            "chequeTableCard"
        );

    if (!card) return;


    card.innerHTML =
        filtered.length
            ? chequeTableHTML(
                filtered
            )
            : emptyStateHTML(
                "No Matches",
                "No cheques match your search."
            );
}


/* =========================================================
   CHEQUE TABLE
========================================================= */

function chequeTableHTML(
    cheques
) {

    return `

        <div class="table-wrap">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>Cheque Date</th>
                        <th>Customer</th>
                        <th>Cheque No.</th>
                        <th>Bank</th>
                        <th>Amount</th>
                        <th>Clearance</th>
                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>

                    ${cheques
                        .map(
                            cheque => {

                                const customer =
                                    getCustomer(
                                        cheque.customerId
                                    );

                                return `

                                    <tr>

                                        <td>
                                            ${formatDate(
                                                cheque.chequeDate
                                            )}
                                        </td>

                                        <td>
                                            ${
                                                customer
                                                    ? escapeHTML(
                                                        customer.name
                                                    )
                                                    : "Unknown"
                                            }
                                        </td>

                                        <td>
                                            <strong>
                                                ${escapeHTML(
                                                    cheque.chequeNumber
                                                )}
                                            </strong>
                                        </td>

                                        <td>
                                            ${
                                                cheque.bank
                                                    ? escapeHTML(
                                                        cheque.bank
                                                    )
                                                    : "—"
                                            }
                                        </td>

                                        <td>
                                            <span class="amount">
                                                ${formatMoney(
                                                    cheque.amount
                                                )}
                                            </span>
                                        </td>

                                        <td>
                                            ${
                                                cheque.clearanceDate
                                                    ? formatDate(
                                                        cheque.clearanceDate
                                                    )
                                                    : "—"
                                            }
                                        </td>

                                        <td>
                                            ${chequeStatusBadge(
                                                cheque.status
                                            )}
                                        </td>

                                    </tr>
                                `;
                            }
                        )
                        .join("")
                    }

                </tbody>

            </table>

        </div>
    `;
}


/* =========================================================
   CHEQUE STATUS BADGE
========================================================= */

function chequeStatusBadge(
    status
) {

    const classes = {

        Issued:
            "badge-warning",

        Deposited:
            "badge-gold",

        Cleared:
            "badge-success",

        "Returned/Bounced":
            "badge-danger",

        Cancelled:
            "badge-neutral"
    };


    return `

        <span class="badge ${
            classes[status] ||
            "badge-neutral"
        }">

            ${escapeHTML(
                status
            )}

        </span>
    `;
}


/* =========================================================
   CHEQUE ALERTS
========================================================= */

function getChequeAlerts() {

    const today =
        startOfDay(
            new Date()
        );


    const notificationDays =
        Number(
            appData.settings
                ?.notificationDays || 5
        );


    const end =
        new Date(today);

    end.setDate(
        end.getDate() +
        notificationDays
    );


    return appData.cheques
        .filter(
            cheque => {

                if (
                    [
                        "Cleared",
                        "Returned/Bounced",
                        "Cancelled"
                    ].includes(
                        cheque.status
                    )
                ) {
                    return false;
                }


                if (
                    !cheque.clearanceDate
                ) {
                    return false;
                }


                const clearance =
                    startOfDay(
                        parseDate(
                            cheque.clearanceDate
                        )
                    );


                return (
                    clearance >= today &&
                    clearance <= end
                );
            }
        )
        .map(
            cheque => {

                const clearance =
                    startOfDay(
                        parseDate(
                            cheque.clearanceDate
                        )
                    );


                const days =
                    Math.round(
                        (
                            clearance -
                            today
                        ) /
                        86400000
                    );


                const customer =
                    getCustomer(
                        cheque.customerId
                    );


                return {

                    cheque,

                    customer,

                    days,

                    title:
                        days === 0
                            ? "Cheque due today"
                            : days === 1
                                ? "Cheque due tomorrow"
                                : `Cheque due in ${days} days`
                };
            }
        )
        .sort(
            (a, b) =>
                a.days -
                b.days
        );
}


/* =========================================================
   ALERT HTML
========================================================= */

function alertHTML(
    alert
) {

    const cheque =
        alert.cheque;

    const customer =
        alert.customer;


    return `

        <div class="alert-card ${
            alert.days <= 1
                ? "danger"
                : "warning"
        }">

            <div class="alert-icon">
                🔔
            </div>

            <div style="flex:1;">

                <div class="alert-title">
                    ${escapeHTML(
                        alert.title
                    )}
                </div>

                <div class="alert-text">

                    ${
                        customer
                            ? escapeHTML(
                                customer.name
                            )
                            : "Unknown customer"
                    }

                    · Cheque
                    <strong>
                        ${escapeHTML(
                            cheque.chequeNumber
                        )}
                    </strong>

                    ·

                    <strong>
                        ${formatMoney(
                            cheque.amount
                        )}
                    </strong>

                    · Clearance
                    ${formatDate(
                        cheque.clearanceDate
                    )}

                </div>

            </div>

        </div>
    `;
}


/* =========================================================
   PRINT STATEMENTS
========================================================= */

function renderPrintStatements() {

    const customers =
        appData.customers;


    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h1>Print Statements</h1>

                <p>
                    Select one, several or all customers.
                </p>

            </div>

            <div class="page-header-actions">

                <button
                    class="primary-button"
                    id="printSelectedButton"
                >
                    ⎙ Print Selected
                </button>

            </div>

        </div>


        <div class="card card-padding">

            <div class="print-actions">

                <button
                    class="secondary-button"
                    id="selectAllCustomers"
                >
                    Select All
                </button>

                <button
                    class="secondary-button"
                    id="clearCustomerSelection"
                >
                    Clear
                </button>

                <span
                    id="selectedCustomerCount"
                    class="badge badge-gold"
                >
                    0 selected
                </span>

            </div>


            ${
                customers.length
                    ? `
                        <div class="print-customer-list">

                            ${customers
                                .map(
                                    customer =>
                                        `
                                        <label
                                            class="print-customer-item"
                                        >

                                            <input
                                                type="checkbox"
                                                class="checkbox print-customer-checkbox"
                                                value="${customer.id}"
                                                ${
                                                    printSelectedCustomers.has(
                                                        customer.id
                                                    )
                                                        ? "checked"
                                                        : ""
                                                }
                                            >

                                            <span>

                                                <strong>
                                                    ${escapeHTML(
                                                        customer.name
                                                    )}
                                                </strong>

                                                <small
                                                    style="
                                                        display:block;
                                                        margin-top:3px;
                                                        color:var(--muted);
                                                    "
                                                >
                                                    Balance:
                                                    ${formatMoney(
                                                        Math.abs(
                                                            getCustomerBalance(
                                                                customer.id
                                                            )
                                                        )
                                                    )}
                                                </small>

                                            </span>

                                        </label>
                                        `
                                )
                                .join("")
                            }

                        </div>
                    `
                    : emptyStateHTML(
                        "No Customers",
                        "Add customers before printing statements."
                    )
            }

        </div>
    `;


    document
        .querySelectorAll(
            ".print-customer-checkbox"
        )
        .forEach(
            checkbox =>
                checkbox.addEventListener(
                    "change",
                    updatePrintSelection
                )
        );


    document
        .getElementById(
            "selectAllCustomers"
        )
        ?.addEventListener(
            "click",
            () => {

                customers.forEach(
                    customer =>
                        printSelectedCustomers.add(
                            customer.id
                        )
                );

                renderPrintStatements();
            }
        );


    document
        .getElementById(
            "clearCustomerSelection"
        )
        ?.addEventListener(
            "click",
            () => {

                printSelectedCustomers.clear();

                renderPrintStatements();
            }
        );


    document
        .getElementById(
            "printSelectedButton"
        )
        ?.addEventListener(
            "click",
            () => {

                if (
                    !printSelectedCustomers.size
                ) {

                    showToast(
                        "Select at least one customer.",
                        "!"
                    );

                    return;
                }


                printStatements(
                    Array.from(
                        printSelectedCustomers
                    )
                );
            }
        );


    updatePrintCount();
}


/* =========================================================
   UPDATE PRINT SELECTION
========================================================= */

function updatePrintSelection(
    event
) {

    const id =
        event.target.value;


    if (event.target.checked) {

        printSelectedCustomers.add(id);

    } else {

        printSelectedCustomers.delete(id);
    }


    updatePrintCount();
}


/* =========================================================
   UPDATE PRINT COUNT
========================================================= */

function updatePrintCount() {

    const element =
        document.getElementById(
            "selectedCustomerCount"
        );

    if (!element) return;

    element.textContent =
        `${printSelectedCustomers.size} selected`;
}


/* =========================================================
   PRINT STATEMENTS
========================================================= */

function printStatements(
    customerIds
) {

    if (!customerIds.length) {

        showToast(
            "No customers selected.",
            "!"
        );

        return;
    }


    const customers =
        customerIds
            .map(
                id =>
                    getCustomer(id)
            )
            .filter(Boolean);


    let pages = "";


    customers.forEach(
        customer => {

            const transactions =
                getCustomerTransactions(
                    customer.id
                );


            const balance =
                getCustomerBalance(
                    customer.id
                );


            pages +=
                printableStatementHTML(
                    customer,
                    transactions,
                    balance
                );
        }
    );


    const printWindow =
        window.open(
            "",
            "_blank"
        );


    if (!printWindow) {

        showToast(
            "Please allow pop-ups to print statements.",
            "!"
        );

        return;
    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>
                Customer Statements
            </title>

            <style>

                * {
                    box-sizing:border-box;
                }

                body {
                    margin:0;
                    padding:0;
                    color:#111;
                    background:#fff;
                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;
                }

                .statement-page {

                    page-break-after:always;

                    min-height:270mm;

                    padding:8mm;
                }

                .statement-page:last-child {
                    page-break-after:auto;
                }

                .header {

                    display:flex;

                    justify-content:space-between;

                    gap:20px;

                    padding-bottom:15px;

                    border-bottom:
                        2px solid #111;
                }

                .company {

                    font-size:21px;

                    font-weight:800;
                }

                .company-sub {

                    margin-top:4px;

                    font-size:11px;

                    color:#666;
                }

                .customer {

                    text-align:right;
                }

                .customer-name {

                    font-size:18px;

                    font-weight:800;
                }

                .customer-info {

                    margin-top:4px;

                    font-size:10px;

                    color:#666;

                    line-height:1.5;
                }

                .summary {

                    display:grid;

                    grid-template-columns:
                        repeat(3,1fr);

                    gap:10px;

                    margin:15px 0;
                }

                .summary-box {

                    padding:11px;

                    border:1px solid #ddd;

                    border-radius:6px;
                }

                .summary-label {

                    font-size:9px;

                    color:#666;

                    text-transform:uppercase;

                    font-weight:700;
                }

                .summary-value {

                    margin-top:5px;

                    font-size:15px;

                    font-weight:800;
                }

                table {

                    width:100%;

                    border-collapse:collapse;

                    font-size:10px;
                }

                th {

                    padding:8px;

                    background:#f2f2f2;

                    border:1px solid #ddd;

                    text-align:left;

                    font-size:9px;

                    text-transform:uppercase;
                }

                td {

                    padding:8px;

                    border:1px solid #ddd;

                    vertical-align:top;
                }

                .right {

                    text-align:right;
                }

                .footer {

                    margin-top:20px;

                    padding-top:10px;

                    border-top:1px solid #ddd;

                    font-size:9px;

                    color:#666;
                }

                @page {

                    size:A4;

                    margin:8mm;
                }

            </style>

        </head>

        <body>

            ${pages}

            <script>

                window.onload = function() {

                    setTimeout(
                        function() {
                            window.print();
                        },
                        300
                    );

                };

            <\/script>

        </body>

        </html>
    `);


    printWindow.document.close();
}


/* =========================================================
   PRINTABLE STATEMENT
========================================================= */

function printableStatementHTML(
    customer,
    transactions,
    balance
) {

    let runningBalance =
        Number(
            customer.openingBalance || 0
        );


    let rows = `

        <tr>

            <td>
                ${formatDate(
                    customer.createdAt
                )}
            </td>

            <td>
                <strong>
                    Opening Balance
                </strong>
            </td>

            <td class="right">
                ${
                    runningBalance > 0
                        ? formatMoney(
                            runningBalance
                        )
                        : "—"
                }
            </td>

            <td class="right">
                ${
                    runningBalance < 0
                        ? formatMoney(
                            Math.abs(
                                runningBalance
                            )
                        )
                        : "—"
                }
            </td>

            <td class="right">
                ${formatMoney(
                    Math.abs(
                        runningBalance
                    )
                )}
            </td>

        </tr>
    `;


    [...transactions]
        .sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        )
        .forEach(
            transaction => {

                const amount =
                    Number(
                        transaction.amount || 0
                    );


                const debit =
                    transaction.type ===
                        "purchase" ||
                    transaction.type ===
                        "debit";


                if (debit) {

                    runningBalance += amount;

                } else {

                    runningBalance -= amount;
                }


                rows += `

                    <tr>

                        <td>
                            ${formatDate(
                                transaction.date
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                transaction.description
                            )}

                            ${
                                transaction.notes
                                    ? `
                                        <br>
                                        <span
                                            style="color:#777;"
                                        >
                                            ${escapeHTML(
                                                transaction.notes
                                            )}
                                        </span>
                                    `
                                    : ""
                            }
                        </td>

                        <td class="right">
                            ${
                                debit
                                    ? formatMoney(
                                        amount
                                    )
                                    : "—"
                            }
                        </td>

                        <td class="right">
                            ${
                                !debit
                                    ? formatMoney(
                                        amount
                                    )
                                    : "—"
                            }
                        </td>

                        <td class="right">
                            ${formatMoney(
                                Math.abs(
                                    runningBalance
                                )
                            )}
                        </td>

                    </tr>
                `;
            }
        );


    return `

        <section class="statement-page">

            <div class="header">

                <div>

                    <div class="company">
                        Al Jefoon Tents
                    </div>

                    <div class="company-sub">
                        Customer Account Statement
                    </div>

                </div>


                <div class="customer">

                    <div class="customer-name">
                        ${escapeHTML(
                            customer.name
                        )}
                    </div>

                    <div class="customer-info">

                        ${
                            customer.phone
                                ? escapeHTML(
                                    customer.phone
                                )
                                : ""
                        }

                        ${
                            customer.email
                                ? "<br>" +
                                  escapeHTML(
                                      customer.email
                                  )
                                : ""
                        }

                    </div>

                </div>

            </div>


            <div class="summary">

                <div class="summary-box">

                    <div class="summary-label">
                        Opening Balance
                    </div>

                    <div class="summary-value">
                        ${formatMoney(
                            customer.openingBalance || 0
                        )}
                    </div>

                </div>


                <div class="summary-box">

                    <div class="summary-label">
                        Current Balance
                    </div>

                    <div class="summary-value">
                        ${formatMoney(
                            Math.abs(balance)
                        )}
                    </div>

                </div>


                <div class="summary-box">

                    <div class="summary-label">
                        Statement Date
                    </div>

                    <div class="summary-value">
                        ${formatDate(
                            todayISO()
                        )}
                    </div>

                </div>

            </div>


            <table>

                <thead>

                    <tr>

                        <th>
                            Date
                        </th>

                        <th>
                            Description
                        </th>

                        <th class="right">
                            Debit
                        </th>

                        <th class="right">
                            Credit
                        </th>

                        <th class="right">
                            Balance
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${rows}

                </tbody>

            </table>


            <div class="footer">

                Generated by
                Al Jefoon Tents Customer Statements

            </div>

        </section>
    `;
}


/* =========================================================
   REPORTS
========================================================= */

function renderReports() {

    const customers =
        appData.customers;


    const rows =
        customers
            .map(
                customer => {

                    const transactions =
                        getCustomerTransactions(
                            customer.id
                        );


                    const purchases =
                        transactions
                            .filter(
                                t =>
                                    t.type ===
                                        "purchase" ||
                                    t.type ===
                                        "debit"
                            )
                            .reduce(
                                (sum, t) =>
                                    sum +
                                    Number(
                                        t.amount || 0
                                    ),
                                0
                            );


                    const payments =
                        transactions
                            .filter(
                                t =>
                                    t.type ===
                                        "payment" ||
                                    t.type ===
                                        "credit"
                            )
                            .reduce(
                                (sum, t) =>
                                    sum +
                                    Number(
                                        t.amount || 0
                                    ),
                                0
                            );


                    const balance =
                        getCustomerBalance(
                            customer.id
                        );


                    return {

                        customer,

                        purchases,

                        payments,

                        balance
                    };
                }
            )
            .sort(
                (a, b) =>
                    Math.abs(
                        b.balance
                    ) -
                    Math.abs(
                        a.balance
                    )
            );


    const totalPurchases =
        rows.reduce(
            (sum, row) =>
                sum + row.purchases,
            0
        );


    const totalPayments =
        rows.reduce(
            (sum, row) =>
                sum + row.payments,
            0
        );


    const totalBalances =
        rows.reduce(
            (sum, row) =>
                sum + row.balance,
            0
        );


    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h1>Reports</h1>

                <p>
                    Customer account summary and outstanding balances.
                </p>

            </div>

            <div class="page-header-actions">

                <button
                    class="primary-button"
                    id="printReportButton"
                >
                    ⎙ Print Report
                </button>

            </div>

        </div>


        <div class="stats-grid">

            ${statCard(
                "Credit Purchases",
                formatMoney(
                    totalPurchases
                ),
                "▤",
                "Total debit activity"
            )}

            ${statCard(
                "Payments",
                formatMoney(
                    totalPayments
                ),
                "↓",
                "Total credit activity"
            )}

            ${statCard(
                "Net Receivable",
                formatMoney(
                    Math.max(
                        totalBalances,
                        0
                    )
                ),
                "◉",
                "Positive customer balances"
            )}

            ${statCard(
                "Accounts",
                customers.length,
                "♙",
                "Customer accounts"
            )}

        </div>


        <div class="card">

            <div class="card-header">

                <div>

                    <div class="card-title">
                        Customer Account Summary
                    </div>

                    <div class="card-subtitle">
                        Opening balances plus transaction activity
                    </div>

                </div>

            </div>


            ${
                rows.length
                    ? `
                        <div class="table-wrap">

                            <table
                                class="data-table"
                                id="reportTable"
                            >

                                <thead>

                                    <tr>

                                        <th>Customer</th>
                                        <th>Opening</th>
                                        <th>Purchases</th>
                                        <th>Payments</th>
                                        <th>Balance</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    ${rows
                                        .map(
                                            row =>
                                                `
                                                <tr>

                                                    <td>
                                                        <strong>
                                                            ${escapeHTML(
                                                                row.customer.name
                                                            )}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        ${formatMoney(
                                                            row.customer.openingBalance ||
                                                            0
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatMoney(
                                                            row.purchases
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatMoney(
                                                            row.payments
                                                        )}
                                                    </td>

                                                    <td>

                                                        <span
                                                            class="amount ${
                                                                row.balance > 0
                                                                    ? "positive"
                                                                    : row.balance < 0
                                                                        ? "negative"
                                                                        : "neutral"
                                                            }"
                                                        >
                                                            ${formatMoney(
                                                                Math.abs(
                                                                    row.balance
                                                                )
                                                            )}
                                                        </span>

                                                    </td>

                                                </tr>
                                                `
                                        )
                                        .join("")
                                    }

                                </tbody>

                            </table>

                        </div>
                    `
                    : emptyStateHTML(
                        "No Report Data",
                        "Add customers and transactions to generate reports."
                    )
            }

        </div>
    `;


    document
        .getElementById(
            "printReportButton"
        )
        ?.addEventListener(
            "click",
            printReport
        );
}


/* =========================================================
   PRINT REPORT
========================================================= */

function printReport() {

    const table =
        document.getElementById(
            "reportTable"
        );


    if (!table) {

        showToast(
            "There is no report to print.",
            "!"
        );

        return;
    }


    const win =
        window.open(
            "",
            "_blank"
        );


    if (!win) {

        showToast(
            "Please allow pop-ups to print.",
            "!"
        );

        return;
    }


    win.document.write(`

        <html>

        <head>

            <title>
                Al Jefoon Tents — Customer Report
            </title>

            <style>

                body {
                    font-family:Arial,sans-serif;
                    padding:20px;
                }

                h1 {
                    margin:0 0 5px;
                }

                p {
                    color:#666;
                    margin:0 0 20px;
                }

                table {
                    width:100%;
                    border-collapse:collapse;
                }

                th,td {
                    border:1px solid #ddd;
                    padding:8px;
                    text-align:left;
                    font-size:11px;
                }

                th {
                    background:#f1f1f1;
                }

                @page {
                    size:A4 landscape;
                    margin:10mm;
                }

            </style>

        </head>

        <body>

            <h1>
                Al Jefoon Tents
            </h1>

            <p>
                Customer Account Summary —
                ${formatDate(todayISO())}
            </p>

            ${table.outerHTML}

            <script>

                window.onload=function(){

                    setTimeout(
                        function(){
                            window.print();
                        },
                        300
                    );

                };

            <\/script>

        </body>

        </html>
    `);


    win.document.close();
}


/* =========================================================
   BACKUP
========================================================= */

function renderBackup() {

    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h1>Backup & Sync</h1>

                <p>
                    Keep a safe copy of your customer account data.
                </p>

            </div>

        </div>


        <div class="dashboard-grid">

            <div class="card card-padding">

                <div class="stat-icon">
                    ⇩
                </div>

                <h3
                    style="
                        margin:14px 0 6px;
                    "
                >
                    Download Backup
                </h3>

                <p
                    style="
                        color:var(--muted);
                        font-size:12px;
                        line-height:1.6;
                    "
                >
                    Download all customers,
                    transactions and cheques as
                    a JSON backup file.
                </p>

                <button
                    class="primary-button"
                    id="downloadBackup"
                >
                    Download Backup
                </button>

            </div>


            <div class="card card-padding">

                <div class="stat-icon">
                    ↑
                </div>

                <h3
                    style="
                        margin:14px 0 6px;
                    "
                >
                    Restore Backup
                </h3>

                <p
                    style="
                        color:var(--muted);
                        font-size:12px;
                        line-height:1.6;
                    "
                >
                    Restore a previously downloaded
                    JSON backup file.
                </p>

                <input
                    id="restoreFile"
                    type="file"
                    accept=".json,application/json"
                    class="form-control"
                >

            </div>


            <div class="card card-padding">

                <div class="stat-icon">
                    ☁
                </div>

                <h3
                    style="
                        margin:14px 0 6px;
                    "
                >
                    Google Sheets Backup
                </h3>

                <p
                    style="
                        color:var(--muted);
                        font-size:12px;
                        line-height:1.6;
                    "
                >
                    The app is prepared for a
                    Google Sheets backup connection.
                    We can add the Apps Script endpoint
                    in the next integration step.
                </p>

                <button
                    class="secondary-button"
                    id="googleSheetsSetup"
                >
                    Google Sheets Setup
                </button>

            </div>

        </div>


        <div class="card card-padding"
             style="margin-top:20px;">

            <div class="card-title">
                Local Data Status
            </div>

            <div class="card-subtitle">
                Your current browser storage
            </div>


            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(3,minmax(0,1fr));
                    gap:12px;
                    margin-top:17px;
                "
            >

                ${miniInfo(
                    "Customers",
                    appData.customers.length
                )}

                ${miniInfo(
                    "Transactions",
                    appData.transactions.length
                )}

                ${miniInfo(
                    "Cheques",
                    appData.cheques.length
                )}

            </div>

        </div>
    `;


    document
        .getElementById(
            "downloadBackup"
        )
        ?.addEventListener(
            "click",
            downloadBackup
        );


    document
        .getElementById(
            "restoreFile"
        )
        ?.addEventListener(
            "change",
            restoreBackup
        );


    document
        .getElementById(
            "googleSheetsSetup"
        )
        ?.addEventListener(
            "click",
            () => {

                showToast(
                    "Google Sheets connection will be configured in the next step."
                );
            }
        );
}


/* =========================================================
   MINI INFO
========================================================= */

function miniInfo(
    label,
    value
) {

    return `

        <div
            style="
                padding:13px;
                border:1px solid var(--border);
                border-radius:10px;
            "
        >

            <div
                style="
                    color:var(--muted);
                    font-size:10px;
                    font-weight:700;
                "
            >
                ${escapeHTML(label)}
            </div>

            <div
                style="
                    margin-top:5px;
                    font-size:19px;
                    font-weight:850;
                "
            >
                ${escapeHTML(
                    String(value)
                )}
            </div>

        </div>
    `;
}


/* =========================================================
   DOWNLOAD BACKUP
========================================================= */

function downloadBackup() {

    const backup = {

        application:
            "Al Jefoon Tents Customer Statements",

        version:
            "1.0",

        exportedAt:
            new Date().toISOString(),

        data:
            appData
    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    backup,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        `AlJefoon-Customer-Statements-${todayISO()}.json`;


    document.body.appendChild(
        link
    );

    link.click();

    link.remove();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "Backup downloaded successfully."
    );
}


/* =========================================================
   RESTORE BACKUP
========================================================= */

function restoreBackup(event) {

    const file =
        event.target.files?.[0];


    if (!file) return;


    const reader =
        new FileReader();


    reader.onload =
        function() {

            try {

                const backup =
                    JSON.parse(
                        reader.result
                    );


                const restored =
                    backup.data ||
                    backup;


                if (
                    !Array.isArray(
                        restored.customers
                    ) ||
                    !Array.isArray(
                        restored.transactions
                    ) ||
                    !Array.isArray(
                        restored.cheques
                    )
                ) {

                    throw new Error(
                        "Invalid backup format"
                    );
                }


                const confirmed =
                    window.confirm(
                        "Restore this backup? Current local data will be replaced."
                    );


                if (!confirmed) {

                    event.target.value = "";

                    return;
                }


                appData = {

                    ...createEmptyData(),

                    ...restored,

                    settings: {

                        ...createEmptyData()
                            .settings,

                        ...(restored.settings || {})
                    }
                };


                saveData();


                showToast(
                    "Backup restored successfully."
                );


                renderView(
                    currentView
                );


            } catch (error) {

                console.error(
                    error
                );

                showToast(
                    "The selected file is not a valid backup.",
                    "!"
                );
            }

            event.target.value = "";
        };


    reader.readAsText(
        file
    );
}


/* =========================================================
   SETTINGS
========================================================= */

function renderSettings() {

    const settings =
        appData.settings;


    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h1>Settings</h1>

                <p>
                    Configure the customer statement application.
                </p>

            </div>

        </div>


        <div class="card card-padding">

            <form id="settingsForm">

                <div class="form-grid">

                    <div class="form-group">

                        <label class="form-label">
                            Company Name
                        </label>

                        <input
                            class="form-control"
                            id="companyNameSetting"
                            value="${escapeAttribute(
                                settings.companyName
                            )}"
                        >

                    </div>


                    <div class="form-group">

                        <label class="form-label">
                            Currency
                        </label>

                        <input
                            class="form-control"
                            id="currencySetting"
                            value="${escapeAttribute(
                                settings.currency
                            )}"
                            maxlength="5"
                        >

                    </div>


                    <div class="form-group">

                        <label class="form-label">
                            Cheque Alert Days
                        </label>

                        <input
                            class="form-control"
                            id="notificationDaysSetting"
                            type="number"
                            min="0"
                            max="30"
                            value="${Number(
                                settings.notificationDays
                            )}"
                        >

                        <div class="form-help">
                            Example: 5 means the app alerts you from
                            five days before cheque clearance.
                        </div>

                    </div>

                </div>


                <div class="modal-footer">

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Save Settings
                    </button>

                </div>

            </form>

        </div>


        <div class="card card-padding"
             style="margin-top:20px;">

            <div class="card-title">
                Data Management
            </div>

            <div class="card-subtitle">
                Local application information
            </div>


            <div
                style="
                    margin-top:16px;
                    color:var(--muted);
                    font-size:12px;
                    line-height:1.7;
                "
            >

                Customers:
                <strong>
                    ${appData.customers.length}
                </strong>

                <br>

                Transactions:
                <strong>
                    ${appData.transactions.length}
                </strong>

                <br>

                Cheques:
                <strong>
                    ${appData.cheques.length}
                </strong>

            </div>

        </div>
    `;


    document
        .getElementById(
            "settingsForm"
        )
        ?.addEventListener(
            "submit",
            saveSettings
        );
}


/* =========================================================
   SAVE SETTINGS
========================================================= */

function saveSettings(event) {

    event.preventDefault();


    appData.settings.companyName =
        document
            .getElementById(
                "companyNameSetting"
            )
            .value
            .trim() ||
        "Al Jefoon Tents";


    appData.settings.currency =
        document
            .getElementById(
                "currencySetting"
            )
            .value
            .trim() ||
        "AED";


    appData.settings.notificationDays =
        Number(
            document
                .getElementById(
                    "notificationDaysSetting"
                )
                .value || 5
        );


    saveData();


    showToast(
        "Settings saved."
    );


    renderView(
        "settings"
    );
}


/* =========================================================
   MODAL
========================================================= */

function openModal(
    title,
    subtitle,
    body
) {

    modalTitle.textContent =
        title;

    modalSubtitle.textContent =
        subtitle || "";

    modalBody.innerHTML =
        body;


    modalOverlay.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";
}


function closeModal() {

    modalOverlay.classList.add(
        "hidden"
    );


    modalBody.innerHTML =
        "";


    document.body.style.overflow =
        "";
}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    icon = "✓"
) {

    clearTimeout(
        toastTimer
    );


    toastIcon.textContent =
        icon;

    toastMessage.textContent =
        message;


    toast.classList.add(
        "show"
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );
}


/* =========================================================
   THEME
========================================================= */

function loadTheme() {

    const theme =
        localStorage.getItem(
            THEME_KEY
        );


    if (
        theme === "dark"
    ) {

        document.body.classList.add(
            "dark"
        );
    }


    updateThemeButton();
}


function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const dark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        THEME_KEY,
        dark
            ? "dark"
            : "light"
    );


    updateThemeButton();
}


function updateThemeButton() {

    const dark =
        document.body.classList.contains(
            "dark"
        );


    themeIcon.textContent =
        dark
            ? "☀"
            : "☾";

    themeText.textContent =
        dark
            ? "Light Mode"
            : "Dark Mode";
}


/* =========================================================
   MOBILE MENU
========================================================= */

function openMobileMenu() {

    sidebar.classList.add(
        "open"
    );

    mobileOverlay.classList.add(
        "show"
    );
}


function closeMobileMenu() {

    sidebar.classList.remove(
        "open"
    );

    mobileOverlay.classList.remove(
        "show"
    );
}


/* =========================================================
   ALERT BADGES
========================================================= */

function updateAlertBadges() {

    const count =
        getChequeAlerts().length;


    notificationBadge.textContent =
        count;

    notificationBadge.classList.toggle(
        "hidden",
        count === 0
    );


    chequeAlertBadge.textContent =
        count;

    chequeAlertBadge.classList.toggle(
        "hidden",
        count === 0
    );
}


/* =========================================================
   BROWSER NOTIFICATIONS
========================================================= */

function checkChequeNotifications() {

    const alerts =
        getChequeAlerts();


    if (
        !alerts.length
    ) {
        return;
    }


    if (
        !("Notification" in window)
    ) {
        return;
    }


    if (
        Notification.permission ===
        "granted"
    ) {

        sendChequeNotifications(
            alerts
        );

        return;
    }


    /*
       We do not automatically request permission
       on page load. The browser can block this.
       The in-app alerts remain active regardless.
    */
}


/* =========================================================
   SEND CHEQUE NOTIFICATIONS
========================================================= */

function sendChequeNotifications(
    alerts
) {

    const notified =
        JSON.parse(
            localStorage.getItem(
                "alJefoonChequeNotificationsV1"
            ) || "{}"
        );


    alerts.forEach(
        alert => {

            const key =
                `${alert.cheque.id}_${alert.cheque.clearanceDate}`;


            if (
                notified[key]
            ) {
                return;
            }


            try {

                new Notification(
                    "Al Jefoon Tents — Cheque Alert",
                    {

                        body:
                            `${alert.title}: ` +
                            `${alert.cheque.chequeNumber} — ` +
                            `${formatMoney(
                                alert.cheque.amount
                            )}`,

                        tag:
                            key
                    }
                );


                notified[key] =
                    new Date().toISOString();


            } catch (error) {

                console.warn(
                    "Notification failed:",
                    error
                );
            }
        }
    );


    localStorage.setItem(
        "alJefoonChequeNotificationsV1",
        JSON.stringify(
            notified
        )
    );
}


/* =========================================================
   REQUEST NOTIFICATIONS
========================================================= */

function requestNotificationPermission() {

    if (
        !("Notification" in window)
    ) {

        showToast(
            "Browser notifications are not supported.",
            "!"
        );

        return;
    }


    Notification
        .requestPermission()
        .then(
            permission => {

                if (
                    permission ===
                    "granted"
                ) {

                    showToast(
                        "Cheque notifications enabled."
                    );

                    sendChequeNotifications(
                        getChequeAlerts()
                    );

                } else {

                    showToast(
                        "Notification permission was not granted.",
                        "!"
                    );
                }
            }
        );
}


/* =========================================================
   UTILITY — CUSTOMER
========================================================= */

function getCustomer(
    customerId
) {

    return appData.customers.find(
        customer =>
            customer.id ===
            customerId
    );
}


/* =========================================================
   UTILITY — TRANSACTIONS
========================================================= */

function getCustomerTransactions(
    customerId
) {

    return appData.transactions.filter(
        transaction =>
            transaction.customerId ===
            customerId
    );
}


/* =========================================================
   UTILITY — DATE
========================================================= */

function todayISO() {

    const date =
        new Date();


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );
}


function parseDate(
    value
) {

    if (!value) {
        return new Date();
    }


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            value
        )
    ) {

        const [
            year,
            month,
            day
        ] =
            value
                .split("-")
                .map(Number);


        return new Date(
            year,
            month - 1,
            day
        );
    }


    return new Date(value);
}


function startOfDay(
    date
) {

    const result =
        new Date(date);

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;
}


function formatDate(
    value
) {

    if (!value) {
        return "—";
    }


    const date =
        parseDate(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";
    }


    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);
}


/* =========================================================
   UTILITY — MONEY
========================================================= */

function formatMoney(
    amount
) {

    const currency =
        appData.settings?.currency ||
        "AED";


    const number =
        Number(amount || 0);


    return (
        currency +
        " " +
        number.toLocaleString(
            "en-AE",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )
    );
}


/* =========================================================
   UTILITY — INITIALS
========================================================= */

function getInitials(
    name
) {

    const parts =
        String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!parts.length) {
        return "?";
    }


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}


/* =========================================================
   UTILITY — EMPTY STATE
========================================================= */

function emptyStateHTML(
    title,
    message
) {

    return `

        <div class="empty-state">

            <div class="empty-icon">
                ▤
            </div>

            <h3>
                ${escapeHTML(title)}
            </h3>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>
    `;
}


/* =========================================================
   UTILITY — ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );
}


/* =========================================================
   END
========================================================= */
