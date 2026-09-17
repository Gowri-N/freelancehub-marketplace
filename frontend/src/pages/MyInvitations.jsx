import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";

function MyInvitations() {
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
    activeInvitationId,
    setActiveInvitationId,
  ] = useState(null);

  const [
    respondingId,
    setRespondingId,
  ] = useState(null);

  const [
    invitationToDecline,
    setInvitationToDecline,
  ] = useState(null);

  const [
    proposal,
    setProposal,
  ] = useState({
    bidAmount: "",
    deliveryDays: "",
    message: "",
  });

  // =====================================
  // LOAD INVITATIONS
  // =====================================

  const loadInvitations =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "http://localhost:5000/api/invitations/my-invitations",
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
              "Unable to load invitations."
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
          "Load invitations error:",
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
  // OPEN ACCEPT FORM
  // =====================================

  const openAcceptForm = (
    invitationId
  ) => {
    setActiveInvitationId(
      invitationId
    );

    setProposal({
      bidAmount: "",
      deliveryDays: "",
      message: "",
    });

    setError("");
    setSuccess("");
  };

  const cancelAcceptForm =
    () => {
      setActiveInvitationId(
        null
      );

      setProposal({
        bidAmount: "",
        deliveryDays: "",
        message: "",
      });
    };

  // =====================================
  // CHANGE PROPOSAL
  // =====================================

  const handleProposalChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setProposal(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };

  // =====================================
  // ACCEPT
  // =====================================

  const handleAccept =
    async (
      event,
      invitationId
    ) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      const bidAmount =
        Number(
          proposal.bidAmount
        );

      const deliveryDays =
        Number(
          proposal.deliveryDays
        );

      if (
        !proposal.bidAmount ||
        !proposal.deliveryDays ||
        !proposal.message.trim()
      ) {
        setError(
          "Please complete all proposal fields."
        );

        return;
      }

      if (
        bidAmount <= 0 ||
        deliveryDays <= 0
      ) {
        setError(
          "Bid amount and delivery days must be greater than zero."
        );

        return;
      }

      try {
        setRespondingId(
          invitationId
        );

        const response =
          await fetch(
            `http://localhost:5000/api/invitations/${invitationId}/status`,
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
                  status:
                    "accepted",

                  bidAmount,

                  deliveryDays,

                  message:
                    proposal.message.trim(),
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to accept invitation."
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
                        "accepted",
                    }
                  : invitation
            )
        );

        setSuccess(
          "Invitation accepted and application submitted successfully."
        );

        setActiveInvitationId(
          null
        );

        setProposal({
          bidAmount: "",
          deliveryDays: "",
          message: "",
        });
      } catch (error) {
        console.error(
          "Accept invitation error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setRespondingId(
          null
        );
      }
    };

  // =====================================
  // DECLINE
  // =====================================

  const handleDecline =
    async (invitationId) => {
      try {
        setError("");
        setSuccess("");

        setRespondingId(
          invitationId
        );

        const response =
          await fetch(
            `http://localhost:5000/api/invitations/${invitationId}/status`,
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
                  status:
                    "declined",
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to decline invitation."
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
                        "declined",
                    }
                  : invitation
            )
        );

        setInvitationToDecline(
          null
        );

        setSuccess(
          "Invitation declined."
        );
      } catch (error) {
        console.error(
          "Decline invitation error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setRespondingId(
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

  const pendingCount =
    invitations.filter(
      (invitation) =>
        invitation.status ===
          "pending" &&
        invitation.projectId
          ?.status === "open"
    ).length;

  return (
    <div className="freelancerListPage">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="freelancerListHeader">

        <div>

          <span className="pageEyebrow">
            Direct Opportunities
          </span>

          <h1>
            My Invitations
          </h1>

          <p>
            Review project
            invitations sent
            directly to you by
            clients.
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

      <section className="invitationsHero">

        <div className="invitationsHeroContent">

          <span>
            ✉️ Client Invitations
          </span>

          <h2>
            Clients are interested
            in your skills.
          </h2>

          <p>
            Review project details
            carefully and submit a
            proposal when an
            opportunity is right
            for you.
          </p>

          <div className="invitationHeroStat">

            <strong>
              {pendingCount}
            </strong>

            <span>
              Pending invitation
              {pendingCount === 1
                ? ""
                : "s"}
            </span>

          </div>

        </div>

        <div className="invitationsHeroImage">

          <img
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=90"
            alt="Client and freelancer collaboration"
          />

        </div>

      </section>

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
          HEADER
      ===================================== */}

      <div className="resultsHeader">

        <div>
          <h2>
            Project Invitations
          </h2>

          <p>
            {
              invitations.length
            }{" "}
            invitation
            {
              invitations.length ===
              1
                ? ""
                : "s"
            }
          </p>
        </div>

      </div>

      {/* =====================================
          LIST
      ===================================== */}

      {loading ? (
        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            ⏳
          </div>

          <h3>
            Loading invitations...
          </h3>

        </div>
      ) : invitations.length ===
        0 ? (
        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            ✉️
          </div>

          <h3>
            No invitations yet
          </h3>

          <p>
            Invitations from
            clients will appear
            here.
          </p>

          <button
            onClick={() =>
              navigate(
                "/find-projects"
              )
            }
          >
            Browse Projects
          </button>

        </div>
      ) : (
        <div className="invitationList">

          {invitations.map(
            (invitation) => {
              const project =
                invitation.projectId;

              const skills =
                getSkills(
                  project?.skills
                );

              const isProjectOpen =
                project?.status ===
                "open";

              const canRespond =
                invitation.status ===
                  "pending" &&
                isProjectOpen;

              return (
                <article
                  className="invitationCard"
                  key={
                    invitation._id
                  }
                >

                  {/* TOP */}

                  <div className="invitationCardHeader">

                    <div className="invitationProjectIdentity">

                      <div className="invitationIcon">
                        ✉️
                      </div>

                      <div>
                        <span>
                          Invitation from{" "}
                          <strong>
                            {
                              invitation.clientId
                                ?.name ||
                              project?.clientName ||
                              "Client"
                            }
                          </strong>
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
                      className={`invitationStatusChip ${invitation.status}`}
                    >
                      {getStatusText(
                        invitation.status
                      )}
                    </span>

                  </div>

                  {/* DESCRIPTION */}

                  <p className="invitationProjectDescription">
                    {
                      project?.description ||
                      "Project details are no longer available."
                    }
                  </p>

                  {/* SKILLS */}

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

                  {/* DETAILS */}

                  <div className="invitationDetailsGrid">

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
                        Project Status
                      </span>

                      <strong>
                        {
                          project?.status ||
                          "Unavailable"
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        Invited
                      </span>

                      <strong>
                        {formatDate(
                          invitation.createdAt
                        )}
                      </strong>

                    </div>

                  </div>

                  {/* CLIENT MESSAGE */}

                  {invitation.message && (
                    <div className="clientInvitationMessage">

                      <div className="messageQuoteIcon">
                        “
                      </div>

                      <div>
                        <span>
                          Client Message
                        </span>

                        <p>
                          {
                            invitation.message
                          }
                        </p>
                      </div>

                    </div>
                  )}

                  {/* CLOSED PROJECT */}

                  {invitation.status ===
                    "pending" &&
                    !isProjectOpen && (
                      <div className="invitationNotice closedNotice">

                        <span>
                          ⚠️
                        </span>

                        <div>
                          <strong>
                            Project no longer open
                          </strong>

                          <p>
                            This invitation
                            cannot be accepted
                            because the project
                            is no longer
                            available.
                          </p>
                        </div>

                      </div>
                    )}

                  {/* ACCEPTED */}

                  {invitation.status ===
                    "accepted" && (
                    <div className="invitationNotice acceptedNotice">

                      <span>
                        ✓
                      </span>

                      <div>
                        <strong>
                          Invitation accepted
                        </strong>

                        <p>
                          Your application has
                          been submitted to the
                          client.
                        </p>
                      </div>

                    </div>
                  )}

                  {/* DECLINED */}

                  {invitation.status ===
                    "declined" && (
                    <div className="invitationNotice declinedNotice">

                      <span>
                        ×
                      </span>

                      <div>
                        <strong>
                          Invitation declined
                        </strong>

                        <p>
                          You chose not to
                          apply for this
                          project.
                        </p>
                      </div>

                    </div>
                  )}

                  {/* CANCELLED */}

                  {invitation.status ===
                    "cancelled" && (
                    <div className="invitationNotice cancelledNotice">

                      <span>
                        —
                      </span>

                      <div>
                        <strong>
                          Invitation cancelled
                        </strong>

                        <p>
                          The client cancelled
                          this invitation.
                        </p>
                      </div>

                    </div>
                  )}

                  {/* BUTTONS */}

                  {canRespond &&
                    activeInvitationId !==
                      invitation._id && (
                      <div className="invitationActions">

                        <button
                          onClick={() =>
                            openAcceptForm(
                              invitation._id
                            )
                          }
                        >
                          ✓ Accept & Apply
                        </button>

                        <button
                          className="declineInvitationButton"
                          disabled={
                            respondingId ===
                            invitation._id
                          }
                          onClick={() =>
                            setInvitationToDecline(
                              invitation
                            )
                          }
                        >
                          {respondingId ===
                          invitation._id
                            ? "Processing..."
                            : "Decline"}
                        </button>

                      </div>
                    )}

                  {/* PROPOSAL FORM */}

                  {canRespond &&
                    activeInvitationId ===
                      invitation._id && (
                      <form
                        className="invitationProposalForm"
                        onSubmit={(
                          event
                        ) =>
                          handleAccept(
                            event,
                            invitation._id
                          )
                        }
                      >

                        <div className="invitationProposalHeader">

                          <div>
                            ✍️
                          </div>

                          <div>
                            <h4>
                              Submit Your
                              Proposal
                            </h4>

                            <p>
                              Accept the
                              invitation by
                              submitting your
                              bid and delivery
                              details.
                            </p>
                          </div>

                        </div>

                        <div className="proposalFormGrid">

                          <div className="modernFormGroup">

                            <label>
                              Bid Amount (£)
                            </label>

                            <div className="proposalInputWithIcon">

                              <span>
                                £
                              </span>

                              <input
                                type="number"
                                name="bidAmount"
                                min="1"
                                placeholder="e.g. 500"
                                value={
                                  proposal.bidAmount
                                }
                                onChange={
                                  handleProposalChange
                                }
                              />

                            </div>

                          </div>

                          <div className="modernFormGroup">

                            <label>
                              Delivery Days
                            </label>

                            <div className="proposalInputWithIcon">

                              <span>
                                📅
                              </span>

                              <input
                                type="number"
                                name="deliveryDays"
                                min="1"
                                placeholder="e.g. 7"
                                value={
                                  proposal.deliveryDays
                                }
                                onChange={
                                  handleProposalChange
                                }
                              />

                            </div>

                          </div>

                        </div>

                        <div className="modernFormGroup">

                          <label>
                            Proposal Message
                          </label>

                          <textarea
                            name="message"
                            rows="5"
                            placeholder="Explain why you're a good fit for this project..."
                            value={
                              proposal.message
                            }
                            onChange={
                              handleProposalChange
                            }
                          />

                        </div>

                        <div className="invitationProposalActions">

                          <button
                            type="button"
                            className="proposalCancelButton"
                            onClick={
                              cancelAcceptForm
                            }
                          >
                            Cancel
                          </button>

                          <button
                            type="submit"
                            disabled={
                              respondingId ===
                              invitation._id
                            }
                          >
                            {respondingId ===
                            invitation._id
                              ? "Submitting..."
                              : "Accept & Submit Proposal"}
                          </button>

                        </div>

                      </form>
                    )}

                </article>
              );
            }
          )}

        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(invitationToDecline)}
        title="Decline Invitation?"
        message={
          invitationToDecline
            ? `Are you sure you want to decline the invitation for "${
                invitationToDecline.projectId?.title ||
                "this project"
              }"?`
            : ""
        }
        confirmText="Decline Invitation"
        cancelText="Keep Invitation"
        type="danger"
        loading={
          respondingId === invitationToDecline?._id
        }
        onCancel={() => {
          if (!respondingId) {
            setInvitationToDecline(null);
          }
        }}
        onConfirm={() => {
          if (invitationToDecline) {
            handleDecline(invitationToDecline._id);
          }
        }}
      />

    </div>
  );
}

export default MyInvitations;