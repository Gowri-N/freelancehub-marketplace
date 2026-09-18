import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";

function MyProjects() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");

  const storedUser =
    localStorage.getItem("user");

  const user =
    storedUser
      ? JSON.parse(storedUser)
      : null;

  const [
    projects,
    setProjects,
  ] = useState([]);

  const [
    reviews,
    setReviews,
  ] = useState({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    sortOrder,
    setSortOrder,
  ] = useState("newest");

  const [
    updatingProjectId,
    setUpdatingProjectId,
  ] = useState(null);

  const [
    deletingProjectId,
    setDeletingProjectId,
  ] = useState(null);

  const [
    projectToDelete,
    setProjectToDelete,
  ] = useState(null);

  // =====================================
  // LOAD PROJECTS
  // =====================================

  const loadProjects =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "https://freelancehub-marketplace.onrender.com/api/projects",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to load projects."
          );

          return;
        }

        const myProjects =
          Array.isArray(data)
            ? data.filter(
                (project) =>
                  project.clientId ===
                    user?._id ||
                  project.clientId ===
                    user?.id
              )
            : [];

        setProjects(
          myProjects
        );

        const reviewResults = {};

        await Promise.all(
          myProjects
            .filter(
              (project) =>
                project.status ===
                "completed"
            )
            .map(
              async (project) => {
                try {
                  const reviewResponse =
                    await fetch(
                      `https://freelancehub-marketplace.onrender.com/api/reviews/project/${project._id}`,
                      {
                        headers: {
                          Authorization:
                            `Bearer ${token}`,
                        },
                      }
                    );

                  if (
                    reviewResponse.ok
                  ) {
                    const reviewData =
                      await reviewResponse.json();

                    if (reviewData) {
                      reviewResults[
                        project._id
                      ] =
                        reviewData;
                    }
                  }
                } catch (error) {
                  console.error(
                    "Review load error:",
                    error
                  );
                }
              }
            )
        );

        setReviews(
          reviewResults
        );
      } catch (error) {
        console.error(
          "Load projects error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadProjects();
  }, []);

  // =====================================
  // FILTER + SORT
  // =====================================

  const filteredProjects =
    useMemo(() => {
      let result =
        [...projects];

      if (
        searchTerm.trim()
      ) {
        const search =
          searchTerm
            .toLowerCase()
            .trim();

        result =
          result.filter(
            (project) =>
              String(
                project.title || ""
              )
                .toLowerCase()
                .includes(search) ||
              String(
                project.skills || ""
              )
                .toLowerCase()
                .includes(search)
          );
      }

      if (
        statusFilter !== "all"
      ) {
        result =
          result.filter(
            (project) =>
              project.status ===
              statusFilter
          );
      }

      result.sort(
        (a, b) => {
          if (
            sortOrder ===
            "oldest"
          ) {
            return (
              new Date(
                a.createdAt
              ) -
              new Date(
                b.createdAt
              )
            );
          }

          return (
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
          );
        }
      );

      return result;
    }, [
      projects,
      searchTerm,
      statusFilter,
      sortOrder,
    ]);

  // =====================================
  // STATUS UPDATE
  // =====================================

  const updateProjectStatus =
    async (
      projectId,
      status
    ) => {
      try {
        setError("");
        setSuccess("");

        setUpdatingProjectId(
          projectId
        );

        const response =
          await fetch(
            `https://freelancehub-marketplace.onrender.com/api/projects/${projectId}/status`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  status,
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to update project."
          );

          return;
        }

        setProjects(
          (previous) =>
            previous.map(
              (project) =>
                project._id ===
                projectId
                  ? {
                      ...project,
                      ...data.project,
                      status,
                    }
                  : project
            )
        );

        if (
          status ===
          "in-progress"
        ) {
          setSuccess(
            "Project started successfully."
          );
        }

        if (
          status ===
          "completed"
        ) {
          setSuccess(
            "Project marked as completed."
          );
        }

        setTimeout(() => {
          setSuccess("");
        }, 2500);
      } catch (error) {
        console.error(
          "Status update error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setUpdatingProjectId(
          null
        );
      }
    };

  // =====================================
  // DELETE PROJECT
  // =====================================

  const handleDelete =
    async (projectId) => {
      try {
        setError("");
        setSuccess("");

        setDeletingProjectId(
          projectId
        );

        const response =
          await fetch(
            `https://freelancehub-marketplace.onrender.com/api/projects/${projectId}`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to delete project."
          );

          return;
        }

        setProjects(
          (previous) =>
            previous.filter(
              (project) =>
                project._id !==
                projectId
            )
        );

        setProjectToDelete(
          null
        );

        setSuccess(
          "Project deleted successfully."
        );

        setTimeout(() => {
          setSuccess("");
        }, 2500);
      } catch (error) {
        console.error(
          "Delete project error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setDeletingProjectId(
          null
        );
      }
    };

  // =====================================
  // HELPERS
  // =====================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "Not specified";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getSkills = (
    skills
  ) =>
    String(
      skills || ""
    )
      .split(",")
      .map((skill) =>
        skill.trim()
      )
      .filter(Boolean);

  const getStatusText = (
    status
  ) => {
    if (
      status ===
      "in-progress"
    ) {
      return "In Progress";
    }

    if (
      status ===
      "completed"
    ) {
      return "Completed";
    }

    if (
      status ===
      "closed"
    ) {
      return "Freelancer Selected";
    }

    return "Open";
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortOrder("newest");
  };

  return (
    <div className="clientProjectsPage">

      {/* HEADER */}

      <div className="clientProjectsHeader">

        <div>
          <span className="pageEyebrow">
            Project Management
          </span>

          <h1>
            My Projects
          </h1>

          <p>
            Manage your posted
            projects, review
            applications and track
            work from posting to
            completion.
          </p>
        </div>

        <div className="clientProjectsHeaderActions">

          <button
            className="pageBackButton"
            onClick={() =>
              navigate(
                "/client-dashboard"
              )
            }
          >
            ← Dashboard
          </button>

          <button
            onClick={() =>
              navigate(
                "/post-project"
              )
            }
          >
            ＋ Post Project
          </button>

        </div>

      </div>

      {/* HERO */}

      <section className="clientProjectsHero">

        <div className="clientProjectsHeroContent">

          <span>
            📁 Your workspace
          </span>

          <h2>
            Manage every project
            in one place.
          </h2>

          <p>
            Review proposals,
            select freelancers,
            track active work and
            complete projects
            smoothly.
          </p>

          <button
            onClick={() =>
              navigate(
                "/post-project"
              )
            }
          >
            Post New Project
          </button>

        </div>

        <div className="clientProjectsHeroImage">

          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=90"
            alt="Team managing projects"
          />

        </div>

      </section>

      {/* STATS */}

      <div className="clientProjectStats">

        <div>
          <span>
            📁
          </span>

          <div>
            <small>
              Total Projects
            </small>

            <strong>
              {
                projects.length
              }
            </strong>
          </div>
        </div>

        <div>
          <span>
            🟢
          </span>

          <div>
            <small>
              Open
            </small>

            <strong>
              {
                projects.filter(
                  (project) =>
                    project.status ===
                    "open"
                ).length
              }
            </strong>
          </div>
        </div>

        <div>
          <span>
            🚀
          </span>

          <div>
            <small>
              In Progress
            </small>

            <strong>
              {
                projects.filter(
                  (project) =>
                    project.status ===
                    "in-progress"
                ).length
              }
            </strong>
          </div>
        </div>

        <div>
          <span>
            ✓
          </span>

          <div>
            <small>
              Completed
            </small>

            <strong>
              {
                projects.filter(
                  (project) =>
                    project.status ===
                    "completed"
                ).length
              }
            </strong>
          </div>
        </div>

      </div>

      {/* FILTER */}

      <section className="modernFilterPanel clientProjectFilter">

        <div className="filterSearchBox">

          <span>
            🔍
          </span>

          <input
            type="text"
            placeholder="Search by project title or skills..."
            value={
              searchTerm
            }
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

        </div>

        <select
          value={
            statusFilter
          }
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Statuses
          </option>

          <option value="open">
            Open
          </option>

          <option value="closed">
            Freelancer Selected
          </option>

          <option value="in-progress">
            In Progress
          </option>

          <option value="completed">
            Completed
          </option>
        </select>

        <select
          value={
            sortOrder
          }
          onChange={(event) =>
            setSortOrder(
              event.target.value
            )
          }
        >
          <option value="newest">
            Newest First
          </option>

          <option value="oldest">
            Oldest First
          </option>
        </select>

        <button
          className="clearFilterButton"
          onClick={
            clearFilters
          }
        >
          Clear
        </button>

      </section>

      {error && (
        <div className="errorMessage">
          {error}
        </div>
      )}

      {success && (
        <div className="successMessage">
          {success}
        </div>
      )}

      <div className="resultsHeader">

        <div>
          <h2>
            Your Projects
          </h2>

          <p>
            {
              filteredProjects.length
            }{" "}
            project
            {
              filteredProjects.length ===
              1
                ? ""
                : "s"
            }{" "}
            found
          </p>
        </div>

      </div>

      {/* PROJECTS */}

      {loading ? (
        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            ⏳
          </div>

          <h3>
            Loading projects...
          </h3>

        </div>
      ) : filteredProjects.length ===
        0 ? (
        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            📁
          </div>

          <h3>
            No projects found
          </h3>

          <p>
            Post a project or
            change your filters.
          </p>

          <button
            onClick={() =>
              navigate(
                "/post-project"
              )
            }
          >
            Post Project
          </button>

        </div>
      ) : (
        <div className="clientProjectGrid">

          {filteredProjects.map(
            (project) => {
              const skills =
                getSkills(
                  project.skills
                );

              const review =
                reviews[
                  project._id
                ];

              return (
                <article
                  className="clientProjectCard"
                  key={
                    project._id
                  }
                >

                  <div className="clientProjectCardTop">

                    <div className="clientProjectTitleBlock">

                      <div className="clientProjectIcon">
                        💼
                      </div>

                      <div>
                        <span>
                          Posted{" "}
                          {formatDate(
                            project.createdAt
                          )}
                        </span>

                        <h3>
                          {
                            project.title
                          }
                        </h3>
                      </div>

                    </div>

                    <span
                      className={`clientProjectStatus ${project.status}`}
                    >
                      {getStatusText(
                        project.status
                      )}
                    </span>

                  </div>

                  <p className="clientProjectDescription">
                    {
                      project.description
                    }
                  </p>

                  <div className="projectSkillTags">

                    {skills
                      .slice(0, 6)
                      .map(
                        (
                          skill,
                          index
                        ) => (
                          <span
                            key={`${skill}-${index}`}
                          >
                            {skill}
                          </span>
                        )
                      )}

                  </div>

                  <div className="clientProjectMeta">

                    <div>
                      <span>
                        Budget
                      </span>

                      <strong>
                        £
                        {
                          project.budget
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Deadline
                      </span>

                      <strong>
                        {formatDate(
                          project.deadline
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Status
                      </span>

                      <strong>
                        {getStatusText(
                          project.status
                        )}
                      </strong>
                    </div>

                  </div>

                  {/* OPEN */}

                  {project.status ===
                    "open" && (
                    <div className="clientProjectActionArea">

                      <button
                        onClick={() =>
                          navigate(
                            `/applications/${project._id}`
                          )
                        }
                      >
                        👥 View Applications
                      </button>

                      <button
                        className="clientSecondaryAction"
                        onClick={() =>
                          navigate(
                            `/edit-project/${project._id}`
                          )
                        }
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="clientDeleteAction"
                        disabled={
                          deletingProjectId ===
                          project._id
                        }
                        onClick={() =>
                          setProjectToDelete(
                            project
                          )
                        }
                      >
                        {deletingProjectId ===
                        project._id
                          ? "Deleting..."
                          : "🗑 Delete"}
                      </button>

                    </div>
                  )}

                  {/* CLOSED */}

                  {project.status ===
                    "closed" && (
                    <div className="clientProjectActionArea">

                      <button
                        onClick={() =>
                          navigate(
                            `/applications/${project._id}`
                          )
                        }
                      >
                        👤 View Freelancer
                      </button>

                      <button
                        disabled={
                          updatingProjectId ===
                          project._id
                        }
                        onClick={() =>
                          updateProjectStatus(
                            project._id,
                            "in-progress"
                          )
                        }
                      >
                        {updatingProjectId ===
                        project._id
                          ? "Starting..."
                          : "🚀 Start Project"}
                      </button>

                    </div>
                  )}

                  {/* IN PROGRESS */}

                  {project.status ===
                    "in-progress" && (
                    <div className="clientProjectActionArea">

                      <button
                        onClick={() =>
                          navigate(
                            "/messages"
                          )
                        }
                      >
                        💬 Open Messages
                      </button>

                      <button
                        disabled={
                          updatingProjectId ===
                          project._id
                        }
                        onClick={() =>
                          updateProjectStatus(
                            project._id,
                            "completed"
                          )
                        }
                      >
                        {updatingProjectId ===
                        project._id
                          ? "Updating..."
                          : "✓ Mark Completed"}
                      </button>

                    </div>
                  )}

                  {/* COMPLETED */}

                  {project.status ===
                    "completed" &&
                    !review && (
                      <div className="clientProjectActionArea">

                        <div className="projectCompletedMessage">
                          ✓ Project completed successfully
                        </div>

                        <button
                          onClick={() =>
                            navigate(
                              `/leave-review/${project._id}`
                            )
                          }
                        >
                          ⭐ Leave Review
                        </button>

                      </div>
                    )}

                  {project.status ===
                    "completed" &&
                    review && (
                      <div className="clientProjectReview">

                        <div className="clientReviewHeader">

                          <strong>
                            Your Review
                          </strong>

                          <span>
                            {"★".repeat(
                              review.rating
                            )}
                            {"☆".repeat(
                              5 -
                                review.rating
                            )}
                          </span>

                        </div>

                        <p>
                          {
                            review.review
                          }
                        </p>

                      </div>
                    )}

                </article>
              );
            }
          )}

        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(projectToDelete)}
        title="Delete Project?"
        message={
          projectToDelete
            ? `Are you sure you want to delete "${projectToDelete.title}"? This action cannot be undone.`
            : ""
        }
        confirmText="Delete Project"
        cancelText="Keep Project"
        type="danger"
        loading={
          deletingProjectId ===
          projectToDelete?._id
        }
        onCancel={() => {
          if (!deletingProjectId) {
            setProjectToDelete(null);
          }
        }}
        onConfirm={() => {
          if (projectToDelete) {
            handleDelete(
              projectToDelete._id
            );
          }
        }}
      />

    </div>
  );
}

export default MyProjects;