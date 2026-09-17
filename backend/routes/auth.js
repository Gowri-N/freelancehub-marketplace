const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const SECRET_KEY = "freelancehub-secret-key";

// =====================================
// AUTH MIDDLEWARE
// =====================================

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Invalid token format",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      SECRET_KEY
    );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// =====================================
// SIGN UP
// =====================================

router.post(
  "/signup",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
      } = req.body;

      if (
        !name ||
        !email ||
        !password ||
        !role
      ) {
        return res.status(400).json({
          message:
            "Please fill in all fields",
        });
      }

      if (
        ![
          "client",
          "freelancer",
        ].includes(role)
      ) {
        return res.status(400).json({
          message:
            "Invalid user role",
        });
      }

      const existingUser =
        await User.findOne({
          email:
            email.toLowerCase(),
        });

      if (existingUser) {
        return res.status(400).json({
          message:
            "An account with this email already exists",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const newUser =
        new User({
          name,
          email:
            email.toLowerCase(),
          password:
            hashedPassword,
          role,
        });

      await newUser.save();

      return res.status(201).json({
        message:
          "Account created successfully!",
      });

    } catch (error) {
      console.error(
        "Signup error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error",
      });
    }
  }
);

// =====================================
// LOGIN
// =====================================

router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Please enter email and password",
        });
      }

      const user =
        await User.findOne({
          email:
            email.toLowerCase(),
        });

      if (!user) {
        return res.status(400).json({
          message:
            "Invalid email or password",
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatch) {
        return res.status(400).json({
          message:
            "Invalid email or password",
        });
      }

      const token =
        jwt.sign(
          {
            id:
              user._id,

            role:
              user.role,

            name:
              user.name,
          },
          SECRET_KEY,
          {
            expiresIn:
              "1d",
          }
        );

      return res.status(200).json({
        message:
          "Login successful",

        token,

        user: {
          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          role:
            user.role,
        },
      });

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error",
      });
    }
  }
);

// =====================================
// GET ALL FREELANCERS
// CLIENT ONLY
// =====================================

router.get(
  "/freelancers",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role !==
        "client"
      ) {
        return res.status(403).json({
          message:
            "Only clients can browse freelancers",
        });
      }

      const freelancers =
        await User.find({
          role:
            "freelancer",
        })

          .select(
            "-password"
          )

          .sort({
            createdAt: -1,
          });

      return res.status(200).json(
        freelancers
      );

    } catch (error) {
      console.error(
        "Get freelancers error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error",

        error:
          error.message,
      });
    }
  }
);

// =====================================
// GET ONE FREELANCER PROFILE
// CLIENT ONLY
// =====================================

router.get(
  "/freelancers/:freelancerId",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role !==
        "client"
      ) {
        return res.status(403).json({
          message:
            "Only clients can view freelancer profiles",
        });
      }

      const freelancer =
        await User.findOne({
          _id:
            req.params
              .freelancerId,

          role:
            "freelancer",
        }).select("-password");

      if (!freelancer) {
        return res.status(404).json({
          message:
            "Freelancer not found",
        });
      }

      return res.status(200).json(
        freelancer
      );

    } catch (error) {
      console.error(
        "Get freelancer error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error",

        error:
          error.message,
      });
    }
  }
);

module.exports = router;