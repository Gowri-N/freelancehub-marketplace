import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

function ApplyProject() {
  const navigate = useNavigate();

  const { projectId } =
    useParams();

  const token =
    localStorage.getItem("token");

  const [
    project,
    setProject,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    formData,
    setFormData,
  ] = useState({
    bidAmount: "",
    deliveryDays: "",
    message: "",
  });

  useEffect(() => {
    const loadProject =
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
                "Unable to load project."
            );
            return;
          }

          const foundProject =
            Array.isArray(data)
              ? data.find(
                  (item) =>
                    item._id ===
                    projectId
                )
              : null;

          if (!foundProject) {
            setError(
              "Project not found."
            );
            return;
          }

          setProject(
            foundProject
          );
        } catch (error) {
          console.error(
            "Load project error:",
            error
          );

          setError(
            "Unable to connect to server."
          );
        } finally {
          setLoading(false);
        }
      };

    loadProject();
  }, [
    projectId,
    token,
  ]);

  const handleChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const bidAmount =
      Number(
        formData.bidAmount
      );

    const deliveryDays =
      Number(
        formData.deliveryDays
      );

    if (
      !formData.bidAmount ||
      !formData.deliveryDays ||
      !formData.message.trim()
    ) {
      setError(
        "Please complete all proposal fields."
      );
      return;
    }

    if (
      Number.isNaN(
        bidAmount
      ) ||
      bidAmount <= 0
    ) {
      setError(
        "Please enter a valid bid amount."
      );
      return;
    }

    if (
      Number.isNaN(
        deliveryDays
      ) ||
      deliveryDays <= 0
    ) {
      setError(
        "Please enter valid delivery days."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response =
        await fetch(
          "https://freelancehub-marketplace.onrender.com/api/applications",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                projectId,
                bidAmount,
                deliveryDays,
                message:
                  formData.message.trim(),
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to submit application."
        );
        return;
      }

      setSuccess(
        "Your proposal has been submitted successfully."
      );

      setTimeout(() => {
        navigate(
          "/my-applications"
        );
      }, 1300);
    } catch (error) {
      console.error(
        "Application error:",
        error
      );

      setError(
        "Unable to connect to server."
      );
    } finally {
      setSubmitting(false);
    }
  };

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

  const skills =
    String(
      project?.skills || ""
    )
      .split(",")
      .map((skill) =>
        skill.trim()
      )
      .filter(Boolean);

  if (loading) {
    return (
      <div className="applicationPage">
        <div className="marketplaceEmptyState">
          <div className="emptyStateIcon">
            ⏳
          </div>

          <h3>
            Loading project...
          </h3>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="applicationPage">

        <div className="applicationPageHeader">

          <button
            className="pageBackButton"
            onClick={() =>
              navigate(
                "/find-projects"
              )
            }
          >
            ← Back to Projects
          </button>

        </div>

        <div className="errorMessage">
          {error ||
            "Project not found."}
        </div>

      </div>
    );
  }

  return (
    <div className="applicationPage">

      <div className="applicationPageHeader">

        <div>
          <span className="pageEyebrow">
            Submit Proposal
          </span>

          <h1>
            Apply for Project
          </h1>

          <p>
            Review the project
            details and send a
            clear proposal to the
            client.
          </p>
        </div>

        <button
          className="pageBackButton"
          onClick={() =>
            navigate(
              "/find-projects"
            )
          }
        >
          ← Back to Projects
        </button>

      </div>

      <div className="applicationLayout">

        <section className="applicationProjectPanel">

          <div className="applicationProjectImage">

            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=90"
              alt="Project workspace"
            />

            <div className="applicationImageOverlay">

              <span>
                Open Project
              </span>

            </div>

          </div>

          <div className="applicationProjectContent">

            <div className="projectClientRow">

              <span>
                Client
              </span>

              <strong>
                {
                  project.clientName
                }
              </strong>

            </div>

            <h2>
              {project.title}
            </h2>

            <p>
              {
                project.description
              }
            </p>

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

            <div className="applicationProjectStats">

              <div>

                <div className="applicationStatIcon">
                  £
                </div>

                <div>
                  <span>
                    Project Budget
                  </span>

                  <strong>
                    £
                    {
                      project.budget
                    }
                  </strong>
                </div>

              </div>

              <div>

                <div className="applicationStatIcon">
                  📅
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

              </div>

            </div>

          </div>

        </section>

        <section className="proposalFormCard">

          <div className="proposalFormHeader">

            <div className="proposalHeaderIcon">
              ✍️
            </div>

            <div>
              <h2>
                Your Proposal
              </h2>

              <p>
                Tell the client how
                you can help with
                this project.
              </p>
            </div>

          </div>

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

          <form
            onSubmit={
              handleSubmit
            }
          >

            <div className="proposalFormGrid">

              <div className="modernFormGroup">

                <label>
                  Your Bid (£)
                </label>

                <div className="proposalInputWithIcon">

                  <span>
                    £
                  </span>

                  <input
                    type="number"
                    name="bidAmount"
                    min="1"
                    step="1"
                    placeholder="e.g. 450"
                    value={
                      formData.bidAmount
                    }
                    onChange={
                      handleChange
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
                    step="1"
                    placeholder="e.g. 7"
                    value={
                      formData.deliveryDays
                    }
                    onChange={
                      handleChange
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
                rows="8"
                placeholder="Introduce yourself, explain your experience and tell the client how you would approach this project..."
                value={
                  formData.message
                }
                onChange={
                  handleChange
                }
              />

              <div className="proposalHelperText">
                {
                  formData.message
                    .length
                }{" "}
                characters
              </div>

            </div>

            <div className="proposalTipBox">

              <div>
                💡
              </div>

              <div>
                <strong>
                  Proposal tip
                </strong>

                <p>
                  Mention relevant
                  skills, explain
                  your approach and
                  give a realistic
                  delivery time.
                </p>
              </div>

            </div>

            <div className="proposalActions">

              <button
                type="button"
                className="proposalCancelButton"
                onClick={() =>
                  navigate(
                    "/find-projects"
                  )
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="proposalSubmitButton"
                disabled={
                  submitting
                }
              >
                {submitting
                  ? "Submitting..."
                  : "Send Proposal →"}
              </button>

            </div>

          </form>

        </section>

      </div>

    </div>
  );
}

export default ApplyProject;