const express = require("express");
const jwt = require("jsonwebtoken");

const Message = require("../models/Message");
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
// CHECK PROJECT ACCESS
// =====================================

const checkProjectAccess = async (
  projectId,
  userId
) => {
  const project =
    await Project.findById(projectId);

  if (!project) {
    return {
      allowed: false,
      message: "Project not found",
    };
  }

  // =====================================
  // CLIENT WHO OWNS PROJECT
  // =====================================

  if (
    project.clientId.toString() ===
    userId
  ) {
    return {
      allowed: true,
      project,
    };
  }

  // =====================================
  // ACCEPTED FREELANCER
  // =====================================

  const acceptedApplication =
    await Application.findOne({
      projectId,
      freelancerId: userId,
      status: "accepted",
    });

  if (acceptedApplication) {
    return {
      allowed: true,
      project,
    };
  }

  return {
    allowed: false,
    message:
      "You are not allowed to message on this project",
  };
};

// =====================================
// 1. SEND MESSAGE
// =====================================

router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        projectId,
        receiverId,
        message,
      } = req.body;

      // =====================================
      // VALIDATE FIELDS
      // =====================================

      if (
        !projectId ||
        !receiverId ||
        !message ||
        !message.trim()
      ) {
        return res.status(400).json({
          message:
            "Project, receiver and message are required",
        });
      }

      // =====================================
      // CHECK PROJECT ACCESS
      // =====================================

      const access =
        await checkProjectAccess(
          projectId,
          req.user.id
        );

      if (!access.allowed) {
        return res.status(403).json({
          message:
            access.message,
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
        return res.status(400).json({
          message:
            "No freelancer has been accepted for this project",
        });
      }

      const clientId =
        access.project.clientId.toString();

      const freelancerId =
        acceptedApplication
          .freelancerId
          .toString();

      // =====================================
      // ONLY CLIENT AND ACCEPTED FREELANCER
      // CAN MESSAGE EACH OTHER
      // =====================================

      const validConversation =
        (
          req.user.id === clientId &&
          receiverId === freelancerId
        ) ||
        (
          req.user.id === freelancerId &&
          receiverId === clientId
        );

      if (!validConversation) {
        return res.status(403).json({
          message:
            "You cannot message this user",
        });
      }

      // =====================================
      // CREATE MESSAGE
      // =====================================

      const newMessage =
        new Message({
          projectId,

          senderId:
            req.user.id,

          receiverId,

          senderName:
            req.user.name ||
            "User",

          message:
            message.trim(),

          read:
            false,
        });

      await newMessage.save();

      return res.status(201).json({
        message:
          "Message sent successfully",

        data:
          newMessage,
      });

    } catch (error) {
      console.error(
        "Send message error:",
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
// 2. GET PROJECT CONVERSATION
// =====================================

router.get(
  "/project/:projectId",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        projectId,
      } = req.params;

      // =====================================
      // CHECK ACCESS
      // =====================================

      const access =
        await checkProjectAccess(
          projectId,
          req.user.id
        );

      if (!access.allowed) {
        return res.status(403).json({
          message:
            access.message,
        });
      }

      // =====================================
      // GET MESSAGES
      // =====================================

      const messages =
        await Message.find({
          projectId,
        })

          .populate(
            "senderId",
            "name email"
          )

          .populate(
            "receiverId",
            "name email"
          )

          .sort({
            createdAt: 1,
          });

      return res
        .status(200)
        .json(messages);

    } catch (error) {
      console.error(
        "Get messages error:",
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
// 3. MARK PROJECT MESSAGES AS READ
// =====================================

router.patch(
  "/project/:projectId/read",
  authMiddleware,
  async (req, res) => {
    try {
      // =====================================
      // CHECK ACCESS
      // =====================================

      const access =
        await checkProjectAccess(
          req.params.projectId,
          req.user.id
        );

      if (!access.allowed) {
        return res.status(403).json({
          message:
            access.message,
        });
      }

      // =====================================
      // MARK RECEIVED MESSAGES AS READ
      // =====================================

      await Message.updateMany(
        {
          projectId:
            req.params.projectId,

          receiverId:
            req.user.id,

          read:
            false,
        },

        {
          $set: {
            read:
              true,
          },
        }
      );

      return res.status(200).json({
        message:
          "Messages marked as read",
      });

    } catch (error) {
      console.error(
        "Mark messages read error:",
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
// 4. GET MY CONVERSATIONS
// =====================================

router.get(
  "/conversations",
  authMiddleware,
  async (req, res) => {
    try {
      let conversations = [];

      // =====================================
      // CLIENT CONVERSATIONS
      // =====================================

      if (
        req.user.role === "client"
      ) {
        const projects =
          await Project.find({
            clientId:
              req.user.id,

            status: {
              $in: [
                "closed",
                "in-progress",
                "completed",
              ],
            },
          })

            .sort({
              updatedAt: -1,
            });

        for (
          const project
          of projects
        ) {
          // =====================================
          // FIND ACCEPTED FREELANCER
          // =====================================

          const acceptedApplication =
            await Application.findOne({
              projectId:
                project._id,

              status:
                "accepted",
            })

              .populate(
                "freelancerId",
                "name email"
              );

          if (
            acceptedApplication &&
            acceptedApplication
              .freelancerId
          ) {
            // =====================================
            // PROJECT UNREAD COUNT
            // =====================================

            const unreadCount =
              await Message.countDocuments({
                projectId:
                  project._id,

                receiverId:
                  req.user.id,

                read:
                  false,
              });

            // =====================================
            // LAST MESSAGE
            // =====================================

            const lastMessage =
              await Message.findOne({
                projectId:
                  project._id,
              })

                .sort({
                  createdAt: -1,
                });

            conversations.push({
              projectId:
                project._id,

              projectTitle:
                project.title,

              projectStatus:
                project.status,

              otherUserId:
                acceptedApplication
                  .freelancerId
                  ._id,

              otherUserName:
                acceptedApplication
                  .freelancerId
                  .name,

              otherUserEmail:
                acceptedApplication
                  .freelancerId
                  .email,

              role:
                "freelancer",

              unreadCount,

              lastMessage:
                lastMessage
                  ? lastMessage.message
                  : "",

              lastMessageAt:
                lastMessage
                  ? lastMessage.createdAt
                  : null,
            });
          }
        }
      }

      // =====================================
      // FREELANCER CONVERSATIONS
      // =====================================

      if (
        req.user.role ===
        "freelancer"
      ) {
        const acceptedApplications =
          await Application.find({
            freelancerId:
              req.user.id,

            status:
              "accepted",
          })

            .populate(
              "projectId"
            );

        for (
          const application
          of acceptedApplications
        ) {
          if (
            !application.projectId
          ) {
            continue;
          }

          const project =
            await Project.findById(
              application.projectId._id
            )

              .populate(
                "clientId",
                "name email"
              );

          if (
            project &&
            project.clientId
          ) {
            // Only valid project stages

            if (
              ![
                "closed",
                "in-progress",
                "completed",
              ].includes(
                project.status
              )
            ) {
              continue;
            }

            // =====================================
            // PROJECT UNREAD COUNT
            // =====================================

            const unreadCount =
              await Message.countDocuments({
                projectId:
                  project._id,

                receiverId:
                  req.user.id,

                read:
                  false,
              });

            // =====================================
            // LAST MESSAGE
            // =====================================

            const lastMessage =
              await Message.findOne({
                projectId:
                  project._id,
              })

                .sort({
                  createdAt: -1,
                });

            conversations.push({
              projectId:
                project._id,

              projectTitle:
                project.title,

              projectStatus:
                project.status,

              otherUserId:
                project.clientId._id,

              otherUserName:
                project.clientId.name,

              otherUserEmail:
                project.clientId.email,

              role:
                "client",

              unreadCount,

              lastMessage:
                lastMessage
                  ? lastMessage.message
                  : "",

              lastMessageAt:
                lastMessage
                  ? lastMessage.createdAt
                  : null,
            });
          }
        }
      }

      // =====================================
      // SORT CONVERSATIONS
      // MOST RECENT MESSAGE FIRST
      // =====================================

      conversations.sort(
        (a, b) => {
          const dateA =
            a.lastMessageAt
              ? new Date(
                  a.lastMessageAt
                ).getTime()
              : 0;

          const dateB =
            b.lastMessageAt
              ? new Date(
                  b.lastMessageAt
                ).getTime()
              : 0;

          return dateB - dateA;
        }
      );

      return res
        .status(200)
        .json(conversations);

    } catch (error) {
      console.error(
        "Get conversations error:",
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
// 5. GET TOTAL VALID UNREAD MESSAGE COUNT
// =====================================

router.get(
  "/unread-count",
  authMiddleware,
  async (req, res) => {
    try {
      let validProjectIds = [];

      // =====================================
      // CLIENT UNREAD MESSAGES
      // =====================================

      if (
        req.user.role === "client"
      ) {
        // Get client's active/accepted projects

        const projects =
          await Project.find({
            clientId:
              req.user.id,

            status: {
              $in: [
                "closed",
                "in-progress",
                "completed",
              ],
            },
          }).select("_id");

        const projectIds =
          projects.map(
            (project) =>
              project._id
          );

        // Find projects that actually have
        // an accepted freelancer

        const acceptedApplications =
          await Application.find({
            projectId: {
              $in:
                projectIds,
            },

            status:
              "accepted",
          }).select("projectId");

        validProjectIds =
          acceptedApplications.map(
            (application) =>
              application.projectId
          );
      }

      // =====================================
      // FREELANCER UNREAD MESSAGES
      // =====================================

      if (
        req.user.role ===
        "freelancer"
      ) {
        // Find freelancer's accepted projects

        const acceptedApplications =
          await Application.find({
            freelancerId:
              req.user.id,

            status:
              "accepted",
          }).select("projectId");

        const projectIds =
          acceptedApplications.map(
            (application) =>
              application.projectId
          );

        // Only include valid project stages

        const projects =
          await Project.find({
            _id: {
              $in:
                projectIds,
            },

            status: {
              $in: [
                "closed",
                "in-progress",
                "completed",
              ],
            },
          }).select("_id");

        validProjectIds =
          projects.map(
            (project) =>
              project._id
          );
      }

      // =====================================
      // NO VALID CONVERSATIONS
      // =====================================

      if (
        validProjectIds.length === 0
      ) {
        return res.status(200).json({
          unreadCount: 0,
        });
      }

      // =====================================
      // COUNT ONLY VALID UNREAD MESSAGES
      // =====================================

      const unreadCount =
        await Message.countDocuments({
          receiverId:
            req.user.id,

          read:
            false,

          projectId: {
            $in:
              validProjectIds,
          },
        });

      return res.status(200).json({
        unreadCount,
      });

    } catch (error) {
      console.error(
        "Get unread count error:",
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