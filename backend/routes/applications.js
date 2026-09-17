const express = require("express");
const jwt = require("jsonwebtoken");

const Application = require("../models/Application");
const Project = require("../models/Project");

const router = express.Router();

const SECRET_KEY = "freelancehub-secret-key";

// =====================================
// AUTH MIDDLEWARE
// =====================================

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Invalid authorization token",
      });
    }

    const decoded = jwt.verify(token, SECRET_KEY);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// =====================================
// APPLY FOR PROJECT
// POST /api/applications
// FREELANCER ONLY
// =====================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({
        message: "Only freelancers can apply for projects",
      });
    }

    const {
      projectId,
      bidAmount,
      deliveryDays,
      message,
    } = req.body;

    if (
      !projectId ||
      !bidAmount ||
      !deliveryDays ||
      !message?.trim()
    ) {
      return res.status(400).json({
        message: "All application fields are required",
      });
    }

    const numericBid = Number(bidAmount);
    const numericDeliveryDays = Number(deliveryDays);

    if (
      Number.isNaN(numericBid) ||
      numericBid <= 0
    ) {
      return res.status(400).json({
        message: "Please enter a valid bid amount",
      });
    }

    if (
      Number.isNaN(numericDeliveryDays) ||
      numericDeliveryDays <= 0
    ) {
      return res.status(400).json({
        message: "Please enter valid delivery days",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (project.status !== "open") {
      return res.status(400).json({
        message: "This project is no longer open",
      });
    }

    const existingApplication = await Application.findOne({
      projectId,
      freelancerId: req.user.id,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this project",
      });
    }

    const application = await Application.create({
      projectId,
      freelancerId: req.user.id,
      freelancerName: req.user.name,
      bidAmount: numericBid,
      deliveryDays: numericDeliveryDays,
      message: message.trim(),
      status: "pending",
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Apply project error:", error);

    return res.status(500).json({
      message: "Unable to submit application",
    });
  }
});

// =====================================
// CLIENT PENDING APPLICATION COUNT
// GET /api/applications/client/pending-count
// =====================================

router.get(
  "/client/pending-count",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "client") {
        return res.status(403).json({
          message: "Only clients can view pending application count",
        });
      }

      const projects = await Project.find({
        clientId: req.user.id,
      }).select("_id");

      const projectIds = projects.map((project) => project._id);

      if (projectIds.length === 0) {
        return res.status(200).json({
          pendingCount: 0,
        });
      }

      const pendingCount = await Application.countDocuments({
        projectId: {
          $in: projectIds,
        },
        status: "pending",
      });

      return res.status(200).json({
        pendingCount,
      });
    } catch (error) {
      console.error(
        "Pending application count error:",
        error
      );

      return res.status(500).json({
        message: "Unable to load pending application count",
      });
    }
  }
);

// =====================================
// GET FREELANCER APPLICATIONS
// GET /api/applications/my-applications
// =====================================

router.get(
  "/my-applications",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "freelancer") {
        return res.status(403).json({
          message: "Only freelancers can view their applications",
        });
      }

      const applications = await Application.find({
        freelancerId: req.user.id,
      })
        .populate({
          path: "projectId",
          select:
            "title description skills budget deadline clientId clientName status completedAt createdAt",
        })
        .sort({
          createdAt: -1,
        });

      return res.status(200).json(applications);
    } catch (error) {
      console.error(
        "Get my applications error:",
        error
      );

      return res.status(500).json({
        message: "Unable to load applications",
      });
    }
  }
);

// =====================================
// GET APPLICATIONS FOR PROJECT
// GET /api/applications/project/:projectId
// CLIENT OWNER ONLY
// =====================================

router.get(
  "/project/:projectId",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "client") {
        return res.status(403).json({
          message: "Only clients can view project applications",
        });
      }

      const project = await Project.findById(
        req.params.projectId
      );

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      if (
        project.clientId.toString() !==
        req.user.id
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to view these applications",
        });
      }

      const applications = await Application.find({
        projectId: req.params.projectId,
      })
        .populate(
          "freelancerId",
          "name email bio skills experience hourlyRate portfolio"
        )
        .sort({
          createdAt: -1,
        });

      return res.status(200).json(applications);
    } catch (error) {
      console.error(
        "Get project applications error:",
        error
      );

      return res.status(500).json({
        message: "Unable to load applications",
      });
    }
  }
);

// =====================================
// WITHDRAW APPLICATION
// DELETE /api/applications/:applicationId
// FREELANCER ONLY
// =====================================

router.delete(
  "/:applicationId",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "freelancer") {
        return res.status(403).json({
          message: "Only freelancers can withdraw applications",
        });
      }

      const application = await Application.findById(
        req.params.applicationId
      );

      if (!application) {
        return res.status(404).json({
          message: "Application not found",
        });
      }

      if (
        application.freelancerId.toString() !==
        req.user.id
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to withdraw this application",
        });
      }

      if (application.status !== "pending") {
        return res.status(400).json({
          message:
            "Only pending applications can be withdrawn",
        });
      }

      await Application.findByIdAndDelete(
        req.params.applicationId
      );

      return res.status(200).json({
        message: "Application withdrawn successfully",
      });
    } catch (error) {
      console.error(
        "Withdraw application error:",
        error
      );

      return res.status(500).json({
        message: "Unable to withdraw application",
      });
    }
  }
);

// =====================================
// ACCEPT / REJECT APPLICATION
// PATCH /api/applications/:applicationId/status
// CLIENT ONLY
// =====================================

router.patch(
  "/:applicationId/status",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "client") {
        return res.status(403).json({
          message: "Only clients can update applications",
        });
      }

      const { status } = req.body;

      if (
        !["accepted", "rejected"].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Status must be accepted or rejected",
        });
      }

      const application = await Application.findById(
        req.params.applicationId
      );

      if (!application) {
        return res.status(404).json({
          message: "Application not found",
        });
      }

      const project = await Project.findById(
        application.projectId
      );

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      if (
        project.clientId.toString() !==
        req.user.id
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to manage this application",
        });
      }

      if (application.status !== "pending") {
        return res.status(400).json({
          message:
            "This application has already been processed",
        });
      }

      // =====================================
      // ACCEPT APPLICATION
      // =====================================

      if (status === "accepted") {
        if (project.status !== "open") {
          return res.status(400).json({
            message:
              "This project is no longer open",
          });
        }

        application.status = "accepted";

        await application.save();

        await Application.updateMany(
          {
            projectId: application.projectId,
            _id: {
              $ne: application._id,
            },
            status: "pending",
          },
          {
            $set: {
              status: "rejected",
            },
          }
        );

        project.status = "closed";

        await project.save();

        return res.status(200).json({
          message: "Freelancer accepted successfully",
          application,
          project,
        });
      }

      // =====================================
      // REJECT APPLICATION
      // =====================================

      application.status = "rejected";

      await application.save();

      return res.status(200).json({
        message: "Application rejected successfully",
        application,
      });
    } catch (error) {
      console.error(
        "Update application status error:",
        error
      );

      return res.status(500).json({
        message: "Unable to update application",
      });
    }
  }
);

module.exports = router;