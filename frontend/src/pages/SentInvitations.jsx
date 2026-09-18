import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";

function SentInvitations() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");

  const [
    invitations,
    setInvitations,
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
    cancellingId,
    setCancellingId,
  ] = useState(null);

  const [
    invitationToCancel,
    setInvitationToCancel,
  ] = useState(null);

  // =====================================
  // LOAD SENT INVITATIONS
  // =====================================

  const loadInvitations =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "https://freelancehub-marketplace.onrender.com/api/invitations/sent",
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
              "Unable to load sent invitations."
          );

          return;
        }

        setInvitations(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Sent invitations error:",
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
    loadInvitations();
  }, []);

  // =====================================
  // CANCEL INVITATION
  // =====================================

  const cancelInvitation =
    async (
      invitationId
    ) => {
      try {
        setCancellingId(
          invitationId
        );

        setError("");
        setSuccess("");

        const response =
          await fetch(
            `https://freelancehub-marketplace.onrender.com/api/invitations/${invitationId}/cancel`,
            {
              method: "PATCH",

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
              "Unable to cancel invitation."
          );

          return;
        }

        setInvitations(
          (previous) =>
            previous.map(
              (invitation) =>
                invitation._id ===
                invitationId
                  ? {
                      ...invitation,
                      status:
                        "cancelled",
                    }
                  : invitation
            )
        );

        setInvitationToCancel(
          null
        );

        setSuccess(
          "Invitation cancelled successfully."
        );

        setTimeout(() => {
          setSuccess("");
        }, 2500);
      } catch (error) {
        console.error(
          "Cancel invitation error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setCancellingId(
          null
        );
      }
    };

  // =====================================
  // FILTER
  // =====================================

  const filteredInvitations =
    useMemo(() => {
      if (
        statusFilter === "all"
      ) {
        return invitations;
      }

      return invitations.filter(
        (invitation) =>
          invitation.status ===
          statusFilter
      );
    }, [
      invitations,
      statusFilter,
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

  const getStatusText = (
    status
  ) => {
    if (
      status === "accepted"
    ) {
      return "Accepted";
    }

    if (
      status === "declined"
    ) {
      return "Declined";
    }

    if (
      status === "cancelled"
    ) {
      return "Cancelled";
    }

    return "Pending";
  };

  return (
    <div className="sentInvitationsPage">

      {/* HEADER */}

      <div className="sentInvitationsHeader">

        <div>

          <span className="pageEyebrow">
            Talent Outreach
          </span>

          <h1>
            Sent Invitations
          </h1>

          <p>
            Track the freelancers you
            invited and see whether
            they accepted, declined or
            are still considering your
            project.
          </p>

        </div>

        <div className="sentInvitationHeaderActions">

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
                "/find-freelancers"
              )
            }
          >
            Find Freelancers
          </button>

        </div>

      </div>

      {/* HERO */}

      <section className="sentInvitationHero">

        <div className="sentInvitationHeroContent">

          <span>
            ✉️ Direct invitations
          </span>

          <h2>
            Keep track of every
            freelancer invitation.
          </h2>

          <p>
            Review pending invitations,
            accepted opportunities and
            previous outreach from one
            place.
          </p>

          <div className="sentInvitationHeroStats">

            <div>

              <strong>
                {
                  invitations.length
                }
              </strong>

              <span>
                Total Sent
              </span>

            </div>

            <div>

              <strong>
                {
                  invitations.filter(
                    (invitation) =>
                      invitation.status ===
                      "pending"
                  ).length
                }
              </strong>

              <span>
                Pending
              </span>

            </div>

            <div>

              <strong>
                {
                  invitations.filter(
                    (invitation) =>
                      invitation.status ===
                      "accepted"
                  ).length
                }
              </strong>

              <span>
                Accepted
              </span>

            </div>

          </div>

        </div>

        <div className="sentInvitationHeroImage">

          <img
            src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1000&q=90"
            alt="Professional collaboration"
          />

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

      {/* TOOLBAR */}

      <div className="sentInvitationToolbar">

        <div>

          <h2>
            Invitation History
          </h2>

          <p>
            {
              filteredInvitations.length
            }{" "}
            invitation
            {
              filteredInvitations.length ===
              1
                ? ""
                : "s"
            }
          </p>

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

          <option value="pending">
            Pending
          </option>

          <option value="accepted">
            Accepted
          </option>

          <option value="declined">
            Declined
          </option>

          <option value="cancelled">
            Cancelled
          </option>

        </select>

      </div>

      {/* LIST */}

      {loading ? (
        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            ⏳
          </div>

          <h3>
            Loading invitations...
          </h3>

        </div>
      ) : filteredInvitations.length ===
        0 ? (
        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            ✉️
          </div>

          <h3>
            No invitations found
          </h3>

          <p>
            Invite freelancers to one
            of your open projects.
          </p>

          <button
            onClick={() =>
              navigate(
                "/find-freelancers"
              )
            }
          >
            Find Freelancers
          </button>

        </div>
      ) : (
        <div className="sentInvitationList">

          {filteredInvitations.map(
            (invitation) => {
              const freelancer =
                invitation.freelancerId;

              const project =
                invitation.projectId;

              const freelancerName =
                freelancer?.name ||
                "Freelancer";

              const projectTitle =
                project?.title ||
                "Project";

              return (
                <article
                  className="sentInvitationCard"
                  key={
                    invitation._id
                  }
                >

                  <div className="sentInvitationCardTop">

                    <div className="sentInvitationPerson">

                      <div className="sentInvitationAvatar">
                        {String(
                          freelancerName
                        )
                          .split(" ")
                          .map(
                            (part) =>
                              part[0]
                          )
                          .join("")
                          .slice(
                            0,
                            2
                          )
                          .toUpperCase()}
                      </div>

                      <div>

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

                    </div>

                    <span
                      className={`sentInvitationStatus ${invitation.status}`}
                    >
                      {getStatusText(
                        invitation.status
                      )}
                    </span>

                  </div>

                  <div className="sentInvitationProject">

                    <span>
                      Project
                    </span>

                    <strong>
                      {
                        projectTitle
                      }
                    </strong>

                    {project?.description && (
                      <p>
                        {
                          project.description
                        }
                      </p>
                    )}

                  </div>

                  <div className="sentInvitationMeta">

                    <div>

                      <span>
                        Budget
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
                        Sent
                      </span>

                      <strong>
                        {formatDate(
                          invitation.createdAt
                        )}
                      </strong>

                    </div>

                  </div>

                  {invitation.message && (
                    <div className="sentInvitationMessage">

                      <span>
                        Your Message
                      </span>

                      <p>
                        “
                        {
                          invitation.message
                        }
                        ”
                      </p>

                    </div>
                  )}

                  {invitation.status ===
                    "pending" && (
                    <div className="sentInvitationPendingNote">

                      <span>
                        ⏳
                      </span>

                      <p>
                        Waiting for the
                        freelancer to
                        respond.
                      </p>

                    </div>
                  )}

                  {invitation.status ===
                    "accepted" && (
                    <div className="sentInvitationAcceptedNote">

                      <span>
                        ✓
                      </span>

                      <div>

                        <strong>
                          Invitation Accepted
                        </strong>

                        <p>
                          The freelancer
                          accepted and an
                          application was
                          created.
                        </p>

                      </div>

                    </div>
                  )}

                  {invitation.status ===
                    "declined" && (
                    <div className="sentInvitationDeclinedNote">

                      <span>
                        ×
                      </span>

                      <p>
                        The freelancer
                        declined this
                        invitation.
                      </p>

                    </div>
                  )}

                  {invitation.status ===
                    "cancelled" && (
                    <div className="sentInvitationCancelledNote">

                      <span>
                        ○
                      </span>

                      <p>
                        You cancelled
                        this invitation.
                      </p>

                    </div>
                  )}

                  <div className="sentInvitationActions">

                    {freelancer?._id && (
                      <button
                        className="sentInvitationSecondary"
                        onClick={() =>
                          navigate(
                            `/freelancer/${freelancer._id}`
                          )
                        }
                      >
                        View Profile
                      </button>
                    )}

                    {invitation.status ===
                      "pending" && (
                      <button
                        className="cancelInvitationButton"
                        disabled={
                          cancellingId ===
                          invitation._id
                        }
                        onClick={() =>
                          setInvitationToCancel(
                            invitation
                          )
                        }
                      >
                        {cancellingId ===
                        invitation._id
                          ? "Cancelling..."
                          : "Cancel Invitation"}
                      </button>
                    )}

                  </div>

                </article>
              );
            }
          )}

        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(invitationToCancel)}
        title="Cancel Invitation?"
        message={
          invitationToCancel
            ? `Are you sure you want to cancel your invitation to ${
                invitationToCancel.freelancerId?.name || "this freelancer"
              }?`
            : ""
        }
        confirmText="Cancel Invitation"
        cancelText="Keep Invitation"
        type="warning"
        loading={
          cancellingId === invitationToCancel?._id
        }
        onCancel={() => {
          if (!cancellingId) {
            setInvitationToCancel(null);
          }
        }}
        onConfirm={() => {
          if (invitationToCancel) {
            cancelInvitation(invitationToCancel._id);
          }
        }}
      />

    </div>
  );
}

export default SentInvitations;