document.addEventListener("DOMContentLoaded", () => {

    let user = null;

    try {
        user = JSON.parse(
            localStorage.getItem("studentSpendUser") || "null"
        );
    } catch (error) {
        console.error("Could not load user:", error);
    }


    if (!user) {
        window.location.href = "login.html";
        return;
    }


    const nameInput =
        document.getElementById("name");

    const emailInput =
        document.getElementById("email");

    const collegeInput =
        document.getElementById("college");

    const budgetInput =
        document.getElementById("monthlyBudget");

    const profileDisplayName =
        document.getElementById("profileDisplayName");

    const profileDisplayEmail =
        document.getElementById("profileDisplayEmail");

    const profileAvatar =
        document.getElementById("profileAvatar");


    // ==========================
    // LOAD USER
    // ==========================

    const userName =
        user.name ||
        user.username ||
        "User";


    nameInput.value = userName;

    emailInput.value =
        user.email || "";

    collegeInput.value =
        user.college || "";

    budgetInput.value =
        user.monthly_budget || 0;


    profileDisplayName.textContent =
        userName;

    profileDisplayEmail.textContent =
        user.email || "";

    profileAvatar.textContent =
        userName.charAt(0).toUpperCase();


    // ==========================
    // SAVE PROFILE
    // ==========================

    document
        .getElementById("saveProfileButton")
        .addEventListener("click", async () => {

            const name =
                nameInput.value.trim();

            const college =
                collegeInput.value.trim();


            if (!name) {
                alert("Please enter your name.");
                return;
            }


            try {

                /*
                 * This will be connected to
                 * the backend profile endpoint.
                 */

                user.name = name;
                user.college = college;


                localStorage.setItem(
                    "studentSpendUser",
                    JSON.stringify(user)
                );


                profileDisplayName.textContent =
                    name;

                profileAvatar.textContent =
                    name.charAt(0).toUpperCase();


                alert("Profile updated!");

            } catch (error) {

                console.error(error);

                alert(
                    "Could not update your profile."
                );

            }

        });


    // ==========================
    // UPDATE BUDGET
    // ==========================

    document
        .getElementById("saveBudgetButton")
        .addEventListener("click", async () => {

            const budget =
                Number(budgetInput.value);


            if (budget < 0) {
                alert("Budget cannot be negative.");
                return;
            }


            try {

                const token =
                    localStorage.getItem(
                        "studentSpendToken"
                    );


                const response =
                    await fetch(
                        "https://studentspend-production.up.railway.app/api/budget",
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({
                                budget
                            })
                        }
                    );


                if (!response.ok) {
                    throw new Error(
                        "Budget update failed."
                    );
                }


                user.monthly_budget = budget;


                localStorage.setItem(
                    "studentSpendUser",
                    JSON.stringify(user)
                );


                alert("Budget updated!");

            } catch (error) {

                console.error(error);

                alert(
                    "Could not update your budget."
                );

            }

        });


    // ==========================
// THEME
// ==========================

const themeButtons =
    document.querySelectorAll(".theme-option");

function applyTheme(theme) {

    if (theme === "dark") {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }

    localStorage.setItem(
        "studentSpendTheme",
        theme
    );

    themeButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.theme === theme
        );
    });
}


themeButtons.forEach(button => {

    button.addEventListener("click", () => {

        const theme =
            button.dataset.theme;

        applyTheme(theme);

    });

});


// ==========================
// LOAD SAVED THEME
// ==========================

const savedTheme =
    localStorage.getItem("studentSpendTheme")
    || "light";

applyTheme(savedTheme);

    // ==========================
    // LOGOUT
    // ==========================

    document
        .getElementById("logoutButton")
        .addEventListener("click", () => {

            localStorage.removeItem(
                "studentSpendToken"
            );

            localStorage.removeItem(
                "studentSpendUser"
            );

            localStorage.removeItem(
                "studentSpendData"
            );


            window.location.href =
                "login.html";

        });

});