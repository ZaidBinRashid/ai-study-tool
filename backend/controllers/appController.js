import { hash, compare } from "bcrypt";
import { body, validationResult } from "express-validator";
import { PrismaClient } from '@prisma/client';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Home page
export async function homePage(req, res) {
  res.render("home", { user: req.user });
}

// Sign-up page 
export async function signUpGet(req, res) {
  res.render("signUp");
}

export async function signUpPost(req, res, next) {
   // Add validation and sanitization
  await body("firstname")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("First name is required")
    .run(req);
  await body("lastname")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Last name is required")
    .run(req);
  await body("username")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("User name is required")
    .run(req);
  await body("email")
    .trim()
    .isEmail()
    .withMessage("Email is not valid")
    .run(req);
  await body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .run(req);
  await body("confirmPassword")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Confirm Password must be at least 8 characters long")
    .run(req);

  // Check for validation errors
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
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await hash(password, 10);

    const user =  await prisma.users.create({
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

export async function appGet(req, res) {
  res.render("app");
}

// Login page 
export async function logInGet(req, res) {
  res.render("login");
}

const JWT_SECRET = process.env.JWT_SECRET_KEY

export async function logInPost(req, res, next) {
  // Add validation and sanitization
  await body("email")
    .trim()
    .isEmail()
    .withMessage("Email is not valid")
    .run(req);
  await body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .run(req);

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("login", { errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { email },
    });

    // If user does not exist, return error
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Compare password with hashed password
    const isMatch = await compare(password, user.password);

    // If password does not match, return error
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email:user.email},
      JWT_SECRET,
      { expiresIn: "1h" }
    )

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000, // 1 hour
    });

    res.redirect("/app");
  } catch (err) {
    return next(err);
  }
}


