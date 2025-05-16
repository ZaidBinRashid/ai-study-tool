import { hash, compare } from "bcrypt";
import { body, validationResult } from "express-validator";
import { PrismaClient } from '@prisma/client';
import jwt from "jsonwebtoken";
import 'dotenv/config';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET_KEY;

// Home page
export async function homePage(req, res) {
  res.render("home", { user: req.user });
}

// Sign-up page (GET)
export async function signUpGet(req, res) {
  res.render("signUp");
}

// Sign-up page (POST)
export async function signUpPost(req, res, next) {
  await Promise.all([
    body("firstname").trim().escape().notEmpty().withMessage("First name is required").run(req),
    body("lastname").trim().escape().notEmpty().withMessage("Last name is required").run(req),
    body("username").trim().escape().notEmpty().withMessage("Username is required").run(req),
    body("email").trim().isEmail().withMessage("Valid email is required").run(req),
    body("password").trim().isLength({ min: 8 }).withMessage("Password must be at least 8 characters").run(req),
    body("confirmPassword").trim().isLength({ min: 8 }).withMessage("Confirm Password must be at least 8 characters").run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("signUp", { errors: errors.array() });
  }

  const { firstname, lastname, username, password, confirmPassword, email } = req.body;

  if (password !== confirmPassword) {
    return res.render("signUp", {
      errors: [{ msg: "Passwords do not match!" }],
    });
  }

  try {
    // Check for existing user by email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.render("signUp", {
        errors: [{ msg: "Email already in use" }],
      });
    }

    const hashedPassword = await hash(password, 10);

    await prisma.user.create({
      data: {
        firstname,
        lastname,
        username,
        password: hashedPassword,
        email,
      },
    });

    res.redirect("/login");
  } catch (err) {
    return next(err);
  }
}

// App page
export async function appGet(req, res) {
  res.render("app");
}

// Login page (GET)
export async function logInGet(req, res) {
  res.render("login");
}

// Login page (POST)
export async function logInPost(req, res, next) {
  await Promise.all([
    body("email").trim().isEmail().withMessage("Email is not valid").run(req),
    body("password").trim().isLength({ min: 8 }).withMessage("Password must be at least 8 characters").run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("login", { errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await compare(password, user.password))) {
      return res.status(401).render("login", {
        errors: [{ msg: "Invalid email or password" }],
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
    });



    res.redirect("/app");
  } catch (err) {
    return next(err);
  }
}

// Logout
export async function logOut(req, res) {
  res.clearCookie("token");
  res.redirect("/login");
}
