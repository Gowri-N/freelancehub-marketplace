import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

function EditProject() {
  const navigate = useNavigate();

  const {
    projectId,
  } = useParams();

  const token =
    localStorage.getItem("token");

  const storedUser =
    localStorage.getItem("user");

  const user =
    storedUser
      ? JSON.parse(storedUser)
      : null;

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
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    project,
    setProject,
  ] = useState(null);

  // =====================================
  // LOAD PROJECT
  // =====================================

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

          if (
            !foundProject
          ) {
            setError(
              "Project not found."
            );

            return;
          }

          const currentUserId =
            user?._id ||
            user?.id;

          if (
            foundProject.clientId !==
            currentUserId
          ) {
            setError(
              "You are not authorised to edit this project."
            );

            return;
          }

          if (
            foundProject.status !==
            "open"
          ) {
            setError(
              "Only open projects can be edited."
            );

            return;
          }

          setProject(
            foundProject
          );

          setFormData({
            title:
              foundProject.title ||
              "",

            description:
              foundProject.description ||
              "",

            skills:
              foundProject.skills ||
              "",

            budget:
              foundProject.budget ||
              "",

            deadline:
              foundProject.deadline
                ? new Date(
                    foundProject.deadline
                  )
                    .toISOString()
                    .split("T")[0]
                : "",
          });
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
  // SAVE
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
        setSaving(true);

        const response =
          await fetch(
            `https://freelancehub-marketplace.onrender.com/api/projects/${projectId}`,
            {
              method: "PUT",

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
              "Unable to update project."
          );

          return;
        }

        setSuccess(
          "Project updated successfully."
        );

        setTimeout(() => {
          navigate(
            "/my-projects"
          );
        }, 1200);
      } catch (error) {
        console.error(
          "Update project error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <div className="projectFormPage">

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
      <div className="projectFormPage">

        <div className="projectFormPageHeader">

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

        <div className="errorMessage">
          {error ||
            "Project unavailable."}
        </div>

      </div>
    );
  }

  return (
    <div className="projectFormPage">

      {/* HEADER */}

      <div className="projectFormPageHeader">

        <div>

          <span className="pageEyebrow">
            Update Project
          </span>

          <h1>
            Edit Project
          </h1>

          <p>
            Update your project
            details while the
            project is still open.
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

        {/* VISUAL */}

        <section className="projectFormVisual">

          <div className="projectFormImage">

            <img
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=90"
              alt="Team reviewing project requirements"
            />

            <div className="projectFormImageOverlay">

              <span>
                ✏️ Refine your project
              </span>

              <h2>
                Keep your project
                details clear and
                accurate.
              </h2>

            </div>

          </div>

          <div className="projectPostingTips">

            <h3>
              Before saving changes
            </h3>

            <div>
              <span>
                ✓
              </span>

              <p>
                Make sure your
                requirements are
                easy to understand.
              </p>
            </div>

            <div>
              <span>
                ✓
              </span>

              <p>
                Keep the required
                skills relevant to
                the work.
              </p>
            </div>

            <div>
              <span>
                ✓
              </span>

              <p>
                Update the deadline
                if your schedule has
                changed.
              </p>
            </div>

            <div>
              <span>
                ✓
              </span>

              <p>
                Only open projects
                can be edited.
              </p>
            </div>

          </div>

        </section>

        {/* FORM */}

        <section className="projectFormCard">

          <div className="projectFormCardHeader">

            <div className="projectFormHeaderIcon">
              ✏️
            </div>

            <div>
              <h2>
                Edit Project Details
              </h2>

              <p>
                Make your changes and
                save the updated
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

            <div className="projectEditNotice">

              <span>
                ℹ️
              </span>

              <p>
                Once a freelancer is
                accepted, the project
                can no longer be
                edited.
              </p>

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
                  saving
                }
              >
                {saving
                  ? "Saving..."
                  : "Save Changes →"}
              </button>

            </div>

          </form>

        </section>

      </div>

    </div>
  );
}

export default EditProject;