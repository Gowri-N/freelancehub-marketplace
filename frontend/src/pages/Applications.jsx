import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";

function Applications() {
  const navigate = useNavigate();

  const {
    projectId,
  } = useParams();

  const token =
    localStorage.getItem("token");

  const [
    applications,
    setApplications,
  ] = useState([]);

  const [
    project,
    setProject,
  ] = useState(null);

  const [
    reviewsByFreelancer,
    setReviewsByFreelancer,
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
    updatingId,
    setUpdatingId,
  ] = useState(null);

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    sortOrder,
    setSortOrder,
  ] = useState(
    "newest"
  );

  const [
    decisionToConfirm,
    setDecisionToConfirm,
  ] = useState(null);

  // =====================================
  // LOAD APPLICATIONS
  // =====================================

  const loadApplications =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `http://localhost:5000/api/applications/project/${projectId}`,
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
              "Unable to load applications."
          );

          return;
        }

        const applicationList =
          Array.isArray(data)
            ? data
            : data.applications ||
              [];

        setApplications(
          applicationList
        );

        const freelancerReviews =
          {};

        await Promise.all(
          applicationList.map(
            async (
              application
            ) => {
              const freelancerId =
                application
                  .freelancerId
                  ?._id ||
                application
                  .freelancerId;

              if (
                !freelancerId
              ) {
                return;
              }

              try {
                const reviewResponse =
                  await fetch(
                    `http://localhost:5000/api/reviews/freelancer/${freelancerId}`,
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

                  freelancerReviews[
                    freelancerId
                  ] =
                    reviewData;
                }
              } catch (
                reviewError
              ) {
                console.error(
                  "Freelancer review error:",
                  reviewError
                );
              }
            }
          )
        );

        setReviewsByFreelancer(
          freelancerReviews
        );
      } catch (error) {
        console.error(
          "Load applications error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setLoading(false);
      }
    };

  // =====================================
  // LOAD PROJECT
  // =====================================

  const loadProject =
    async () => {
      try {
        const response =
          await fetch(
            "http://localhost:5000/api/projects",
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
          return;
        }

        if (
          Array.isArray(data)
        ) {
          const foundProject =
            data.find(
              (item) =>
                item._id ===
                projectId
            );

          setProject(
            foundProject || null
          );
        }
      } catch (error) {
        console.error(
          "Load project error:",
          error
        );
      }
    };

  useEffect(() => {
    loadProject();
    loadApplications();
  }, [projectId]);

  // =====================================
  // ACCEPT / REJECT
  // =====================================

  const updateApplicationStatus =
    async (
      applicationId,
      status
    ) => {
      try {
        setError("");
        setSuccess("");
        setUpdatingId(
          applicationId
        );

        const response =
          await fetch(
            `http://localhost:5000/api/applications/${applicationId}/status`,
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
              "Unable to update application."
          );

          return;
        }

        if (
          status ===
          "accepted"
        ) {
          setApplications(
            (previous) =>
              previous.map(
                (
                  application
                ) => {
                  if (
                    application._id ===
                    applicationId
                  ) {
                    return {
                      ...application,
                      status:
                        "accepted",
                    };
                  }

                  if (
                    application.status ===
                    "pending"
                  ) {
                    return {
                      ...application,
                      status:
                        "rejected",
                    };
                  }

                  return application;
                }
              )
          );

          setProject(
            (previous) =>
              previous
                ? {
                    ...previous,
                    status:
                      "closed",
                  }
                : previous
          );

          setSuccess(
            "Freelancer accepted successfully."
          );
        } else {
          setApplications(
            (previous) =>
              previous.map(
                (
                  application
                ) =>
                  application._id ===
                  applicationId
                    ? {
                        ...application,
                        status:
                          "rejected",
                      }
                    : application
              )
          );

          setSuccess(
            "Application rejected."
          );
        }

        setDecisionToConfirm(
          null
        );

        setTimeout(() => {
          setSuccess("");
        }, 2500);
      } catch (error) {
        console.error(
          "Update application error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setUpdatingId(
          null
        );
      }
    };

  // =====================================
  // FILTER + SORT
  // =====================================

  const filteredApplications =
    useMemo(() => {
      let result =
        [...applications];

      if (
        statusFilter !== "all"
      ) {
        result =
          result.filter(
            (application) =>
              application.status ===
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

          if (
            sortOrder ===
            "bidLow"
          ) {
            return (
              Number(
                a.bidAmount
              ) -
              Number(
                b.bidAmount
              )
            );
          }

          if (
            sortOrder ===
            "bidHigh"
          ) {
            return (
              Number(
                b.bidAmount
              ) -
              Number(
                a.bidAmount
              )
            );
          }

          if (
            sortOrder ===
            "delivery"
          ) {
            return (
              Number(
                a.deliveryDays
              ) -
              Number(
                b.deliveryDays
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
      applications,
      statusFilter,
      sortOrder,
    ]);

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
  ) => {
    return String(
      skills || ""
    )
      .split(",")
      .map((skill) =>
        skill.trim()
      )
      .filter(Boolean);
  };

  const getInitials = (
    name
  ) => {
    return String(
      name || "F"
    )
      .split(" ")
      .map(
        (part) =>
          part[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getStatusLabel = (
    status
  ) => {
    if (
      status === "accepted"
    ) {
      return "Accepted";
    }

    if (
      status === "rejected"
    ) {
      return "Rejected";
    }

    return "Pending";
  };

  const acceptedApplication =
    applications.find(
      (application) =>
        application.status ===
        "accepted"
    );

  return (
    <div className="clientApplicationsPage">

      {/* HEADER */}

      <div className="clientApplicationsHeader">

        <div>
          <span className="pageEyebrow">
            Freelancer Proposals
          </span>

          <h1>
            Review Applications
          </h1>

          <p>
            Compare proposals,
            freelancer experience,
            ratings and delivery
            estimates before choosing
            the right person.
          </p>
        </div>

        <button
          className="pageBackButton"
          onClick={() =>
            navigate(
              "/my-projects"
            )
          }
        >
          ← My Projects
        </button>

      </div>

      {/* PROJECT SUMMARY */}

      {project && (
        <section className="applicationsProjectHero">

          <div className="applicationsProjectHeroContent">

            <span>
              📁 Project
            </span>

            <h2>
              {project.title}
            </h2>

            <p>
              {
                project.description
              }
            </p>

            <div className="applicationsProjectInfo">

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
                  {
                    project.status
                  }
                </strong>
              </div>

            </div>

          </div>

          <div className="applicationsProjectHeroImage">

            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=90"
              alt="Team reviewing freelancer applications"
            />

          </div>

        </section>
      )}

      {/* STATS */}

      <div className="clientApplicationStats">

        <div>

          <div className="applicationStatVisual">
            👥
          </div>

          <div>
            <span>
              Total
            </span>

            <strong>
              {
                applications.length
              }
            </strong>
          </div>

        </div>

        <div>

          <div className="applicationStatVisual pending">
            ⏳
          </div>

          <div>
            <span>
              Pending
            </span>

            <strong>
              {
                applications.filter(
                  (application) =>
                    application.status ===
                    "pending"
                ).length
              }
            </strong>
          </div>

        </div>

        <div>

          <div className="applicationStatVisual accepted">
            ✓
          </div>

          <div>
            <span>
              Accepted
            </span>

            <strong>
              {
                applications.filter(
                  (application) =>
                    application.status ===
                    "accepted"
                ).length
              }
            </strong>
          </div>

        </div>

        <div>

          <div className="applicationStatVisual rejected">
            ×
          </div>

          <div>
            <span>
              Rejected
            </span>

            <strong>
              {
                applications.filter(
                  (application) =>
                    application.status ===
                    "rejected"
                ).length
              }
            </strong>
          </div>

        </div>

      </div>

      {/* ACCEPTED BANNER */}

      {acceptedApplication && (
        <div className="acceptedFreelancerBanner">

          <div className="acceptedFreelancerIcon">
            ✓
          </div>

          <div>
            <strong>
              Freelancer selected
            </strong>

            <p>
              You have accepted{" "}
              {
                acceptedApplication
                  .freelancerName
              }
              . You can continue from
              My Projects.
            </p>
          </div>

          <button
            onClick={() =>
              navigate(
                "/my-projects"
              )
            }
          >
            View Project →
          </button>

        </div>
      )}

      {/* FILTER */}

      <section className="clientApplicationsToolbar">

        <div>
          <h2>
            Freelancer Proposals
          </h2>

          <p>
            {
              filteredApplications.length
            }{" "}
            application
            {
              filteredApplications.length ===
              1
                ? ""
                : "s"
            }
          </p>
        </div>

        <div className="clientApplicationsFilters">

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

            <option value="pending">
              Pending
            </option>

            <option value="accepted">
              Accepted
            </option>

            <option value="rejected">
              Rejected
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

            <option value="bidLow">
              Lowest Bid
            </option>

            <option value="bidHigh">
              Highest Bid
            </option>

            <option value="delivery">
              Fastest Delivery
            </option>
          </select>

        </div>

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

      {/* APPLICATIONS */}

      {loading ? (
        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            ⏳
          </div>

          <h3>
            Loading applications...
          </h3>

        </div>
      ) : filteredApplications.length ===
        0 ? (
        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            👥
          </div>

          <h3>
            No applications found
          </h3>

          <p>
            Freelancer proposals will
            appear here when they apply.
          </p>

        </div>
      ) : (
        <div className="clientApplicationList">

          {filteredApplications.map(
            (application) => {
              const freelancer =
                application
                  .freelancerId;

              const freelancerId =
                freelancer?._id ||
                freelancer;

              const freelancerName =
                freelancer?.name ||
                application
                  .freelancerName ||
                "Freelancer";

              const skills =
                getSkills(
                  freelancer?.skills
                );

              const reviewData =
                reviewsByFreelancer[
                  freelancerId
                ];

              const averageRating =
                Number(
                  reviewData?.averageRating ||
                    0
                );

              const totalReviews =
                Number(
                  reviewData?.totalReviews ||
                    0
                );

              const recentReviews =
                reviewData?.reviews ||
                [];

              return (
                <article
                  className="clientApplicationCard"
                  key={
                    application._id
                  }
                >

                  {/* PROFILE */}

                  <div className="applicationFreelancerSection">

                    <div className="freelancerProfileTop">

                      <div className="freelancerAvatarLarge">
                        {getInitials(
                          freelancerName
                        )}
                      </div>

                      <div className="freelancerProfileIdentity">

                        <span>
                          Freelancer
                        </span>

                        <h3>
                          {
                            freelancerName
                          }
                        </h3>

                        <p>
                          {
                            freelancer?.email ||
                            ""
                          }
                        </p>

                      </div>

                      <span
                        className={`applicationStatusChip ${application.status}`}
                      >
                        {getStatusLabel(
                          application.status
                        )}
                      </span>

                    </div>

                    {/* RATING */}

                    <div className="freelancerRatingBox">

                      <div className="freelancerRatingNumber">
                        {totalReviews >
                        0
                          ? averageRating.toFixed(
                              1
                            )
                          : "New"}
                      </div>

                      <div>

                        <div className="freelancerStars">
                          {totalReviews >
                          0
                            ? "★".repeat(
                                Math.round(
                                  averageRating
                                )
                              ) +
                              "☆".repeat(
                                5 -
                                  Math.round(
                                    averageRating
                                  )
                              )
                            : "☆☆☆☆☆"}
                        </div>

                        <span>
                          {totalReviews >
                          0
                            ? `${totalReviews} client review${
                                totalReviews ===
                                1
                                  ? ""
                                  : "s"
                              }`
                            : "No reviews yet"}
                        </span>

                      </div>

                    </div>

                    {/* PROFILE INFO */}

                    <div className="freelancerProfileInfo">

                      {freelancer?.bio && (
                        <div>
                          <span>
                            About
                          </span>

                          <p>
                            {
                              freelancer.bio
                            }
                          </p>
                        </div>
                      )}

                      {skills.length >
                        0 && (
                        <div>

                          <span>
                            Skills
                          </span>

                          <div className="projectSkillTags">

                            {skills.map(
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

                        </div>
                      )}

                      <div className="freelancerProfileMeta">

                        <div>
                          <span>
                            Experience
                          </span>

                          <strong>
                            {
                              freelancer?.experience ||
                              "Not provided"
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Hourly Rate
                          </span>

                          <strong>
                            {freelancer?.hourlyRate
                              ? `£${freelancer.hourlyRate}/hr`
                              : "Not provided"}
                          </strong>
                        </div>

                      </div>

                      {freelancer?.portfolio && (
                        <div className="freelancerPortfolioRow">

                          <span>
                            Portfolio
                          </span>

                          <a
                            href={
                              freelancer.portfolio
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Portfolio ↗
                          </a>

                        </div>
                      )}

                    </div>

                    <button
                      className="viewFreelancerProfileButton"
                      onClick={() =>
                        navigate(
                          `/freelancer/${freelancerId}`
                        )
                      }
                    >
                      View Full Profile
                    </button>

                  </div>

                  {/* PROPOSAL */}

                  <div className="applicationProposalSection">

                    <div className="proposalSectionHeader">

                      <div>
                        <span>
                          Proposal
                        </span>

                        <h3>
                          Offer Details
                        </h3>
                      </div>

                      <span className="proposalAppliedDate">
                        Applied{" "}
                        {formatDate(
                          application.createdAt
                        )}
                      </span>

                    </div>

                    <div className="proposalHighlightGrid">

                      <div>

                        <div className="proposalHighlightIcon">
                          £
                        </div>

                        <div>
                          <span>
                            Bid Amount
                          </span>

                          <strong>
                            £
                            {
                              application.bidAmount
                            }
                          </strong>
                        </div>

                      </div>

                      <div>

                        <div className="proposalHighlightIcon">
                          📅
                        </div>

                        <div>
                          <span>
                            Delivery
                          </span>

                          <strong>
                            {
                              application.deliveryDays
                            }{" "}
                            days
                          </strong>
                        </div>

                      </div>

                    </div>

                    <div className="proposalMessageCard">

                      <span>
                        Freelancer Proposal
                      </span>

                      <p>
                        {
                          application.message
                        }
                      </p>

                    </div>

                    {/* RECENT REVIEWS */}

                    <div className="applicationReviewsSection">

                      <div className="applicationReviewsHeader">

                        <strong>
                          Recent Client Reviews
                        </strong>

                        <span>
                          {
                            totalReviews
                          }{" "}
                          total
                        </span>

                      </div>

                      {recentReviews.length ===
                        0 ? (
                        <div className="noFreelancerReviews">

                          <span>
                            ☆
                          </span>

                          <p>
                            No client reviews yet.
                          </p>

                        </div>
                      ) : (
                        <div className="recentReviewList">

                          {recentReviews
                            .slice(
                              0,
                              2
                            )
                            .map(
                              (
                                review
                              ) => (
                                <div
                                  className="recentReviewCard"
                                  key={
                                    review._id
                                  }
                                >

                                  <div>

                                    <span className="recentReviewStars">
                                      {"★".repeat(
                                        review.rating
                                      )}
                                      {"☆".repeat(
                                        5 -
                                          review.rating
                                      )}
                                    </span>

                                    <small>
                                      {formatDate(
                                        review.createdAt
                                      )}
                                    </small>

                                  </div>

                                  <p>
                                    {
                                      review.review
                                    }
                                  </p>

                                </div>
                              )
                            )}

                        </div>
                      )}

                    </div>

                    {/* ACTIONS */}

                    {application.status ===
                      "pending" &&
                      project?.status ===
                        "open" && (
                        <div className="applicationDecisionActions">

                          <button
                            className="rejectFreelancerButton"
                            disabled={
                              updatingId ===
                              application._id
                            }
                            onClick={() =>
                              setDecisionToConfirm({
                                application,
                                status: "rejected",
                              })
                            }
                          >
                            {updatingId ===
                            application._id
                              ? "Processing..."
                              : "✕ Reject"}
                          </button>

                          <button
                            className="acceptFreelancerButton"
                            disabled={
                              updatingId ===
                              application._id
                            }
                            onClick={() =>
                              setDecisionToConfirm({
                                application,
                                status: "accepted",
                              })
                            }
                          >
                            {updatingId ===
                            application._id
                              ? "Processing..."
                              : "✓ Accept Freelancer"}
                          </button>

                        </div>
                      )}

                    {application.status ===
                      "accepted" && (
                      <div className="selectedFreelancerNotice">

                        <div>
                          ✓
                        </div>

                        <div>
                          <strong>
                            Selected Freelancer
                          </strong>

                          <p>
                            This freelancer has
                            been accepted for the
                            project.
                          </p>
                        </div>

                      </div>
                    )}

                    {application.status ===
                      "rejected" && (
                      <div className="rejectedFreelancerNotice">

                        <div>
                          ×
                        </div>

                        <div>
                          <strong>
                            Application Rejected
                          </strong>

                          <p>
                            This proposal was not
                            selected.
                          </p>
                        </div>

                      </div>
                    )}

                  </div>

                </article>
              );
            }
          )}

        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(decisionToConfirm)}
        title={
          decisionToConfirm?.status === "accepted"
            ? "Accept Freelancer?"
            : "Reject Application?"
        }
        message={
          decisionToConfirm
            ? decisionToConfirm.status === "accepted"
              ? `Are you sure you want to accept ${
                  decisionToConfirm.application.freelancerId?.name ||
                  decisionToConfirm.application.freelancerName ||
                  "this freelancer"
                } for this project? Other pending applications will be rejected automatically.`
              : `Are you sure you want to reject the application from ${
                  decisionToConfirm.application.freelancerId?.name ||
                  decisionToConfirm.application.freelancerName ||
                  "this freelancer"
                }?`
            : ""
        }
        confirmText={
          decisionToConfirm?.status === "accepted"
            ? "Accept Freelancer"
            : "Reject Application"
        }
        cancelText="Go Back"
        type={
          decisionToConfirm?.status === "accepted"
            ? "success"
            : "danger"
        }
        loading={
          updatingId === decisionToConfirm?.application?._id
        }
        onCancel={() => {
          if (!updatingId) {
            setDecisionToConfirm(null);
          }
        }}
        onConfirm={() => {
          if (decisionToConfirm) {
            updateApplicationStatus(
              decisionToConfirm.application._id,
              decisionToConfirm.status
            );
          }
        }}
      />

    </div>
  );
}

export default Applications;