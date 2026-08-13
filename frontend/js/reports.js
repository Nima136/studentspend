// ==========================================
// STUDENTSPEND - REPORTS PAGE
// Reads through data.js so this page shares the SAME
// storage as Dashboard, Expenses, and Budget.
//
// NOTE: The "Monthly Spending" 6-month bar chart and the
// "Insights" cards further down the page stay as static
// placeholder content, since the app only tracks a flat
// list of expenses (no month-by-month history yet) to
// build a real multi-month trend from.
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const mobileMenu =
        document.getElementById("mobileMenu");

    const sidebar =
        document.querySelector(".sidebar");


    if (mobileMenu) {

        mobileMenu.addEventListener("click", () => {

            sidebar.classList.toggle("open");

        });

    }


    const monthSelector =
        document.getElementById("monthSelector");


    if (monthSelector) {

        monthSelector.addEventListener("change", () => {

            console.log(
                "Selected month:",
                monthSelector.value
            );

            /*
                Later we will filter data.js's expenses by
                month here. Right now the report always
                reflects all stored expenses.
            */

        });

    }


    updateReportsPage();


    // Re-render if data changes elsewhere (e.g. an
    // expense was just added on the Expenses page)

    window.addEventListener(
        "studentspend:data-changed",
        updateReportsPage
    );

});


// ==========================================
// UPDATE ENTIRE REPORTS PAGE
// ==========================================

function updateReportsPage() {

    const data =
        getData();

    const budget =
        Number(data.budget) || 0;

    const expenses =
        data.expenses || [];

    const spent =
        getTotalSpent(expenses);

    const remaining =
        budget - spent;

    const savingsRate =
        budget > 0
            ? (remaining / budget) * 100
            : 0;

    const percentUsed =
        budget > 0
            ? (spent / budget) * 100
            : 0;


    updateSummaryCards(
    budget,
    spent,
    remaining,
    savingsRate,
    percentUsed
);

updateCategoryReport(expenses);

updateHealthReport(
    budget,
    spent,
    remaining,
    savingsRate,
    percentUsed,
    expenses
);

updateInsights(
    budget,
    spent,
    remaining,
    expenses
);

}


// ==========================================
// SUMMARY CARDS
// ==========================================

function updateSummaryCards(budget, spent, remaining, savingsRate, percentUsed) {

    const incomeEl =
        document.getElementById("reportIncome");

    if (incomeEl) {
        incomeEl.textContent = formatCurrency(budget);
    }


    const expensesEl =
        document.getElementById("reportExpenses");

    if (expensesEl) {
        expensesEl.textContent = formatCurrency(spent);
    }

    const expensesNote =
        document.getElementById("reportExpensesNote");

    if (expensesNote) {
        expensesNote.textContent =
            percentUsed.toFixed(1) + "% of income";
    }


    const remainingEl =
        document.getElementById("reportRemaining");

    if (remainingEl) {
        remainingEl.textContent = formatCurrency(remaining);
    }

    const remainingNote =
        document.getElementById("reportRemainingNote");

    if (remainingNote) {
        remainingNote.textContent =
            remaining >= 0 ? "You're on track" : "You're over budget";
        remainingNote.classList.toggle("positive", remaining >= 0);
    }


    const savingsRateEl =
        document.getElementById("reportSavingsRate");

    if (savingsRateEl) {
        savingsRateEl.textContent =
            savingsRate.toFixed(1) + "%";
    }

    const savingsNote =
        document.getElementById("reportSavingsNote");

    if (savingsNote) {
        savingsNote.textContent =
            savingsRate >= 20 ? "Good progress" : "Room to save more";
        savingsNote.classList.toggle("positive", savingsRate >= 20);
    }

}


// ==========================================
// CATEGORY BREAKDOWN
// ==========================================

function updateCategoryReport(expenses) {

    const container =
        document.getElementById("reportCategoryList");

    if (!container) {
        return;
    }

    const totals =
        getCategoryTotals(expenses);

    const total =
        getTotalSpent(expenses);

    const categories =
        Object.keys(totals)
            .sort((a, b) => totals[b] - totals[a]);

    if (categories.length === 0) {

        container.innerHTML =
            "<p>No expenses recorded yet.</p>";

        return;
    }

    container.innerHTML =
        categories.map(category => {

            const amount =
                totals[category];

            const percentage =
                total > 0
                    ? (amount / total) * 100
                    : 0;

            return `
                <div class="report-category">

                    <div class="category-row">

                        <div class="category-name">

                            <span class="category-icon ${getCategoryClass(category)}">
                                ${getCategoryEmoji(category)}
                            </span>

                            <div>
                                <strong>${escapeHTML(category)}</strong>
                                <small>${formatCurrency(amount)}</small>
                            </div>

                        </div>

                        <strong>${percentage.toFixed(1)}%</strong>

                    </div>

                    <div class="report-progress">
                        <div
                            class="report-progress-fill ${getCategoryFillClass(category)}"
                            style="width: ${Math.min(percentage, 100)}%;"
                        ></div>
                    </div>

                </div>
            `;

        }).join("");

}


// ==========================================
// SPENDING HEALTH
// ==========================================

function updateHealthReport(budget, spent, remaining, savingsRate, percentUsed, expenses) {

    // Simple health score: starts at 100, loses points the
    // closer/over budget you get. Purely illustrative.

    let score =
        100 - Math.max(0, percentUsed - 50);

    score =
        Math.max(0, Math.min(100, Math.round(score)));

    const scoreDeg =
        (score / 100) * 360;


    const circle =
        document.getElementById("healthCircle");

    if (circle) {

        const color =
            score >= 70 ? "#10b981" :
            score >= 40 ? "#f59e0b" :
            "#ef4444";

        circle.style.background =
            `conic-gradient(${color} 0deg ${scoreDeg}deg, #e5e7eb ${scoreDeg}deg 360deg)`;

    }


    const scoreEl =
        document.getElementById("healthScore");

    if (scoreEl) {
        scoreEl.textContent = score;
    }


    const headingEl =
        document.getElementById("healthHeading");

    const descriptionEl =
        document.getElementById("healthDescription");

    if (headingEl && descriptionEl) {

        if (score >= 70) {

            headingEl.textContent = "Good financial health";
            descriptionEl.textContent =
                "You're spending within your limits and maintaining a healthy amount of savings.";

        } else if (score >= 40) {

            headingEl.textContent = "Keep an eye on things";
            descriptionEl.textContent =
                "You're getting close to your budget limit. A little more caution will help.";

        } else {

            headingEl.textContent = "Spending needs attention";
            descriptionEl.textContent =
                "You've used most (or all) of your budget for this month. Consider cutting back.";

        }

    }


    const budgetUsedEl =
        document.getElementById("healthBudgetUsed");

    if (budgetUsedEl) {
        budgetUsedEl.textContent = percentUsed.toFixed(1) + "%";
    }


    const savingsEl =
        document.getElementById("healthSavings");

    if (savingsEl) {
        savingsEl.textContent = savingsRate.toFixed(1) + "%";
    }


    const dailyAverageEl =
        document.getElementById("healthDailyAverage");

    if (dailyAverageEl) {

        const average =
            getAverageExpense(expenses);

        dailyAverageEl.textContent =
            formatCurrency(Math.round(average));

    }

}
// ==========================================
// DYNAMIC INSIGHTS
// ==========================================

function updateInsights(
    budget,
    spent,
    remaining,
    expenses
) {

    const categoryIcon =
        document.getElementById("insightCategoryIcon");

    const categoryTitle =
        document.getElementById("insightCategoryTitle");

    const categoryText =
        document.getElementById("insightCategoryText");


    const budgetTitle =
        document.getElementById("insightBudgetTitle");

    const budgetText =
        document.getElementById("insightBudgetText");


    const dailyTitle =
        document.getElementById("insightDailyTitle");

    const dailyText =
        document.getElementById("insightDailyText");


    // ======================================
    // NO EXPENSES
    // ======================================

    if (expenses.length === 0) {

        if (categoryIcon) {
            categoryIcon.textContent = "📊";
        }

        if (categoryTitle) {
            categoryTitle.textContent =
                "No spending data yet";
        }

        if (categoryText) {
            categoryText.textContent =
                "Add your first expense to start receiving personalized spending insights.";
        }


        if (budgetTitle) {
            budgetTitle.textContent =
                "Your budget is ready";
        }

        if (budgetText) {
            budgetText.textContent =
                `You have ${formatCurrency(budget)} available for this month.`;
        }


        if (dailyTitle) {
            dailyTitle.textContent =
                "Start tracking your spending";
        }

        if (dailyText) {
            dailyText.textContent =
                "Once you add expenses, we'll calculate your average daily spending and give you recommendations.";
        }

        return;
    }


    // ======================================
    // BIGGEST CATEGORY
    // ======================================

    const totals =
        getCategoryTotals(expenses);

    const categories =
        Object.keys(totals);


    categories.sort(
        (a, b) =>
            totals[b] - totals[a]
    );


    const biggestCategory =
        categories[0];

    const biggestAmount =
        totals[biggestCategory];


    const categoryPercentage =
        spent > 0
            ? (biggestAmount / spent) * 100
            : 0;


    const emoji =
        getCategoryEmoji(biggestCategory);


    if (categoryIcon) {
        categoryIcon.textContent = emoji;
    }


    if (categoryTitle) {

        categoryTitle.textContent =
            `${biggestCategory} is your biggest expense`;

    }


    if (categoryText) {

        categoryText.textContent =
            `You spent ${formatCurrency(biggestAmount)} on ${biggestCategory.toLowerCase()}, making up ${categoryPercentage.toFixed(1)}% of your total spending.`;

    }


    // ======================================
    // BUDGET INSIGHT
    // ======================================

    const percentUsed =
        budget > 0
            ? (spent / budget) * 100
            : 0;


    if (budget <= 0) {

        if (budgetTitle) {
            budgetTitle.textContent =
                "Set a monthly budget";
        }

        if (budgetText) {
            budgetText.textContent =
                "Set your monthly budget to receive more accurate spending recommendations.";
        }

    } else if (remaining < 0) {

        if (budgetTitle) {
            budgetTitle.textContent =
                "You're over budget";
        }

        if (budgetText) {
            budgetText.textContent =
                `You've exceeded your monthly budget by ${formatCurrency(Math.abs(remaining))}. Consider reducing your spending for the rest of the month.`;
        }

    } else if (percentUsed >= 80) {

        if (budgetTitle) {
            budgetTitle.textContent =
                "You're close to your budget limit";
        }

        if (budgetText) {
            budgetText.textContent =
                `You've used ${percentUsed.toFixed(1)}% of your budget and have ${formatCurrency(remaining)} remaining.`;
        }

    } else if (percentUsed >= 50) {

        if (budgetTitle) {
            budgetTitle.textContent =
                "You're halfway through your budget";
        }

        if (budgetText) {
            budgetText.textContent =
                `You've used ${percentUsed.toFixed(1)}% of your monthly budget. You have ${formatCurrency(remaining)} remaining.`;
        }

    } else {

        if (budgetTitle) {
            budgetTitle.textContent =
                "You're spending within your budget";
        }

        if (budgetText) {
            budgetText.textContent =
                `You've used ${percentUsed.toFixed(1)}% of your monthly budget and still have ${formatCurrency(remaining)} available.`;
        }

    }


    // ======================================
    // DAILY SPENDING
    // ======================================

    const averageExpense =
        getAverageExpense(expenses);


    const today =
        new Date();


    const daysInMonth =
        new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
        ).getDate();


    const daysRemaining =
        Math.max(
            1,
            daysInMonth - today.getDate() + 1
        );


    const recommendedDaily =
        remaining > 0
            ? remaining / daysRemaining
            : 0;


    if (remaining <= 0) {

        if (dailyTitle) {
            dailyTitle.textContent =
                "Your spending needs attention";
        }

        if (dailyText) {
            dailyText.textContent =
                `Your average expense is ${formatCurrency(Math.round(averageExpense))}. You've used your entire available budget, so consider limiting non-essential spending.`;
        }

    } else if (averageExpense > recommendedDaily) {

        if (dailyTitle) {
            dailyTitle.textContent =
                "Your spending pace is high";
        }

        if (dailyText) {
            dailyText.textContent =
                `Your average transaction is ${formatCurrency(Math.round(averageExpense))}. Your remaining budget allows about ${formatCurrency(Math.round(recommendedDaily))} per day for the rest of the month.`;
        }

    } else {

        if (dailyTitle) {
            dailyTitle.textContent =
                "You're maintaining a good spending pace";
        }

        if (dailyText) {
            dailyText.textContent =
                `Your average transaction is ${formatCurrency(Math.round(averageExpense))}. You can spend about ${formatCurrency(Math.round(recommendedDaily))} per day for the rest of the month and stay within budget.`;
        }

    }

}