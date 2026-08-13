const API_BASE_URL = "https://studentspend-production.up.railway.app";
const TOKEN_KEY = "studentSpendToken";
const USER_KEY = "studentSpendUser";
const STORAGE_KEY = "studentSpendData";

async function authRequest(path, body) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    let payload = {};
    try {
        payload = await response.json();
    } catch {}

    if (!response.ok) {
        throw new Error(
            payload.message || "Request failed"
        );
    }

    return payload;
}

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const payload = await authRequest(
                "/api/auth/login",
                { email, password }
            );

            localStorage.setItem(
                TOKEN_KEY,
                payload.token
            );

            localStorage.setItem(
                USER_KEY,
                JSON.stringify(payload.user)
            );

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    budget: Number(payload.user.monthly_budget) || 0,
                    expenses: []
                })
            );

            window.location.href = "dashboard.html";
        } catch (error) {
            alert(error.message);
        }
    });
}

if (registerForm) {
    registerForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const college = document.getElementById("college").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;
        const allowance =
            Number(document.getElementById("allowance").value) || 15000;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            await authRequest(
                "/api/auth/register",
                {
                    name,
                    email,
                    college,
                    password,
                    monthly_budget: allowance
                }
            );

            alert("Registration successful! Please log in.");
            window.location.href = "login.html";
        } catch (error) {
            alert(error.message);
        }
    });
}
