const express = require("express");
const jwt = require("jsonwebtoken");

const Invitation = require("../models/Invitation");
const Project = require("../models/Project");
const User = require("../models/User");
const Application = require("../models/Application");

const router = express.Router();

const SECRET_KEY =
  "freelancehub-secret-key";

// =====================================
// AUTH MIDDLEWARE
// =====================================

const authMiddleware = (
  req,
  res,
  next
) => {
  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  const token =
    authHeader.split(" ")[1];

  try {
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
// CREATE INVITATION
// CLIENT ONLY
// POST /api/invitations
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
            "Only clients can send invitations",
        });
      }

      const {
        projectId,
        freelancerId,
        message,
      } = req.body;

      if (
        !projectId ||
        !freelancerId
      ) {
        return res.status(400).json({
          message:
            "Project and freelancer are required",
        });
      }

      // CHECK PROJECT

      const project =
        await Project.findById(
          projectId
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
            "You can only invite freelancers to your own projects",
        });
      }

      if (
        project.status !== "open"
      ) {
        return res.status(400).json({
          message:
            "You can only send invitations for open projects",
        });
      }

      // CHECK FREELANCER

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

      // CHECK EXISTING APPLICATION

      const existingApplication =
        await Application.findOne({
          projectId,
          freelancerId,
        });

      if (existingApplication) {
        return res.status(400).json({
          message:
            "This freelancer has already applied to this project",
        });
      }

      // CHECK EXISTING INVITATION

      const existingInvitation =
        await Invitation.findOne({
          projectId,
          clientId: req.user.id,
          freelancerId,
        });

      if (existingInvitation) {
        if (
          existingInvitation.status ===
          "cancelled"
        ) {
          return res.status(400).json({
            message:
              "An invitation was previously cancelled for this freelancer and project",
          });
        }

        return res.status(400).json({
          message:
            "Invitation already sent",
        });
      }

      // CREATE INVITATION

      const invitation =
        await Invitation.create({
          projectId,
          clientId: req.user.id,
          freelancerId,
          message:
            message?.trim() || "",
        });

      const populatedInvitation =
        await Invitation.findById(
          invitation._id
        )
          .populate(
            "projectId",
            "title description skills budget deadline status clientName"
          )
          .populate(
            "clientId",
            "name email"
          )
          .populate(
            "freelancerId",
            "name email skills hourlyRate bio"
          );

      return res.status(201).json({
        message:
          "Invitation sent successfully",
        invitation:
          populatedInvitation,
      });
    } catch (error) {
      console.error(
        "Create invitation error:",
        error
      );

      if (
        error.code === 11000
      ) {
        return res.status(400).json({
          message:
            "Invitation already sent",
        });
      }

      return res.status(500).json({
        message:
          "Unable to send invitation",
      });
    }
  }
);

// =====================================
// FREELANCER - MY INVITATIONS
// GET /api/invitations/my-invitations
// =====================================

router.get(
  "/my-invitations",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role !==
        "freelancer"
      ) {
        return res.status(403).json({
          message:
            "Only freelancers can view invitations",
        });
      }

      const invitations =
        await Invitation.find({
          freelancerId:
            req.user.id,
        })
          .populate(
            "projectId",
            "title description skills budget deadline status clientName"
          )
          .populate(
            "clientId",
            "name email"
          )
          .sort({
            createdAt: -1,
          });

      return res
        .status(200)
        .json(invitations);
    } catch (error) {
      console.error(
        "My invitations error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load invitations",
      });
    }
  }
);

// =====================================
// CLIENT - SENT INVITATIONS
// GET /api/invitations/sent
// =====================================

router.get(
  "/sent",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role !== "client"
      ) {
        return res.status(403).json({
          message:
            "Only clients can view sent invitations",
        });
      }

      const invitations =
        await Invitation.find({
          clientId: req.user.id,
        })
          .populate(
            "projectId",
            "title description budget skills deadline status"
          )
          .populate(
            "freelancerId",
            "name email skills hourlyRate bio"
          )
          .sort({
            createdAt: -1,
          });

      return res
        .status(200)
        .json(invitations);
    } catch (error) {
      console.error(
        "Sent invitations error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load sent invitations",
      });
    }
  }
);

// =====================================
// CLIENT CANCEL INVITATION
// PATCH /api/invitations/:invitationId/cancel
// =====================================

router.patch(
  "/:invitationId/cancel",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role !== "client"
      ) {
        return res.status(403).json({
          message:
            "Only clients can cancel invitations",
        });
      }

      const invitation =
        await Invitation.findById(
          req.params.invitationId
        );

      if (!invitation) {
        return res.status(404).json({
          message:
            "Invitation not found",
        });
      }

      // CHECK OWNERSHIP

      if (
        invitation.clientId.toString() !==
        req.user.id
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to cancel this invitation",
        });
      }

      // ONLY PENDING CAN BE CANCELLED

      if (
        invitation.status !==
        "pending"
      ) {
        return res.status(400).json({
          message:
            "Only pending invitations can be cancelled",
        });
      }

      invitation.status =
        "cancelled";

      invitation.respondedAt =
        new Date();

      await invitation.save();

      const updatedInvitation =
        await Invitation.findById(
          invitation._id
        )
          .populate(
            "projectId",
            "title description budget skills deadline status"
          )
          .populate(
            "freelancerId",
            "name email skills hourlyRate bio"
          );

      return res.status(200).json({
        message:
          "Invitation cancelled successfully",
        invitation:
          updatedInvitation,
      });
    } catch (error) {
      console.error(
        "Cancel invitation error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to cancel invitation",
      });
    }
  }
);

// =====================================
// FREELANCER ACCEPT / DECLINE
// PATCH /api/invitations/:invitationId/status
// =====================================

router.patch(
  "/:invitationId/status",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role !==
        "freelancer"
      ) {
        return res.status(403).json({
          message:
            "Only freelancers can respond to invitations",
        });
      }

      const {
        status,
        bidAmount,
        deliveryDays,
        proposalMessage,
      } = req.body;

      if (
        ![
          "accepted",
          "declined",
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Status must be accepted or declined",
        });
      }

      const invitation =
        await Invitation.findById(
          req.params.invitationId
        );

      if (!invitation) {
        return res.status(404).json({
          message:
            "Invitation not found",
        });
      }

      if (
        invitation.freelancerId.toString() !==
        req.user.id
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to respond to this invitation",
        });
      }

      if (
        invitation.status !==
        "pending"
      ) {
        return res.status(400).json({
          message:
            "This invitation has already been answered or cancelled",
        });
      }

      // DECLINE

      if (
        status === "declined"
      ) {
        invitation.status =
          "declined";

        invitation.respondedAt =
          new Date();

        await invitation.save();

        return res.status(200).json({
          message:
            "Invitation declined",
          invitation,
        });
      }

      // =====================================
      // ACCEPT INVITATION
      // =====================================

      const numericBid =
        Number(bidAmount);

      const numericDeliveryDays =
        Number(deliveryDays);

      if (
        !numericBid ||
        numericBid <= 0
      ) {
        return res.status(400).json({
          message:
            "Please enter a valid bid amount",
        });
      }

      if (
        !numericDeliveryDays ||
        numericDeliveryDays <= 0
      ) {
        return res.status(400).json({
          message:
            "Please enter valid delivery days",
        });
      }

      if (
        !proposalMessage ||
        !proposalMessage.trim()
      ) {
        return res.status(400).json({
          message:
            "Proposal message is required",
        });
      }

      const project =
        await Project.findById(
          invitation.projectId
        );

      if (!project) {
        return res.status(404).json({
          message:
            "Project not found",
        });
      }

      if (
        project.status !== "open"
      ) {
        return res.status(400).json({
          message:
            "This project is no longer open",
        });
      }

      // CHECK EXISTING APPLICATION

      const existingApplication =
        await Application.findOne({
          projectId:
            invitation.projectId,
          freelancerId:
            req.user.id,
        });

      if (existingApplication) {
        return res.status(400).json({
          message:
            "You already applied to this project",
        });
      }

      const freelancer =
        await User.findById(
          req.user.id
        );

      if (!freelancer) {
        return res.status(404).json({
          message:
            "Freelancer not found",
        });
      }

      // CREATE APPLICATION

      const application =
        await Application.create({
          projectId:
            invitation.projectId,

          freelancerId:
            req.user.id,

          freelancerName:
            freelancer.name,

          bidAmount:
            numericBid,

          deliveryDays:
            numericDeliveryDays,

          message:
            proposalMessage.trim(),

          status: "pending",
        });

      invitation.status =
        "accepted";

      invitation.respondedAt =
        new Date();

      await invitation.save();

      const populatedApplication =
        await Application.findById(
          application._id
        )
          .populate(
            "projectId",
            "title description skills budget deadline status clientName"
          )
          .populate(
            "freelancerId",
            "name email skills hourlyRate bio"
          );

      return res.status(200).json({
        message:
          "Invitation accepted and application submitted successfully",
        application:
          populatedApplication,
      });
    } catch (error) {
      console.error(
        "Invitation response error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to respond to invitation",
      });
    }
  }
);

module.exports = router;