// ==========================================
// STUDENTSPEND - DASHBOARD JAVASCRIPT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ======================================
    // MOBILE MENU
    // ======================================

    const mobileMenu = document.getElementById("mobileMenu");
    const sidebar = document.querySelector(".sidebar");

    if (mobileMenu && sidebar) {
        mobileMenu.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }


    // ======================================
    // ADD EXPENSE BUTTON
    // ======================================

    const addExpenseButton =
        document.getElementById("addExpenseButton");

    if (addExpenseButton) {
        addExpenseButton.addEventListener("click", () => {
            window.location.href = "expenses.html";
        });
    }


    // ======================================
    // LOAD DASHBOARD
    // ======================================

    updateDashboard();


    // ======================================
    // RE-RENDER IF DATA CHANGES
    // (e.g. an expense is added on another tab)
    // ======================================

    window.addEventListener(
        "studentspend:data-changed",
        updateDashboard
    );

});


// ==========================================
// UPDATE ENTIRE DASHBOARD
// ==========================================

function updateDashboard() {

    const data = getData();

    const expenses = data.expenses || [];
    const budget = Number(data.budget) || 0;

    const totalSpent = getTotalSpent(expenses);
    const remaining = budget - totalSpent;

    const savingsRate =
        budget > 0
            ? ((remaining / budget) * 100)
            : 0;


    // ======================================
    // SUMMARY CARDS
    // ======================================

    const balanceAmount =
        document.getElementById("balanceAmount");

    const incomeAmount =
        document.getElementById("incomeAmount");

    const expenseAmount =
        document.getElementById("expenseAmount");

    const savingsRateElement =
        document.getElementById("savingsRate");


    if (balanceAmount) {
        balanceAmount.textContent =
            formatCurrency(remaining);
    }


    if (incomeAmount) {
        incomeAmount.textContent =
            formatCurrency(budget);
    }


    if (expenseAmount) {
        expenseAmount.textContent =
            formatCurrency(totalSpent);
    }


    if (savingsRateElement) {
        savingsRateElement.textContent =
            savingsRate.toFixed(1) + "%";
    }


    // ======================================
    // TRANSACTION COUNT
    // ======================================

    const expenseCard =
        document.querySelector(
            ".summary-card:nth-child(3) p"
        );

    if (expenseCard) {
        expenseCard.textContent =
            `${expenses.length} transaction${expenses.length !== 1 ? "s" : ""}`;
    }


    // ======================================
    // BUDGET CARD
    // ======================================

    updateBudgetCard(
        budget,
        totalSpent,
        remaining
    );


    // ======================================
    // CATEGORY CHART
    // ======================================

    updateCategoryChart(expenses);


    // ======================================
    // RECENT TRANSACTIONS
    // ======================================

    updateRecentTransactions(expenses);


    // ======================================
    // SPENDING BREAKDOWN
    // ======================================

    updateBreakdown(expenses);

}


// ==========================================
// BUDGET CARD
// ==========================================

function updateBudgetCard(
    budget,
    totalSpent,
    remaining
) {

    const budgetAmount =
        document.querySelector(".budget-amount");

    if (budgetAmount) {

        budgetAmount.innerHTML = `
            <strong>
                ${formatCurrency(totalSpent)}
            </strong>

            <span>
                / ${formatCurrency(budget)}
            </span>
        `;
    }


    const progress =
        document.querySelector(".large-progress-fill");

    if (progress) {

        let percentage =
            budget > 0
                ? (totalSpent / budget) * 100
                : 0;

        percentage =
            Math.min(percentage, 100);

        progress.style.width =
            percentage + "%";
    }


    const budgetInfo =
        document.querySelector(".budget-info");

    if (budgetInfo) {

        const percentage =
            budget > 0
                ? (totalSpent / budget) * 100
                : 0;

        budgetInfo.innerHTML = `
            <span>
                ${percentage.toFixed(1)}% used
            </span>

            <span>
                ${formatCurrency(remaining)} left
            </span>
        `;
    }


    // ======================================
    // DAILY SPENDING MESSAGE
    // ======================================

    const budgetMessage =
        document.querySelector(".budget-message p");

    if (budgetMessage) {

        const today = new Date();

        const daysLeft =
            Math.max(
                1,
                new Date(
                    today.getFullYear(),
                    today.getMonth() + 1,
                    0
                ).getDate() - today.getDate() + 1
            );

        const dailyAmount =
            remaining > 0
                ? remaining / daysLeft
                : 0;

        budgetMessage.innerHTML = `
            You're on track! You can spend about
            <strong>
                ${formatCurrency(dailyAmount)}/day
            </strong>
            for the rest of the month.
        `;
    }

}


// ==========================================
// CATEGORY CHART
// ==========================================

function updateCategoryChart(expenses) {

    const rawTotals =
        getCategoryTotals(expenses);


    // The chart only has 5 fixed bars (Food, Transport,
    // Education, Shopping, Other), but expenses can be
    // logged under 8 categories. Fold anything without its
    // own bar (Entertainment, Bills, Health) into "Other"
    // so that spending never silently disappears.

    const categories = [
        "Food",
        "Transport",
        "Education",
        "Shopping",
        "Other"
    ];

    const totals = {
        Food: 0,
        Transport: 0,
        Education: 0,
        Shopping: 0,
        Other: 0
    };

    Object.keys(rawTotals).forEach(category => {

        const bucket =
            categories.includes(category)
                ? category
                : "Other";

        totals[bucket] += rawTotals[category];
    });


    const chartBars =
        document.querySelectorAll(".chart-bar");


    const values =
        categories.map(category =>
            totals[category] || 0
        );


    const maxValue =
        Math.max(...values, 1);


    chartBars.forEach((bar, index) => {

        if (index >= categories.length) {
            return;
        }

        const category =
            categories[index];

        const amount =
            totals[category] || 0;


        const height =
            (amount / maxValue) * 100;


        bar.style.height =
            Math.max(height, 3) + "%";


        const label =
            bar.querySelector("span");


        if (label) {

            label.textContent =
                `${category} ${formatCurrency(amount)}`;
        }

    });

}


// ==========================================
// RECENT TRANSACTIONS
// ==========================================

function updateRecentTransactions(expenses) {

    const container =
        document.querySelector(".transactions");


    if (!container) {
        return;
    }


    if (expenses.length === 0) {

        container.innerHTML = `
            <p style="padding: 20px;">
                No expenses yet.
            </p>
        `;

        return;
    }


    // newest first

    const recentExpenses =
        [...expenses]
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            )
            .slice(0, 5);


    container.innerHTML =
        recentExpenses.map(expense => {

            const icon =
                getCategoryEmoji(expense.category);

            return `
                <div class="transaction-row">

                    <div class="transaction-info">

                        <div class="transaction-icon">
                            ${icon}
                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(expense.category)}
                            </strong>

                            <small>
                                ${escapeHTML(expense.description || "Expense")}
                                ·
                                ${formatDate(expense.date)}
                            </small>

                        </div>

                    </div>

                    <span class="transaction-amount">
                        -${formatCurrency(expense.amount)}
                    </span>

                </div>
            `;

        }).join("");

}


// ==========================================
// SPENDING BREAKDOWN
// ==========================================

function updateBreakdown(expenses) {

    const container =
        document.querySelector(".breakdown-list");


    if (!container) {
        return;
    }


    const totals =
        getCategoryTotals(expenses);


    const categories =
        Object.keys(totals);


    if (categories.length === 0) {

        container.innerHTML =
            "<p>No expenses yet.</p>";

        return;
    }


    // Sort largest first

    categories.sort(
        (a, b) =>
            totals[b] - totals[a]
    );


    container.innerHTML =
        categories.map(category => {

            return `
                <div class="breakdown-item">

                    <div class="breakdown-left">

                        <span
                            class="category-dot"
                        ></span>

                        <span>
                            ${escapeHTML(category)}
                        </span>

                    </div>

                    <strong>
                        ${formatCurrency(totals[category])}
                    </strong>

                </div>
            `;

        }).join("");

}


// ==========================================
// NOTE: formatCurrency, formatDate, escapeHTML, and
// category icon/class lookups now live in data.js
// (loaded before this file) so every page shares the
// exact same formatting logic.
// ==========================================