document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("studentSpendToken");

    const protectedPage = ![
        "login.html",
        "register.html",
        "index.html"
    ].some(name => location.pathname.endsWith(name));

    if (protectedPage && !token) {
        location.href = "login.html";
        return;
    }

    const user = (() => {
        try {
            return JSON.parse(
                localStorage.getItem("studentSpendUser") || "null"
            );
        } catch {
            return null;
        }
    })();

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
