import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

function PostProject() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");

  const [
    formData,
    setFormData,
  ] = useState({
    title: "",
    description: "",
    skills: "",
    budget: "",
    deadline: "",
  });

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  // =====================================
  // CHANGE
  // =====================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  // =====================================
  // SUBMIT
  // =====================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (
        !formData.title.trim() ||
        !formData.description.trim() ||
        !formData.skills.trim() ||
        !formData.budget ||
        !formData.deadline
      ) {
        setError(
          "Please complete all project fields."
        );

        return;
      }

      const budget =
        Number(
          formData.budget
        );

      if (
        Number.isNaN(
          budget
        ) ||
        budget <= 0
      ) {
        setError(
          "Please enter a valid project budget."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            "http://localhost:5000/api/projects",
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
                  title:
                    formData.title.trim(),

                  description:
                    formData.description.trim(),

                  skills:
                    formData.skills.trim(),

                  budget,

                  deadline:
                    formData.deadline,
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to post project."
          );

          return;
        }

        setSuccess(
          "Project posted successfully."
        );

        setTimeout(() => {
          navigate(
            "/my-projects"
          );
        }, 1200);
      } catch (error) {
        console.error(
          "Post project error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="projectFormPage">

      {/* HEADER */}

      <div className="projectFormPageHeader">

        <div>
          <span className="pageEyebrow">
            Create Opportunity
          </span>

          <h1>
            Post a New Project
          </h1>

          <p>
            Describe your project
            clearly and attract
            freelancers with the
            right skills.
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

      <div className="projectFormLayout">

        {/* LEFT SIDE */}

        <section className="projectFormVisual">

          <div className="projectFormImage">

            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=90"
              alt="Team planning a project"
            />

            <div className="projectFormImageOverlay">

              <span>
                ✨ Start something great
              </span>

              <h2>
                Find the right
                freelancer for
                your project.
              </h2>

            </div>

          </div>

          <div className="projectPostingTips">

            <h3>
              Tips for a great project
            </h3>

            <div>
              <span>
                ✓
              </span>

              <p>
                Use a clear and
                specific project
                title.
              </p>
            </div>

            <div>
              <span>
                ✓
              </span>

              <p>
                Explain the work,
                expectations and
                deliverables.
              </p>
            </div>

            <div>
              <span>
                ✓
              </span>

              <p>
                Add relevant skills
                so freelancers can
                find your project.
              </p>
            </div>

            <div>
              <span>
                ✓
              </span>

              <p>
                Choose a realistic
                budget and deadline.
              </p>
            </div>

          </div>

        </section>

        {/* FORM */}

        <section className="projectFormCard">

          <div className="projectFormCardHeader">

            <div className="projectFormHeaderIcon">
              📁
            </div>

            <div>
              <h2>
                Project Details
              </h2>

              <p>
                Complete the details
                below to publish your
                project.
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

            <div className="modernFormGroup">

              <label>
                Project Title
              </label>

              <input
                type="text"
                name="title"
                placeholder="e.g. Build a React eCommerce website"
                value={
                  formData.title
                }
                onChange={
                  handleChange
                }
              />

            </div>

            <div className="modernFormGroup">

              <label>
                Project Description
              </label>

              <textarea
                name="description"
                rows="7"
                placeholder="Describe the project, requirements, deliverables and anything the freelancer should know..."
                value={
                  formData.description
                }
                onChange={
                  handleChange
                }
              />

              <div className="projectFormHelper">
                {
                  formData
                    .description
                    .length
                }{" "}
                characters
              </div>

            </div>

            <div className="modernFormGroup">

              <label>
                Required Skills
              </label>

              <input
                type="text"
                name="skills"
                placeholder="React, Node.js, MongoDB, JavaScript"
                value={
                  formData.skills
                }
                onChange={
                  handleChange
                }
              />

              <small>
                Separate skills using
                commas.
              </small>

            </div>

            <div className="projectFormGrid">

              <div className="modernFormGroup">

                <label>
                  Budget (£)
                </label>

                <div className="proposalInputWithIcon">

                  <span>
                    £
                  </span>

                  <input
                    type="number"
                    name="budget"
                    min="1"
                    placeholder="e.g. 750"
                    value={
                      formData.budget
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

              <div className="modernFormGroup">

                <label>
                  Deadline
                </label>

                <input
                  type="date"
                  name="deadline"
                  value={
                    formData.deadline
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

            </div>

            <div className="projectPublishNotice">

              <span>
                💡
              </span>

              <div>
                <strong>
                  Ready to publish?
                </strong>

                <p>
                  After posting, your
                  project will be
                  visible to
                  freelancers in the
                  marketplace.
                </p>
              </div>

            </div>

            <div className="projectFormActions">

              <button
                type="button"
                className="proposalCancelButton"
                onClick={() =>
                  navigate(
                    "/my-projects"
                  )
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  loading
                }
              >
                {loading
                  ? "Posting..."
                  : "Post Project →"}
              </button>

            </div>

          </form>

        </section>

      </div>

    </div>
  );
}

export default PostProject;