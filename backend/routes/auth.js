const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

function makeToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

router.post("/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            college = "",
            monthly_budget = 15000
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const budget = Number(monthly_budget) || 15000;

        if (budget < 0) {
            return res.status(400).json({
                success: false,
                message: "Monthly budget cannot be negative"
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [normalizedEmail]
        );

        if (existing.length) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users
                (name, email, password_hash, college, monthly_budget)
             VALUES (?, ?, ?, ?, ?)`,
            [
                String(name).trim(),
                normalizedEmail,
                passwordHash,
                String(college).trim(),
                budget
            ]
        );

        res.status(201).json({
            success: true,
            message: "Registration successful",
            user: {
                id: result.insertId,
                name: String(name).trim(),
                email: normalizedEmail,
                college: String(college).trim(),
                monthly_budget: budget
            }
        });
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const [users] = await db.query(
            `SELECT id, name, email, college, monthly_budget, password_hash
             FROM users
             WHERE email = ?`,
            [normalizedEmail]
        );

        if (!users.length) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];
        const passwordCorrect = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = makeToken(user);

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                college: user.college,
                monthly_budget: Number(user.monthly_budget)
            }
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

module.exports = router;
