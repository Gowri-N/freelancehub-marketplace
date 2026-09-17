const express = require("express");
const jwt = require("jsonwebtoken");

const Review = require("../models/Review");
const Project = require("../models/Project");
const Application = require("../models/Application");

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
// CREATE REVIEW
// CLIENT ONLY
// =====================================

router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "client") {
        return res.status(403).json({
          message:
            "Only clients can submit reviews",
        });
      }

      const {
        projectId,
        rating,
        review,
      } = req.body;


      // =====================================
      // VALIDATE FIELDS
      // =====================================

      if (
        !projectId ||
        !rating ||
        !review?.trim()
      ) {
        return res.status(400).json({
          message:
            "Project, rating and review are required",
        });
      }


      const numericRating =
        Number(rating);


      if (
        numericRating < 1 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          message:
            "Rating must be between 1 and 5",
        });
      }


      // =====================================
      // FIND PROJECT
      // =====================================

      const project =
        await Project.findById(
          projectId
        );


      if (!project) {
        return res.status(404).json({
          message:
            "Project not found",
        });
      }


      // =====================================
      // CHECK PROJECT OWNER
      // =====================================

      if (
        project.clientId.toString() !==
        req.user.id
      ) {
        return res.status(403).json({
          message:
            "You can only review your own projects",
        });
      }


      // =====================================
      // PROJECT MUST BE COMPLETED
      // =====================================

      if (
        project.status !==
        "completed"
      ) {
        return res.status(400).json({
          message:
            "Project must be completed before leaving a review",
        });
      }


      // =====================================
      // CHECK EXISTING REVIEW
      // =====================================

      const existingReview =
        await Review.findOne({
          projectId,
        });


      if (existingReview) {
        return res.status(400).json({
          message:
            "A review has already been submitted for this project",
        });
      }


      // =====================================
      // FIND ACCEPTED FREELANCER
      // =====================================

      const acceptedApplication =
        await Application.findOne({
          projectId,
          status: "accepted",
        });


      if (!acceptedApplication) {
        return res.status(404).json({
          message:
            "Accepted freelancer not found",
        });
      }


      // =====================================
      // CREATE REVIEW
      // =====================================

      const newReview =
        new Review({
          projectId,

          clientId:
            req.user.id,

          freelancerId:
            acceptedApplication.freelancerId,

          rating:
            numericRating,

          review:
            review.trim(),
        });


      await newReview.save();


      const populatedReview =
        await Review.findById(
          newReview._id
        )
          .populate(
            "clientId",
            "name"
          )
          .populate(
            "freelancerId",
            "name email"
          )
          .populate(
            "projectId",
            "title"
          );


      return res.status(201).json({
        message:
          "Review submitted successfully",

        review:
          populatedReview,
      });

    } catch (error) {
      console.error(
        "Create review error:",
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
// GET REVIEW FOR PROJECT
// =====================================

router.get(
  "/project/:projectId",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        projectId,
      } = req.params;


      const review =
        await Review.findOne({
          projectId,
        })
          .populate(
            "clientId",
            "name"
          )
          .populate(
            "freelancerId",
            "name email"
          )
          .populate(
            "projectId",
            "title"
          );


      if (!review) {
        return res.status(404).json({
          message:
            "Review not found",
        });
      }


      return res.status(200).json(
        review
      );

    } catch (error) {
      console.error(
        "Get project review error:",
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
// GET ALL REVIEWS FOR FREELANCER
// =====================================

router.get(
  "/freelancer/:freelancerId",
  async (req, res) => {
    try {
      const {
        freelancerId,
      } = req.params;


      const reviews =
        await Review.find({
          freelancerId,
        })
          .populate(
            "clientId",
            "name"
          )
          .populate(
            "projectId",
            "title"
          )
          .sort({
            createdAt: -1,
          });


      // =====================================
      // CALCULATE AVERAGE RATING
      // =====================================

      let averageRating = 0;


      if (
        reviews.length > 0
      ) {
        const totalRating =
          reviews.reduce(
            (
              total,
              currentReview
            ) =>
              total +
              currentReview.rating,
            0
          );


        averageRating =
          totalRating /
          reviews.length;
      }


      return res.status(200).json({
        reviews,

        totalReviews:
          reviews.length,

        averageRating:
          Number(
            averageRating.toFixed(1)
          ),
      });

    } catch (error) {
      console.error(
        "Get freelancer reviews error:",
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
// EXPORT ROUTER
// =====================================

module.exports = router;