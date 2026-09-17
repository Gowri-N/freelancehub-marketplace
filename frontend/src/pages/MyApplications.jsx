import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";

function MyApplications() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");

  const [
    applications,
    setApplications,
  ] = useState([]);

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
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    withdrawingId,
    setWithdrawingId,
  ] = useState(null);

  const [
    applicationToWithdraw,
    setApplicationToWithdraw,
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
            "http://localhost:5000/api/applications/my-applications",
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

        setApplications(
          Array.isArray(data)
            ? data
            : []
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

  useEffect(() => {
    loadApplications();
  }, []);

  // =====================================
  // FILTER
  // =====================================

  const filteredApplications =
    useMemo(() => {
      if (
        statusFilter === "all"
      ) {
        return applications;
      }

      return applications.filter(
        (application) =>
          application.status ===
          statusFilter
      );
    }, [
      applications,
      statusFilter,
    ]);

  // =====================================
  // WITHDRAW APPLICATION
  // =====================================

  const handleWithdraw =
    async (applicationId) => {
      try {
        setError("");
        setSuccess("");

        setWithdrawingId(
          applicationId
        );

        const response =
          await fetch(
            `http://localhost:5000/api/applications/${applicationId}`,
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
              "Unable to withdraw application."
          );

          return;
        }

        setApplications(
          (previous) =>
            previous.filter(
              (application) =>
                application._id !==
                applicationId
            )
        );

        setApplicationToWithdraw(
          null
        );

        setSuccess(
          "Application withdrawn successfully."
        );

        setTimeout(() => {
          setSuccess("");
        }, 2500);
      } catch (error) {
        console.error(
          "Withdraw error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setWithdrawingId(
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

  return (
    <div className="freelancerListPage">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="freelancerListHeader">

        <div>
          <span className="pageEyebrow">
            Proposal Management
          </span>

          <h1>
            My Applications
          </h1>

          <p>
            Track your proposals,
            monitor client responses
            and manage your active
            applications.
          </p>
        </div>

        <button
          className="pageBackButton"
          onClick={() =>
            navigate(
              "/freelancer-dashboard"
            )
          }
        >
          ← Dashboard
        </button>

      </div>

      {/* =====================================
          HERO
      ===================================== */}

      <section className="applicationsHero">

        <div className="applicationsHeroContent">

          <span>
            📄 Your proposals
          </span>

          <h2>
            Keep track of every
            opportunity.
          </h2>

          <p>
            See which proposals are
            waiting for a response,
            accepted by clients or
            no longer moving
            forward.
          </p>

          <button
            onClick={() =>
              navigate(
                "/find-projects"
              )
            }
          >
            🔍 Find More Projects
          </button>

        </div>

        <div className="applicationsHeroImage">

          <img
            src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=90"
            alt="Freelancer managing applications"
          />

        </div>

      </section>

      {/* =====================================
          STATUS STATS
      ===================================== */}

      <div className="applicationSummaryGrid">

        <button
          className={
            statusFilter === "all"
              ? "applicationSummaryCard active"
              : "applicationSummaryCard"
          }
          onClick={() =>
            setStatusFilter(
              "all"
            )
          }
        >

          <div className="summaryIcon">
            📑
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

        </button>

        <button
          className={
            statusFilter === "pending"
              ? "applicationSummaryCard active"
              : "applicationSummaryCard"
          }
          onClick={() =>
            setStatusFilter(
              "pending"
            )
          }
        >

          <div className="summaryIcon pending">
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

        </button>

        <button
          className={
            statusFilter === "accepted"
              ? "applicationSummaryCard active"
              : "applicationSummaryCard"
          }
          onClick={() =>
            setStatusFilter(
              "accepted"
            )
          }
        >

          <div className="summaryIcon accepted">
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

        </button>

        <button
          className={
            statusFilter === "rejected"
              ? "applicationSummaryCard active"
              : "applicationSummaryCard"
          }
          onClick={() =>
            setStatusFilter(
              "rejected"
            )
          }
        >

          <div className="summaryIcon rejected">
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

        </button>

      </div>

      {/* =====================================
          MESSAGES
      ===================================== */}

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

      {/* =====================================
          RESULT HEADER
      ===================================== */}

      <div className="resultsHeader">

        <div>
          <h2>
            Applications
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

        <select
          className="smallStatusFilter"
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
            All Applications
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

      </div>

      {/* =====================================
          APPLICATIONS
      ===================================== */}

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
            📄
          </div>

          <h3>
            No applications found
          </h3>

          <p>
            You don't have any
            applications in this
            category.
          </p>

          <button
            onClick={() =>
              navigate(
                "/find-projects"
              )
            }
          >
            Find Projects
          </button>

        </div>
      ) : (
        <div className="applicationList">

          {filteredApplications.map(
            (application) => {
              const project =
                application.projectId;

              const skills =
                getSkills(
                  project?.skills
                );

              const projectStatus =
                project?.status ||
                "unknown";

              return (
                <article
                  className="applicationCard"
                  key={
                    application._id
                  }
                >

                  {/* STATUS */}

                  <div className="applicationCardHeader">

                    <div className="applicationProjectIdentity">

                      <div className="applicationIcon">
                        💻
                      </div>

                      <div>
                        <span>
                          Application
                        </span>

                        <h3>
                          {
                            project?.title ||
                            "Project unavailable"
                          }
                        </h3>
                      </div>

                    </div>

                    <span
                      className={`applicationStatusChip ${application.status}`}
                    >
                      {getStatusLabel(
                        application.status
                      )}
                    </span>

                  </div>

                  {/* PROJECT INFO */}

                  <div className="applicationProjectDescription">
                    {
                      project?.description ||
                      "Project details are no longer available."
                    }
                  </div>

                  <div className="projectSkillTags">

                    {skills
                      .slice(0, 5)
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

                  {/* PROJECT META */}

                  <div className="applicationMetaGrid">

                    <div>
                      <span>
                        Client
                      </span>

                      <strong>
                        {
                          project?.clientName ||
                          "Unavailable"
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Project Budget
                      </span>

                      <strong>
                        {project?.budget
                          ? `£${project.budget}`
                          : "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Deadline
                      </span>

                      <strong>
                        {formatDate(
                          project?.deadline
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Project Status
                      </span>

                      <strong className="projectStatusText">
                        {
                          projectStatus
                        }
                      </strong>
                    </div>

                  </div>

                  {/* PROPOSAL */}

                  <div className="proposalDetailsBox">

                    <div className="proposalDetailsTitle">
                      <span>
                        ✍️
                      </span>

                      <strong>
                        Your Proposal
                      </strong>
                    </div>

                    <div className="proposalNumbers">

                      <div>
                        <span>
                          Your Bid
                        </span>

                        <strong>
                          £
                          {
                            application.bidAmount
                          }
                        </strong>
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

                      <div>
                        <span>
                          Applied
                        </span>

                        <strong>
                          {formatDate(
                            application.createdAt
                          )}
                        </strong>
                      </div>

                    </div>

                    <p>
                      {
                        application.message
                      }
                    </p>

                  </div>

                  {/* STATUS RESULT */}

                  {application.status ===
                    "pending" && (
                    <div className="applicationStatusMessage pendingMessage">

                      <div>
                        ⏳
                      </div>

                      <div>
                        <strong>
                          Waiting for client response
                        </strong>

                        <p>
                          You can withdraw your
                          proposal while it is
                          still pending.
                        </p>
                      </div>

                    </div>
                  )}

                  {application.status ===
                    "accepted" && (
                    <div className="applicationStatusMessage acceptedMessage">

                      <div>
                        ✓
                      </div>

                      <div>
                        <strong>
                          Congratulations!
                        </strong>

                        <p>
                          The client accepted
                          your proposal.
                        </p>
                      </div>

                    </div>
                  )}

                  {application.status ===
                    "rejected" && (
                    <div className="applicationStatusMessage rejectedMessage">

                      <div>
                        ×
                      </div>

                      <div>
                        <strong>
                          Proposal not selected
                        </strong>

                        <p>
                          Keep applying — another
                          project may be a better
                          match.
                        </p>
                      </div>

                    </div>
                  )}

                  {/* ACTIONS */}

                  <div className="applicationCardActions">

                    {application.status ===
                      "pending" && (
                      <button
                        className="withdrawApplicationButton"
                        disabled={
                          withdrawingId ===
                          application._id
                        }
                        onClick={() =>
                          setApplicationToWithdraw(
                            application
                          )
                        }
                      >
                        {withdrawingId ===
                        application._id
                          ? "Withdrawing..."
                          : "Withdraw Application"}
                      </button>
                    )}

                    {application.status ===
                      "accepted" &&
                      projectStatus !==
                        "completed" && (
                        <button
                          onClick={() =>
                            navigate(
                              "/messages"
                            )
                          }
                        >
                          💬 Message Client
                        </button>
                      )}

                    {application.status ===
                      "accepted" &&
                      projectStatus ===
                        "completed" && (
                        <div className="completedApplicationLabel">
                          ✓ Project completed
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
        isOpen={Boolean(applicationToWithdraw)}
        title="Withdraw Application?"
        message={
          applicationToWithdraw
            ? `Are you sure you want to withdraw your application for "${
                applicationToWithdraw.projectId?.title || "this project"
              }"?`
            : ""
        }
        confirmText="Withdraw"
        cancelText="Keep Application"
        type="warning"
        loading={
          withdrawingId === applicationToWithdraw?._id
        }
        onCancel={() => {
          if (!withdrawingId) {
            setApplicationToWithdraw(null);
          }
        }}
        onConfirm={() => {
          if (applicationToWithdraw) {
            handleWithdraw(applicationToWithdraw._id);
          }
        }}
      />

    </div>
  );
}

export default MyApplications;