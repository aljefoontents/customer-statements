/* =========================================================
   AL JEFOON TENTS
   CUSTOMER STATEMENTS & ACCOUNTS
   VERSION 2.0

   FEATURES
   ---------------------------------------------------------
   - Customers
   - Opening balances
   - Receivables
   - Payables
   - Transactions
   - Payments received
   - Payments made
   - Cheques received
   - Cheques issued
   - Cheque register
   - Edit transactions
   - Delete transactions
   - Edit customers
   - Delete customers
   - Edit cheques
   - Delete cheques
   - Customer statements
   - Running balances
   - Dashboard
   - Print statements
   - JSON backup / restore
   - Dark mode
   - 5-day cheque clearance alerts
========================================================= */

"use strict";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "alJefoonCustomerStatementsV1";
const THEME_KEY = "alJefoonCustomerStatementsTheme";

/* =========================================================
   APPLICATION STATE
========================================================= */

let state = loadState();

let currentView = "dashboard";
let currentCustomerId = null;
let editingTransactionId = null;
let editingCustomerId = null;
let editingChequeId = null;

/* =========================================================
   DEFAULT STATE
========================================================= */

function defaultState() {
    return {
        customers: [],
        transactions: [],
        cheques: [],
        settings: {}
    };
}

/* =========================================================
   LOAD STATE
========================================================= */

function loadState() {

    try {

        const raw =
            localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return defaultState();
        }

        const parsed = JSON.parse(raw);

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
                parsed.settings || {}
        };

    } catch (error) {

        console.error(
            "Unable to load Customer Statements data:",
            error
        );

        return defaultState();
    }
}

/* =========================================================
   SAVE
========================================================= */

function save() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
    );
}

/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function money(value) {

    return `AED ${Number(value || 0).toLocaleString(
        "en-AE",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;
}

function number(value) {

    const n = parseFloat(value);

    return Number.isFinite(n)
        ? n
        : 0;
}

function generateID(prefix = "ID") {

    return (
        prefix +
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 8)
    ).toUpperCase();
}

function today() {

    const d = new Date();

    return (
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0")
    );
}

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const d = new Date(value);

    if (isNaN(d)) {
        return value;
    }

    return d.toLocaleDateString(
        "en-AE",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

/* =========================================================
   CUSTOMER HELPERS
========================================================= */

function getCustomer(id) {

    return state.customers.find(
        customer =>
            customer.id === id
    );
}

function customerName(id) {

    const customer =
        getCustomer(id);

    return customer
        ? customer.name
        : "Unknown Customer";
}

/* =========================================================
   TRANSACTION DIRECTION
=========================================================

   RECEIVABLE
   ----------
   Customer owes Al Jefoon.

   PAYABLE
   -------
   Al Jefoon owes customer.

========================================================= */

const RECEIVABLE = "receivable";
const PAYABLE = "payable";

/* =========================================================
   TRANSACTION TYPES
========================================================= */

const TRANSACTION_TYPES = {

    creditPurchase: {
        label: "Credit Purchase",
        direction: RECEIVABLE
    },

    paymentReceived: {
        label: "Payment Received",
        direction: RECEIVABLE
    },

    advanceReceived: {
        label: "Advance Received",
        direction: PAYABLE
    },

    paymentMade: {
        label: "Payment Made",
        direction: PAYABLE
    },

    debitAdjustment: {
        label: "Debit Adjustment",
        direction: RECEIVABLE
    },

    creditAdjustment: {
        label: "Credit Adjustment",
        direction: PAYABLE
    }
};

/* =========================================================
   GET TRANSACTION TYPE
========================================================= */

function getTransactionType(type) {

    return TRANSACTION_TYPES[type] || {
        label: type || "Transaction",
        direction: RECEIVABLE
    };
}

/* =========================================================
   TRANSACTION DIRECTION LABEL
========================================================= */

function directionLabel(direction) {

    if (direction === PAYABLE) {

        return `
            <span class="direction-badge payable">
                🔴 PAYABLE
            </span>
        `;
    }

    return `
        <span class="direction-badge receivable">
            🟢 RECEIVABLE
        </span>
    `;
}

/* =========================================================
   CALCULATE CUSTOMER TOTALS
========================================================= */

function getCustomerTotals(customerId) {

    let receivable = 0;
    let payable = 0;

    const customer =
        getCustomer(customerId);

    /* ---------------------------------------------
       OPENING BALANCE
       --------------------------------------------- */

    if (customer) {

        const opening =
            number(customer.openingBalance);

        const openingDirection =
            customer.openingDirection ||
            RECEIVABLE;

        if (openingDirection === PAYABLE) {

            payable += opening;

        } else {

            receivable += opening;
        }
    }

    /* ---------------------------------------------
       TRANSACTIONS
       --------------------------------------------- */

    state.transactions
        .filter(
            transaction =>
                transaction.customerId === customerId
        )
        .forEach(transaction => {

            const amount =
                number(transaction.amount);

            const direction =
                transaction.direction ||
                getTransactionType(
                    transaction.type
                ).direction;

            /*
               Payment Received reduces receivable.
            */

            if (
                transaction.type ===
                "paymentReceived"
            ) {

                receivable -= amount;

                return;
            }

            /*
               Payment Made reduces payable.
            */

            if (
                transaction.type ===
                "paymentMade"
            ) {

                payable -= amount;

                return;
            }

            /*
               Other transactions add to
               their respective side.
            */

            if (direction === PAYABLE) {

                payable += amount;

            } else {

                receivable += amount;
            }

        });

    /*
       Never display negative side balances.
       A negative receivable effectively becomes
       payable, and vice versa.
    */

    if (receivable < 0) {

        payable += Math.abs(receivable);

        receivable = 0;
    }

    if (payable < 0) {

        receivable += Math.abs(payable);

        payable = 0;
    }

    return {
        receivable,
        payable,
        net: receivable - payable
    };
}

/* =========================================================
   GET CUSTOMER TRANSACTIONS
========================================================= */

function getCustomerTransactions(customerId) {

    return state.transactions
        .filter(
            transaction =>
                transaction.customerId === customerId
        )
        .sort(
            (a, b) =>
                new Date(a.date || 0) -
                new Date(b.date || 0)
        );
}

/* =========================================================
   RUNNING STATEMENT
========================================================= */

function buildStatement(customerId) {

    const customer =
        getCustomer(customerId);

    if (!customer) {
        return [];
    }

    let receivable = 0;
    let payable = 0;

    const rows = [];

    /* ---------------------------------------------
       OPENING BALANCE
    --------------------------------------------- */

    const opening =
        number(customer.openingBalance);

    const openingDirection =
        customer.openingDirection ||
        RECEIVABLE;

    if (openingDirection === PAYABLE) {

        payable = opening;

    } else {

        receivable = opening;
    }

    rows.push({
        date: customer.openingDate || "",
        description: "Opening Balance",
        type: "opening",
        direction: openingDirection,
        amount: opening,
        receivable,
        payable
    });

    /* ---------------------------------------------
       TRANSACTIONS
    --------------------------------------------- */

    getCustomerTransactions(customerId)
        .forEach(transaction => {

            const amount =
                number(transaction.amount);

            const type =
                getTransactionType(
                    transaction.type
                );

            const direction =
                transaction.direction ||
                type.direction;

            if (
                transaction.type ===
                "paymentReceived"
            ) {

                receivable -= amount;

            } else if (
                transaction.type ===
                "paymentMade"
            ) {

                payable -= amount;

            } else if (
                direction === PAYABLE
            ) {

                payable += amount;

            } else {

                receivable += amount;
            }

            rows.push({

                ...transaction,

                description:
                    transaction.description ||
                    type.label,

                direction,

                receivable,
                payable
            });
        });

    return rows;
}

/* =========================================================
   TOAST
========================================================= */

function toast(message, type = "success") {

    let container =
        $("toastContainer");

    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "toastContainer";

        document.body.appendChild(
            container
        );
    }

    const item =
        document.createElement("div");

    item.className =
        `toast ${type}`;

    item.textContent =
        message;

    container.appendChild(item);

    setTimeout(
        () => item.remove(),
        3500
    );
}

/* =========================================================
   MODAL
========================================================= */

function openModal(content) {

    let modal =
        $("appModal");

    if (!modal) {

        modal =
            document.createElement("div");

        modal.id =
            "appModal";

        modal.className =
            "modal-overlay";

        document.body.appendChild(
            modal
        );
    }

    modal.innerHTML = `
        <div class="modal-card">
            ${content}
        </div>
    `;

    modal.classList.add("show");

    modal.onclick =
        function(event) {

            if (
                event.target === modal
            ) {

                closeModal();
            }
        };
}

function closeModal() {

    const modal =
        $("appModal");

    if (modal) {

        modal.classList.remove(
            "show"
        );
    }
}

/* =========================================================
   CUSTOMER FORM
========================================================= */

function openCustomerForm(customerId = null) {

    editingCustomerId =
        customerId;

    const customer =
        customerId
            ? getCustomer(customerId)
            : null;

    openModal(`

        <div class="modal-header">
            <h2>
                ${customer
                    ? "✏️ Edit Customer"
                    : "👤 Add Customer"}
            </h2>

            <button
                class="modal-close"
                onclick="closeModal()"
            >
                ×
            </button>
        </div>

        <form
            id="customerForm"
            onsubmit="saveCustomer(event)"
        >

            <div class="form-grid">

                <div class="form-group">
                    <label>Customer Name *</label>
                    <input
                        id="customerName"
                        required
                        value="${escapeHTML(
                            customer?.name || ""
                        )}"
                    >
                </div>

                <div class="form-group">
                    <label>Company Name</label>
                    <input
                        id="customerCompany"
                        value="${escapeHTML(
                            customer?.company || ""
                        )}"
                    >
                </div>

                <div class="form-group">
                    <label>Contact Person</label>
                    <input
                        id="customerContact"
                        value="${escapeHTML(
                            customer?.contact || ""
                        )}"
                    >
                </div>

                <div class="form-group">
                    <label>Phone</label>
                    <input
                        id="customerPhone"
                        value="${escapeHTML(
                            customer?.phone || ""
                        )}"
                    >
                </div>

                <div class="form-group">
                    <label>Email</label>
                    <input
                        id="customerEmail"
                        type="email"
                        value="${escapeHTML(
                            customer?.email || ""
                        )}"
                    >
                </div>

                <div class="form-group">
                    <label>Opening Balance</label>
                    <input
                        id="openingBalance"
                        type="number"
                        step="0.01"
                        min="0"
                        value="${customer
                            ? number(
                                customer.openingBalance
                              )
                            : 0}"
                    >
                </div>

                <div class="form-group">
                    <label>Opening Balance Type</label>

                    <select id="openingDirection">

                        <option
                            value="receivable"
                            ${
                                (
                                    customer?.openingDirection ||
                                    RECEIVABLE
                                ) === RECEIVABLE
                                    ? "selected"
                                    : ""
                            }
                        >
                            🟢 Receivable -
                            Customer owes Al Jefoon
                        </option>

                        <option
                            value="payable"
                            ${
                                customer?.openingDirection ===
                                PAYABLE
                                    ? "selected"
                                    : ""
                            }
                        >
                            🔴 Payable -
                            Al Jefoon owes customer
                        </option>

                    </select>
                </div>

                <div class="form-group">
                    <label>Opening Date</label>

                    <input
                        id="openingDate"
                        type="date"
                        value="${
                            customer?.openingDate ||
                            today()
                        }"
                    >
                </div>

                <div class="form-group full">
                    <label>Address</label>

                    <textarea
                        id="customerAddress"
                    >${escapeHTML(
                        customer?.address || ""
                    )}</textarea>
                </div>

                <div class="form-group full">
                    <label>Notes</label>

                    <textarea
                        id="customerNotes"
                    >${escapeHTML(
                        customer?.notes || ""
                    )}</textarea>
                </div>

            </div>

            <div class="modal-actions">

                <button
                    type="button"
                    class="btn secondary"
                    onclick="closeModal()"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="btn primary"
                >
                    💾 Save Customer
                </button>

            </div>

        </form>
    `);
}

/* =========================================================
   SAVE CUSTOMER
========================================================= */

function saveCustomer(event) {

    event.preventDefault();

    const name =
        $("customerName").value.trim();

    if (!name) {

        toast(
            "Customer name is required.",
            "error"
        );

        return;
    }

    const data = {

        name,

        company:
            $("customerCompany").value.trim(),

        contact:
            $("customerContact").value.trim(),

        phone:
            $("customerPhone").value.trim(),

        email:
            $("customerEmail").value.trim(),

        openingBalance:
            number(
                $("openingBalance").value
            ),

        openingDirection:
            $("openingDirection").value,

        openingDate:
            $("openingDate").value ||
            today(),

        address:
            $("customerAddress").value.trim(),

        notes:
            $("customerNotes").value.trim()
    };

    if (editingCustomerId) {

        const customer =
            getCustomer(
                editingCustomerId
            );

        if (customer) {

            Object.assign(
                customer,
                data
            );
        }

        toast(
            "Customer updated successfully."
        );

    } else {

        state.customers.push({

            id:
                generateID("CUS"),

            createdAt:
                new Date().toISOString(),

            ...data
        });

        toast(
            "Customer added successfully."
        );
    }

    save();

    closeModal();

    render();
}

/* =========================================================
   DELETE CUSTOMER
========================================================= */

function deleteCustomer(customerId) {

    const customer =
        getCustomer(customerId);

    if (!customer) {
        return;
    }

    const transactionCount =
        state.transactions.filter(
            transaction =>
                transaction.customerId ===
                customerId
        ).length;

    if (transactionCount > 0) {

        const proceed =
            confirm(
                `This customer has ${transactionCount} transaction(s).\n\nDeleting the customer will also delete those transactions and related cheques.\n\nContinue?`
            );

        if (!proceed) {
            return;
        }

    } else {

        const proceed =
            confirm(
                `Delete ${customer.name}?`
            );

        if (!proceed) {
            return;
        }
    }

    state.customers =
        state.customers.filter(
            customer =>
                customer.id !==
                customerId
        );

    state.transactions =
        state.transactions.filter(
            transaction =>
                transaction.customerId !==
                customerId
        );

    state.cheques =
        state.cheques.filter(
            cheque =>
                cheque.customerId !==
                customerId
        );

    save();

    currentCustomerId =
        null;

    toast(
        "Customer deleted.",
        "success"
    );

    render();
}

/* =========================================================
   TRANSACTION FORM
========================================================= */

function openTransactionForm(
    transactionId = null,
    customerId = null
) {

    editingTransactionId =
        transactionId;

    const transaction =
        transactionId
            ? state.transactions.find(
                item =>
                    item.id ===
                    transactionId
              )
            : null;

    const selectedCustomer =
        customerId ||
        transaction?.customerId ||
        currentCustomerId ||
        "";

    const customers =
        state.customers;

    openModal(`

        <div class="modal-header">

            <h2>
                ${
                    transaction
                        ? "✏️ Edit Transaction"
                        : "➕ Add Transaction"
                }
            </h2>

            <button
                class="modal-close"
                onclick="closeModal()"
            >
                ×
            </button>

        </div>

        <form
            id="transactionForm"
            onsubmit="saveTransaction(event)"
        >

            <div class="form-grid">

                <div class="form-group full">

                    <label>Customer *</label>

                    <select
                        id="transactionCustomer"
                        required
                    >

                        <option value="">
                            Select customer
                        </option>

                        ${customers.map(
                            customer => `
                                <option
                                    value="${customer.id}"
                                    ${
                                        customer.id ===
                                        selectedCustomer
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${escapeHTML(
                                        customer.name
                                    )}
                                </option>
                            `
                        ).join("")}

                    </select>

                </div>

                <div class="form-group">

                    <label>Date *</label>

                    <input
                        id="transactionDate"
                        type="date"
                        required
                        value="${
                            transaction?.date ||
                            today()
                        }"
                    >

                </div>

                <div class="form-group">

                    <label>Transaction Type *</label>

                    <select
                        id="transactionType"
                        onchange="transactionTypeChanged()"
                        required
                    >

                        <option
                            value="creditPurchase"
                            ${
                                transaction?.type ===
                                "creditPurchase"
                                    ? "selected"
                                    : ""
                            }
                        >
                            🟢 Credit Purchase
                            (Receivable)
                        </option>

                        <option
                            value="paymentReceived"
                            ${
                                transaction?.type ===
                                "paymentReceived"
                                    ? "selected"
                                    : ""
                            }
                        >
                            🟢 Payment Received
                            (Receivable)
                        </option>

                        <option
                            value="advanceReceived"
                            ${
                                transaction?.type ===
                                "advanceReceived"
                                    ? "selected"
                                    : ""
                            }
                        >
                            🔴 Advance Received
                            (Payable)
                        </option>

                        <option
                            value="paymentMade"
                            ${
                                transaction?.type ===
                                "paymentMade"
                                    ? "selected"
                                    : ""
                            }
                        >
                            🔴 Payment Made
                            (Payable)
                        </option>

                        <option
                            value="debitAdjustment"
                            ${
                                transaction?.type ===
                                "debitAdjustment"
                                    ? "selected"
                                    : ""
                            }
                        >
                            🟢 Debit Adjustment
                            (Receivable)
                        </option>

                        <option
                            value="creditAdjustment"
                            ${
                                transaction?.type ===
                                "creditAdjustment"
                                    ? "selected"
                                    : ""
                            }
                        >
                            🔴 Credit Adjustment
                            (Payable)
                        </option>

                    </select>

                </div>

                <div class="form-group">

                    <label>Amount *</label>

                    <input
                        id="transactionAmount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value="${
                            transaction
                                ? number(
                                    transaction.amount
                                  )
                                : ""
                        }"
                    >

                </div>

                <div
                    class="form-group"
                    id="paymentMethodGroup"
                >

                    <label>Payment Method</label>

                    <select
                        id="paymentMethod"
                        onchange="paymentMethodChanged()"
                    >

                        <option value="">
                            Select method
                        </option>

                        <option
                            value="Cash"
                            ${
                                transaction?.paymentMethod ===
                                "Cash"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Cash
                        </option>

                        <option
                            value="Cheque"
                            ${
                                transaction?.paymentMethod ===
                                "Cheque"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Cheque
                        </option>

                        <option
                            value="Bank Transfer"
                            ${
                                transaction?.paymentMethod ===
                                "Bank Transfer"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Bank Transfer
                        </option>

                        <option
                            value="BOTIM Transfer"
                            ${
                                transaction?.paymentMethod ===
                                "BOTIM Transfer"
                                    ? "selected"
                                    : ""
                            }
                        >
                            BOTIM Transfer
                        </option>

                        <option
                            value="Other"
                            ${
                                transaction?.paymentMethod ===
                                "Other"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Other
                        </option>

                    </select>

                </div>

                <div class="form-group">

                    <label>Reference</label>

                    <input
                        id="transactionReference"
                        value="${escapeHTML(
                            transaction?.reference ||
                            ""
                        )}"
                    >

                </div>

                <div class="form-group full">

                    <label>Description / Notes</label>

                    <textarea
                        id="transactionDescription"
                    >${escapeHTML(
                        transaction?.description ||
                        ""
                    )}</textarea>

                </div>

            </div>

            <div
                id="transactionDirectionPreview"
                class="direction-preview"
            ></div>

            <div
                id="chequeFields"
                style="display:none"
            >

                <h3>🧾 Cheque Details</h3>

                <div class="form-grid">

                    <div class="form-group">

                        <label>Cheque Number</label>

                        <input
                            id="chequeNumber"
                            value="${escapeHTML(
                                transaction?.chequeNumber ||
                                ""
                            )}"
                        >

                    </div>

                    <div class="form-group">

                        <label>Cheque Date</label>

                        <input
                            id="chequeDate"
                            type="date"
                            value="${
                                transaction?.chequeDate ||
                                ""
                            }"
                        >

                    </div>

                    <div class="form-group">

                        <label>Expected Clearance Date</label>

                        <input
                            id="clearanceDate"
                            type="date"
                            value="${
                                transaction?.clearanceDate ||
                                ""
                            }"
                        >

                    </div>

                    <div class="form-group">

                        <label>Bank Name</label>

                        <input
                            id="chequeBank"
                            value="${escapeHTML(
                                transaction?.chequeBank ||
                                ""
                            )}"
                        >

                    </div>

                    <div class="form-group">

                        <label>Account / Drawer</label>

                        <input
                            id="chequeDrawer"
                            value="${escapeHTML(
                                transaction?.chequeDrawer ||
                                ""
                            )}"
                        >

                    </div>

                    <div class="form-group">

                        <label>Payee</label>

                        <input
                            id="chequePayee"
                            value="${escapeHTML(
                                transaction?.chequePayee ||
                                ""
                            )}"
                        >

                    </div>

                    <div class="form-group">

                        <label>Cheque Status</label>

                        <select id="chequeStatus">

                            ${[
                                "Issued",
                                "Deposited",
                                "Cleared",
                                "Returned/Bounced",
                                "Cancelled"
                            ].map(
                                status => `
                                    <option
                                        value="${status}"
                                        ${
                                            (
                                                transaction?.chequeStatus ||
                                                "Issued"
                                            ) === status
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        ${status}
                                    </option>
                                `
                            ).join("")}

                        </select>

                    </div>

                    <div class="form-group">

                        <label>Actual Clearing Date</label>

                        <input
                            id="actualClearingDate"
                            type="date"
                            value="${
                                transaction?.actualClearingDate ||
                                ""
                            }"
                        >

                    </div>

                </div>

            </div>

            <div class="modal-actions">

                <button
                    type="button"
                    class="btn secondary"
                    onclick="closeModal()"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="btn primary"
                >
                    💾 Save Transaction
                </button>

            </div>

        </form>
    `);

    transactionTypeChanged();
    paymentMethodChanged();
}

/* =========================================================
   TRANSACTION TYPE CHANGED
========================================================= */

function transactionTypeChanged() {

    const type =
        $("transactionType");

    if (!type) {
        return;
    }

    const config =
        getTransactionType(
            type.value
        );

    const preview =
        $("transactionDirectionPreview");

    if (preview) {

        if (
            config.direction ===
            PAYABLE
        ) {

            preview.innerHTML = `
                <strong>🔴 PAYABLE</strong>
                <span>
                    This transaction represents
                    money Al Jefoon owes.
                </span>
            `;

            preview.className =
                "direction-preview payable";

        } else {

            preview.innerHTML = `
                <strong>🟢 RECEIVABLE</strong>
                <span>
                    This transaction represents
                    money the customer owes Al Jefoon.
                </span>
            `;

            preview.className =
                "direction-preview receivable";
        }
    }

    const paymentGroup =
        $("paymentMethodGroup");

    if (paymentGroup) {

        const paymentTypes = [
            "paymentReceived",
            "paymentMade"
        ];

        paymentGroup.style.display =
            paymentTypes.includes(
                type.value
            )
                ? ""
                : "none";
    }
}

/* =========================================================
   PAYMENT METHOD CHANGED
========================================================= */

function paymentMethodChanged() {

    const method =
        $("paymentMethod");

    const chequeFields =
        $("chequeFields");

    if (!method || !chequeFields) {
        return;
    }

    chequeFields.style.display =
        method.value === "Cheque"
            ? ""
            : "none";
}

/* =========================================================
   SAVE TRANSACTION
========================================================= */

function saveTransaction(event) {

    event.preventDefault();

    const customerId =
        $("transactionCustomer").value;

    const type =
        $("transactionType").value;

    const amount =
        number(
            $("transactionAmount").value
        );

    if (!customerId) {

        toast(
            "Please select a customer.",
            "error"
        );

        return;
    }

    if (amount <= 0) {

        toast(
            "Please enter a valid amount.",
            "error"
        );

        return;
    }

    const config =
        getTransactionType(type);

    const data = {

        customerId,

        date:
            $("transactionDate").value ||
            today(),

        type,

        direction:
            config.direction,

        amount,

        paymentMethod:
            $("paymentMethod").value,

        reference:
            $("transactionReference")
                .value
                .trim(),

        description:
            $("transactionDescription")
                .value
                .trim(),

        chequeNumber:
            $("chequeNumber")?.value.trim() ||
            "",

        chequeDate:
            $("chequeDate")?.value ||
            "",

        clearanceDate:
            $("clearanceDate")?.value ||
            "",

        chequeBank:
            $("chequeBank")?.value.trim() ||
            "",

        chequeDrawer:
            $("chequeDrawer")?.value.trim() ||
            "",

        chequePayee:
            $("chequePayee")?.value.trim() ||
            "",

        chequeStatus:
            $("chequeStatus")?.value ||
            "",

        actualClearingDate:
            $("actualClearingDate")?.value ||
            ""
    };

    /* ---------------------------------------------
       EDIT
    --------------------------------------------- */

    if (editingTransactionId) {

        const transaction =
            state.transactions.find(
                item =>
                    item.id ===
                    editingTransactionId
            );

        if (transaction) {

            Object.assign(
                transaction,
                data,
                {
                    updatedAt:
                        new Date().toISOString()
                }
            );
        }

        syncChequeFromTransaction(
            transaction
        );

        toast(
            "Transaction updated successfully."
        );

    } else {

        const transaction = {

            id:
                generateID("TRX"),

            createdAt:
                new Date().toISOString(),

            ...data
        };

        state.transactions.push(
            transaction
        );

        syncChequeFromTransaction(
            transaction
        );

        toast(
            "Transaction added successfully."
        );
    }

    save();

    closeModal();

    render();
}

/* =========================================================
   SYNC CHEQUE FROM TRANSACTION
========================================================= */

function syncChequeFromTransaction(
    transaction
) {

    if (!transaction) {
        return;
    }

    /*
       Only create cheque record when
       payment method is Cheque.
    */

    if (
        transaction.paymentMethod !==
        "Cheque"
    ) {

        state.cheques =
            state.cheques.filter(
                cheque =>
                    cheque.transactionId !==
                    transaction.id
            );

        return;
    }

    const existing =
        state.cheques.find(
            cheque =>
                cheque.transactionId ===
                transaction.id
        );

    const chequeData = {

        transactionId:
            transaction.id,

        customerId:
            transaction.customerId,

        date:
            transaction.chequeDate ||
            transaction.date,

        amount:
            transaction.amount,

        chequeNumber:
            transaction.chequeNumber,

        clearanceDate:
            transaction.clearanceDate,

        bank:
            transaction.chequeBank,

        drawer:
            transaction.chequeDrawer,

        payee:
            transaction.chequePayee,

        status:
            transaction.chequeStatus ||
            "Issued",

        actualClearingDate:
            transaction.actualClearingDate,

        direction:
            transaction.direction
    };

    if (existing) {

        Object.assign(
            existing,
            chequeData,
            {
                updatedAt:
                    new Date().toISOString()
            }
        );

    } else {

        state.cheques.push({

            id:
                generateID("CHQ"),

            createdAt:
                new Date().toISOString(),

            ...chequeData
        });
    }
}

/* =========================================================
   EDIT TRANSACTION
========================================================= */

function editTransaction(
    transactionId
) {

    const transaction =
        state.transactions.find(
            item =>
                item.id ===
                transactionId
        );

    if (!transaction) {

        toast(
            "Transaction not found.",
            "error"
        );

        return;
    }

    openTransactionForm(
        transactionId,
        transaction.customerId
    );
}

/* =========================================================
   DELETE TRANSACTION
========================================================= */

function deleteTransaction(
    transactionId
) {

    const transaction =
        state.transactions.find(
            item =>
                item.id ===
                transactionId
        );

    if (!transaction) {
        return;
    }

    const type =
        getTransactionType(
            transaction.type
        );

    const customer =
        customerName(
            transaction.customerId
        );

    const confirmed =
        confirm(
            `Delete this transaction?\n\n` +
            `Customer: ${customer}\n` +
            `Type: ${type.label}\n` +
            `Amount: ${money(transaction.amount)}\n\n` +
            `This will change the customer's balance.`
        );

    if (!confirmed) {
        return;
    }

    state.transactions =
        state.transactions.filter(
            item =>
                item.id !==
                transactionId
        );

    state.cheques =
        state.cheques.filter(
            cheque =>
                cheque.transactionId !==
                transactionId
        );

    save();

    toast(
        "Transaction deleted."
    );

    render();
}

/* =========================================================
   EDIT CHEQUE
========================================================= */

function editCheque(
    chequeId
) {

    const cheque =
        state.cheques.find(
            item =>
                item.id ===
                chequeId
        );

    if (!cheque) {
        return;
    }

    const transaction =
        state.transactions.find(
            item =>
                item.id ===
                cheque.transactionId
        );

    if (transaction) {

        openTransactionForm(
            transaction.id,
            transaction.customerId
        );

        return;
    }

    openChequeForm(
        chequeId
    );
}

/* =========================================================
   CHEQUE FORM
========================================================= */

function openChequeForm(
    chequeId = null
) {

    editingChequeId =
        chequeId;

    const cheque =
        chequeId
            ? state.cheques.find(
                item =>
                    item.id ===
                    chequeId
              )
            : null;

    openModal(`

        <div class="modal-header">

            <h2>
                ${
                    cheque
                        ? "✏️ Edit Cheque"
                        : "🧾 Add Cheque"
                }
            </h2>

            <button
                class="modal-close"
                onclick="closeModal()"
            >
                ×
            </button>

        </div>

        <form
            onsubmit="saveStandaloneCheque(event)"
        >

            <div class="form-grid">

                <div class="form-group">

                    <label>Customer</label>

                    <select
                        id="chequeCustomer"
                        required
                    >

                        <option value="">
                            Select customer
                        </option>

                        ${state.customers.map(
                            customer => `
                                <option
                                    value="${customer.id}"
                                    ${
                                        customer.id ===
                                        cheque?.customerId
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${escapeHTML(
                                        customer.name
                                    )}
                                </option>
                            `
                        ).join("")}

                    </select>

                </div>

                <div class="form-group">

                    <label>Direction</label>

                    <select id="standaloneChequeDirection">

                        <option
                            value="receivable"
                            ${
                                (
                                    cheque?.direction ||
                                    RECEIVABLE
                                ) === RECEIVABLE
                                    ? "selected"
                                    : ""
                            }
                        >
                            🟢 Receivable
                            - Cheque Received
                        </option>

                        <option
                            value="payable"
                            ${
                                cheque?.direction ===
                                PAYABLE
                                    ? "selected"
                                    : ""
                            }
                        >
                            🔴 Payable
                            - Cheque Issued
                        </option>

                    </select>

                </div>

                <div class="form-group">

                    <label>Amount</label>

                    <input
                        id="standaloneChequeAmount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value="${
                            cheque
                                ? number(
                                    cheque.amount
                                  )
                                : ""
                        }"
                    >

                </div>

                <div class="form-group">

                    <label>Cheque Number</label>

                    <input
                        id="standaloneChequeNumber"
                        value="${escapeHTML(
                            cheque?.chequeNumber ||
                            ""
                        )}"
                    >

                </div>

                <div class="form-group">

                    <label>Cheque Date</label>

                    <input
                        id="standaloneChequeDate"
                        type="date"
                        value="${
                            cheque?.date ||
                            ""
                        }"
                    >

                </div>

                <div class="form-group">

                    <label>Expected Clearance Date</label>

                    <input
                        id="standaloneClearanceDate"
                        type="date"
                        value="${
                            cheque?.clearanceDate ||
                            ""
                        }"
                    >

                </div>

                <div class="form-group">

                    <label>Bank</label>

                    <input
                        id="standaloneChequeBank"
                        value="${escapeHTML(
                            cheque?.bank ||
                            ""
                        )}"
                    >

                </div>

                <div class="form-group">

                    <label>Account / Drawer</label>

                    <input
                        id="standaloneChequeDrawer"
                        value="${escapeHTML(
                            cheque?.drawer ||
                            ""
                        )}"
                    >

                </div>

                <div class="form-group">

                    <label>Payee</label>

                    <input
                        id="standaloneChequePayee"
                        value="${escapeHTML(
                            cheque?.payee ||
                            ""
                        )}"
                    >

                </div>

                <div class="form-group">

                    <label>Status</label>

                    <select id="standaloneChequeStatus">

                        ${[
                            "Issued",
                            "Deposited",
                            "Cleared",
                            "Returned/Bounced",
                            "Cancelled"
                        ].map(
                            status => `
                                <option
                                    value="${status}"
                                    ${
                                        (
                                            cheque?.status ||
                                            "Issued"
                                        ) === status
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${status}
                                </option>
                            `
                        ).join("")}

                    </select>

                </div>

                <div class="form-group">

                    <label>Actual Clearing Date</label>

                    <input
                        id="standaloneActualClearingDate"
                        type="date"
                        value="${
                            cheque?.actualClearingDate ||
                            ""
                        }"
                    >

                </div>

            </div>

            <div class="modal-actions">

                <button
                    type="button"
                    class="btn secondary"
                    onclick="closeModal()"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="btn primary"
                >
                    💾 Save Cheque
                </button>

            </div>

        </form>
    `);
}

/* =========================================================
   SAVE STANDALONE CHEQUE
========================================================= */

function saveStandaloneCheque(event) {

    event.preventDefault();

    const data = {

        customerId:
            $("chequeCustomer").value,

        direction:
            $("standaloneChequeDirection").value,

        amount:
            number(
                $("standaloneChequeAmount").value
            ),

        chequeNumber:
            $("standaloneChequeNumber")
                .value
                .trim(),

        date:
            $("standaloneChequeDate").value,

        clearanceDate:
            $("standaloneClearanceDate").value,

        bank:
            $("standaloneChequeBank")
                .value
                .trim(),

        drawer:
            $("standaloneChequeDrawer")
                .value
                .trim(),

        payee:
            $("standaloneChequePayee")
                .value
                .trim(),

        status:
            $("standaloneChequeStatus").value,

        actualClearingDate:
            $("standaloneActualClearingDate")
                .value
    };

    if (!data.customerId) {

        toast(
            "Please select a customer.",
            "error"
        );

        return;
    }

    if (data.amount <= 0) {

        toast(
            "Please enter a valid amount.",
            "error"
        );

        return;
    }

    if (editingChequeId) {

        const cheque =
            state.cheques.find(
                item =>
                    item.id ===
                    editingChequeId
            );

        if (cheque) {

            Object.assign(
                cheque,
                data
            );
        }

        toast(
            "Cheque updated successfully."
        );

    } else {

        state.cheques.push({

            id:
                generateID("CHQ"),

            createdAt:
                new Date().toISOString(),

            ...data
        });

        toast(
            "Cheque added successfully."
        );
    }

    save();

    closeModal();

    render();
}

/* =========================================================
   DELETE CHEQUE
========================================================= */

function deleteCheque(
    chequeId
) {

    const cheque =
        state.cheques.find(
            item =>
                item.id ===
                chequeId
        );

    if (!cheque) {
        return;
    }

    const confirmed =
        confirm(
            `Delete cheque ${cheque.chequeNumber || ""}?\n\n` +
            `Amount: ${money(cheque.amount)}\n` +
            `Customer: ${customerName(
                cheque.customerId
            )}`
        );

    if (!confirmed) {
        return;
    }

    /*
       If cheque belongs to a transaction,
       remove the cheque details from that
       transaction but DO NOT delete the
       transaction itself.
    */

    if (cheque.transactionId) {

        const transaction =
            state.transactions.find(
                item =>
                    item.id ===
                    cheque.transactionId
            );

        if (transaction) {

            transaction.paymentMethod =
                "";

            transaction.chequeNumber =
                "";

            transaction.chequeDate =
                "";

            transaction.clearanceDate =
                "";

            transaction.chequeBank =
                "";

            transaction.chequeDrawer =
                "";

            transaction.chequePayee =
                "";

            transaction.chequeStatus =
                "";

            transaction.actualClearingDate =
                "";
        }
    }

    state.cheques =
        state.cheques.filter(
            item =>
                item.id !==
                chequeId
        );

    save();

    toast(
        "Cheque deleted."
    );

    render();
}

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

    const customers =
        state.customers;

    let totalReceivable = 0;
    let totalPayable = 0;

    customers.forEach(
        customer => {

            const totals =
                getCustomerTotals(
                    customer.id
                );

            totalReceivable +=
                totals.receivable;

            totalPayable +=
                totals.payable;
        }
    );

    const pendingCheques =
        state.cheques.filter(
            cheque =>
                cheque.status ===
                    "Issued" ||
                cheque.status ===
                    "Deposited"
        );

    const upcoming =
        getUpcomingCheques();

    return `

        <div class="page-header">

            <div>
                <h1>Dashboard</h1>

                <p>
                    Customer accounts overview
                </p>
            </div>

            <button
                class="btn primary"
                onclick="openTransactionForm()"
            >
                ➕ Add Transaction
            </button>

        </div>

        <div class="stats-grid">

            <div class="stat-card receivable">

                <div class="stat-icon">
                    🟢
                </div>

                <div>
                    <span>
                        Total Receivable
                    </span>

                    <strong>
                        ${money(totalReceivable)}
                    </strong>

                    <small>
                        Customers owe Al Jefoon
                    </small>
                </div>

            </div>

            <div class="stat-card payable">

                <div class="stat-icon">
                    🔴
                </div>

                <div>
                    <span>
                        Total Payable
                    </span>

                    <strong>
                        ${money(totalPayable)}
                    </strong>

                    <small>
                        Al Jefoon owes customers
                    </small>
                </div>

            </div>

            <div class="stat-card">

                <div class="stat-icon">
                    👥
                </div>

                <div>
                    <span>
                        Customers
                    </span>

                    <strong>
                        ${customers.length}
                    </strong>
                </div>

            </div>

            <div class="stat-card">

                <div class="stat-icon">
                    🧾
                </div>

                <div>
                    <span>
                        Pending Cheques
                    </span>

                    <strong>
                        ${pendingCheques.length}
                    </strong>
                </div>

            </div>

        </div>

        <div class="dashboard-grid">

            <div class="card">

                <div class="card-header">

                    <h2>
                        Customer Balances
                    </h2>

                    <button
                        class="btn small"
                        onclick="navigate('customers')"
                    >
                        View All
                    </button>

                </div>

                ${renderCustomerBalanceRows()}

            </div>

            <div class="card">

                <div class="card-header">

                    <h2>
                        🔔 Cheque Alerts
                    </h2>

                    <button
                        class="btn small"
                        onclick="navigate('cheques')"
                    >
                        Cheque Register
                    </button>

                </div>

                ${
                    upcoming.length
                        ? upcoming.map(
                            cheque =>
                                renderChequeAlert(
                                    cheque
                                )
                          ).join("")
                        : `
                            <div class="empty-state">
                                No cheques due within 5 days.
                            </div>
                        `
                }

            </div>

        </div>
    `;
}

/* =========================================================
   CUSTOMER BALANCE ROWS
========================================================= */

function renderCustomerBalanceRows() {

    if (!state.customers.length) {

        return `
            <div class="empty-state">
                No customers yet.
            </div>
        `;
    }

    return state.customers
        .slice(0, 10)
        .map(customer => {

            const totals =
                getCustomerTotals(
                    customer.id
                );

            let status = "";

            if (
                totals.receivable >
                0.009
            ) {

                status = `
                    <span class="balance-badge receivable">
                        🟢 Receivable
                    </span>
                `;

            } else if (
                totals.payable >
                0.009
            ) {

                status = `
                    <span class="balance-badge payable">
                        🔴 Payable
                    </span>
                `;

            } else {

                status = `
                    <span class="balance-badge settled">
                        ✓ Settled
                    </span>
                `;
            }

            return `

                <div
                    class="customer-balance-row"
                    onclick="openCustomer('${customer.id}')"
                >

                    <div>

                        <strong>
                            ${escapeHTML(
                                customer.name
                            )}
                        </strong>

                        <small>
                            ${
                                customer.company
                                    ? escapeHTML(
                                        customer.company
                                      )
                                    : ""
                            }
                        </small>

                    </div>

                    <div class="balance-values">

                        ${status}

                        ${
                            totals.receivable
                                ? `
                                    <span class="receivable-text">
                                        ${money(
                                            totals.receivable
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                        ${
                            totals.payable
                                ? `
                                    <span class="payable-text">
                                        ${money(
                                            totals.payable
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                    </div>

                </div>
            `;

        })
        .join("");
}

/* =========================================================
   CUSTOMER LIST
========================================================= */

function renderCustomers() {

    return `

        <div class="page-header">

            <div>
                <h1>Customers</h1>

                <p>
                    Manage customer accounts
                </p>
            </div>

            <button
                class="btn primary"
                onclick="openCustomerForm()"
            >
                ➕ Add Customer
            </button>

        </div>

        <div class="card">

            <div class="search-bar">

                <input
                    id="customerSearch"
                    placeholder="🔎 Search customers..."
                    oninput="filterCustomers()"
                >

            </div>

            <div id="customerList">

                ${renderCustomerCards()}

            </div>

        </div>
    `;
}

/* =========================================================
   CUSTOMER CARDS
========================================================= */

function renderCustomerCards(
    search = ""
) {

    const term =
        String(search)
            .toLowerCase()
            .trim();

    const customers =
        state.customers.filter(
            customer =>
                !term ||
                String(
                    customer.name
                )
                    .toLowerCase()
                    .includes(term) ||
                String(
                    customer.company
                )
                    .toLowerCase()
                    .includes(term) ||
                String(
                    customer.phone
                )
                    .toLowerCase()
                    .includes(term)
        );

    if (!customers.length) {

        return `
            <div class="empty-state">
                No customers found.
            </div>
        `;
    }

    return `
        <div class="customer-grid">

            ${customers.map(
                customer => {

                    const totals =
                        getCustomerTotals(
                            customer.id
                        );

                    return `

                        <div class="customer-card">

                            <div class="customer-card-top">

                                <div class="customer-avatar">
                                    👤
                                </div>

                                <div>

                                    <h3>
                                        ${escapeHTML(
                                            customer.name
                                        )}
                                    </h3>

                                    <p>
                                        ${escapeHTML(
                                            customer.company ||
                                            ""
                                        )}
                                    </p>

                                </div>

                            </div>

                            <div class="customer-financials">

                                <div class="financial-item receivable">

                                    <span>
                                        🟢 Receivable
                                    </span>

                                    <strong>
                                        ${money(
                                            totals.receivable
                                        )}
                                    </strong>

                                </div>

                                <div class="financial-item payable">

                                    <span>
                                        🔴 Payable
                                    </span>

                                    <strong>
                                        ${money(
                                            totals.payable
                                        )}
                                    </strong>

                                </div>

                            </div>

                            <div class="customer-actions">

                                <button
                                    class="btn small primary"
                                    onclick="openCustomer('${customer.id}')"
                                >
                                    📒 Statement
                                </button>

                                <button
                                    class="btn small"
                                    onclick="openCustomerForm('${customer.id}')"
                                >
                                    ✏️ Edit
                                </button>

                                <button
                                    class="btn small danger"
                                    onclick="deleteCustomer('${customer.id}')"
                                >
                                    🗑️
                                </button>

                            </div>

                        </div>
                    `;
                }
            ).join("")}

        </div>
    `;
}

/* =========================================================
   FILTER CUSTOMERS
========================================================= */

function filterCustomers() {

    const search =
        $("customerSearch")?.value ||
        "";

    const list =
        $("customerList");

    if (list) {

        list.innerHTML =
            renderCustomerCards(
                search
            );
    }
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

        return `
            <div class="empty-state">
                Customer not found.
            </div>
        `;
    }

    const totals =
        getCustomerTotals(
            customerId
        );

    const statement =
        buildStatement(
            customerId
        );

    return `

        <div class="page-header">

            <div>

                <button
                    class="back-button"
                    onclick="navigate('customers')"
                >
                    ← Back to Customers
                </button>

                <h1>
                    ${escapeHTML(
                        customer.name
                    )}
                </h1>

                <p>
                    Customer Statement
                </p>

            </div>

            <div class="header-actions">

                <button
                    class="btn"
                    onclick="openCustomerForm('${customer.id}')"
                >
                    ✏️ Edit Customer
                </button>

                <button
                    class="btn primary"
                    onclick="openTransactionForm(null, '${customer.id}')"
                >
                    ➕ Add Transaction
                </button>

                <button
                    class="btn"
                    onclick="printStatement('${customer.id}')"
                >
                    🖨️ Print
                </button>

            </div>

        </div>

        <div class="account-summary-grid">

            <div class="account-summary-card receivable">

                <span>
                    🟢 RECEIVABLE
                </span>

                <strong>
                    ${money(
                        totals.receivable
                    )}
                </strong>

                <small>
                    Customer owes Al Jefoon
                </small>

            </div>

            <div class="account-summary-card payable">

                <span>
                    🔴 PAYABLE
                </span>

                <strong>
                    ${money(
                        totals.payable
                    )}
                </strong>

                <small>
                    Al Jefoon owes customer
                </small>

            </div>

            <div class="account-summary-card">

                <span>
                    NET POSITION
                </span>

                <strong>

                    ${
                        totals.receivable >=
                        totals.payable
                            ? "🟢 " +
                              money(
                                  totals.receivable -
                                  totals.payable
                              )
                            : "🔴 " +
                              money(
                                  totals.payable -
                                  totals.receivable
                              )
                    }

                </strong>

                <small>

                    ${
                        totals.receivable >=
                        totals.payable
                            ? "Receivable"
                            : "Payable"
                    }

                </small>

            </div>

        </div>

        <div class="card statement-card">

            <div class="card-header">

                <div>

                    <h2>
                        Account Statement
                    </h2>

                    <p>
                        ${
                            customer.company
                                ? escapeHTML(
                                    customer.company
                                  )
                                : ""
                        }
                    </p>

                </div>

                <div class="statement-legend">

                    <span>
                        🟢 Receivable
                    </span>

                    <span>
                        🔴 Payable
                    </span>

                </div>

            </div>

            <div class="table-wrapper">

                <table class="data-table">

                    <thead>

                        <tr>

                            <th>Date</th>

                            <th>Description</th>

                            <th>Direction</th>

                            <th>Reference</th>

                            <th>Amount</th>

                            <th>Receivable</th>

                            <th>Payable</th>

                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${statement.map(
                            row =>
                                renderStatementRow(
                                    row
                                )
                        ).join("")}

                    </tbody>

                </table>

            </div>

        </div>
    `;
}

/* =========================================================
   STATEMENT ROW
========================================================= */

function renderStatementRow(
    row
) {

    const isOpening =
        row.type === "opening";

    const direction =
        row.direction ||
        RECEIVABLE;

    const transactionId =
        row.id;

    return `

        <tr>

            <td>
                ${formatDate(
                    row.date
                )}
            </td>

            <td>

                <strong>
                    ${escapeHTML(
                        row.description ||
                        "Transaction"
                    )}
                </strong>

                ${
                    row.paymentMethod
                        ? `
                            <small class="table-sub">
                                ${escapeHTML(
                                    row.paymentMethod
                                )}
                            </small>
                          `
                        : ""
                }

            </td>

            <td>

                ${directionLabel(
                    direction
                )}

            </td>

            <td>
                ${escapeHTML(
                    row.reference ||
                    "-"
                )}
            </td>

            <td>
                <strong>
                    ${money(
                        row.amount
                    )}
                </strong>
            </td>

            <td>

                ${
                    row.receivable !==
                    undefined
                        ? money(
                            Math.max(
                                0,
                                row.receivable
                            )
                          )
                        : "-"
                }

            </td>

            <td>

                ${
                    row.payable !==
                    undefined
                        ? money(
                            Math.max(
                                0,
                                row.payable
                            )
                          )
                        : "-"
                }

            </td>

            <td>

                ${
                    isOpening
                        ? `
                            <span class="muted">
                                Opening
                            </span>
                          `
                        : `
                            <div class="row-actions">

                                <button
                                    class="icon-btn"
                                    title="Edit"
                                    onclick="editTransaction('${transactionId}')"
                                >
                                    ✏️
                                </button>

                                <button
                                    class="icon-btn danger"
                                    title="Delete"
                                    onclick="deleteTransaction('${transactionId}')"
                                >
                                    🗑️
                                </button>

                            </div>
                          `
                }

            </td>

        </tr>
    `;
}

/* =========================================================
   TRANSACTIONS PAGE
========================================================= */

function renderTransactions() {

    const transactions =
        [...state.transactions]
            .sort(
                (a, b) =>
                    new Date(
                        b.date || 0
                    ) -
                    new Date(
                        a.date || 0
                    )
            );

    return `

        <div class="page-header">

            <div>

                <h1>
                    Transactions
                </h1>

                <p>
                    Receivables and payables
                </p>

            </div>

            <button
                class="btn primary"
                onclick="openTransactionForm()"
            >
                ➕ Add Transaction
            </button>

        </div>

        <div class="card">

            <div class="table-wrapper">

                <table class="data-table">

                    <thead>

                        <tr>

                            <th>Date</th>
                            <th>Customer</th>
                            <th>Transaction</th>
                            <th>Direction</th>
                            <th>Method</th>
                            <th>Amount</th>
                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${
                            transactions.length
                                ? transactions.map(
                                    transaction =>
                                        renderTransactionRow(
                                            transaction
                                        )
                                  ).join("")
                                : `
                                    <tr>
                                        <td
                                            colspan="7"
                                            class="empty-table"
                                        >
                                            No transactions yet.
                                        </td>
                                    </tr>
                                  `
                        }

                    </tbody>

                </table>

            </div>

        </div>
    `;
}

/* =========================================================
   TRANSACTION ROW
========================================================= */

function renderTransactionRow(
    transaction
) {

    const config =
        getTransactionType(
            transaction.type
        );

    return `

        <tr>

            <td>
                ${formatDate(
                    transaction.date
                )}
            </td>

            <td>
                <strong>
                    ${escapeHTML(
                        customerName(
                            transaction.customerId
                        )
                    )}
                </strong>
            </td>

            <td>
                ${escapeHTML(
                    config.label
                )}
            </td>

            <td>

                ${directionLabel(
                    transaction.direction ||
                    config.direction
                )}

            </td>

            <td>
                ${escapeHTML(
                    transaction.paymentMethod ||
                    "-"
                )}
            </td>

            <td>
                <strong>
                    ${money(
                        transaction.amount
                    )}
                </strong>
            </td>

            <td>

                <div class="row-actions">

                    <button
                        class="icon-btn"
                        title="Edit"
                        onclick="editTransaction('${transaction.id}')"
                    >
                        ✏️
                    </button>

                    <button
                        class="icon-btn danger"
                        title="Delete"
                        onclick="deleteTransaction('${transaction.id}')"
                    >
                        🗑️
                    </button>

                </div>

            </td>

        </tr>
    `;
}

/* =========================================================
   CHEQUE REGISTER
========================================================= */

function renderCheques() {

    const cheques =
        [...state.cheques]
            .sort(
                (a, b) =>
                    new Date(
                        a.clearanceDate || a.date || 0
                    ) -
                    new Date(
                        b.clearanceDate || b.date || 0
                    )
            );

    return `

        <div class="page-header">

            <div>

                <h1>
                    Cheque Register
                </h1>

                <p>
                    Track receivable and payable cheques
                </p>

            </div>

        </div>

        <div class="card">

            <div class="table-wrapper">

                <table class="data-table">

                    <thead>

                        <tr>

                            <th>Direction</th>
                            <th>Customer</th>
                            <th>Cheque No.</th>
                            <th>Cheque Date</th>
                            <th>Clearance</th>
                            <th>Bank</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${
                            cheques.length
                                ? cheques.map(
                                    cheque =>
                                        renderChequeRow(
                                            cheque
                                        )
                                  ).join("")
                                : `
                                    <tr>
                                        <td
                                            colspan="9"
                                            class="empty-table"
                                        >
                                            No cheques recorded.
                                        </td>
                                    </tr>
                                  `
                        }

                    </tbody>

                </table>

            </div>

        </div>
    `;
}

/* =========================================================
   CHEQUE ROW
========================================================= */

function renderChequeRow(
    cheque
) {

    const direction =
        cheque.direction ||
        RECEIVABLE;

    return `

        <tr>

            <td>

                ${
                    direction === PAYABLE
                        ? `
                            <span class="direction-badge payable">
                                🔴 PAYABLE
                            </span>
                            <small>
                                Cheque Issued
                            </small>
                          `
                        : `
                            <span class="direction-badge receivable">
                                🟢 RECEIVABLE
                            </span>
                            <small>
                                Cheque Received
                            </small>
                          `
                }

            </td>

            <td>
                ${escapeHTML(
                    customerName(
                        cheque.customerId
                    )
                )}
            </td>

            <td>
                ${escapeHTML(
                    cheque.chequeNumber ||
                    "-"
                )}
            </td>

            <td>
                ${formatDate(
                    cheque.date
                )}
            </td>

            <td>

                ${
                    cheque.clearanceDate
                        ? formatDate(
                            cheque.clearanceDate
                          )
                        : "-"
                }

            </td>

            <td>
                ${escapeHTML(
                    cheque.bank ||
                    "-"
                )}
            </td>

            <td>
                <strong>
                    ${money(
                        cheque.amount
                    )}
                </strong>
            </td>

            <td>
                <span class="status-badge">
                    ${escapeHTML(
                        cheque.status ||
                        "Issued"
                    )}
                </span>
            </td>

            <td>

                <div class="row-actions">

                    <button
                        class="icon-btn"
                        title="Edit"
                        onclick="editCheque('${cheque.id}')"
                    >
                        ✏️
                    </button>

                    <button
                        class="icon-btn danger"
                        title="Delete"
                        onclick="deleteCheque('${cheque.id}')"
                    >
                        🗑️
                    </button>

                </div>

            </td>

        </tr>
    `;
}

/* =========================================================
   UPCOMING CHEQUES
========================================================= */

function getUpcomingCheques() {

    const now =
        new Date();

    now.setHours(
        0,
        0,
        0,
        0
    );

    const fiveDays =
        new Date(now);

    fiveDays.setDate(
        fiveDays.getDate() + 5
    );

    return state.cheques
        .filter(
            cheque => {

                if (
                    cheque.status !==
                        "Issued" &&
                    cheque.status !==
                        "Deposited"
                ) {

                    return false;
                }

                if (
                    !cheque.clearanceDate
                ) {

                    return false;
                }

                const date =
                    new Date(
                        cheque.clearanceDate
                    );

                date.setHours(
                    0,
                    0,
                    0,
                    0
                );

                return (
                    date >= now &&
                    date <= fiveDays
                );
            }
        )
        .sort(
            (a, b) =>
                new Date(
                    a.clearanceDate
                ) -
                new Date(
                    b.clearanceDate
                )
        );
}

/* =========================================================
   CHEQUE ALERT
========================================================= */

function renderChequeAlert(
    cheque
) {

    const direction =
        cheque.direction ||
        RECEIVABLE;

    return `

        <div
            class="alert-item ${
                direction === PAYABLE
                    ? "payable"
                    : "receivable"
            }"
        >

            <div>

                <strong>

                    ${
                        direction === PAYABLE
                            ? "🔴 PAYABLE"
                            : "🟢 RECEIVABLE"
                    }

                </strong>

                <span>
                    ${escapeHTML(
                        customerName(
                            cheque.customerId
                        )
                    )}
                </span>

                <small>
                    Cheque ${
                        escapeHTML(
                            cheque.chequeNumber ||
                            "-"
                        )
                    }
                    · Clears
                    ${formatDate(
                        cheque.clearanceDate
                    )}
                </small>

            </div>

            <strong>
                ${money(
                    cheque.amount
                )}
            </strong>

        </div>
    `;
}

/* =========================================================
   PRINT STATEMENT
========================================================= */

function printStatement(
    customerId
) {

    const customer =
        getCustomer(customerId);

    if (!customer) {
        return;
    }

    const totals =
        getCustomerTotals(
            customerId
        );

    const statement =
        buildStatement(
            customerId
        );

    const win =
        window.open(
            "",
            "_blank"
        );

    if (!win) {

        toast(
            "Please allow pop-ups to print.",
            "error"
        );

        return;
    }

    win.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                ${escapeHTML(
                    customer.name
                )} - Statement
            </title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {
                    font-family:
                        Arial,
                        sans-serif;

                    margin: 30px;

                    color: #111;
                }

                h1 {
                    margin-bottom: 4px;
                }

                .header {
                    border-bottom:
                        3px solid #fcc224;

                    padding-bottom:
                        15px;

                    margin-bottom:
                        20px;
                }

                .brand {
                    font-weight: bold;
                    font-size: 20px;
                }

                .summary {
                    display: grid;
                    grid-template-columns:
                        repeat(3, 1fr);

                    gap: 12px;

                    margin-bottom:
                        20px;
                }

                .box {
                    border:
                        1px solid #ddd;

                    padding: 14px;

                    border-radius: 8px;
                }

                .box strong {
                    display: block;
                    font-size: 20px;
                    margin-top: 5px;
                }

                .receivable {
                    border-left:
                        5px solid #1f9d55;
                }

                .payable {
                    border-left:
                        5px solid #d93025;
                }

                table {
                    width: 100%;
                    border-collapse:
                        collapse;
                }

                th,
                td {
                    border:
                        1px solid #ddd;

                    padding:
                        8px;

                    text-align:
                        left;

                    font-size:
                        12px;
                }

                th {
                    background:
                        #f5f5f5;
                }

                .right {
                    text-align:
                        right;
                }

                .footer {
                    margin-top:
                        30px;

                    font-size:
                        11px;

                    color:
                        #666;
                }

                @media print {

                    body {
                        margin:
                            15mm;
                    }

                }

            </style>

        </head>

        <body>

            <div class="header">

                <div class="brand">
                    AL JEFOON TENTS
                </div>

                <h1>
                    Customer Statement
                </h1>

                <strong>
                    ${escapeHTML(
                        customer.name
                    )}
                </strong>

                ${
                    customer.company
                        ? `<div>
                            ${escapeHTML(
                                customer.company
                            )}
                           </div>`
                        : ""
                }

            </div>

            <div class="summary">

                <div class="box receivable">

                    🟢 RECEIVABLE

                    <strong>
                        ${money(
                            totals.receivable
                        )}
                    </strong>

                    Customer owes Al Jefoon

                </div>

                <div class="box payable">

                    🔴 PAYABLE

                    <strong>
                        ${money(
                            totals.payable
                        )}
                    </strong>

                    Al Jefoon owes customer

                </div>

                <div class="box">

                    NET POSITION

                    <strong>
                        ${
                            totals.receivable >=
                            totals.payable
                                ? money(
                                    totals.receivable -
                                    totals.payable
                                  ) +
                                  " RECEIVABLE"
                                : money(
                                    totals.payable -
                                    totals.receivable
                                  ) +
                                  " PAYABLE"
                        }
                    </strong>

                </div>

            </div>

            <table>

                <thead>

                    <tr>

                        <th>Date</th>
                        <th>Description</th>
                        <th>Direction</th>
                        <th>Reference</th>
                        <th class="right">
                            Amount
                        </th>
                        <th class="right">
                            Receivable
                        </th>
                        <th class="right">
                            Payable
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${statement.map(
                        row => `

                            <tr>

                                <td>
                                    ${formatDate(
                                        row.date
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        row.description ||
                                        ""
                                    )}
                                </td>

                                <td>
                                    ${
                                        row.direction ===
                                        PAYABLE
                                            ? "🔴 PAYABLE"
                                            : "🟢 RECEIVABLE"
                                    }
                                </td>

                                <td>
                                    ${escapeHTML(
                                        row.reference ||
                                        "-"
                                    )}
                                </td>

                                <td class="right">
                                    ${money(
                                        row.amount
                                    )}
                                </td>

                                <td class="right">
                                    ${money(
                                        Math.max(
                                            0,
                                            row.receivable ||
                                            0
                                        )
                                    )}
                                </td>

                                <td class="right">
                                    ${money(
                                        Math.max(
                                            0,
                                            row.payable ||
                                            0
                                        )
                                    )}
                                </td>

                            </tr>

                        `
                    ).join("")}

                </tbody>

            </table>

            <div class="footer">

                Printed:
                ${new Date().toLocaleString(
                    "en-AE"
                )}

                <br><br>

                Al Jefoon Tents

            </div>

            <script>

                window.onload =
                    function () {

                        window.print();

                    };

            <\/script>

        </body>

        </html>
    `);

    win.document.close();
}

/* =========================================================
   PRINT MULTIPLE STATEMENTS
========================================================= */

function printSelectedStatements() {

    if (!state.customers.length) {

        toast(
            "No customers available.",
            "error"
        );

        return;
    }

    openModal(`

        <div class="modal-header">

            <h2>
                🖨️ Print Statements
            </h2>

            <button
                class="modal-close"
                onclick="closeModal()"
            >
                ×
            </button>

        </div>

        <div class="print-customer-list">

            ${state.customers.map(
                customer => `
                    <label class="checkbox-row">

                        <input
                            type="checkbox"
                            name="printCustomer"
                            value="${customer.id}"
                        >

                        <span>
                            ${escapeHTML(
                                customer.name
                            )}
                        </span>

                    </label>
                `
            ).join("")}

        </div>

        <div class="modal-actions">

            <button
                class="btn"
                onclick="selectAllPrintCustomers(true)"
            >
                Select All
            </button>

            <button
                class="btn"
                onclick="selectAllPrintCustomers(false)"
            >
                Clear
            </button>

            <button
                class="btn primary"
                onclick="printSelectedCustomers()"
            >
                🖨️ Print Selected
            </button>

        </div>
    `);
}

/* =========================================================
   SELECT PRINT CUSTOMERS
========================================================= */

function selectAllPrintCustomers(
    checked
) {

    document
        .querySelectorAll(
            'input[name="printCustomer"]'
        )
        .forEach(
            checkbox =>
                checkbox.checked =
                    checked
        );
}

/* =========================================================
   PRINT SELECTED CUSTOMERS
========================================================= */

function printSelectedCustomers() {

    const ids =
        Array.from(
            document.querySelectorAll(
                'input[name="printCustomer"]:checked'
            )
        )
        .map(
            checkbox =>
                checkbox.value
        );

    if (!ids.length) {

        toast(
            "Select at least one customer.",
            "error"
        );

        return;
    }

    closeModal();

    const win =
        window.open(
            "",
            "_blank"
        );

    if (!win) {

        toast(
            "Please allow pop-ups.",
            "error"
        );

        return;
    }

    win.document.write(`

        <html>

        <head>

            <title>
                Al Jefoon Tents - Customer Statements
            </title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {
                    font-family:
                        Arial,
                        sans-serif;

                    margin:
                        15mm;
                }

                .statement {
                    page-break-after:
                        always;
                }

                .statement:last-child {
                    page-break-after:
                        auto;
                }

                h1 {
                    margin-bottom:
                        4px;
                }

                .brand {
                    font-weight:
                        bold;

                    font-size:
                        20px;

                    border-bottom:
                        3px solid #fcc224;

                    padding-bottom:
                        10px;
                }

                .summary {
                    display:
                        flex;

                    gap:
                        10px;

                    margin:
                        15px 0;
                }

                .box {
                    flex:
                        1;

                    border:
                        1px solid #ddd;

                    padding:
                        10px;
                }

                table {
                    width:
                        100%;

                    border-collapse:
                        collapse;
                }

                th,
                td {
                    border:
                        1px solid #ddd;

                    padding:
                        7px;

                    font-size:
                        11px;
                }

                th {
                    background:
                        #f4f4f4;
                }

                .receivable {
                    border-left:
                        5px solid #1f9d55;
                }

                .payable {
                    border-left:
                        5px solid #d93025;
                }

                .right {
                    text-align:
                        right;
                }

            </style>

        </head>

        <body>

            ${ids.map(
                id => {

                    const customer =
                        getCustomer(id);

                    const totals =
                        getCustomerTotals(id);

                    const statement =
                        buildStatement(id);

                    return `

                        <section class="statement">

                            <div class="brand">
                                AL JEFOON TENTS
                            </div>

                            <h1>
                                Customer Statement
                            </h1>

                            <strong>
                                ${escapeHTML(
                                    customer.name
                                )}
                            </strong>

                            ${
                                customer.company
                                    ? `<div>
                                        ${escapeHTML(
                                            customer.company
                                        )}
                                       </div>`
                                    : ""
                            }

                            <div class="summary">

                                <div class="box receivable">

                                    🟢 RECEIVABLE

                                    <strong>
                                        ${money(
                                            totals.receivable
                                        )}
                                    </strong>

                                </div>

                                <div class="box payable">

                                    🔴 PAYABLE

                                    <strong>
                                        ${money(
                                            totals.payable
                                        )}
                                    </strong>

                                </div>

                            </div>

                            <table>

                                <thead>

                                    <tr>

                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Direction</th>
                                        <th>Reference</th>
                                        <th>Amount</th>
                                        <th>Receivable</th>
                                        <th>Payable</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    ${statement.map(
                                        row => `

                                            <tr>

                                                <td>
                                                    ${formatDate(
                                                        row.date
                                                    )}
                                                </td>

                                                <td>
                                                    ${escapeHTML(
                                                        row.description ||
                                                        ""
                                                    )}
                                                </td>

                                                <td>
                                                    ${
                                                        row.direction ===
                                                        PAYABLE
                                                            ? "🔴 PAYABLE"
                                                            : "🟢 RECEIVABLE"
                                                    }
                                                </td>

                                                <td>
                                                    ${escapeHTML(
                                                        row.reference ||
                                                        "-"
                                                    )}
                                                </td>

                                                <td class="right">
                                                    ${money(
                                                        row.amount
                                                    )}
                                                </td>

                                                <td class="right">
                                                    ${money(
                                                        row.receivable ||
                                                        0
                                                    )}
                                                </td>

                                                <td class="right">
                                                    ${money(
                                                        row.payable ||
                                                        0
                                                    )}
                                                </td>

                                            </tr>
                                        `
                                    ).join("")}

                                </tbody>

                            </table>

                        </section>
                    `;
                }
            ).join("")}

            <script>

                window.onload =
                    function () {

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

function exportBackup() {

    const blob =
        new Blob(
            [
                JSON.stringify(
                    state,
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

    const a =
        document.createElement(
            "a"
        );

    a.href = url;

    a.download =
        `al-jefoon-customer-statements-${today()}.json`;

    a.click();

    URL.revokeObjectURL(
        url
    );

    toast(
        "Backup downloaded successfully."
    );
}

/* =========================================================
   RESTORE BACKUP
========================================================= */

function restoreBackup(
    event
) {

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    const reader =
        new FileReader();

    reader.onload =
        function () {

            try {

                const imported =
                    JSON.parse(
                        reader.result
                    );

                if (
                    !imported ||
                    !Array.isArray(
                        imported.customers
                    ) ||
                    !Array.isArray(
                        imported.transactions
                    )
                ) {

                    throw new Error(
                        "Invalid backup file."
                    );
                }

                const confirmed =
                    confirm(
                        "Restore this backup?\n\nCurrent data will be replaced."
                    );

                if (!confirmed) {
                    return;
                }

                state = {

                    customers:
                        imported.customers,

                    transactions:
                        imported.transactions,

                    cheques:
                        Array.isArray(
                            imported.cheques
                        )
                            ? imported.cheques
                            : [],

                    settings:
                        imported.settings ||
                        {}
                };

                save();

                toast(
                    "Backup restored successfully."
                );

                render();

            } catch (error) {

                console.error(
                    error
                );

                toast(
                    "Invalid backup file.",
                    "error"
                );
            }
        };

    reader.readAsText(
        file
    );
}

/* =========================================================
   SETTINGS
========================================================= */

function renderSettings() {

    return `

        <div class="page-header">

            <div>

                <h1>
                    Settings
                </h1>

                <p>
                    Application settings and data
                </p>

            </div>

        </div>

        <div class="settings-grid">

            <div class="card">

                <h2>
                    💾 Backup & Restore
                </h2>

                <p>
                    Keep a copy of your customer,
                    transaction and cheque data.
                </p>

                <div class="settings-actions">

                    <button
                        class="btn primary"
                        onclick="exportBackup()"
                    >
                        ⬇️ Download Backup
                    </button>

                    <label
                        class="btn"
                    >
                        ⬆️ Restore Backup

                        <input
                            type="file"
                            accept=".json,application/json"
                            onchange="restoreBackup(event)"
                            hidden
                        >

                    </label>

                </div>

            </div>

            <div class="card">

                <h2>
                    ☁️ Google Sheets
                </h2>

                <p>
                    Google Sheets synchronization
                    can be connected in the next
                    integration stage.
                </p>

                <button
                    class="btn"
                    onclick="toast('Google Sheets integration will be connected in the next stage.')"
                >
                    Configure Backup
                </button>

            </div>

        </div>
    `;
}

/* =========================================================
   REPORTS
========================================================= */

function renderReports() {

    let receivable = 0;
    let payable = 0;

    state.customers.forEach(
        customer => {

            const totals =
                getCustomerTotals(
                    customer.id
                );

            receivable +=
                totals.receivable;

            payable +=
                totals.payable;
        }
    );

    return `

        <div class="page-header">

            <div>

                <h1>
                    Reports
                </h1>

                <p>
                    Receivables and payables overview
                </p>

            </div>

        </div>

        <div class="stats-grid">

            <div class="stat-card receivable">

                <div class="stat-icon">
                    🟢
                </div>

                <div>

                    <span>
                        Total Receivable
                    </span>

                    <strong>
                        ${money(
                            receivable
                        )}
                    </strong>

                </div>

            </div>

            <div class="stat-card payable">

                <div class="stat-icon">
                    🔴
                </div>

                <div>

                    <span>
                        Total Payable
                    </span>

                    <strong>
                        ${money(
                            payable
                        )}
                    </strong>

                </div>

            </div>

        </div>

        <div class="card">

            <div class="card-header">

                <h2>
                    Customer Position
                </h2>

            </div>

            <div class="table-wrapper">

                <table class="data-table">

                    <thead>

                        <tr>

                            <th>
                                Customer
                            </th>

                            <th>
                                🟢 Receivable
                            </th>

                            <th>
                                🔴 Payable
                            </th>

                            <th>
                                Net Position
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${state.customers.map(
                            customer => {

                                const totals =
                                    getCustomerTotals(
                                        customer.id
                                    );

                                return `

                                    <tr>

                                        <td>
                                            <strong>
                                                ${escapeHTML(
                                                    customer.name
                                                )}
                                            </strong>
                                        </td>

                                        <td>
                                            ${money(
                                                totals.receivable
                                            )}
                                        </td>

                                        <td>
                                            ${money(
                                                totals.payable
                                            )}
                                        </td>

                                        <td>

                                            ${
                                                totals.receivable >=
                                                totals.payable
                                                    ? `
                                                        <span class="direction-badge receivable">
                                                            🟢 ${money(
                                                                totals.receivable -
                                                                totals.payable
                                                            )}
                                                        </span>
                                                      `
                                                    : `
                                                        <span class="direction-badge payable">
                                                            🔴 ${money(
                                                                totals.payable -
                                                                totals.receivable
                                                            )}
                                                        </span>
                                                      `
                                            }

                                        </td>

                                    </tr>
                                `;
                            }
                        ).join("")}

                    </tbody>

                </table>

            </div>

        </div>
    `;
}

/* =========================================================
   PRINT PAGE
========================================================= */

function renderPrintPage() {

    return `

        <div class="page-header">

            <div>

                <h1>
                    Print Statements
                </h1>

                <p>
                    Select one, several or all customers.
                </p>

            </div>

            <button
                class="btn primary"
                onclick="printSelectedStatements()"
            >
                🖨️ Select Statements
            </button>

        </div>

        <div class="card">

            <div class="empty-state">

                <div class="empty-icon">
                    🖨️
                </div>

                <h3>
                    Print Customer Statements
                </h3>

                <p>
                    Choose the customers you want
                    to print.
                </p>

                <button
                    class="btn primary"
                    onclick="printSelectedStatements()"
                >
                    Choose Customers
                </button>

            </div>

        </div>
    `;
}

/* =========================================================
   NAVIGATION
========================================================= */

function navigate(view) {

    currentView =
        view;

    currentCustomerId =
        null;

    render();
}

/* =========================================================
   OPEN CUSTOMER
========================================================= */

function openCustomer(
    customerId
) {

    currentCustomerId =
        customerId;

    currentView =
        "customer";

    render();
}

/* =========================================================
   RENDER
========================================================= */

function render() {

    const content =
        $("appContent");

    if (!content) {

        console.error(
            "appContent element not found."
        );

        return;
    }

    switch (
        currentView
    ) {

        case "customers":

            content.innerHTML =
                renderCustomers();

            break;

        case "transactions":

            content.innerHTML =
                renderTransactions();

            break;

        case "cheques":

            content.innerHTML =
                renderCheques();

            break;

        case "print":

            content.innerHTML =
                renderPrintPage();

            break;

        case "reports":

            content.innerHTML =
                renderReports();

            break;

        case "settings":

        case "backup":

            content.innerHTML =
                renderSettings();

            break;

        case "customer":

            content.innerHTML =
                renderCustomerStatement(
                    currentCustomerId
                );

            break;

        case "dashboard":

        default:

            content.innerHTML =
                renderDashboard();

            break;
    }

    updatePageTitle();

    updateNavigation();

    updateAlertCount();
}

/* =========================================================
   PAGE TITLE
========================================================= */

function updatePageTitle() {

    const titles = {

        dashboard:
            "Dashboard",

        customers:
            "Customers",

        transactions:
            "Transactions",

        cheques:
            "Cheque Register",

        print:
            "Print Statements",

        reports:
            "Reports",

        settings:
            "Settings",

        backup:
            "Backup & Sync",

        customer:
            "Customer Statement"
    };

    const title =
        titles[currentView] ||
        "Customer Statements";

    const pageTitle =
        $("pageTitle");

    if (pageTitle) {

        pageTitle.textContent =
            title;
    }
}

/* =========================================================
   NAVIGATION HIGHLIGHT
========================================================= */

function updateNavigation() {

    document
        .querySelectorAll(
            "[data-view]"
        )
        .forEach(
            element => {

                const view =
                    element.dataset.view;

                element.classList.toggle(
                    "active",
                    view ===
                        currentView ||
                    (
                        currentView ===
                            "customer" &&
                        view ===
                            "customers"
                    )
                );
            }
        );
}

/* =========================================================
   ALERT COUNT
========================================================= */

function updateAlertCount() {

    const count =
        getUpcomingCheques()
            .length;

    const badge =
        $("alertCount");

    if (badge) {

        badge.textContent =
            count;

        badge.style.display =
            count
                ? ""
                : "none";
    }
}

/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const saved =
        localStorage.getItem(
            THEME_KEY
        );

    if (
        saved ===
        "dark"
    ) {

        document.body.classList.add(
            "dark"
        );
    }
}

function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );

    localStorage.setItem(
        THEME_KEY,
        document.body.classList.contains(
            "dark"
        )
            ? "dark"
            : "light"
    );
}

/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function toggleSidebar() {

    const sidebar =
        $("sidebar");

    if (sidebar) {

        sidebar.classList.toggle(
            "open"
        );
    }
}

/* =========================================================
   EVENT DELEGATION
========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const navigation =
            event.target.closest(
                "[data-view]"
            );

        if (navigation) {

            event.preventDefault();

            navigate(
                navigation.dataset.view
            );

            return;
        }

        const action =
            event.target.closest(
                "[data-view-action]"
            );

        if (action) {

            event.preventDefault();

            const view =
                action.dataset.viewAction;

            navigate(view);

            return;
        }
    }
);

/* =========================================================
   BROWSER NOTIFICATIONS
========================================================= */

function requestNotificationPermission() {

    if (
        !("Notification" in window)
    ) {

        return;
    }

    if (
        Notification.permission ===
        "default"
    ) {

        Notification.requestPermission();
    }
}

function checkChequeNotifications() {

    if (
        !("Notification" in window)
    ) {

        return;
    }

    if (
        Notification.permission !==
        "granted"
    ) {

        return;
    }

    const cheques =
        getUpcomingCheques();

    const notificationKey =
        today() +
        "-" +
        cheques
            .map(
                cheque =>
                    cheque.id
            )
            .join(",");

    const previous =
        localStorage.getItem(
            "alJefoonChequeNotification"
        );

    if (
        previous ===
        notificationKey
    ) {

        return;
    }

    if (!cheques.length) {
        return;
    }

    new Notification(
        "Al Jefoon Tents - Cheque Alert",
        {
            body:
                `${cheques.length} cheque(s) ` +
                `are due within 5 days.`
        }
    );

    localStorage.setItem(
        "alJefoonChequeNotification",
        notificationKey
    );
}

/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initializeTheme();

        render();

        setTimeout(
            checkChequeNotifications,
            1000
        );

        /*
           We do not automatically ask for
           notification permission because some
           browsers block automatic permission
           prompts.

           User can enable notifications later.
        */
    }
);

/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.navigate =
    navigate;

window.openCustomer =
    openCustomer;

window.openCustomerForm =
    openCustomerForm;

window.saveCustomer =
    saveCustomer;

window.deleteCustomer =
    deleteCustomer;

window.openTransactionForm =
    openTransactionForm;

window.saveTransaction =
    saveTransaction;

window.editTransaction =
    editTransaction;

window.deleteTransaction =
    deleteTransaction;

window.transactionTypeChanged =
    transactionTypeChanged;

window.paymentMethodChanged =
    paymentMethodChanged;

window.editCheque =
    editCheque;

window.deleteCheque =
    deleteCheque;

window.openChequeForm =
    openChequeForm;

window.saveStandaloneCheque =
    saveStandaloneCheque;

window.printStatement =
    printStatement;

window.printSelectedStatements =
    printSelectedStatements;

window.selectAllPrintCustomers =
    selectAllPrintCustomers;

window.printSelectedCustomers =
    printSelectedCustomers;

window.exportBackup =
    exportBackup;

window.restoreBackup =
    restoreBackup;

window.toggleTheme =
    toggleTheme;

window.toggleSidebar =
    toggleSidebar;

window.closeModal =
    closeModal;

window.filterCustomers =
    filterCustomers;

window.requestNotificationPermission =
    requestNotificationPermission;

/* =========================================================
   END
========================================================= */
