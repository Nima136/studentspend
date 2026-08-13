// ==========================================
// STUDENTSPEND - DATABASE DATA LAYER
// MySQL is the source of truth.
// localStorage is used only for the JWT/session
// and a short-lived UI cache.
// ==========================================

const API_BASE_URL = "http://localhost:3000";
const STORAGE_KEY = "studentSpendData";
const TOKEN_KEY = "studentSpendToken";
const USER_KEY = "studentSpendUser";

let remoteLoaded = false;

const emptyData = {
    budget: 0,
    expenses: []
};

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
        return null;
    }
}

function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(STORAGE_KEY);
}

function requireSession() {
    if (!getToken()) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

function getData() {
    try {
        const cached = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "null"
        );

        if (cached && Array.isArray(cached.expenses)) {
            return cached;
        }
    } catch (error) {
        console.warn("Invalid local cache:", error);
    }

    return { ...emptyData, expenses: [] };
}

function saveLocalCache(data) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            budget: Number(data.budget) || 0,
            expenses: Array.isArray(data.expenses)
                ? data.expenses
                : []
        })
    );
}

async function apiFetch(path, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_BASE_URL}${path}`,
        { ...options, headers }
    );

    let payload = {};
    try {
        payload = await response.json();
    } catch {
        payload = {};
    }

    if (!response.ok) {
        if (response.status === 401) {
            clearSession();
            window.location.href = "login.html";
        }

        throw new Error(
            payload.message || `Request failed (${response.status})`
        );
    }

    return payload;
}

async function loadRemoteData() {
    if (!getToken()) {
        return getData();
    }

    try {
        const payload = await apiFetch("/api/data");

        const data = {
            budget: Number(payload.user.monthly_budget) || 0,
            expenses: Array.isArray(payload.expenses)
                ? payload.expenses
                : []
        };

        saveLocalCache(data);
        localStorage.setItem(
            USER_KEY,
            JSON.stringify(payload.user)
        );

        remoteLoaded = true;
        broadcastDataChange();

        return data;
    } catch (error) {
        console.error("Could not load database data:", error);
        alert(`Could not load your database data: ${error.message}`);
        return getData();
    }
}

async function addExpense(expense) {
    const payload = await apiFetch("/api/expenses", {
        method: "POST",
        body: JSON.stringify({
            amount: Number(expense.amount),
            category: expense.category,
            date: expense.date,
            description: expense.description || ""
        })
    });

    const data = getData();
    data.expenses.push(payload.expense);
    saveLocalCache(data);
    broadcastDataChange();

    return payload.expense;
}

async function deleteExpense(id) {
    await apiFetch(`/api/expenses/${encodeURIComponent(id)}`, {
        method: "DELETE"
    });

    const data = getData();
    data.expenses = data.expenses.filter(
        expense => String(expense.id) !== String(id)
    );

    saveLocalCache(data);
    broadcastDataChange();
}

async function updateExpense(id, updatedExpense) {
    const payload = await apiFetch(
        `/api/expenses/${encodeURIComponent(id)}`,
        {
            method: "PUT",
            body: JSON.stringify(updatedExpense)
        }
    );

    const data = getData();
    const index = data.expenses.findIndex(
        expense => String(expense.id) === String(id)
    );

    if (index !== -1) {
        data.expenses[index] = payload.expense;
        saveLocalCache(data);
    }

    broadcastDataChange();
    return payload.expense;
}

async function setBudget(amount) {
    const budget = Number(amount);

    await apiFetch("/api/budget", {
        method: "PUT",
        body: JSON.stringify({ budget })
    });

    const data = getData();
    data.budget = budget;
    saveLocalCache(data);

    const user = getCurrentUser();
    if (user) {
        user.monthly_budget = budget;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    broadcastDataChange();
}

function getBudget() {
    return Number(getData().budget) || 0;
}

function getTotalSpent(expenses = null) {
    if (!expenses) expenses = getData().expenses;

    return expenses.reduce(
        (total, expense) =>
            total + Number(expense.amount || 0),
        0
    );
}

function getTransactionCount(expenses = null) {
    if (!expenses) expenses = getData().expenses;
    return expenses.length;
}

function getAverageExpense(expenses = null) {
    if (!expenses) expenses = getData().expenses;
    return expenses.length
        ? getTotalSpent(expenses) / expenses.length
        : 0;
}

function getRemaining() {
    return getBudget() - getTotalSpent();
}

function getCategoryTotals(expenses = null) {
    if (!expenses) expenses = getData().expenses;

    const totals = {};

    expenses.forEach(expense => {
        const category = expense.category || "Other";
        totals[category] =
            (totals[category] || 0) +
            Number(expense.amount || 0);
    });

    return totals;
}

const CATEGORY_META = {
    Food:          { emoji: "🍔", cssClass: "food",          badge: "food-badge",          fill: "food-fill" },
    Transport:     { emoji: "🚗", cssClass: "transport",     badge: "transport-badge",     fill: "transport-fill" },
    Education:     { emoji: "📚", cssClass: "education",     badge: "education-badge",     fill: "education-fill" },
    Shopping:      { emoji: "🛒", cssClass: "shopping",      badge: "shopping-badge",      fill: "shopping-fill" },
    Entertainment: { emoji: "🎮", cssClass: "entertainment", badge: "entertainment-badge", fill: "other-fill" },
    Bills:         { emoji: "💡", cssClass: "other",         badge: "shopping-badge",      fill: "other-fill" },
    Health:        { emoji: "💊", cssClass: "other",         badge: "shopping-badge",      fill: "other-fill" },
    Other:         { emoji: "📦", cssClass: "other",         badge: "shopping-badge",      fill: "other-fill" }
};

function getCategoryMeta(category) {
    return CATEGORY_META[category] || CATEGORY_META.Other;
}

function getCategoryEmoji(category) {
    return getCategoryMeta(category).emoji;
}

function getCategoryClass(category) {
    return getCategoryMeta(category).cssClass;
}

function getCategoryBadgeClass(category) {
    return getCategoryMeta(category).badge;
}

function getCategoryFillClass(category) {
    return getCategoryMeta(category).fill;
}

function formatCurrency(amount) {
    return "₹" + Number(amount || 0).toLocaleString(
        "en-IN",
        { maximumFractionDigits: 0 }
    );
}

function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(
        String(dateString).slice(0, 10) + "T00:00:00"
    );

    return date.toLocaleDateString(
        "en-IN",
        { day: "numeric", month: "short", year: "numeric" }
    );
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function broadcastDataChange() {
    window.dispatchEvent(
        new Event("studentspend:data-changed")
    );
}

// Every data page loads the current user's MySQL data.
// This also overwrites the old hard-coded/localStorage
// expenses that caused "Expense not found".
document.addEventListener("DOMContentLoaded", () => {
    if (
        !location.pathname.endsWith("/login.html") &&
        !location.pathname.endsWith("/register.html") &&
        !location.pathname.endsWith("/index.html")
    ) {
        if (requireSession()) {
            loadRemoteData();
        }
    }
});
