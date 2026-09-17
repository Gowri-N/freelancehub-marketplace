const express = require("express");
const jwt = require("jsonwebtoken");

const Favourite = require("../models/Favourite");
const User = require("../models/User");

const router = express.Router();

const JWT_SECRET = "freelancehub-secret-key";

// =====================================
// AUTH MIDDLEWARE
// =====================================

const authMiddleware = (req, res, next) => {
  const authHeader =
    req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  const token =
    authHeader.split(" ")[1];

  try {
    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

// =====================================
// GET SAVED FREELANCERS
// GET /api/favourites
// =====================================

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role !== "client"
      ) {
        return res.status(403).json({
          message:
            "Only clients can view saved freelancers",
        });
      }

      const favourites =
        await Favourite.find({
          clientId: req.user.id,
        })
          .populate(
            "freelancerId",
            "name email bio skills experience hourlyRate portfolio"
          )
          .sort({
            createdAt: -1,
          });

      res.json(favourites);
    } catch (error) {
      console.error(
        "GET FAVOURITES ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Server error while loading saved freelancers",
      });
    }
  }
);

// =====================================
// SAVE FREELANCER
// POST /api/favourites
// =====================================

router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role !== "client"
      ) {
        return res.status(403).json({
          message:
            "Only clients can save freelancers",
        });
      }

      const {
        freelancerId,
      } = req.body;

      if (!freelancerId) {
        return res.status(400).json({
          message:
            "Freelancer ID is required",
        });
      }

      const freelancer =
        await User.findById(
          freelancerId
        );

      if (!freelancer) {
        return res.status(404).json({
          message:
            "Freelancer not found",
        });
      }

      if (
        freelancer.role !==
        "freelancer"
      ) {
        return res.status(400).json({
          message:
            "Selected user is not a freelancer",
        });
      }

      const existingFavourite =
        await Favourite.findOne({
          clientId: req.user.id,
          freelancerId,
        });

      if (existingFavourite) {
        return res.status(200).json({
          message:
            "Freelancer already saved",
          favourite:
            existingFavourite,
        });
      }

      const favourite =
        await Favourite.create({
          clientId: req.user.id,
          freelancerId,
        });

      const populatedFavourite =
        await Favourite.findById(
          favourite._id
        ).populate(
          "freelancerId",
          "name email bio skills experience hourlyRate portfolio"
        );

      res.status(201).json({
        message:
          "Freelancer saved successfully",
        favourite:
          populatedFavourite,
      });
    } catch (error) {
      console.error(
        "SAVE FAVOURITE ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Server error while saving freelancer",
      });
    }
  }
);

// =====================================
// REMOVE SAVED FREELANCER
// DELETE /api/favourites/:freelancerId
// =====================================

router.delete(
  "/:freelancerId",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role !== "client"
      ) {
        return res.status(403).json({
          message:
            "Only clients can remove saved freelancers",
        });
      }

      const {
        freelancerId,
      } = req.params;

      const favourite =
        await Favourite.findOneAndDelete({
          clientId: req.user.id,
          freelancerId,
        });

      if (!favourite) {
        return res.status(404).json({
          message:
            "Saved freelancer not found",
        });
      }

      res.json({
        message:
          "Freelancer removed from saved list",
      });
    } catch (error) {
      console.error(
        "DELETE FAVOURITE ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Server error while removing freelancer",
      });
    }
  }
);

// =====================================
// CHECK IF SAVED
// GET /api/favourites/check/:freelancerId
// =====================================

router.get(
  "/check/:freelancerId",
  authMiddleware,
  async (req, res) => {
    try {
      const favourite =
        await Favourite.findOne({
          clientId: req.user.id,
          freelancerId:
            req.params.freelancerId,
        });

      res.json({
        saved: Boolean(
          favourite
        ),
      });
    } catch (error) {
      console.error(
        "CHECK FAVOURITE ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Server error",
      });
    }
  }
);

module.exports = router;