const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function homePage(req, res) {
  res.render("home");
}


async function signUpGet(req, res) {
  res.render("signUp");
}

async function signUpPost(req, res, next) {
  console.log("Sign up post request received");
  
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user =  await prisma.users.create({
      data: {
        firstname,
        lastname,
        username,
        password: hashedPassword,
        email,
      },
    });  
      
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.redirect("/login");

  } catch (err) {
    return next(err);
  }
}

module.exports = {
  homePage,
  signUpGet,
  signUpPost,
};
