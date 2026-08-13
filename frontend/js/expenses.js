// ==========================================
// STUDENTSPEND - EXPENSES PAGE
// Reads/writes through data.js (getData/addExpense/
// deleteExpense/updateExpense) so this page shares the
// SAME storage as Dashboard, Budget, and Reports.
// ==========================================


// ==========================================
// MOBILE MENU
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const mobileMenu =
        document.getElementById("mobileMenu");

    const sidebar =
        document.querySelector(".sidebar");

    if (mobileMenu && sidebar) {

        mobileMenu.addEventListener("click", function () {

            sidebar.classList.toggle("open");

        });

    }

});


// ==========================================
// ELEMENTS
// ==========================================

const openExpenseForm =
    document.getElementById(
        "openExpenseForm"
    );

const expenseFormCard =
    document.getElementById(
        "expenseFormCard"
    );

const cancelExpense =
    document.getElementById(
        "cancelExpense"
    );

const expenseForm =
    document.getElementById(
        "expenseForm"
    );

const tableBody =
    document.getElementById(
        "expenseTableBody"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );

const totalSpentElement =
    document.getElementById(
        "totalSpent"
    );

const transactionCountElement =
    document.getElementById(
        "transactionCount"
    );

const averageExpenseElement =
    document.getElementById(
        "averageExpense"
    );


// ==========================================
// OPEN ADD EXPENSE FORM
// ==========================================

if (openExpenseForm) {

    openExpenseForm.addEventListener(
        "click",
        function () {

            if (expenseFormCard) {

                expenseFormCard.classList.add(
                    "show"
                );

            }

            const amountInput =
                document.getElementById(
                    "amount"
                );

            if (amountInput) {

                amountInput.focus();

            }

        }
    );

}


// ==========================================
// CLOSE ADD EXPENSE FORM
// ==========================================

if (cancelExpense) {

    cancelExpense.addEventListener(
        "click",
        function () {

            if (expenseFormCard) {

                expenseFormCard.classList.remove(
                    "show"
                );

            }

            if (expenseForm) {

                expenseForm.reset();

            }

        }
    );

}


// ==========================================
// ADD NEW EXPENSE
// ==========================================

if (expenseForm) {

    expenseForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // ----------------------------------
            // GET FORM VALUES
            // ----------------------------------

            const amount =
                Number(
                    document.getElementById(
                        "amount"
                    ).value
                );

            const category =
                document.getElementById(
                    "category"
                ).value;

            const date =
                document.getElementById(
                    "expenseDate"
                ).value;

            const description =
                document.getElementById(
                    "description"
                ).value.trim();


            // ----------------------------------
            // VALIDATION
            // ----------------------------------

            if (
                !amount ||
                amount <= 0
            ) {

                alert(
                    "Please enter a valid amount."
                );

                return;

            }


            if (!category) {

                alert(
                    "Please select a category."
                );

                return;

            }


            if (!date) {

                alert(
                    "Please select a date."
                );

                return;

            }


            // ----------------------------------
            // SAVE THROUGH THE SHARED DATA STORE
            // (data.js -> localStorage key "studentSpendData",
            //  the same store Dashboard/Budget/Reports read from)
            // ----------------------------------

            try {
                await addExpense({
                    amount: amount,
                    category: category,
                    date: date,
                    description: description || category
                });
            } catch (error) {
                alert(`Could not add expense: ${error.message}`);
                return;
            }

            // ----------------------------------
            // RESET + CLOSE FORM
            // ----------------------------------

            expenseForm.reset();

            if (expenseFormCard) {

                expenseFormCard.classList.remove(
                    "show"
                );

            }


            // ----------------------------------
            // REFRESH THIS PAGE
            // ----------------------------------

            renderExpenses();

            updateStatistics();


            alert(
                "Expense added successfully!"
            );

        }
    );

}


// ==========================================
// RENDER EXPENSES
// ==========================================

function renderExpenses() {

    if (!tableBody) {

        return;

    }


    const expenses =
        getData().expenses;


    tableBody.innerHTML =
        "";


    if (expenses.length === 0) {

        updateEmptyState();

        return;

    }


    // Newest first

    const sorted =
        [...expenses].sort(
            (a, b) =>
                new Date(b.date) - new Date(a.date)
        );


    sorted.forEach(
        function (expense) {

            const row =
                createExpenseRow(
                    expense
                );


            tableBody.appendChild(
                row
            );

        }
    );


    updateEmptyState();

}


// ==========================================
// CREATE EXPENSE ROW
// ==========================================

function createExpenseRow(
    expense
) {

    const row =
        document.createElement(
            "tr"
        );


    row.dataset.id =
        expense.id;


    row.innerHTML = `

        <td>

            <div class="expense-name">

                <div class="expense-icon ${getCategoryClass(expense.category)}">

                    ${getCategoryEmoji(expense.category)}

                </div>

                <div>

                    <strong>

                        ${escapeHTML(
                            expense.description ||
                            expense.category
                        )}

                    </strong>

                    <small>

                        ${escapeHTML(
                            expense.category
                        )}

                    </small>

                </div>

            </div>

        </td>


        <td>

            <span class="category-badge ${getCategoryBadgeClass(expense.category)}">

                ${escapeHTML(
                    expense.category
                )}

            </span>

        </td>


        <td>

            ${formatDate(
                expense.date
            )}

        </td>


        <td class="amount">

            -${formatCurrency(expense.amount)}

        </td>


        <td>

            <div class="actions">

                <button
                    class="edit-button"
                    title="Edit"
                    type="button"
                >

                    ✎

                </button>


                <button
                    class="delete-button"
                    title="Delete"
                    type="button"
                >

                    🗑

                </button>

            </div>

        </td>

    `;


    attachRowButtons(
        row,
        expense
    );


    return row;

}


// ==========================================
// DELETE / EDIT BUTTONS
// ==========================================

function attachRowButtons(
    row,
    expense
) {

    const deleteButton =
        row.querySelector(
            ".delete-button"
        );


    const editButton =
        row.querySelector(
            ".edit-button"
        );


    // ======================================
    // DELETE
    // ======================================

    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            async function () {

                const confirmed =
                    confirm(
                        "Are you sure you want to delete this expense?"
                    );


                if (!confirmed) {

                    return;

                }


                try {
                    await deleteExpense(expense.id);
                    renderExpenses();
                    updateStatistics();
                } catch (error) {
                    alert(`Could not delete expense: ${error.message}`);
                }


            }
        );

    }


    // ======================================
    // EDIT
    // ======================================

    if (editButton) {

        editButton.addEventListener(
            "click",
            function () {

                openEditExpenseModal(
                    expense
                );

            }
        );

    }

}


// ==========================================
// EDIT EXPENSE MODAL
// ==========================================

const editExpenseModal = document.getElementById("editExpenseModal");
const editExpenseForm = document.getElementById("editExpenseForm");
const editAmountInput = document.getElementById("editAmount");
const editCategoryInput = document.getElementById("editCategory");
const editDateInput = document.getElementById("editDate");
const editDescriptionInput = document.getElementById("editDescription");
const closeEditModalButton = document.getElementById("closeEditModal");
const cancelEditModalButton = document.getElementById("cancelEditModal");
const editModalBackdrop = document.getElementById("editModalBackdrop");

let expenseBeingEdited = null;

function openEditExpenseModal(expense) {
    if (!editExpenseModal || !editExpenseForm) return;

    expenseBeingEdited = expense;
    editAmountInput.value = Number(expense.amount || 0);
    editCategoryInput.value = expense.category || "Other";
    editDateInput.value = expense.date || "";
    editDescriptionInput.value = expense.description || "";

    editExpenseModal.classList.add("show");
    editExpenseModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    setTimeout(() => editAmountInput.focus(), 50);
}

function closeEditExpenseModal() {
    if (!editExpenseModal) return;

    editExpenseModal.classList.remove("show");
    editExpenseModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    expenseBeingEdited = null;
    if (editExpenseForm) editExpenseForm.reset();
}

if (closeEditModalButton) closeEditModalButton.addEventListener("click", closeEditExpenseModal);
if (cancelEditModalButton) cancelEditModalButton.addEventListener("click", closeEditExpenseModal);
if (editModalBackdrop) editModalBackdrop.addEventListener("click", closeEditExpenseModal);

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && editExpenseModal?.classList.contains("show")) {
        closeEditExpenseModal();
    }
});

if (editExpenseForm) {
    editExpenseForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!expenseBeingEdited) return;

        const amount = Number(editAmountInput.value);
        const category = editCategoryInput.value;
        const date = editDateInput.value;
        const description = editDescriptionInput.value.trim();

        if (!amount || amount <= 0) {
            editAmountInput.focus();
            return;
        }

        if (!category || !date) return;

        const saveButton = document.getElementById("saveEditModal");
        const originalText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
            await updateExpense(expenseBeingEdited.id, {
                amount,
                category,
                date,
                description
            });

            closeEditExpenseModal();
            renderExpenses();
            updateStatistics();
        } catch (error) {
            alert(`Could not update expense: ${error.message}`);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = originalText;
        }
    });
}

// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateStatistics() {

    if (
        !totalSpentElement ||
        !transactionCountElement ||
        !averageExpenseElement
    ) {

        return;

    }


    const expenses =
        getData().expenses;


    const total =
        getTotalSpent(expenses);


    const count =
        expenses.length;


    const average =
        getAverageExpense(expenses);


    totalSpentElement.textContent =
        formatCurrency(total);


    transactionCountElement.textContent =
        count;


    averageExpenseElement.textContent =
        formatCurrency(Math.round(average));

}


// ==========================================
// SEARCH
// ==========================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            applyFilters();

        }
    );

}


// ==========================================
// CATEGORY FILTER
// ==========================================

if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        function () {

            applyFilters();

        }
    );

}


// ==========================================
// FILTER EXPENSES
// ==========================================

function applyFilters() {

    if (!tableBody) {

        return;

    }


    const searchTerm =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const selectedCategory =
        categoryFilter
            ? categoryFilter.value
            : "all";


    const rows =
        tableBody.querySelectorAll(
            "tr"
        );


    let visibleRows =
        0;


    rows.forEach(
        function (row) {

            const rowText =
                row.textContent
                    .toLowerCase();


            const categoryBadge =
                row.querySelector(
                    ".category-badge"
                );


            const rowCategory =
                categoryBadge
                    ? categoryBadge.textContent.trim()
                    : "";


            const matchesSearch =
                rowText.includes(
                    searchTerm
                );


            const matchesCategory =
                selectedCategory === "all" ||
                rowCategory ===
                    selectedCategory;


            if (
                matchesSearch &&
                matchesCategory
            ) {

                row.style.display =
                    "";

                visibleRows++;

            } else {

                row.style.display =
                    "none";

            }

        }
    );


    updateEmptyState(
        visibleRows
    );

}


// ==========================================
// EMPTY STATE
// ==========================================

function updateEmptyState(
    visibleRows = null
) {

    const emptyState =
        document.getElementById(
            "emptyState"
        );


    if (!emptyState) {

        return;

    }


    if (
        visibleRows === null
    ) {

        visibleRows =
            getData().expenses.length;

    }


    if (
        visibleRows === 0
    ) {

        emptyState.style.display =
            "block";

    } else {

        emptyState.style.display =
            "none";

    }

}


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        renderExpenses();

        updateStatistics();

    }
);


window.addEventListener(
    "studentspend:data-changed",
    function () {
        renderExpenses();
        updateStatistics();
    }
);
