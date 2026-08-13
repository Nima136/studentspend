document.addEventListener("DOMContentLoaded", () => {
    let user = null;

    try {
        user = JSON.parse(
            localStorage.getItem("studentSpendUser") || "null"
        );
    } catch (error) {
        console.error("Could not read logged-in user:", error);
    }

    if (!user) return;

    const userName = user.name || user.username || "User";

    const profileName = document.getElementById("profileName");
    const welcomeName = document.getElementById("welcomeName");

    if (profileName) {
        profileName.textContent = userName;
    }

    if (welcomeName) {
        welcomeName.textContent = userName;
    }

    document.querySelectorAll(".profile-info strong")
        .forEach(el => {
            el.textContent = userName;
        });

    document.querySelectorAll(".profile-avatar")
        .forEach(el => {
            el.textContent = userName.charAt(0).toUpperCase();
        });

    document.querySelectorAll("a.logout").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();

            localStorage.removeItem("studentSpendToken");
            localStorage.removeItem("studentSpendUser");
            localStorage.removeItem("studentSpendData");

            location.href = "login.html";
        });
    });
});