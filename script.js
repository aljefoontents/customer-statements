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

let editingCustomerId = null;
let editingTransactionId = null;


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

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(appData)
        );

        updateAlertBadges();

        return true;

    } catch (error) {

        console.error(
            "Could not save application data:",
            error
        );

        showToast(
            "Unable to save. Browser storage may be blocked or full.",
            "!"
        );

        return false;
    }
}

        return true;

    } catch (error) {

        console.error(
            "Could not save application data:",
            error
        );

        showToast(
            "Unable to save. Browser storage may be blocked or full.",
            "!"
        );

        return false;
    }
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
            subtitle: "Customer Accounts Overview"
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
    "Payable",
    formatMoney(totalCredit),
    "↙",
    "Amounts owed to suppliers"
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


    attachTransactionActionListeners();

    attachCustomerBalanceListeners();
}


/* =========================================================
   CUSTOMER BALANCE LIST
========================================================= */

function customerBalanceListHTML(items) {

    if (!items.length) {

        return emptyStateHTML(
            "All Accounts Clear",
            "There are currently no outstanding customer balances."
        );
    }


    return `

        <div class="balance-list">

            ${items
                .map(
                    item => {

                        const customer =
                            item.customer;

                        const balance =
                            item.balance;

                        const isReceivable =
                            balance > 0;

                        return `

                            <div
                                class="balance-list-item"
                                data-customer-id="${customer.id}"
                            >

                                <div>

                                    <div class="balance-customer-name">
                                        ${escapeHTML(
                                            customer.name
                                        )}
                                    </div>

                                    <div class="balance-customer-meta">
                                        ${
                                            customer.phone
                                                ? escapeHTML(
                                                    customer.phone
                                                )
                                                : "No phone number"
                                        }
                                    </div>

                                </div>


                                <div
                                    class="balance-value ${
                                        isReceivable
                                            ? "positive"
                                            : "negative"
                                    }"
                                >

                                    ${
                                        isReceivable
                                            ? "+"
                                            : "-"
                                    }

                                    ${formatMoney(
                                        Math.abs(balance)
                                    )}

                                </div>

                            </div>

                        `;
                    }
                )
                .join("")
            }

        </div>

    `;
}


/* =========================================================
   CUSTOMER BALANCE LISTENERS
========================================================= */

function attachCustomerBalanceListeners() {

    document
        .querySelectorAll(
            ".balance-list-item"
        )
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const customerId =
                        item.dataset.customerId;

                    if (!customerId) {
                        return;
                    }

                    selectedCustomerId =
                        customerId;

                    renderView("customer");
                }
            );

        });
}


/* =========================================================
   CUSTOMERS VIEW
========================================================= */

function renderCustomers() {

    const customers =
        [...appData.customers]
            .sort(
                (a, b) =>
                    String(a.name || "")
                        .localeCompare(
                            String(b.name || "")
                        )
            );


    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h1>Customers</h1>

                <p>
                    Manage your customer accounts
                    and view their statements.
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


        <div class="card">

            <div class="card-header">

                <div>

                    <div class="card-title">
                        Customer Accounts
                    </div>

                    <div class="card-subtitle">
                        ${customers.length}
                        customer(s)
                    </div>

                </div>

            </div>


            ${
                customers.length
                    ? `
                        <div class="customer-grid">

                            ${customers
                                .map(
                                    customer =>
                                        customerCardHTML(
                                            customer
                                        )
                                )
                                .join("")
                            }

                        </div>
                    `
                    : emptyStateHTML(
                        "No Customers",
                        "Add your first customer account."
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


    attachCustomerCardListeners();
}


/* =========================================================
   CUSTOMER CARD
========================================================= */

function customerCardHTML(customer) {

    const balance =
        getCustomerBalance(
            customer.id
        );

    const transactions =
        getCustomerTransactions(
            customer.id
        );

    const balanceClass =
        balance > 0
            ? "positive"
            : balance < 0
                ? "negative"
                : "neutral";


    const balanceLabel =
        balance > 0
            ? "Receivable"
            : balance < 0
                ? "Credit"
                : "Clear";


    return `

        <div
            class="customer-card"
            data-customer-id="${customer.id}"
        >

            <div class="customer-card-top">

                <div>

                    <div class="customer-name">
                        ${escapeHTML(
                            customer.name
                        )}
                    </div>

                    ${
                        customer.company
                            ? `
                                <div class="customer-company">
                                    ${escapeHTML(
                                        customer.company
                                    )}
                                </div>
                            `
                            : ""
                    }

                </div>


                <div
                    class="customer-balance ${
                        balanceClass
                    }"
                >

                    <span>
                        ${balanceLabel}
                    </span>

                    <strong>
                        ${formatMoney(
                            Math.abs(balance)
                        )}
                    </strong>

                </div>

            </div>


            <div class="customer-card-details">

                ${
                    customer.phone
                        ? `
                            <div>
                                <span>Phone</span>
                                ${escapeHTML(
                                    customer.phone
                                )}
                            </div>
                        `
                        : ""
                }


                ${
                    customer.email
                        ? `
                            <div>
                                <span>Email</span>
                                ${escapeHTML(
                                    customer.email
                                )}
                            </div>
                        `
                        : ""
                }


                <div>

                    <span>Transactions</span>

                    ${transactions.length}

                </div>

            </div>


            <div class="customer-card-actions">

                <button
                    class="secondary-button edit-customer-button"
                    data-customer-id="${customer.id}"
                >
                    Edit
                </button>


                <button
                    class="secondary-button view-statement-button"
                    data-customer-id="${customer.id}"
                >
                    Statement
                </button>


                <button
                    class="secondary-button danger-action delete-customer-button"
                    data-customer-id="${customer.id}"
                >
                    Delete
                </button>

            </div>

        </div>

    `;
}
/* =========================================================
   STAT CARD
========================================================= */

function statCard(
    label,
    value,
    icon,
    description
) {

    return `

        <div class="stat-card">

            <div class="stat-icon">
                ${icon}
            </div>

            <div class="stat-content">

                <div class="stat-label">
                    ${escapeHTML(label)}
                </div>

                <div class="stat-value">
                    ${value}
                </div>

                <div class="stat-description">
                    ${escapeHTML(description)}
                </div>

            </div>

        </div>

    `;
}


/* =========================================================
   CUSTOMER BALANCE
========================================================= */

function getCustomerBalance(
    customerId
) {

    const customer =
        getCustomer(customerId);

    if (!customer) {
        return 0;
    }


    let balance =
        Number(
            customer.openingBalance || 0
        );


    const transactions =
        getCustomerTransactions(
            customerId
        );


    transactions.forEach(
        transaction => {

            const amount =
                Number(
                    transaction.amount || 0
                );


            switch (
                transaction.type
            ) {

                case "sale":
                case "debit":

                    balance += amount;

                    break;


                case "payment_received":
                case "credit":

                    balance -= amount;

                    break;


                case "purchase":

                    balance -= amount;

                    break;


                case "payment_made":

                    balance += amount;

                    break;

            }
        }
    );


    return balance;
}


/* =========================================================
   CUSTOMER BALANCE LIST
========================================================= */

function customerBalanceListHTML(
    items
) {

    if (!items.length) {

        return emptyStateHTML(
            "All Accounts Clear",
            "There are currently no outstanding customer balances."
        );
    }


    return `

        <div class="balance-list">

            ${items
                .map(
                    item => {

                        const customer =
                            item.customer;

                        const balance =
                            item.balance;

                        const isReceivable =
                            balance > 0;


                        return `

                            <div
                                class="balance-list-item"
                                data-customer-id="${customer.id}"
                            >

                                <div>

                                    <div class="balance-customer-name">
                                        ${escapeHTML(
                                            customer.name
                                        )}
                                    </div>

                                    <div class="balance-customer-meta">
                                        ${
                                            customer.phone
                                                ? escapeHTML(
                                                    customer.phone
                                                )
                                                : "No phone number"
                                        }
                                    </div>

                                </div>


                                <div
                                    class="balance-value ${
                                        isReceivable
                                            ? "positive"
                                            : "negative"
                                    }"
                                >

                                    ${
                                        isReceivable
                                            ? "+"
                                            : "-"
                                    }

                                    ${formatMoney(
                                        Math.abs(
                                            balance
                                        )
                                    )}

                                </div>

                            </div>

                        `;
                    }
                )
                .join("")
            }

        </div>

    `;
}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

function deleteTransaction(
    transactionId
) {

    const transaction =
        getTransaction(
            transactionId
        );


    if (!transaction) {

        showToast(
            "Transaction not found.",
            "!"
        );

        return;
    }


    const customer =
        getCustomer(
            transaction.customerId
        );


    const customerName =
        customer
            ? customer.name
            : "this customer";


    const confirmed =
        window.confirm(
            `Delete this transaction for ${customerName}?`
        );


    if (!confirmed) {
        return;
    }


    const linkedCheque =
        appData.cheques.find(
            cheque =>
                cheque.transactionId ===
                transactionId
        );


    appData.transactions =
        appData.transactions.filter(
            item =>
                item.id !==
                transactionId
        );


    if (linkedCheque) {

        appData.cheques =
            appData.cheques.filter(
                cheque =>
                    cheque.transactionId !==
                    transactionId
            );
    }


    const saved =
        saveData();


    if (!saved) {

        /*
         * Restore the deleted transaction
         * if saving failed.
         */

        appData.transactions.push(
            transaction
        );


        if (linkedCheque) {

            appData.cheques.push(
                linkedCheque
            );
        }


        return;
    }


    showToast(
        "Transaction deleted successfully.",
        "✓"
    );


    if (
        currentView === "customer" &&
        selectedCustomerId
    ) {

        renderCustomerStatement(
            selectedCustomerId
        );

        return;
    }


    if (
        currentView === "transactions"
    ) {

        renderTransactions();

        return;
    }


    renderView(
        currentView
    );
}


/* =========================================================
   CUSTOMERS VIEW
========================================================= */

function renderCustomers() {

    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h1>Customers</h1>

                <p>
                    Manage customer accounts,
                    balances and statements.
                </p>

            </div>


            <div class="page-header-actions">

                <button
                    class="primary-button"
                    data-action="add-customer"
                >
                    + Add Customer
                </button>

            </div>

        </div>


        <div class="card">

            <div class="card-header">

                <div>

                    <div class="card-title">
                        Customer Accounts
                    </div>

                    <div class="card-subtitle">
                        ${
                            appData.customers.length
                        }
                        customer(s)
                    </div>

                </div>


                <div
                    class="search-box"
                    style="max-width:300px;"
                >

                    <span class="search-icon">
                        ⌕
                    </span>

                    <input
                        type="search"
                        id="customerSearch"
                        placeholder="Search customers..."
                    >

                </div>

            </div>


            <div
                id="customerGrid"
                class="customer-grid"
            >

                ${
                    appData.customers.length
                        ? customersHTML(
                            appData.customers
                        )
                        : emptyStateHTML(
                            "No Customers",
                            "Add your first customer account."
                        )
                }

            </div>

        </div>

    `;


    document
        .querySelector(
            '[data-action="add-customer"]'
        )
        ?.addEventListener(
            "click",
            () => openCustomerModal()
        );


    document
        .getElementById(
            "customerSearch"
        )
        ?.addEventListener(
            "input",
            filterCustomers
        );


    setupCustomerCardButtons();
}


/* =========================================================
   CUSTOMER CARDS
========================================================= */

function customersHTML(
    customers
) {

    return customers
        .map(customer => {

            const balance =
                getCustomerBalance(
                    customer.id
                );


            const initials =
                getInitials(
                    customer.name
                );


            return `

                <div class="card customer-card">

                    <div class="customer-card-top">

                        <div class="customer-avatar">
                            ${escapeHTML(
                                initials
                            )}
                        </div>

                        ${
                            balance > 0
                                ? `
                                    <span class="badge badge-danger">
                                        RECEIVABLE
                                    </span>
                                `
                                : balance < 0
                                    ? `
                                        <span class="badge badge-success">
                                            PAYABLE
                                        </span>
                                    `
                                    : `
                                        <span class="badge badge-neutral">
                                            SETTLED
                                        </span>
                                    `
                        }

                    </div>


                    <div class="customer-name">
                        ${escapeHTML(
                            customer.name
                        )}
                    </div>


                    <div class="customer-detail">

                        ${
                            customer.phone
                                ? "☎ " +
                                  escapeHTML(
                                      customer.phone
                                  )
                                : "No phone number"
                        }

                    </div>


                    <div class="customer-detail">

                        ${
                            customer.email
                                ? "✉ " +
                                  escapeHTML(
                                      customer.email
                                  )
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
                                    Math.abs(
                                        balance
                                    )
                                )}
                            </div>

                        </div>

                    </div>


                    <div class="customer-actions">

                        <button
                            class="secondary-button"
                            data-action="edit-customer"
                            data-id="${customer.id}"
                        >
                            Edit
                        </button>


                        <button
                            class="secondary-button"
                            data-action="statement"
                            data-id="${customer.id}"
                        >
                            Statement
                        </button>


                        <button
                            class="secondary-button danger-action"
                            data-action="delete-customer"
                            data-id="${customer.id}"
                            style="border-color:#d64545;color:#d64545;"
                        >
                            Delete
                        </button>


                        <button
                            class="secondary-button danger-action"
                            data-action="delete-customer"
                            data-id="${customer.id}"
                        >
                            Delete
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
function setupCustomerCardButtons() {

    document
        .querySelectorAll(
            '[data-action="edit-customer"]'
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const customer =
                        getCustomer(
                            button.dataset.id
                        );

                    if (customer) {
                        openCustomerModal(
                            customer
                        );
                    }
                }
            );
        });


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
            '[data-action="delete-customer"]'
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    deleteCustomer(
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
   DELETE CUSTOMER
========================================================= */

function deleteCustomer(customerId) {

    const customer =
        getCustomer(customerId);

    if (!customer) {
        showToast(
            "Customer could not be found.",
            "!"
        );
        return;
    }

    const hasTransactions =
        appData.transactions.some(
            transaction =>
                transaction.customerId ===
                customerId
        );

    const hasCheques =
        appData.cheques.some(
            cheque =>
                cheque.customerId ===
                customerId
        );

    if (hasTransactions || hasCheques) {
        showToast(
            "This customer cannot be deleted because account activity exists. Delete the transactions first.",
            "!"
        );
        return;
    }

    if (!window.confirm(
        `Delete customer "${customer.name}"? This action cannot be undone.`
    )) {
        return;
    }

    appData.customers =
        appData.customers.filter(
            item => item.id !== customerId
        );

    saveData();

    showToast(
        "Customer deleted successfully."
    );

    renderView("customers");
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
   ADD / EDIT CUSTOMER MODAL
========================================================= */

function openCustomerModal(
    customerToEdit = null
) {

    editingCustomerId =
        customerToEdit?.id || null;

    openModal(
        editingCustomerId
            ? "Edit Customer"
            : "Add Customer",

        editingCustomerId
            ? "Update customer account details"
            : "Create a new customer account",

        `
            <form
                id="customerForm"
                class="modal-form"
            >

                <div class="form-grid">

                    <div class="form-group">

                        <label>
                            Customer Name
                            <span class="required">*</span>
                        </label>

                        <input
                            type="text"
                            id="customerName"
                            class="form-input"
                            required
                            value="${
                                customerToEdit
                                    ? escapeHTML(
                                        customerToEdit.name || ""
                                    )
                                    : ""
                            }"
                            placeholder="Enter customer name"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Company
                        </label>

                        <input
                            type="text"
                            id="customerCompany"
                            class="form-input"
                            value="${
                                customerToEdit
                                    ? escapeHTML(
                                        customerToEdit.company || ""
                                    )
                                    : ""
                            }"
                            placeholder="Company name"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Phone
                        </label>

                        <input
                            type="tel"
                            id="customerPhone"
                            class="form-input"
                            value="${
                                customerToEdit
                                    ? escapeHTML(
                                        customerToEdit.phone || ""
                                    )
                                    : ""
                            }"
                            placeholder="Phone number"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            id="customerEmail"
                            class="form-input"
                            value="${
                                customerToEdit
                                    ? escapeHTML(
                                        customerToEdit.email || ""
                                    )
                                    : ""
                            }"
                            placeholder="Email address"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Opening Balance
                        </label>

                        <input
                            type="number"
                            id="customerOpeningBalance"
                            class="form-input"
                            step="0.01"
                            value="${
                                customerToEdit
                                    ? Number(
                                        customerToEdit.openingBalance || 0
                                    )
                                    : 0
                            }"
                            placeholder="0.00"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Opening Balance Type
                        </label>

                        <select
                            id="customerOpeningBalanceType"
                            class="form-input"
                        >

                            <option
                                value="receivable"
                                ${
                                    !customerToEdit ||
                                    Number(
                                        customerToEdit.openingBalance || 0
                                    ) >= 0
                                        ? "selected"
                                        : ""
                                }
                            >
                                Receivable
                            </option>

                            <option
                                value="payable"
                                ${
                                    customerToEdit &&
                                    Number(
                                        customerToEdit.openingBalance || 0
                                    ) < 0
                                        ? "selected"
                                        : ""
                                }
                            >
                                Payable
                            </option>

                        </select>

                    </div>

                </div>


                <div class="modal-actions">

                    <button
                        type="button"
                        class="secondary-button"
                        data-modal-cancel
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        class="primary-button"
                    >
                        ${
                            editingCustomerId
                                ? "Update Customer"
                                : "Save Customer"
                        }
                    </button>

                </div>

            </form>
        `
    );


    document
        .getElementById("customerForm")
        ?.addEventListener(
            "submit",
            saveCustomer
        );


    document
        .querySelector(
            "[data-modal-cancel]"
        )
        ?.addEventListener(
            "click",
            closeModal
        );
}


/* =========================================================
   SAVE CUSTOMER
========================================================= */

function saveCustomer(event) {

    event.preventDefault();


    const nameInput =
        document.getElementById(
            "customerName"
        );

    const companyInput =
        document.getElementById(
            "customerCompany"
        );

    const phoneInput =
        document.getElementById(
            "customerPhone"
        );

    const emailInput =
        document.getElementById(
            "customerEmail"
        );

    const openingBalanceInput =
        document.getElementById(
            "customerOpeningBalance"
        );

    const openingBalanceTypeInput =
        document.getElementById(
            "customerOpeningBalanceType"
        );


    if (!nameInput) {
        showToast(
            "Customer form could not be loaded.",
            "!"
        );
        return;
    }


    const name =
        nameInput.value.trim();


    const company =
        companyInput?.value.trim() || "";


    const phone =
        phoneInput?.value.trim() || "";


    const email =
        emailInput?.value.trim() || "";


    const openingBalance =
        Number(
            openingBalanceInput?.value || 0
        );


    const openingBalanceType =
        openingBalanceTypeInput?.value ||
        "receivable";


    if (!name) {

        showToast(
            "Please enter the customer name.",
            "!"
        );

        nameInput.focus();

        return;
    }


    if (
        !Number.isFinite(
            openingBalance
        )
    ) {

        showToast(
            "Please enter a valid opening balance.",
            "!"
        );

        return;
    }


    const finalOpeningBalance =
        openingBalanceType ===
        "payable"
            ? -Math.abs(
                openingBalance
            )
            : Math.abs(
                openingBalance
            );


    if (editingCustomerId) {

        const customer =
            getCustomer(
                editingCustomerId
            );


        if (!customer) {

            showToast(
                "Customer could not be found.",
                "!"
            );

            return;
        }


        customer.name =
            name;

        customer.company =
            company;

        customer.phone =
            phone;

        customer.email =
            email;

        customer.openingBalance =
            finalOpeningBalance;


        saveData();


        closeModal();


        showToast(
            "Customer updated successfully.",
            "✓"
        );


        renderView(
            currentView
        );


        return;
    }


    const customer = {

        id:
            makeId(
                "customer"
            ),

        name:
            name,

        company:
            company,

        phone:
            phone,

        email:
            email,

        openingBalance:
            finalOpeningBalance,

        createdAt:
            new Date()
                .toISOString()

    };


    appData.customers.push(
        customer
    );


    saveData();


    closeModal();


    showToast(
        "Customer saved successfully.",
        "✓"
    );


    renderView(
        currentView
    );
}


/* =========================================================
   OPEN CUSTOMER STATEMENT
========================================================= */

function openCustomerStatement(
    customerId
) {

    const customer =
        getCustomer(
            customerId
        );


    if (!customer) {

        showToast(
            "Customer could not be found.",
            "!"
        );

        return;
    }


    selectedCustomerId =
        customerId;


    renderView(
        "customer"
    );
}


/* =========================================================
   CUSTOMER STATEMENT VIEW
========================================================= */

function renderCustomerStatement(
    customerId
) {

    const customer =
        getCustomer(
            customerId
        );


    if (!customer) {

        selectedCustomerId =
            null;

        renderView(
            "customers"
        );

        return;
    }


    const transactions =
        getCustomerTransactions(
            customerId
        );


    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <button
                    class="secondary-button"
                    id="backToCustomersButton"
                >
                    ← Back
                </button>

            </div>


            <div class="page-header-actions">

                <button
                    class="secondary-button"
                    id="customerStatementEditButton"
                >
                    Edit Customer
                </button>


                <button
                    class="primary-button"
                    id="customerStatementAddButton"
                >
                    + Add Transaction
                </button>


                <button
                    class="secondary-button"
                    id="customerStatementPrintButton"
                >
                    Print
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
                        Customer Statement
                    </div>

                </div>


                <div class="statement-customer">

                    <div class="statement-customer-name">
                        ${escapeHTML(
                            customer.name
                        )}
                    </div>

                    ${
                        customer.company
                            ? `
                                <div class="statement-customer-info">
                                    ${escapeHTML(
                                        customer.company
                                    )}
                                </div>
                            `
                            : ""
                    }


                    ${
                        customer.phone
                            ? `
                                <div class="statement-customer-info">
                                    ${escapeHTML(
                                        customer.phone
                                    )}
                                </div>
                            `
                            : ""
                    }


                    ${
                        customer.email
                            ? `
                                <div class="statement-customer-info">
                                    ${escapeHTML(
                                        customer.email
                                    )}
                                </div>
                            `
                            : ""
                    }

                </div>

            </div>


            <div class="statement-summary">

                <div class="summary-item">

                    <span>
                        Opening Balance
                    </span>

                    <strong>
                        ${formatMoney(
                            Math.abs(
                                Number(
                                    customer.openingBalance || 0
                                )
                            )
                        )}
                    </strong>

                </div>


                <div class="summary-item">

                    <span>
                        Transactions
                    </span>

                    <strong>
                        ${transactions.length}
                    </strong>

                </div>


                <div class="summary-item">

                    <span>
                        Current Balance
                    </span>

                    <strong
                        class="${
                            getCustomerBalance(
                                customer.id
                            ) > 0
                                ? "positive"
                                : getCustomerBalance(
                                    customer.id
                                ) < 0
                                    ? "negative"
                                    : ""
                        }"
                    >
                        ${formatMoney(
                            Math.abs(
                                getCustomerBalance(
                                    customer.id
                                )
                            )
                        )}
                    </strong>

                </div>

            </div>


            <div class="table-wrap">

                ${
                    statementTableHTML(
                        customer,
                        transactions
                    )
                }

            </div>

        </div>

    `;


    document
        .getElementById(
            "backToCustomersButton"
        )
        ?.addEventListener(
            "click",
            () => {

                selectedCustomerId =
                    null;

                renderView(
                    "customers"
                );
            }
        );


    document
        .getElementById(
            "customerStatementEditButton"
        )
        ?.addEventListener(
            "click",
            () =>
                openCustomerModal(
                    customer
                )
        );


    document
        .getElementById(
            "customerStatementAddButton"
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
            "customerStatementPrintButton"
        )
        ?.addEventListener(
            "click",
            () =>
                printCustomerStatement(
                    customerId
                )
        );


    attachTransactionActionListeners();
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
            class="transaction-type-button ${
                type === "sale"
                    ? "active"
                    : ""
            }"
            data-transaction-type="${type}"
        >

            <span class="transaction-type-icon">
                ${icon}
            </span>

            <span class="transaction-type-content">

                <span class="transaction-type-title">
                    ${title}
                </span>

                <span class="transaction-type-description">
                    ${description}
                </span>

            </span>

        </button>

    `;
}


/* =========================================================
   TRANSACTION FORM SETUP
========================================================= */

function setupTransactionForm() {

    const form =
        document.getElementById(
            "transactionForm"
        );

    if (!form) return;


    const typeButtons =
        document.querySelectorAll(
            ".transaction-type-button"
        );

    const typeInput =
        document.getElementById(
            "transactionType"
        );


    typeButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                typeButtons.forEach(
                    item => {
                        item.classList.remove(
                            "active"
                        );
                    }
                );

                button.classList.add(
                    "active"
                );

                typeInput.value =
                    button.dataset.transactionType;

                updatePaymentVisibility();
            }
        );

    });


    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        );

    if (paymentMethod) {

        paymentMethod.addEventListener(
            "change",
            updateChequeVisibility
        );

    }


    document
        .getElementById("cancelTransaction")
        ?.addEventListener(
            "click",
            closeModal
        );


    updatePaymentVisibility();


    form.addEventListener(
        "submit",
        saveTransaction
    );

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


    const showPayment =
        type === "payment_received" ||
        type === "payment_made";


    paymentDetails.classList.toggle(
        "hidden",
        !showPayment
    );


    if (showPayment) {

        updateChequeVisibility();

    }

}


/* =========================================================
   CHEQUE VISIBILITY
========================================================= */

function updateChequeVisibility() {

    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        )?.value;


    const chequeDetails =
        document.getElementById(
            "chequeDetails"
        );


    if (!chequeDetails) return;


    chequeDetails.classList.toggle(
        "hidden",
        paymentMethod !== "Cheque"
    );

}


/* =========================================================
   SAVE TRANSACTION
========================================================= */

function saveTransaction(event) {

    event.preventDefault();


    const customerElement =
        document.getElementById(
            "transactionCustomer"
        );

    const amountElement =
        document.getElementById(
            "transactionAmount"
        );

    const dateElement =
        document.getElementById(
            "transactionDate"
        );

    const descriptionElement =
        document.getElementById(
            "transactionDescription"
        );

    const typeElement =
        document.getElementById(
            "transactionType"
        );


    if (
        !customerElement ||
        !amountElement ||
        !dateElement ||
        !descriptionElement ||
        !typeElement
    ) {

        showToast(
            "Transaction form could not be loaded.",
            "!"
        );

        return;
    }


    const customerId =
        customerElement.value;


    const amount =
        Number(
            amountElement.value
        );


    const date =
        dateElement.value;


    const description =
        descriptionElement.value.trim();


    const type =
        typeElement.value;


    if (!customerId) {

        showToast(
            "Please select a customer.",
            "!"
        );

        return;
    }


    if (
        !Number.isFinite(amount) ||
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
            "Please select a transaction date.",
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


    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        )?.value || "";


    const chequeNumber =
        document.getElementById(
            "chequeNumber"
        )?.value.trim() || "";


    if (
        paymentMethod === "Cheque" &&
        (type === "payment_received" ||
         type === "payment_made") &&
        !chequeNumber
    ) {

        showToast(
            "Please enter the cheque number.",
            "!"
        );

        return;
    }


    const notes =
        document.getElementById(
            "transactionNotes"
        )?.value.trim() || "";


    const existingTransaction =
        editingTransactionId
            ? appData.transactions.find(
                transaction =>
                    transaction.id ===
                    editingTransactionId
            )
            : null;


    const transactionData = {

        id:
            existingTransaction?.id ||
            makeId("transaction"),

        customerId,

        type,

        date,

        amount,

        description,

        paymentMethod:
            type === "payment_received" ||
            type === "payment_made"
                ? paymentMethod
                : "",

        notes,

        createdAt:
            existingTransaction?.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (existingTransaction) {

        Object.assign(
            existingTransaction,
            transactionData
        );

    } else {

        appData.transactions.push(
            transactionData
        );

    }


    const existingCheque =
        appData.cheques.find(
            cheque =>
                cheque.transactionId ===
                transactionData.id
        );


    const isCheque =
        paymentMethod === "Cheque" &&
        (
            type === "payment_received" ||
            type === "payment_made"
        );


    if (isCheque) {

        const chequeData = {

            id:
                existingCheque?.id ||
                makeId("cheque"),

            transactionId:
                transactionData.id,

            customerId,

            chequeNumber,

            bank:
                document
                    .getElementById("chequeBank")
                    ?.value.trim() || "",

            chequeDate:
                document
                    .getElementById("chequeDate")
                    ?.value ||
                date,

            clearanceDate:
                document
                    .getElementById(
                        "chequeClearanceDate"
                    )
                    ?.value || "",

            drawer:
                document
                    .getElementById("chequeDrawer")
                    ?.value.trim() || "",

            status:
                document
                    .getElementById("chequeStatus")
                    ?.value ||
                "Issued"

        };


        if (existingCheque) {

            Object.assign(
                existingCheque,
                chequeData
            );

        } else {

            appData.cheques.push(
                chequeData
            );

        }

    } else if (existingCheque) {

        appData.cheques =
            appData.cheques.filter(
                cheque =>
                    cheque.transactionId !==
                    transactionData.id
            );

    }


    try {

        saveData();

    } catch (error) {

        console.error(
            "Failed to save transaction:",
            error
        );

        showToast(
            "Transaction could not be saved.",
            "!"
        );

        return;
    }


    closeModal();


    const wasEditing =
        Boolean(editingTransactionId);


    editingTransactionId =
        null;


    showToast(
        wasEditing
            ? "Transaction updated successfully."
            : "Transaction saved successfully."
    );


    if (selectedCustomerId) {

        renderCustomerStatement(
            selectedCustomerId
        );

    } else {

        renderView(
            currentView || "dashboard"
        );

    }

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
                    <th>Actions</th>

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

            <td>
                —
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


            const isReceivable =
                transaction.type === "sale";


            const isPaymentReceived =
                transaction.type ===
                "payment_received";


            const isPayable =
                transaction.type === "purchase";


            const isPaymentMade =
                transaction.type === "payment_made";


            const isDebit =
                transaction.type === "debit";


            const isCredit =
                transaction.type === "credit";


            /* -------------------------------------------------
               RUNNING BALANCE
            ------------------------------------------------- */

            if (isReceivable) {

                runningBalance += amount;

            } else if (isPaymentReceived) {

                runningBalance -= amount;

            } else if (isPayable) {

                runningBalance -= amount;

            } else if (isPaymentMade) {

                runningBalance += amount;

            } else if (isDebit) {

                runningBalance += amount;

            } else if (isCredit) {

                runningBalance -= amount;
            }


            const debit =
                isReceivable ||
                isPaymentMade ||
                isDebit;


            const credit =
                isPaymentReceived ||
                isPayable ||
                isCredit;


            let entryLabel = "Adjustment";


            if (isReceivable) {

                entryLabel = "Receivable";

            } else if (isPaymentReceived) {

                entryLabel = "Payment Received";

            } else if (isPayable) {

                entryLabel = "Payable";

            } else if (isPaymentMade) {

                entryLabel = "Payment Made";

            } else if (isDebit) {

                entryLabel = "Debit";

            } else if (isCredit) {

                entryLabel = "Credit";
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
                                        ${entryLabel}
                                    </span>
                                `
                        }

                    </td>

                    <td>

                        ${
                            debit
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
                            credit
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

                    <td>
                        <div class="table-actions">
                            <button
                                type="button"
                                class="secondary-button edit-transaction-button"
                                data-transaction-id="${transaction.id}"
                                style="padding:6px 10px;font-size:11px;white-space:nowrap;"
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                class="secondary-button danger-action delete-transaction-button"
                                data-transaction-id="${transaction.id}"
                                style="padding:6px 10px;font-size:11px;white-space:nowrap;"
                            >
                                Delete
                            </button>
                        </div>
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
                    id="addTransactionButton"
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
                    placeholder="Search transactions..."
                >

            </div>


            <div class="filter-group">

                <select
                    id="transactionCustomerFilter"
                    class="filter-select"
                >

                    <option value="">
                        All Customers
                    </option>

                    ${
                        appData.customers
                            .map(
                                customer => `
                                    <option
                                        value="${customer.id}"
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


                <select
                    id="transactionTypeFilter"
                    class="filter-select"
                >

                    <option value="">
                        All Types
                    </option>

                    <option value="sale">
                        Sale
                    </option>

                    <option value="payment_received">
                        Payment Received
                    </option>

                    <option value="purchase">
                        Purchase
                    </option>

                    <option value="payment_made">
                        Payment Made
                    </option>

                    <option value="debit">
                        Debit
                    </option>

                    <option value="credit">
                        Credit
                    </option>

                </select>

            </div>

        </div>


        <div class="card">

            <div
                id="transactionsTableContainer"
                class="table-wrap"
            >

                ${
                    transactions.length
                        ? transactionsTableHTML(
                            transactions
                        )
                        : emptyStateHTML(
                            "No Transactions",
                            "No transactions match your current filters."
                        )
                }

            </div>

        </div>
    `;


    document
        .getElementById(
            "addTransactionButton"
        )
        ?.addEventListener(
            "click",
            () => openTransactionModal()
        );


    const searchInput =
        document.getElementById(
            "transactionSearch"
        );


    const customerFilter =
        document.getElementById(
            "transactionCustomerFilter"
        );


    const typeFilter =
        document.getElementById(
            "transactionTypeFilter"
        );


    const refresh =
        () => {

            const filtered =
                getFilteredTransactions(
                    searchInput?.value || "",
                    customerFilter?.value || "",
                    typeFilter?.value || ""
                );


            const container =
                document.getElementById(
                    "transactionsTableContainer"
                );


            if (!container) return;


            container.innerHTML =
                filtered.length
                    ? transactionsTableHTML(
                        filtered
                    )
                    : emptyStateHTML(
                        "No Transactions",
                        "No transactions match your current filters."
                    );


            attachTransactionActionListeners();
        };


    searchInput?.addEventListener(
        "input",
        refresh
    );


    customerFilter?.addEventListener(
        "change",
        refresh
    );


    typeFilter?.addEventListener(
        "change",
        refresh
    );


    attachTransactionActionListeners();
}
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

    const customerData = {
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
                    .getElementById("customerOpeningBalance")
                    .value || 0
            )
    };

    if (editingCustomerId) {

        const customer =
            getCustomer(editingCustomerId);

        if (!customer) {
            showToast(
                "Customer could not be found.",
                "!"
            );
            return;
        }

        Object.assign(
            customer,
            customerData
        );

        saveData();

        closeModal();

        showToast(
            "Customer updated successfully."
        );

        editingCustomerId = null;

        renderView("customers");

        return;
    }

    const customer = {

        id:
            makeId("customer"),

        ...customerData,

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
    preselectedCustomerId = null,
    transactionToEdit = null
) {

    editingTransactionId =
        transactionToEdit?.id || null;

    const defaultCustomer =
        transactionToEdit?.customerId ||
        preselectedCustomerId ||
        selectedCustomerId ||
        "";

    openModal(
        editingTransactionId
            ? "Edit Transaction"
            : "Add Transaction",
        editingTransactionId
            ? "Update this customer account entry"
            : "Record a customer account entry",
        transactionFormHTML(
            defaultCustomer,
            transactionToEdit
        )
    );

    setupTransactionForm();
}


/* =========================================================
   TRANSACTION FORM
========================================================= */

function transactionFormHTML(
    customerId,
    transaction = null
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
                        .map(customer => `
                            <option
                                value="${customer.id}"
                                ${customer.id === customerId ? "selected" : ""}
                            >
                                ${escapeHTML(customer.name)}
                            </option>
                        `)
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
    value="${transaction?.type || "sale"}"
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
                        value="${transaction?.date || todayISO()}"
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
                        value="${transaction?.amount ?? ""}"
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
                        value="${escapeAttribute(transaction?.description || "")}"
                        required
                        placeholder="e.g. Tent rental, invoice payment, advance..."
                    >

                </div>

            </div>


            <div id="paymentDetails">

                <div class="form-section">
                function transactionTypeButton(
    type,
    icon,
    title,
    description
) {

    const currentType =
        arguments.length > 4
            ? arguments[4]
            : null;

    return `

        <button
            type="button"
            class="transaction-type-button ${
                (
                    currentType ||
                    "sale"
                ) === type
                    ? "active"
                    : ""
            }"
            data-transaction-type="${type}"
        >

            <span class="transaction-type-icon">
                ${icon}
            </span>

            <span class="transaction-type-content">

                <span class="transaction-type-title">
                    ${title}
                </span>

                <span class="transaction-type-description">
                    ${description}
                </span>

            </span>

        </button>

    `;
}


/* =========================================================
   TRANSACTION FORM SETUP
========================================================= */

function setupTransactionForm() {

    const form =
        document.getElementById(
            "transactionForm"
        );

    if (!form) return;


    const typeButtons =
        document.querySelectorAll(
            ".transaction-type-button"
        );

    const typeInput =
        document.getElementById(
            "transactionType"
        );


    typeButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                typeButtons.forEach(
                    item => {
                        item.classList.remove(
                            "active"
                        );
                    }
                );

                button.classList.add(
                    "active"
                );

                typeInput.value =
                    button.dataset.transactionType;

                updatePaymentVisibility();
            }
        );

    });


    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        );

    if (paymentMethod) {

        paymentMethod.addEventListener(
            "change",
            updateChequeVisibility
        );

    }


    document
        .getElementById("cancelTransaction")
        ?.addEventListener(
            "click",
            closeModal
        );


    updatePaymentVisibility();


    form.addEventListener(
        "submit",
        saveTransaction
    );

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


    const showPayment =
        type === "payment_received" ||
        type === "payment_made";


    paymentDetails.classList.toggle(
        "hidden",
        !showPayment
    );


    if (showPayment) {

        updateChequeVisibility();

    }

}


/* =========================================================
   CHEQUE VISIBILITY
========================================================= */

function updateChequeVisibility() {

    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        )?.value;


    const chequeDetails =
        document.getElementById(
            "chequeDetails"
        );


    if (!chequeDetails) return;


    chequeDetails.classList.toggle(
        "hidden",
        paymentMethod !== "Cheque"
    );

}


/* =========================================================
   SAVE TRANSACTION
========================================================= */

function saveTransaction(event) {

    event.preventDefault();


    const customerElement =
        document.getElementById(
            "transactionCustomer"
        );

    const amountElement =
        document.getElementById(
            "transactionAmount"
        );

    const dateElement =
        document.getElementById(
            "transactionDate"
        );

    const descriptionElement =
        document.getElementById(
            "transactionDescription"
        );

    const typeElement =
        document.getElementById(
            "transactionType"
        );


    if (
        !customerElement ||
        !amountElement ||
        !dateElement ||
        !descriptionElement ||
        !typeElement
    ) {

        showToast(
            "Transaction form could not be loaded.",
            "!"
        );

        return;
    }


    const customerId =
        customerElement.value;


    const amount =
        Number(
            amountElement.value
        );


    const date =
        dateElement.value;


    const description =
        descriptionElement.value.trim();


    const type =
        typeElement.value;


    if (!customerId) {

        showToast(
            "Please select a customer.",
            "!"
        );

        return;
    }


    if (
        !Number.isFinite(amount) ||
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
            "Please select a transaction date.",
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


    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        )?.value || "";


    const chequeNumber =
        document.getElementById(
            "chequeNumber"
        )?.value.trim() || "";


    if (
        paymentMethod === "Cheque" &&
        (
            type === "payment_received" ||
            type === "payment_made"
        ) &&
        !chequeNumber
    ) {

        showToast(
            "Please enter the cheque number.",
            "!"
        );

        return;
    }


    const notes =
        document.getElementById(
            "transactionNotes"
        )?.value.trim() || "";


    const existingTransaction =
        editingTransactionId
            ? appData.transactions.find(
                transaction =>
                    transaction.id ===
                    editingTransactionId
            )
            : null;


    const transactionData = {

        id:
            existingTransaction?.id ||
            makeId("transaction"),

        customerId,

        type,

        date,

        amount,

        description,

        paymentMethod:
            type === "payment_received" ||
            type === "payment_made"
                ? paymentMethod
                : "",

        notes,

        createdAt:
            existingTransaction?.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (existingTransaction) {

        Object.assign(
            existingTransaction,
            transactionData
        );

    } else {

        appData.transactions.push(
            transactionData
        );

    }


    const existingCheque =
        appData.cheques.find(
            cheque =>
                cheque.transactionId ===
                transactionData.id
        );


    const isCheque =
        paymentMethod === "Cheque" &&
        (
            type === "payment_received" ||
            type === "payment_made"
        );


    if (isCheque) {

        const chequeData = {

            id:
                existingCheque?.id ||
                makeId("cheque"),

            transactionId:
                transactionData.id,

            customerId,

            chequeNumber,

            bank:
                document
                    .getElementById("chequeBank")
                    ?.value.trim() || "",

            chequeDate:
                document
                    .getElementById("chequeDate")
                    ?.value ||
                date,

            clearanceDate:
                document
                    .getElementById(
                        "chequeClearanceDate"
                    )
                    ?.value || "",

            drawer:
                document
                    .getElementById("chequeDrawer")
                    ?.value.trim() || "",

            status:
                document
                    .getElementById("chequeStatus")
                    ?.value ||
                "Issued"

        };


        if (existingCheque) {

            Object.assign(
                existingCheque,
                chequeData
            );

        } else {

            appData.cheques.push(
                chequeData
            );

        }

    } else if (existingCheque) {

        appData.cheques =
            appData.cheques.filter(
                cheque =>
                    cheque.transactionId !==
                    transactionData.id
            );

    }


    try {

        saveData();

    } catch (error) {

        console.error(
            "Failed to save transaction:",
            error
        );

        showToast(
            "Transaction could not be saved.",
            "!"
        );

        return;
    }


    closeModal();


    const wasEditing =
        Boolean(editingTransactionId);


    editingTransactionId =
        null;


   const edited =
    Boolean(editingTransactionId);

saveData();

closeModal();

editingTransactionId = null;

showToast(
    edited
        ? "Transaction updated successfully."
        : "Transaction saved successfully."
);


    if (selectedCustomerId) {

        renderCustomerStatement(
            selectedCustomerId
        );

    } else {

        renderView(
            currentView || "dashboard"
        );

    }

}


/* =========================================================
   STATEMENTS
========================================================= */

function renderStatements() {

    const customers =
        [...appData.customers]
            .sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name
                    )
            );


    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h1>Customer Statements</h1>

                <p>
                    View customer balances and detailed account statements.
                </p>

            </div>

        </div>


        <div class="card">

            <div class="search-box">

                <span class="search-icon">
                    ⌕
                </span>

                <input
                    id="statementSearch"
                    type="search"
                    placeholder="Search customers..."
                >

            </div>

        </div>


        <div
            id="statementsCustomerList"
            class="customer-grid"
        >

            ${
                customers.length
                    ? customers
                        .map(
                            customer =>
                                statementCustomerCardHTML(
                                    customer
                                )
                        )
                        .join("")
                    : emptyStateHTML(
                        "No Customers",
                        "Add a customer to create statements."
                    )
            }

        </div>
    `;


    document
        .getElementById(
            "statementSearch"
        )
        ?.addEventListener(
            "input",
            event => {

                const search =
                    event.target.value
                        .trim()
                        .toLowerCase();


                const filtered =
                    customers.filter(
                        customer =>
                            customer.name
                                .toLowerCase()
                                .includes(search) ||
                            (
                                customer.phone ||
                                ""
                            )
                                .toLowerCase()
                                .includes(search)
                    );


                const container =
                    document.getElementById(
                        "statementsCustomerList"
                    );


                if (!container) return;


                container.innerHTML =
                    filtered.length
                        ? filtered
                            .map(
                                customer =>
                                    statementCustomerCardHTML(
                                        customer
                                    )
                            )
                            .join("")
                        : emptyStateHTML(
                            "No Customers Found",
                            "Try a different search."
                        );


                setupStatementCustomerButtons();

            }
        );


    setupStatementCustomerButtons();
}
                    button.dataset
                            .transactionType;
                    updatePaymentVisibility();
                }
            );

        });


    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        );

    if (paymentMethod) {

        paymentMethod.addEventListener(
            "change",
            updateChequeVisibility
        );

    }


    updatePaymentVisibility();


    document
        .getElementById(
            "transactionForm"
        )
        ?.addEventListener(
            "submit",
            saveTransaction
        );

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


    const needsPaymentDetails =
        type === "payment_received" ||
        type === "payment_made";


    paymentDetails.classList.toggle(
        "hidden",
        !needsPaymentDetails
    );


    if (needsPaymentDetails) {

        updateChequeVisibility();

    }

}


/* =========================================================
   CHEQUE VISIBILITY
========================================================= */

function updateChequeVisibility() {

    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        )?.value;


    const chequeDetails =
        document.getElementById(
            "chequeDetails"
        );


    if (!chequeDetails) return;


    chequeDetails.classList.toggle(
        "hidden",
        paymentMethod !== "Cheque"
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
        )?.value;


    const type =
        document.getElementById(
            "transactionType"
        )?.value;


    const date =
        document.getElementById(
            "transactionDate"
        )?.value;


    const amount =
        Number(
            document.getElementById(
                "transactionAmount"
            )?.value
        );


    const description =
        document.getElementById(
            "transactionDescription"
        )?.value
            .trim();


    if (!customerId) {

        showToast(
            "Please select a customer.",
            "!"
        );

        return;
    }


    if (!type) {

        showToast(
            "Please select a transaction type.",
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


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        showToast(
            "Please enter a valid amount.",
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


    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        )?.value || "";


    const chequeNumber =
        document.getElementById(
            "chequeNumber"
        )?.value
            .trim() || "";


    if (
        paymentMethod === "Cheque" &&
        (
            type === "payment_received" ||
            type === "payment_made"
        ) &&
        !chequeNumber
    ) {

        showToast(
            "Please enter the cheque number.",
            "!"
        );

        return;
    }


    const notes =
        document.getElementById(
            "transactionNotes"
        )?.value
            .trim() || "";


    const transactionId =
        editingTransactionId ||
        makeId("transaction");


    const existingTransaction =
        appData.transactions.find(
            transaction =>
                transaction.id ===
                transactionId
        );


    const transaction = {

        id: transactionId,

        customerId,

        type,

        date,

        amount,

        description,

        paymentMethod:
            type === "payment_received" ||
            type === "payment_made"
                ? paymentMethod
                : "",

        notes,

        createdAt:
            existingTransaction?.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (existingTransaction) {

        Object.assign(
            existingTransaction,
            transaction
        );

    } else {

        appData.transactions.push(
            transaction
        );

    }


    const existingCheque =
        appData.cheques.find(
            cheque =>
                cheque.transactionId ===
                transactionId
        );


    const chequePayment =
        paymentMethod === "Cheque" &&
        (
            type === "payment_received" ||
            type === "payment_made"
        );


    if (chequePayment) {

        const cheque = {

            id:
                existingCheque?.id ||
                makeId("cheque"),

            transactionId,

            customerId,

            chequeNumber,

            bank:
                document
                    .getElementById(
                        "chequeBank"
                    )
                    ?.value
                    .trim() || "",

            chequeDate:
                document
                    .getElementById(
                        "chequeDate"
                    )
                    ?.value ||
                date,

            clearanceDate:
                document
                    .getElementById(
                        "chequeClearanceDate"
                    )
                    ?.value || "",

            drawer:
                document
                    .getElementById(
                        "chequeDrawer"
                    )
                    ?.value
                    .trim() || "",

            status:
                document
                    .getElementById(
                        "chequeStatus"
                    )
                    ?.value ||
                "Issued"

        };


        if (existingCheque) {

            Object.assign(
                existingCheque,
                cheque
            );

        } else {

            appData.cheques.push(
                cheque
            );

        }

    } else if (existingCheque) {

        appData.cheques =
            appData.cheques.filter(
                cheque =>
                    cheque.transactionId !==
                    transactionId
            );

    }


    saveData();


    const wasEditing =
        Boolean(
            editingTransactionId
        );


    editingTransactionId = null;


    closeModal();


    showToast(
        wasEditing
            ? "Transaction updated successfully."
            : "Transaction saved successfully."
    );


    if (selectedCustomerId) {

        renderCustomerStatement(
            selectedCustomerId
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
        [...appData.customers]
            .sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name
                    )
            );


    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h1>Customer Statements</h1>

                <p>
                    View customer balances and detailed statements.
                </p>

            </div>

        </div>


        <div class="card">

            <div class="search-box">

                <span class="search-icon">
                    ⌕
                </span>

                <input
                    type="search"
                    id="statementSearch"
                    placeholder="Search customers..."
                >

            </div>

        </div>


        <div
            id="statementsCustomerList"
            class="customer-grid"
        >

            ${
                customers.length
                    ? customers
                        .map(
                            customer =>
                                statementCustomerCardHTML(
                                    customer
                                )
                        )
                        .join("")
                    : emptyStateHTML(
                        "No Customers",
                        "Add a customer to create statements."
                    )
            }

        </div>

    `;


    document
        .getElementById(
            "statementSearch"
        )
        ?.addEventListener(
            "input",
            event => {

                const search =
                    event.target.value
                        .trim()
                        .toLowerCase();


                const filtered =
                    customers.filter(
                        customer =>
                            customer.name
                                .toLowerCase()
                                .includes(search) ||
                            (
                                customer.phone ||
                                ""
                            )
                                .toLowerCase()
                                .includes(search)
                    );


                const container =
                    document.getElementById(
                        "statementsCustomerList"
                    );


                if (!container) return;


                container.innerHTML =
                    filtered.length
                        ? filtered
                            .map(
                                customer =>
                                    statementCustomerCardHTML(
                                        customer
                                    )
                            )
                            .join("")
                        : emptyStateHTML(
                            "No Customers Found",
                            "Try a different search."
                        );


                setupStatementCustomerButtons();

            }
        );


    setupStatementCustomerButtons();

}
/* =========================================================
   SAVE TRANSACTION
========================================================= */

function saveTransaction(event) {

    event.preventDefault();

    const customerElement =
        document.getElementById(
            "transactionCustomer"
        );

    const amountElement =
        document.getElementById(
            "transactionAmount"
        );

    const dateElement =
        document.getElementById(
            "transactionDate"
        );

    const descriptionElement =
        document.getElementById(
            "transactionDescription"
        );

    const typeElement =
        document.getElementById(
            "transactionType"
        );

    if (
        !customerElement ||
        !amountElement ||
        !dateElement ||
        !descriptionElement ||
        !typeElement
    ) {

        showToast(
            "Transaction form could not be loaded.",
            "!"
        );

        return;
    }

    const customerId =
        customerElement.value;

    const amount =
        Number(
            amountElement.value
        );

    const date =
        dateElement.value;

    const description =
        descriptionElement.value.trim();

    const type =
        typeElement.value;

    if (!customerId) {

        showToast(
            "Please select a customer.",
            "!"
        );

        return;
    }

    if (
        !Number.isFinite(amount) ||
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
            "Please select a transaction date.",
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

    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        )?.value || "";

    const chequeNumber =
        document.getElementById(
            "chequeNumber"
        )?.value.trim() || "";

    if (
        paymentMethod === "Cheque" &&
        (
            type === "payment_received" ||
            type === "payment_made"
        ) &&
        !chequeNumber
    ) {

        showToast(
            "Please enter the cheque number.",
            "!"
        );

        return;
    }

    const notes =
        document.getElementById(
            "transactionNotes"
        )?.value.trim() || "";

    const existingTransaction =
        editingTransactionId
            ? appData.transactions.find(
                transaction =>
                    transaction.id ===
                    editingTransactionId
            )
            : null;

    const transactionData = {

        id:
            existingTransaction?.id ||
            makeId("transaction"),

        customerId,

        type,

        date,

        amount,

        description,

        paymentMethod:
            type === "payment_received" ||
            type === "payment_made"
                ? paymentMethod
                : "",

        notes,

        createdAt:
            existingTransaction?.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };

    if (existingTransaction) {

        Object.assign(
            existingTransaction,
            transactionData
        );

    } else {

        appData.transactions.push(
            transactionData
        );

    }

    const existingCheque =
        appData.cheques.find(
            cheque =>
                cheque.transactionId ===
                transactionData.id
        );

    const isCheque =
        paymentMethod === "Cheque" &&
        (
            type === "payment_received" ||
            type === "payment_made"
        );

    if (isCheque) {

        const chequeData = {

            id:
                existingCheque?.id ||
                makeId("cheque"),

            transactionId:
                transactionData.id,

            customerId,

            chequeNumber,

            bank:
                document
                    .getElementById("chequeBank")
                    ?.value.trim() || "",

            chequeDate:
                document
                    .getElementById("chequeDate")
                    ?.value ||
                date,

            clearanceDate:
                document
                    .getElementById(
                        "chequeClearanceDate"
                    )
                    ?.value || "",

            drawer:
                document
                    .getElementById("chequeDrawer")
                    ?.value.trim() || "",

            status:
                document
                    .getElementById("chequeStatus")
                    ?.value ||
                "Issued"

        };

        if (existingCheque) {

            Object.assign(
                existingCheque,
                chequeData
            );

        } else {

            appData.cheques.push(
                chequeData
            );

        }

    } else if (existingCheque) {

        appData.cheques =
            appData.cheques.filter(
                cheque =>
                    cheque.transactionId !==
                    transactionData.id
            );

    }

    try {

        saveData();

    } catch (error) {

        console.error(
            "Failed to save transaction:",
            error
        );

        showToast(
            "Transaction could not be saved.",
            "!"
        );

        return;
    }

    closeModal();

    const wasEditing =
        Boolean(
            editingTransactionId
        );

    editingTransactionId =
        null;

    showToast(
        wasEditing
            ? "Transaction updated successfully."
            : "Transaction saved successfully."
    );

    if (selectedCustomerId) {

        renderCustomerStatement(
            selectedCustomerId
        );

    } else {

        renderView(
            currentView || "dashboard"
        );

    }

}


/* =========================================================
   STATEMENTS
========================================================= */

function renderStatements() {

    const customers =
        [...appData.customers]
            .sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name
                    )
            );

    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h1>Customer Statements</h1>

                <p>
                    View customer balances and detailed account statements.
                </p>

            </div>

        </div>

        <div class="card">

            <div class="search-box">

                <span class="search-icon">
                    ⌕
                </span>

                <input
                    id="statementSearch"
                    type="search"
                    placeholder="Search customers..."
                >

            </div>

        </div>

        <div
            id="statementsCustomerList"
            class="customer-grid"
        >

            ${
                customers.length
                    ? customers
                        .map(
                            customer =>
                                statementCustomerCardHTML(
                                    customer
                                )
                        )
                        .join("")
                    : emptyStateHTML(
                        "No Customers",
                        "Add a customer to create statements."
                    )
            }

        </div>
    `;

    document
        .getElementById(
            "statementSearch"
        )
        ?.addEventListener(
            "input",
            event => {

                const search =
                    event.target.value
                        .trim()
                        .toLowerCase();

                const filtered =
                    customers.filter(
                        customer =>
                            customer.name
                                .toLowerCase()
                                .includes(search) ||
                            (
                                customer.phone ||
                                ""
                            )
                                .toLowerCase()
                                .includes(search)
                    );

                const container =
                    document.getElementById(
                        "statementsCustomerList"
                    );

                if (!container) return;

                container.innerHTML =
                    filtered.length
                        ? filtered
                            .map(
                                customer =>
                                    statementCustomerCardHTML(
                                        customer
                                    )
                            )
                            .join("")
                        : emptyStateHTML(
                            "No Customers Found",
                            "Try a different search."
                        );

                setupStatementCustomerButtons();

            }
        );

    setupStatementCustomerButtons();

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
                    <th>Actions</th>

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

            <td>
                —
            </td>

        </tr>
    `;


    const sortedTransactions =
        [...transactions].sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );


    sortedTransactions.forEach(
        transaction => {

            const amount =
                Number(
                    transaction.amount || 0
                );


            const isSale =
                transaction.type === "sale";


            const isPaymentReceived =
                transaction.type ===
                "payment_received";


            const isPurchase =
                transaction.type === "purchase";


            const isPaymentMade =
                transaction.type ===
                "payment_made";


            const isDebit =
                transaction.type === "debit";


            const isCredit =
                transaction.type === "credit";


            if (isSale) {

                runningBalance += amount;

            } else if (
                isPaymentReceived
            ) {

                runningBalance -= amount;

            } else if (isPurchase) {

                runningBalance -= amount;

            } else if (isPaymentMade) {

                runningBalance += amount;

            } else if (isDebit) {

                runningBalance += amount;

            } else if (isCredit) {

                runningBalance -= amount;

            }


            const debit =
                isSale ||
                isPaymentMade ||
                isDebit;


            const credit =
                isPaymentReceived ||
                isPurchase ||
                isCredit;


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
                                        ${escapeHTML(
                                            transaction.type
                                        )}
                                    </span>
                                `
                        }

                    </td>

                    <td>

                        ${
                            debit
                                ? `
                                    <span class="amount positive">
                                        ${formatMoney(
                                            amount
                                        )}
                                    </span>
                                `
                                : "—"
                        }

                    </td>

                    <td>

                        ${
                            credit
                                ? `
                                    <span class="amount negative">
                                        ${formatMoney(
                                            amount
                                        )}
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

                    <td>

                        <div class="table-actions">

                            <button
                                type="button"
                                class="secondary-button edit-transaction-button"
                                data-transaction-id="${transaction.id}"
                                style="
                                    padding:6px 10px;
                                    font-size:11px;
                                    white-space:nowrap;
                                "
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="secondary-button danger-action delete-transaction-button"
                                data-transaction-id="${transaction.id}"
                                style="
                                    padding:6px 10px;
                                    font-size:11px;
                                    white-space:nowrap;
                                "
                            >
                                Delete
                            </button>

                        </div>

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
   PRINT STATEMENTS
========================================================= */

function printStatements(
    customerIds = null
) {

    const customers =
        customerIds
            ? appData.customers.filter(
                customer =>
                    customerIds.includes(
                        customer.id
                    )
            )
            : appData.customers;


    if (!customers.length) {

        showToast(
            "No customer statements available.",
            "!"
        );

        return;
    }


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


    const statementSections =
        customers
            .map(
                customer => {

                    const transactions =
                        getCustomerTransactions(
                            customer.id
                        );

                    const balance =
                        getCustomerBalance(
                            customer.id
                        );

                    return `

                        <section class="print-statement">

                            <div class="print-header">

                                <div>

                                    <h1>
                                        Al Jefoon Tents
                                    </h1>

                                    <div>
                                        Customer Account Statement
                                    </div>

                                </div>

                                <div class="print-customer">

                                    <strong>
                                        ${escapeHTML(
                                            customer.name
                                        )}
                                    </strong>

                                    ${
                                        customer.phone
                                            ? `<div>
                                                ${escapeHTML(
                                                    customer.phone
                                                )}
                                            </div>`
                                            : ""
                                    }

                                    ${
                                        customer.email
                                            ? `<div>
                                                ${escapeHTML(
                                                    customer.email
                                                )}
                                            </div>`
                                            : ""
                                    }

                                </div>

                            </div>

                            <div class="print-balance">

                                <div>
                                    <span>
                                        Opening Balance
                                    </span>

                                    <strong>
                                        ${formatMoney(
                                            Math.abs(
                                                Number(
                                                    customer.openingBalance || 0
                                                )
                                            )
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Current Balance
                                    </span>

                                    <strong>
                                        ${formatMoney(
                                            Math.abs(
                                                balance
                                            )
                                        )}
                                    </strong>
                                </div>

                            </div>

                            ${statementTableHTML(
                                customer,
                                transactions
                            )}

                        </section>

                    `;
                }
            )
            .join("");


    printWindow.document.open();


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>
                Al Jefoon Tents - Customer Statements
            </title>

            <style>

                * {
                    box-sizing:border-box;
                }

                body {
                    margin:0;
                    padding:20px;
                    font-family:Arial, sans-serif;
                    color:#111;
                    background:#fff;
                }

                .print-statement {
                    margin-bottom:40px;
                    page-break-after:always;
                }

                .print-statement:last-child {
                    page-break-after:auto;
                }

                .print-header {
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                    border-bottom:2px solid #fcc224;
                    padding-bottom:14px;
                    margin-bottom:18px;
                }

                .print-header h1 {
                    margin:0 0 5px;
                    font-size:22px;
                }

                .print-customer {
                    text-align:right;
                }

                .print-balance {
                    display:flex;
                    gap:20px;
                    margin-bottom:18px;
                }

                .print-balance > div {
                    border:1px solid #ddd;
                    padding:10px 14px;
                    min-width:180px;
                }

                .print-balance span {
                    display:block;
                    font-size:10px;
                    color:#666;
                    margin-bottom:4px;
                }

                .print-balance strong {
                    font-size:16px;
                }

                table {
                    width:100%;
                    border-collapse:collapse;
                }

                th,
                td {
                    border:1px solid #ddd;
                    padding:8px;
                    font-size:11px;
                    text-align:left;
                }

                th {
                    background:#f5f5f5;
                }

                .table-actions {
                    display:none;
                }

                .badge {
                    display:inline-block;
                    padding:3px 6px;
                    border:1px solid #ddd;
                    border-radius:4px;
                    font-size:9px;
                }

                .amount {
                    font-weight:600;
                }

                @page {
                    size:A4 landscape;
                    margin:12mm;
                }

            </style>

        </head>

        <body>

            ${statementSections}

        </body>

        </html>

    `);


    printWindow.document.close();


    printWindow.focus();


    setTimeout(
        () => {
            printWindow.print();
        },
        300
    );

}
        ?.addEventListener(
            "input",
            applyTransactionFilters
        );


    document
        .getElementById(
            "transactionTypeFilter"
        )
        ?.addEventListener(
            "change",
            applyTransactionFilters
        );


    attachTransactionActionListeners();
}


/* =========================================================
   APPLY TRANSACTION FILTERS
========================================================= */

function applyTransactionFilters() {

    const search =
        document
            .getElementById(
                "transactionSearch"
            )
            ?.value
            .trim()
            .toLowerCase() || "";


    const type =
        document
            .getElementById(
                "transactionTypeFilter"
            )
            ?.value || "all";


    let transactions =
        [...appData.transactions];


    if (search) {

        transactions =
            transactions.filter(
                transaction => {

                    const customer =
                        getCustomer(
                            transaction.customerId
                        );


                    const customerName =
                        customer?.name
                            ?.toLowerCase() || "";


                    const description =
                        (
                            transaction.description ||
                            ""
                        )
                            .toLowerCase();


                    return (
                        customerName.includes(
                            search
                        ) ||
                        description.includes(
                            search
                        )
                    );

                }
            );

    }


    if (type !== "all") {

        transactions =
            transactions.filter(
                transaction =>
                    transaction.type === type
            );

    }


    const container =
        document.getElementById(
            "transactionsTableCard"
        );


    if (!container) return;


    container.innerHTML =
        transactions.length
            ? transactionTableHTML(
                transactions
            )
            : emptyStateHTML(
                "No Transactions",
                "No transactions match the current filters."
            );


    attachTransactionActionListeners();

}


/* =========================================================
   TRANSACTION TABLE
========================================================= */

function transactionTableHTML(
    transactions
) {

    const sorted =
        [...transactions]
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            );


    let rows = `

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
                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>
    `;


    sorted.forEach(
        transaction => {

            const customer =
                getCustomer(
                    transaction.customerId
                );


            const amount =
                Number(
                    transaction.amount || 0
                );


            const typeLabel =
                transaction.type === "sale"
                    ? "Sale"
                    : transaction.type ===
                      "payment_received"
                        ? "Payment Received"
                        : transaction.type ===
                          "purchase"
                            ? "Purchase"
                            : transaction.type ===
                              "payment_made"
                                ? "Payment Made"
                                : transaction.type ===
                                  "debit"
                                    ? "Debit"
                                    : transaction.type ===
                                      "credit"
                                        ? "Credit"
                                        : "Adjustment";


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
                                customer?.name ||
                                "Unknown Customer"
                            )}
                        </strong>

                    </td>


                    <td>

                        ${escapeHTML(
                            transaction.description ||
                            ""
                        )}

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

                        <span class="badge badge-gold">
                            ${typeLabel}
                        </span>

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

                        <strong>
                            ${formatMoney(
                                amount
                            )}
                        </strong>

                    </td>


                    <td>

                        <div class="table-actions">

                            <button
                                type="button"
                                class="secondary-button edit-transaction-button"
                                data-transaction-id="${transaction.id}"
                                style="
                                    padding:6px 10px;
                                    font-size:11px;
                                    white-space:nowrap;
                                "
                            >
                                Edit
                            </button>


                            <button
                                type="button"
                                class="secondary-button danger-action delete-transaction-button"
                                data-transaction-id="${transaction.id}"
                                style="
                                    padding:6px 10px;
                                    font-size:11px;
                                    white-space:nowrap;
                                "
                            >
                                Delete
                            </button>

                        </div>

                    </td>

                </tr>

            `;

        }
    );


    rows += `

                </tbody>

            </table>

        </div>

    `;


    return rows;

}


/* =========================================================
   TRANSACTION ACTION LISTENERS
========================================================= */

function attachTransactionActionListeners() {

    document
        .querySelectorAll(
            ".edit-transaction-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const transaction =
                            appData.transactions.find(
                                item =>
                                    item.id ===
                                    button.dataset
                                        .transactionId
                            );


                        if (!transaction) {

                            showToast(
                                "Transaction could not be found.",
                                "!"
                            );

                            return;
                        }


                        const cheque =
                            appData.cheques.find(
                                item =>
                                    item.transactionId ===
                                    transaction.id
                            ) || null;


                        openTransactionModal(
                            transaction.customerId,
                            {
                                ...transaction,
                                cheque
                            }
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".delete-transaction-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteTransaction(
                            button.dataset
                                .transactionId
                        );

                    }
                );

            }
        );

}
    if (
        currentView === "customer" &&
        selectedCustomerId
    ) {

        renderCustomerStatement(
            selectedCustomerId
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


    const receivableActivity =
        transactions
            .filter(
                t =>
                    t.type === "sale" ||
                    t.type === "payment_received"
            )
            .reduce(
                (sum, t) =>
                    sum + Number(t.amount || 0),
                0
            );


    const payableActivity =
        transactions
            .filter(
                t =>
                    t.type === "purchase" ||
                    t.type === "payment_made"
            )
            .reduce(
                (sum, t) =>
                    sum + Number(t.amount || 0),
                0
            );


    const adjustments =
        transactions
            .filter(
                t =>
                    t.type === "debit" ||
                    t.type === "credit"
            )
            .reduce(
                (sum, t) =>
                    sum + Number(t.amount || 0),
                0
            );


    const totalActivity =
        receivableActivity +
        payableActivity +
        adjustments;


    const balanceLabel =
        balance > 0
            ? "RECEIVABLE"
            : balance < 0
                ? "PAYABLE"
                : "SETTLED";


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
                            Math.abs(
                                Number(
                                    customer.openingBalance || 0
                                )
                            )
                        )}

                    </div>

                </div>


                <div class="balance-box">

                    <div class="balance-box-label">
                        Total Activity
                    </div>

                    <div class="balance-box-value">

                        ${formatMoney(
                            totalActivity
                        )}

                    </div>

                </div>


                <div class="balance-box">

                    <div class="balance-box-label">
                        ${balanceLabel}
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
                    <th>Actions</th>

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

            <td>
                —
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


            const isReceivable =
                transaction.type === "sale";


            const isPaymentReceived =
                transaction.type ===
                "payment_received";


            const isPayable =
                transaction.type === "purchase";


            const isPaymentMade =
                transaction.type ===
                "payment_made";


            const isDebit =
                transaction.type === "debit";


            const isCredit =
                transaction.type === "credit";


            if (isReceivable) {

                runningBalance += amount;

            } else if (isPaymentReceived) {

                runningBalance -= amount;

            } else if (isPayable) {

                runningBalance -= amount;

            } else if (isPaymentMade) {

                runningBalance += amount;

            } else if (isDebit) {

                runningBalance += amount;

            } else if (isCredit) {

                runningBalance -= amount;

            }


            const debit =
                isReceivable ||
                isPaymentMade ||
                isDebit;


            const credit =
                isPaymentReceived ||
                isPayable ||
                isCredit;


            let entryLabel = "Adjustment";


            if (isReceivable) {

                entryLabel = "Receivable";

            } else if (isPaymentReceived) {

                entryLabel = "Payment Received";

            } else if (isPayable) {

                entryLabel = "Payable";

            } else if (isPaymentMade) {

                entryLabel = "Payment Made";

            } else if (isDebit) {

                entryLabel = "Debit";

            } else if (isCredit) {

                entryLabel = "Credit";

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
                                        ${entryLabel}
                                    </span>
                                `
                        }

                    </td>

                    <td>

                        ${
                            debit
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
                            credit
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

                    <td>

                        <div class="table-actions">

                            <button
                                type="button"
                                class="secondary-button edit-transaction-button"
                                data-transaction-id="${transaction.id}"
                                style="padding:6px 10px;font-size:11px;"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="secondary-button danger-action delete-transaction-button"
                                data-transaction-id="${transaction.id}"
                                style="padding:6px 10px;font-size:11px;"
                            >
                                Delete
                            </button>

                        </div>

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

                <option value="payment_received">
                    Payments Received
                </option>

                <option value="payment_made">
                    Payments Made
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
                        <th>Actions</th>

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


                                const isReceivable =
                                    transaction.type ===
                                    "sale";


                                const isPaymentReceived =
                                    transaction.type ===
                                    "payment_received";


                                const isPayable =
                                    transaction.type ===
                                    "purchase";


                                const isPaymentMade =
                                    transaction.type ===
                                    "payment_made";


                                const isDebit =
                                    transaction.type ===
                                    "debit";


                                const isCredit =
                                    transaction.type ===
                                    "credit";


                                const isPositive =
                                    isReceivable ||
                                    isPaymentMade ||
                                    isDebit;


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
                                                    isPositive
                                                        ? "positive"
                                                        : "negative"
                                                }"
                                            >
                                                ${
                                                    isPositive
                                                        ? "+"
                                                        : "-"
                                                }
                                                ${formatMoney(
                                                    transaction.amount
                                                )}
                                            </span>

                                        </td>

                                        <td>
                                            <div class="table-actions">
                                                <button
                                                    type="button"
                                                    class="secondary-button edit-transaction-button"
                                                    data-transaction-id="${transaction.id}"
                                                    style="padding:6px 10px;font-size:11px;white-space:nowrap;"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    class="secondary-button danger-action delete-transaction-button"
                                                    data-transaction-id="${transaction.id}"
                                                    style="padding:6px 10px;font-size:11px;white-space:nowrap;"
                                                >
                                                    Delete
                                                </button>
                                            </div>
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

        sale:
            ["Credit Sale", "badge-success"],

        payment_received:
            ["Payment Received", "badge-success"],

        purchase:
            ["Credit Purchase", "badge-danger"],

        payment_made:
            ["Payment Made", "badge-danger"],

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
                                cheque.amount ||
                                0
                            ),
                        0
                    )
                )
            )}

            ${chequeSummaryCard(
                "Due Soon",
                dueSoon.length,
                formatMoney(
                    dueSoon.reduce(
                        (sum, cheque) =>
                            sum +
                            Number(
                                cheque.amount ||
                                0
                            ),
                        0
                    )
                )
            )}

            ${chequeSummaryCard(
                "Cleared",
                cleared.length,
                formatMoney(
                    cleared.reduce(
                        (sum, cheque) =>
                            sum +
                            Number(
                                cheque.amount ||
                                0
                            ),
                        0
                    )
                )
            )}

        </div>
/* =========================================================
   CHEQUE SUMMARY
========================================================= */

function chequeSummaryCard(
    title,
    count,
    amount
) {

    return `

        <div class="stat-card">

            <div class="stat-card-label">
                ${title}
            </div>

            <div class="stat-card-value">
                ${count}
            </div>

            <div class="stat-card-meta">
                ${amount}
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
                a.dueDate ||
                a.date
            ) -
            new Date(
                b.dueDate ||
                b.date
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

                    (
                        cheque.chequeNumber ||
                        ""
                    )
                        .toLowerCase()
                        .includes(query)

                    ||

                    (
                        cheque.bankName ||
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

                        <th>Cheque No.</th>
                        <th>Customer</th>
                        <th>Bank</th>
                        <th>Cheque Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>

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
                                            <strong>
                                                ${escapeHTML(
                                                    cheque.chequeNumber ||
                                                    "—"
                                                )}
                                            </strong>
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
                                            ${escapeHTML(
                                                cheque.bankName ||
                                                "—"
                                            )}
                                        </td>

                                        <td>
                                            ${formatDate(
                                                cheque.dueDate ||
                                                cheque.date
                                            )}
                                        </td>

                                        <td>
                                            ${formatMoney(
                                                cheque.amount
                                            )}
                                        </td>

                                        <td>
                                            ${chequeStatusBadge(
                                                cheque.status
                                            )}
                                        </td>

                                        <td>

                                            <div class="table-actions">

                                                <button
                                                    type="button"
                                                    class="secondary-button edit-cheque-button"
                                                    data-cheque-id="${cheque.id}"
                                                    style="padding:6px 10px;font-size:11px;white-space:nowrap;"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    class="secondary-button danger-action delete-cheque-button"
                                                    data-cheque-id="${cheque.id}"
                                                    style="padding:6px 10px;font-size:11px;white-space:nowrap;"
                                                >
                                                    Delete
                                                </button>

                                            </div>

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

    const badges = {

        Issued:
            "badge-warning",

        Deposited:
            "badge-neutral",

        Cleared:
            "badge-success",

        "Returned/Bounced":
            "badge-danger",

        Cancelled:
            "badge-danger"
    };


    return `
        <span class="badge ${
            badges[status] ||
            "badge-neutral"
        }">
            ${escapeHTML(
                status ||
                "Unknown"
            )}
        </span>
    `;
}
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
                                                        getCustomerBalance(
                                                            customer.id
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
            checkbox => {

                checkbox.addEventListener(
                    "change",
                    event => {

                        if (
                            event.target.checked
                        ) {

                            printSelectedCustomers.add(
                                event.target.value
                            );

                        } else {

                            printSelectedCustomers.delete(
                                event.target.value
                            );
                        }


                        updateSelectedCustomerCount();
                    }
                );
            }
        );


    document
        .getElementById(
            "selectAllCustomers"
        )
        ?.addEventListener(
            "click",
            () => {

                appData.customers.forEach(
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
            printSelectedStatements
        );


    updateSelectedCustomerCount();
}


/* =========================================================
   SELECTED CUSTOMER COUNT
========================================================= */

function updateSelectedCustomerCount() {

    const element =
        document.getElementById(
            "selectedCustomerCount"
        );


    if (!element) return;


    element.textContent =
        `${printSelectedCustomers.size} selected`;
}


/* =========================================================
   PRINT SELECTED STATEMENTS
========================================================= */

function printSelectedStatements() {

    const selected =
        appData.customers.filter(
            customer =>
                printSelectedCustomers.has(
                    customer.id
                )
        );


    if (!selected.length) {

        showToast(
            "Please select at least one customer.",
            "!"
        );

        return;
    }


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


    printWindow.document.write(
        buildPrintStatementsHTML(
            selected
        )
    );


    printWindow.document.close();


    printWindow.focus();


    setTimeout(
        () => {

            printWindow.print();

        },
        300
    );
}


/* =========================================================
   BUILD PRINT STATEMENTS HTML
========================================================= */

function buildPrintStatementsHTML(
    customers
) {

    return `<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <title>
        Al Jefoon Tents - Customer Statements
    </title>

    <style>

        * {
            box-sizing:border-box;
        }

        body {
            margin:0;
            padding:20px;
            font-family:Arial,Helvetica,sans-serif;
            color:#111;
            background:#fff;
        }

        .statement {
            page-break-after:always;
        }

        .statement:last-child {
            page-break-after:auto;
        }

        .print-header {
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            border-bottom:3px solid #fcc224;
            padding-bottom:14px;
            margin-bottom:18px;
        }

        .company-name {
            font-size:24px;
            font-weight:800;
        }

        .company-subtitle {
            font-size:14px;
            margin-top:4px;
            color:#555;
        }

        .print-date {
            text-align:right;
            font-size:12px;
            color:#555;
        }

        .customer-info {
            margin-bottom:18px;
        }

        .customer-name {
            font-size:20px;
            font-weight:700;
            margin-bottom:6px;
        }

        .customer-details {
            font-size:12px;
            color:#555;
            line-height:1.6;
        }

        table {
            width:100%;
            border-collapse:collapse;
            font-size:11px;
        }

        th {
            background:#111;
            color:#fff;
            padding:8px;
            text-align:left;
        }

        td {
            border-bottom:1px solid #ddd;
            padding:7px 8px;
            vertical-align:top;
        }

        .amount {
            text-align:right;
            white-space:nowrap;
        }

        .balance {
            font-weight:700;
            text-align:right;
            white-space:nowrap;
        }

        .summary {
            margin-top:18px;
            margin-left:auto;
            width:280px;
            border:1px solid #ddd;
        }

        .summary-row {
            display:flex;
            justify-content:space-between;
            padding:8px 10px;
            border-bottom:1px solid #ddd;
            font-size:12px;
        }

        .summary-row:last-child {
            border-bottom:0;
            background:#fcc224;
            font-weight:800;
        }

        .footer {
            margin-top:28px;
            padding-top:10px;
            border-top:1px solid #ddd;
            font-size:10px;
            color:#777;
            text-align:center;
        }

        @media print {

            body {
                padding:10mm;
            }

        }

    </style>

</head>

<body>

    ${customers
        .map(
            customer =>
                buildSinglePrintStatement(
                    customer
                )
        )
        .join("")
    }

</body>

</html>`;
}
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

                <option value="sale">
                    Credit Sales
                </option>

                <option value="payment_received">
                    Payments Received
                </option>

                <option value="purchase">
                    Credit Purchases
                </option>

                <option value="payment_made">
                    Payments Made
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
                        <th>Actions</th>

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


                                const isReceivable =
                                    transaction.type ===
                                    "sale";


                                const isPaymentReceived =
                                    transaction.type ===
                                    "payment_received";


                                const isPayable =
                                    transaction.type ===
                                    "purchase";


                                const isPaymentMade =
                                    transaction.type ===
                                    "payment_made";


                                const isDebit =
                                    transaction.type ===
                                    "debit";


                                const isCredit =
                                    transaction.type ===
                                    "credit";


                                const isPositive =
                                    isReceivable ||
                                    isPaymentMade ||
                                    isDebit;


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
                                                    isPositive
                                                        ? "positive"
                                                        : "negative"
                                                }"
                                            >
                                                ${
                                                    isPositive
                                                        ? "+"
                                                        : "-"
                                                }
                                                ${formatMoney(
                                                    transaction.amount
                                                )}
                                            </span>

                                        </td>

                                        <td>
                                            <div class="table-actions">
                                                <button
                                                    type="button"
                                                    class="secondary-button edit-transaction-button"
                                                    data-transaction-id="${transaction.id}"
                                                    style="padding:6px 10px;font-size:11px;white-space:nowrap;"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    class="secondary-button danger-action delete-transaction-button"
                                                    data-transaction-id="${transaction.id}"
                                                    style="padding:6px 10px;font-size:11px;white-space:nowrap;"
                                                >
                                                    Delete
                                                </button>
                                            </div>
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

        sale:
            ["Credit Sale", "badge-success"],

        payment_received:
            ["Payment Received", "badge-success"],

        purchase:
            ["Credit Purchase", "badge-danger"],

        payment_made:
            ["Payment Made", "badge-danger"],

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
    title,
    count,
    amount
) {

    return `

        <div class="stat-card">

            <div class="stat-card-label">
                ${title}
            </div>

            <div class="stat-card-value">
                ${count}
            </div>

            <div class="stat-card-meta">
                ${amount}
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
                a.dueDate ||
                a.date
            ) -
            new Date(
                b.dueDate ||
                b.date
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

                    (
                        cheque.chequeNumber ||
                        ""
                    )
                        .toLowerCase()
                        .includes(query)

                    ||

                    (
                        cheque.bankName ||
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
                        <th>Actions</th>

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
                                        <td>
                                            <div class="table-actions">
                                                <button
                                                    type="button"
                                                    class="secondary-button edit-transaction-button"
                                                    data-transaction-id="${cheque.transactionId || ""}"
                                                    style="padding:6px 10px;font-size:11px;white-space:nowrap;"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    class="secondary-button danger-action delete-transaction-button"
                                                    data-transaction-id="${cheque.transactionId || ""}"
                                                    style="padding:6px 10px;font-size:11px;white-space:nowrap;"
                                                >
                                                    Delete
                                                </button>
                                            </div>
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
                        <th>Actions</th>

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
                                        <td>
                                            <div class="table-actions">
                                                <button
                                                    type="button"
                                                    class="secondary-button edit-transaction-button"
                                                    data-transaction-id="${cheque.transactionId || ""}"
                                                    style="padding:6px 10px;font-size:11px;white-space:nowrap;"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    class="secondary-button danger-action delete-transaction-button"
                                                    data-transaction-id="${cheque.transactionId || ""}"
                                                    style="padding:6px 10px;font-size:11px;white-space:nowrap;"
                                                >
                                                    Delete
                                                </button>
                                            </div>
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


                return {
                    ...cheque,
                    days
                };
            }
        )
        .sort(
            (
                a,
                b
            ) =>
                a.days -
                b.days
        );
}

/* =========================================================
   CHEQUE NOTIFICATION HELPERS
========================================================= */

function getChequeNotificationText(
    cheque
) {

    const customer =
        getCustomer(
            cheque.customerId
        );


    const customerName =
        customer
            ? customer.name
            : "Unknown Customer";


    const amount =
        formatMoney(
            cheque.amount
        );


    const days =
        Number(
            cheque.days
        );


    let timing;


    if (days === 0) {

        timing =
            "is due today.";

    } else if (days === 1) {

        timing =
            "is due tomorrow.";

    } else if (days > 1) {

        timing =
            `is due in ${days} days.`;

    } else {

        timing =
            `was due ${Math.abs(days)} days ago.`;
    }


    return (
        `Cheque ${cheque.chequeNumber} ` +
        `for ${amount} from ${customerName} ` +
        `${timing}`
    );
}


/* =========================================================
   SEND CHEQUE NOTIFICATION
========================================================= */

function sendChequeNotification(
    cheque
) {

    if (!cheque) return;


    const message =
        getChequeNotificationText(
            cheque
        );


    if (
        "Notification" in window &&
        Notification.permission ===
            "granted"
    ) {

        new Notification(
            "Cheque Reminder",
            {
                body: message,
                icon: "icon-192.png"
            }
        );

    } else {

        showToast(
            message,
            "!"
        );
    }
}


/* =========================================================
   CHEQUE ALERT CARD
========================================================= */

function chequeAlertCard(
    cheque
) {

    const customer =
        getCustomer(
            cheque.customerId
        );


    const customerName =
        customer
            ? customer.name
            : "Unknown Customer";


    return `

        <div class="alert-item">

            <div class="alert-item-content">

                <strong>
                    ${escapeHTML(
                        customerName
                    )}
                </strong>

                <span>
                    Cheque
                    ${escapeHTML(
                        cheque.chequeNumber
                    )}
                    ·
                    ${formatMoney(
                        cheque.amount
                    )}
                </span>

                <small>
                    ${
                        cheque.clearanceDate
                            ? formatDate(
                                cheque.clearanceDate
                            )
                            : "No clearance date"
                    }
                </small>

            </div>

            <button
                type="button"
                class="secondary-button"
                onclick="sendChequeNotification(
                    appData.cheques.find(
                        item =>
                            item.id ===
                            '${escapeAttribute(
                                cheque.id
                            )}'
                    )
                )"
            >
                Remind
            </button>

        </div>
    `;
}


/* =========================================================
   CHEQUE ALERTS HTML
========================================================= */

function chequeAlertsHTML(
    alerts
) {

    if (
        !alerts ||
        !alerts.length
    ) {

        return emptyStateHTML(
            "No Upcoming Cheques",
            "There are no cheque clearance reminders."
        );
    }


    return `

        <div class="alerts-list">

            ${alerts
                .map(
                    cheque =>
                        chequeAlertCard(
                            cheque
                        )
                )
                .join("")
            }

        </div>
    `;
}

                    }
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
                                .join("")}
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


                    const creditSales =
                        transactions
                            .filter(
                                t =>
                                    t.type ===
                                    "sale"
                            )
                            .reduce(
                                (sum, t) =>
                                    sum +
                                    Number(
                                        t.amount || 0
                                    ),
                                0
                            );


                    const paymentsReceived =
                        transactions
                            .filter(
                                t =>
                                    t.type ===
                                    "payment_received"
                            )
                            .reduce(
                                (sum, t) =>
                                    sum +
                                    Number(
                                        t.amount || 0
                                    ),
                                0
                            );


                    const creditPurchases =
                        transactions
                            .filter(
                                t =>
                                    t.type ===
                                    "purchase"
                            )
                            .reduce(
                                (sum, t) =>
                                    sum +
                                    Number(
                                        t.amount || 0
                                    ),
                                0
                            );


                    const paymentsMade =
                        transactions
                            .filter(
                                t =>
                                    t.type ===
                                    "payment_made"
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
                        creditSales,
                        paymentsReceived,
                        creditPurchases,
                        paymentsMade,
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


    const totalReceivable =
        rows.reduce(
            (sum, row) =>
                sum +
                Math.max(
                    row.balance,
                    0
                ),
            0
        );


    const totalPayable =
        rows.reduce(
            (sum, row) =>
                sum +
                Math.max(
                    -row.balance,
                    0
                ),
            0
        );


    const totalSales =
        rows.reduce(
            (sum, row) =>
                sum +
                row.creditSales,
            0
        );


    const totalPurchases =
        rows.reduce(
            (sum, row) =>
                sum +
                row.creditPurchases,
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
                "Receivable",
                formatMoney(
                    totalReceivable
                ),
                "◉",
                "Customers owing Al Jefoon"
            )}

            ${statCard(
                "Payable",
                formatMoney(
                    totalPayable
                ),
                "↙",
                "Amounts owed to suppliers"
            )}

            ${statCard(
                "Credit Sales",
                formatMoney(
                    totalSales
                ),
                "↑",
                "Total credit sales"
            )}
            ${statCard(
                "Credit Purchases",
                formatMoney(
                    totalPurchases
                ),
                "▤",
                "Total credit purchases"
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
                                        <th>Credit Sales</th>
                                        <th>Payments Received</th>
                                        <th>Credit Purchases</th>
                                        <th>Payments Made</th>
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
                                                            row.creditSales
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatMoney(
                                                            row.paymentsReceived
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatMoney(
                                                            row.creditPurchases
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatMoney(
                                                            row.paymentsMade
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

                                                            ${
                                                                row.balance > 0
                                                                    ? "RECEIVABLE "
                                                                    : row.balance < 0
                                                                        ? "PAYABLE "
                                                                        : "SETTLED "
                                                            }

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
                                                ${statCard(
                "Credit Purchases",
                formatMoney(
                    totalPurchases
                ),
                "▤",
                "Total credit purchases"
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
                                        <th>Credit Sales</th>
                                        <th>Payments Received</th>
                                        <th>Credit Purchases</th>
                                        <th>Payments Made</th>
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
                                                            row.creditSales
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatMoney(
                                                            row.paymentsReceived
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatMoney(
                                                            row.creditPurchases
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatMoney(
                                                            row.paymentsMade
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

                                                            ${
                                                                row.balance > 0
                                                                    ? "RECEIVABLE "
                                                                    : row.balance < 0
                                                                        ? "PAYABLE "
                                                                        : "SETTLED "
                                                            }

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
