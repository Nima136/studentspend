(function () {

    const savedTheme =
        localStorage.getItem("studentSpendTheme") || "light";

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }

})();