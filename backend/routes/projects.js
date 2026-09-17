const express = require("express");
const jwt = require("jsonwebtoken");
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
// GET ALL PROJECTS
// =====================================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find().sort({
      createdAt: -1,
    });

    return res.status(200).json(projects);
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      message: "Unable to load projects",
    });
  }
});

// =====================================
// CREATE PROJECT
// =====================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({
        message: "Only clients can post projects",
      });
    }

    const {
      title,
      description,
      skills,
      budget,
      deadline,
    } = req.body;

    if (
      !title?.trim() ||
      !description?.trim() ||
      !skills?.trim() ||
      !budget ||
      !deadline
    ) {
      return res.status(400).json({
        message: "All project fields are required",
      });
    }

    const numericBudget = Number(budget);

    if (
      Number.isNaN(numericBudget) ||
      numericBudget <= 0
    ) {
      return res.status(400).json({
        message: "Please enter a valid budget",
      });
    }

    const project = await Project.create({
      title: title.trim(),
      description: description.trim(),
      skills: skills.trim(),
      budget: numericBudget,
      deadline,
      clientId: req.user.id,
      clientName: req.user.name,
      status: "open",
    });

    return res.status(201).json({
      message: "Project posted successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      message: "Unable to create project",
    });
  }
});

// =====================================
// EDIT PROJECT
// =====================================

router.put(
  "/:projectId",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "client") {
        return res.status(403).json({
          message: "Only clients can edit projects",
        });
      }

      const {
        title,
        description,
        skills,
        budget,
        deadline,
      } = req.body;

      if (
        !title?.trim() ||
        !description?.trim() ||
        !skills?.trim() ||
        !budget ||
        !deadline
      ) {
        return res.status(400).json({
          message: "All project fields are required",
        });
      }

      const numericBudget = Number(budget);

      if (
        Number.isNaN(numericBudget) ||
        numericBudget <= 0
      ) {
        return res.status(400).json({
          message: "Please enter a valid budget",
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
            "You are not authorized to edit this project",
        });
      }

      if (project.status !== "open") {
        return res.status(400).json({
          message:
            "Only open projects can be edited",
        });
      }

      project.title = title.trim();
      project.description = description.trim();
      project.skills = skills.trim();
      project.budget = numericBudget;
      project.deadline = new Date(deadline);

      await project.save();

      return res.status(200).json({
        message: "Project updated successfully",
        project,
      });
    } catch (error) {
      console.error("Edit project error:", error);

      return res.status(500).json({
        message: "Unable to update project",
      });
    }
  }
);

// =====================================
// DELETE PROJECT
// DELETE /api/projects/:projectId
// =====================================

router.delete(
  "/:projectId",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "client") {
        return res.status(403).json({
          message:
            "Only clients can delete projects",
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
            "You are not authorized to delete this project",
        });
      }

      if (project.status !== "open") {
        return res.status(400).json({
          message:
            "Only open projects can be deleted",
        });
      }

      await Project.findByIdAndDelete(
        req.params.projectId
      );

      return res.status(200).json({
        message: "Project deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete project error:",
        error
      );

      return res.status(500).json({
        message: "Unable to delete project",
      });
    }
  }
);

// =====================================
// UPDATE PROJECT STATUS
// =====================================

router.patch(
  "/:projectId/status",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "client") {
        return res.status(403).json({
          message:
            "Only clients can update project status",
        });
      }

      const { status } = req.body;

      if (
        !["in-progress", "completed"].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Status must be in-progress or completed",
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
            "You are not authorized to manage this project",
        });
      }

      if (
        status === "in-progress" &&
        project.status !== "closed"
      ) {
        return res.status(400).json({
          message:
            "Only closed projects can be started",
        });
      }

      if (
        status === "completed" &&
        project.status !== "in-progress"
      ) {
        return res.status(400).json({
          message:
            "Only projects in progress can be completed",
        });
      }

      project.status = status;

      if (status === "completed") {
        project.completedAt = new Date();
      }

      await project.save();

      return res.status(200).json({
        message:
          "Project status updated successfully",
        project,
      });
    } catch (error) {
      console.error(
        "Project status update error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to update project status",
      });
    }
  }
);

module.exports = router;