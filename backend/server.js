const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// =====================================
// ROUTES
// =====================================

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const applicationRoutes = require("./routes/applications");
const messageRoutes = require("./routes/messages");
const reviewRoutes = require("./routes/reviews");
const favouriteRoutes = require("./routes/favourites");
const invitationRoutes = require("./routes/invitations");

// =====================================
// MODELS
// =====================================

const User = require("./models/User");

// =====================================
// APP
// =====================================

const app = express();

const PORT = process.env.PORT || 5000;

const SECRET_KEY =
  process.env.JWT_SECRET ||
  "freelancehub-secret-key";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/freelancehub";

// =====================================
// MIDDLEWARE
// =====================================

app.use(cors());
app.use(express.json());

// =====================================
// AUTH MIDDLEWARE
// =====================================

const authMiddleware = (req, res, next) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message:
          "Authorization token required",
      });
    }

    const token =
      authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message:
          "Invalid authorization token",
      });
    }

    const decoded = jwt.verify(
      token,
      SECRET_KEY
    );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message:
        "Invalid or expired token",
    });
  }
};

// =====================================
// API ROUTES
// =====================================

// AUTH
app.use(
  "/api/auth",
  authRoutes
);

// PROJECTS
app.use(
  "/api/projects",
  projectRoutes
);

// APPLICATIONS
app.use(
  "/api/applications",
  applicationRoutes
);

// MESSAGES
app.use(
  "/api/messages",
  messageRoutes
);

// REVIEWS
app.use(
  "/api/reviews",
  reviewRoutes
);

// FAVOURITES
app.use(
  "/api/favourites",
  favouriteRoutes
);

// INVITATIONS
app.use(
  "/api/invitations",
  invitationRoutes
);

// =====================================
// GET CURRENT USER PROFILE
// GET /api/profile
// =====================================

app.get(
  "/api/profile",
  authMiddleware,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.id
        ).select("-password");

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      return res
        .status(200)
        .json(user);
    } catch (error) {
      console.error(
        "Profile fetch error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load profile",
      });
    }
  }
);

// =====================================
// UPDATE FREELANCER PROFILE
// PUT /api/profile
// =====================================

app.put(
  "/api/profile",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role !== "freelancer"
      ) {
        return res.status(403).json({
          message:
            "Only freelancers can update this profile",
        });
      }

      const {
        bio,
        skills,
        experience,
        hourlyRate,
        portfolio,
      } = req.body;

      const user =
        await User.findById(
          req.user.id
        );

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // =====================================
      // UPDATE BIO
      // =====================================

      if (bio !== undefined) {
        user.bio = bio;
      }

      // =====================================
      // UPDATE SKILLS
      // =====================================

      if (skills !== undefined) {
        user.skills = skills;
      }

      // =====================================
      // UPDATE EXPERIENCE
      // =====================================

      if (experience !== undefined) {
        user.experience =
          experience;
      }

      // =====================================
      // UPDATE HOURLY RATE
      // =====================================

      if (hourlyRate !== undefined) {
        user.hourlyRate =
          hourlyRate;
      }

      // =====================================
      // UPDATE PORTFOLIO
      // =====================================

      if (portfolio !== undefined) {
        user.portfolio =
          portfolio;
      }

      await user.save();

      const updatedUser =
        await User.findById(
          req.user.id
        ).select("-password");

      return res.status(200).json({
        message:
          "Profile updated successfully",

        user: updatedUser,
      });
    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to update profile",
      });
    }
  }
);

// =====================================
// HOME / SERVER TEST
// =====================================

app.get("/", (req, res) => {
  res.send(
    "FreelanceHub API is running"
  );
});

// =====================================
// 404 ROUTE
// =====================================

app.use((req, res) => {
  return res.status(404).json({
    message: "Route not found",
  });
});

// =====================================
// CONNECT TO MONGODB
// =====================================

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(
      "MongoDB connected successfully"
    );

    // =====================================
    // START SERVER
    // =====================================

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection error:",
      error
    );
  });