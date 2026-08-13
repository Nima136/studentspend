document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));

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

    if (user) {
        document.querySelectorAll(".profile-info strong")
            .forEach(el => el.textContent = user.name || "Student");

        document.querySelectorAll(".profile-avatar")
            .forEach(el => {
                el.textContent =
                    (user.name || "S").charAt(0).toUpperCase();
            });
    }

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