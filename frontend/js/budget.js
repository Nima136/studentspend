// ==========================================
// STUDENTSPEND - BUDGET JAVASCRIPT
// Reads/writes through data.js so this page shares the
// SAME storage as Dashboard, Expenses, and Reports.
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ======================================
    // MOBILE MENU
    // ======================================

    const mobileMenu =
        document.getElementById("mobileMenu");

    const sidebar =
        document.querySelector(".sidebar");


    if (mobileMenu && sidebar) {

        mobileMenu.addEventListener("click", () => {

            sidebar.classList.toggle("open");

        });

    }


    // ======================================
    // LOAD BUDGET
    // ======================================

    updateBudgetPage();


    // ======================================
    // WIRE UP FORMS / BUTTONS
    // ======================================

    wireEditBudgetToggle();

    wireBudgetForm();


    // ======================================
    // RE-RENDER IF DATA CHANGES
    // (e.g. an expense was added on another tab/page)
    // ======================================

    window.addEventListener(
        "studentspend:data-changed",
        updateBudgetPage
    );

});


// ==========================================
// UPDATE BUDGET PAGE
// ==========================================

function updateBudgetPage() {

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


    const percentage =
        budget > 0
            ? (spent / budget) * 100
            : 0;


    const clampedPercentage =
        Math.min(percentage, 100);


    // ======================================
    // MAIN BUDGET CARD
    // ======================================

    const budgetAmount =
        document.getElementById("budgetAmount");

    if (budgetAmount) {

        budgetAmount.textContent =
            formatCurrency(budget);

    }


    const progressInfoSpans =
        document.querySelectorAll(
            ".progress-info span"
        );

    if (progressInfoSpans[0]) {

        progressInfoSpans[0].textContent =
            `${formatCurrency(spent)} spent`;

    }

    if (progressInfoSpans[1]) {

        progressInfoSpans[1].textContent =
            remaining >= 0
                ? `${formatCurrency(remaining)} remaining`
                : `${formatCurrency(Math.abs(remaining))} over budget`;

    }


    const progressFill =
        document.getElementById("budgetProgress");

    if (progressFill) {

        progressFill.style.width =
            clampedPercentage + "%";

        progressFill.style.background =
            percentage >= 100 ? "#dc2626" : "";

    }


    const percentageElement =
        document.getElementById("budgetPercentage");

    if (percentageElement) {

        percentageElement.textContent =
            percentage.toFixed(1) + "%";

    }


    // ======================================
    // STATUS CARD
    // ======================================

    updateStatusCard(percentage, spent, budget, remaining);


    // ======================================
    // DAILY SUGGESTED SPEND
    // ======================================

    const dailyBudgetElement =
        document.getElementById("dailyBudget");

    if (dailyBudgetElement) {

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

        dailyBudgetElement.textContent =
            formatCurrency(Math.round(dailyAmount)) + "/day";

    }


    // ======================================
    // CATEGORY BREAKDOWN
    // ======================================

    updateBudgetCategories(expenses);

}


// ==========================================
// STATUS CARD (on track / almost there / over)
// ==========================================

function updateStatusCard(percentage, spent, budget, remaining) {

    const statusCard =
        document.querySelector(".budget-status-card");

    if (!statusCard) {
        return;
    }

    const icon =
        statusCard.querySelector(".status-icon");

    const heading =
        statusCard.querySelector("h3");

    const description =
        statusCard.querySelector("p");


    if (percentage >= 100) {

        if (icon) icon.textContent = "!";
        if (heading) heading.textContent = "Over budget!";
        if (description) {
            description.textContent =
                `You've gone ${formatCurrency(spent - budget)} over your monthly budget.`;
        }

    } else if (percentage >= 80) {

        if (icon) icon.textContent = "⚠";
        if (heading) heading.textContent = "Almost there";
        if (description) {
            description.textContent =
                `You have ${formatCurrency(remaining)} left for the rest of the month.`;
        }

    } else {

        if (icon) icon.textContent = "✓";
        if (heading) heading.textContent = "You're on track!";
        if (description) {
            description.textContent =
                `You have ${formatCurrency(remaining)} left for the rest of the month.`;
        }

    }

}


// ==========================================
// CATEGORY BREAKDOWN CARDS
// ==========================================

function updateBudgetCategories(expenses) {

    const totals =
        getCategoryTotals(expenses);


    const cards =
        document.querySelectorAll(
            ".category-card"
        );


    cards.forEach(card => {

        const category =
            card.dataset.category;


        if (!category) {
            return;
        }


        const categoryBudget =
            Number(card.dataset.budget) || 0;


        const spent =
            totals[category] || 0;


        const percentage =
            categoryBudget > 0
                ? (spent / categoryBudget) * 100
                : 0;


        const clampedPercentage =
            Math.min(percentage, 100);


        const amountText =
            card.querySelector(".category-info p");

        if (amountText) {

            amountText.textContent =
                `${formatCurrency(spent)} of ${formatCurrency(categoryBudget)}`;

        }


        const fill =
            card.querySelector(
                ".category-progress-fill"
            );

        if (fill) {

            fill.style.width =
                clampedPercentage + "%";

            fill.style.background =
                percentage >= 100 ? "#dc2626" : "";

        }


        const bottomSpan =
            card.querySelector(".category-bottom span");

        const bottomStrong =
            card.querySelector(".category-bottom strong");

        if (bottomSpan) {

            bottomSpan.textContent =
                percentage.toFixed(1) + "% used";

        }

        if (bottomStrong) {

            const leftover =
                categoryBudget - spent;

            bottomStrong.textContent =
                leftover >= 0
                    ? `${formatCurrency(leftover)} left`
                    : `${formatCurrency(Math.abs(leftover))} over`;

        }

    });

}


// ==========================================
// EDIT BUDGET BUTTON (show / hide the form)
// ==========================================

function wireEditBudgetToggle() {

    const editButton =
        document.getElementById("editBudgetButton");

    const editCard =
        document.getElementById("editBudgetCard");

    const newBudgetInput =
        document.getElementById("newBudget");

    const cancelButton =
        document.getElementById("cancelBudget");


    if (editButton && editCard) {

        editButton.addEventListener("click", () => {

            editCard.classList.toggle("show");

            if (editCard.classList.contains("show")) {

                if (newBudgetInput) {

                    newBudgetInput.value =
                        getData().budget || "";

                    newBudgetInput.focus();

                }

            }

        });

    }


    if (cancelButton && editCard) {

        cancelButton.addEventListener("click", () => {

            editCard.classList.remove("show");

            const form =
                document.getElementById("budgetForm");

            if (form) {
                form.reset();
            }

        });

    }

}


// ==========================================
// SET MONTHLY BUDGET FORM
// ==========================================

function wireBudgetForm() {

    const form =
        document.getElementById("budgetForm");

    const newBudgetInput =
        document.getElementById("newBudget");

    const editCard =
        document.getElementById("editBudgetCard");


    if (!form) {
        return;
    }


    form.addEventListener("submit", async event => {

        event.preventDefault();


        const value =
            Number(newBudgetInput ? newBudgetInput.value : 0);


        if (!value || value <= 0) {

            alert("Please enter a valid budget amount.");

            return;

        }


        try {
            await setBudget(value);
        } catch (error) {
            alert(`Could not update budget: ${error.message}`);
            return;
        }

        form.reset();


        if (editCard) {
            editCard.classList.remove("show");
        }


        updateBudgetPage();


        alert("Budget updated!");

    });

}
