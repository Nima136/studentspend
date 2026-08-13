require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

const authRoutes = require("./routes/auth");
const requireAuth = require("./middleware/auth");

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "StudentSpend backend is running!"
    });
});

app.get("/test", (req, res) => {
    res.send("TEST ROUTE WORKS!");
});

app.get("/debug-db", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                DATABASE() AS database_name,
                @@hostname AS hostname,
                @@port AS port,
                CURRENT_USER() AS db_user,
                (SELECT COUNT(*) FROM users) AS user_count,
                (SELECT COUNT(*) FROM expenses) AS expense_count
        `);

        res.json({
            success: true,
            ...rows[0]
        });
    } catch (error) {
        console.error("DEBUG DB ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Database connection/query failed",
            error: error.message
        });
    }
});

// Return all data belonging only to the logged-in user.
app.get("/api/data", requireAuth, async (req, res) => {
    try {
        const [[user]] = await db.query(
            `SELECT id, name, email, college, monthly_budget
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const [expenses] = await db.query(
            `SELECT
                id,
                user_id,
                category,
                description,
                amount,
                DATE_FORMAT(expense_date, '%Y-%m-%d') AS date
             FROM expenses
             WHERE user_id = ?
             ORDER BY expense_date DESC, id DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                college: user.college || "",
                monthly_budget: Number(user.monthly_budget || 0)
            },
            expenses: expenses.map(expense => ({
                ...expense,
                id: Number(expense.id),
                user_id: Number(expense.user_id),
                amount: Number(expense.amount)
            }))
        });
    } catch (error) {
        console.error("GET DATA ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Could not load your data"
        });
    }
});

app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
        const { amount, category, date, description = "" } = req.body;

        const numericAmount = Number(amount);

        if (!numericAmount || numericAmount <= 0 || !category || !date) {
            return res.status(400).json({
                success: false,
                message: "Amount, category and date are required"
            });
        }

        const [result] = await db.query(
            `INSERT INTO expenses
                (user_id, category, description, amount, expense_date)
             VALUES (?, ?, ?, ?, ?)`,
            [
                req.user.id,
                String(category).trim(),
                String(description).trim(),
                numericAmount,
                date
            ]
        );

        const [[expense]] = await db.query(
            `SELECT
                id, user_id, category, description, amount,
                DATE_FORMAT(expense_date, '%Y-%m-%d') AS date
             FROM expenses
             WHERE id = ? AND user_id = ?`,
            [result.insertId, req.user.id]
        );

        res.status(201).json({
            success: true,
            expense: {
                ...expense,
                id: Number(expense.id),
                user_id: Number(expense.user_id),
                amount: Number(expense.amount)
            }
        });
    } catch (error) {
        console.error("ADD EXPENSE ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Could not add expense"
        });
    }
});

app.put("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { amount, category, date, description } = req.body;

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense ID"
            });
        }

        const fields = [];
        const values = [];

        if (amount !== undefined) {
            const numericAmount = Number(amount);
            if (!numericAmount || numericAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Amount must be greater than zero"
                });
            }
            fields.push("amount = ?");
            values.push(numericAmount);
        }

        if (category !== undefined) {
            fields.push("category = ?");
            values.push(String(category).trim());
        }

        if (date !== undefined) {
            fields.push("expense_date = ?");
            values.push(date);
        }

        if (description !== undefined) {
            fields.push("description = ?");
            values.push(String(description).trim());
        }

        if (!fields.length) {
            return res.status(400).json({
                success: false,
                message: "Nothing to update"
            });
        }

        values.push(id, req.user.id);

        const [result] = await db.query(
            `UPDATE expenses
             SET ${fields.join(", ")}
             WHERE id = ? AND user_id = ?`,
            values
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        const [[expense]] = await db.query(
            `SELECT
                id, user_id, category, description, amount,
                DATE_FORMAT(expense_date, '%Y-%m-%d') AS date
             FROM expenses
             WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );

        res.json({
            success: true,
            expense: {
                ...expense,
                id: Number(expense.id),
                user_id: Number(expense.user_id),
                amount: Number(expense.amount)
            }
        });
    } catch (error) {
        console.error("UPDATE EXPENSE ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Could not update expense"
        });
    }
});

app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense ID"
            });
        }

        const [result] = await db.query(
            `DELETE FROM expenses
             WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        res.json({
            success: true,
            message: "Expense deleted"
        });
    } catch (error) {
        console.error("DELETE EXPENSE ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Could not delete expense"
        });
    }
});

app.put("/api/budget", requireAuth, async (req, res) => {
    try {
        const budget = Number(req.body.budget);

        if (!Number.isFinite(budget) || budget <= 0) {
            return res.status(400).json({
                success: false,
                message: "Budget must be greater than zero"
            });
        }

        const [result] = await db.query(
            `UPDATE users
             SET monthly_budget = ?
             WHERE id = ?`,
            [budget, req.user.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            budget
        });
    } catch (error) {
        console.error("UPDATE BUDGET ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Could not update budget"
        });
    }
});

db.query("SELECT 1")
    .then(() => {
        console.log("MySQL connected successfully!");
    })
    .catch((error) => {
        console.error("MySQL connection failed:", error.message);
    });

app.listen(PORT, () => {
    console.log(
        `StudentSpend backend running on http://localhost:${PORT}`
    );
});
