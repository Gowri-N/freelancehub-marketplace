import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

function LeaveReview() {
  const navigate =
    useNavigate();

  const {
    projectId,
  } = useParams();

  const token =
    localStorage.getItem("token");

  const [
    project,
    setProject,
  ] = useState(null);

  const [
    rating,
    setRating,
  ] = useState(5);

  const [
    hoverRating,
    setHoverRating,
  ] = useState(0);

  const [
    review,
    setReview,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
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
  // LOAD PROJECT
  // =====================================

  useEffect(() => {
    const loadProject =
      async () => {
        try {
          setLoading(true);

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

          setProject(
            foundProject
          );
        } catch (error) {
          console.error(
            "Project load error:",
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
  // SUBMIT REVIEW
  // =====================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (
        !rating ||
        rating < 1 ||
        rating > 5
      ) {
        setError(
          "Please choose a rating."
        );

        return;
      }

      if (
        !review.trim()
      ) {
        setError(
          "Please write a review."
        );

        return;
      }

      try {
        setSubmitting(true);

        const response =
          await fetch(
            "https://freelancehub-marketplace.onrender.com/api/reviews",
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
                  rating,
                  review:
                    review.trim(),
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to submit review."
          );

          return;
        }

        setSuccess(
          "Review submitted successfully."
        );

        setTimeout(() => {
          navigate(
            "/my-projects"
          );
        }, 1300);
      } catch (error) {
        console.error(
          "Review submit error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setSubmitting(false);
      }
    };

  // =====================================
  // LABEL
  // =====================================

  const getRatingLabel = (
    value
  ) => {
    if (value === 1) {
      return "Poor";
    }

    if (value === 2) {
      return "Fair";
    }

    if (value === 3) {
      return "Good";
    }

    if (value === 4) {
      return "Very Good";
    }

    return "Excellent";
  };

  if (loading) {
    return (
      <div className="leaveReviewPage">

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

  return (
    <div className="leaveReviewPage">

      {/* HEADER */}

      <div className="leaveReviewHeader">

        <div>

          <span className="pageEyebrow">
            Project Feedback
          </span>

          <h1>
            Leave a Review
          </h1>

          <p>
            Share your experience and
            help future clients make
            informed decisions.
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

      <div className="leaveReviewLayout">

        {/* PROJECT SIDE */}

        <section className="leaveReviewProjectCard">

          <div className="leaveReviewProjectImage">

            <img
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1000&q=90"
              alt="Successful project collaboration"
            />

            <div className="leaveReviewProjectOverlay">

              <span>
                ✓ Project Complete
              </span>

              <h2>
                Celebrate successful
                collaboration.
              </h2>

            </div>

          </div>

          <div className="leaveReviewProjectDetails">

            <span>
              Project
            </span>

            <h3>
              {
                project?.title ||
                "Completed Project"
              }
            </h3>

            <p>
              {
                project?.description
              }
            </p>

            <div className="leaveReviewProjectMeta">

              <div>

                <span>
                  Budget
                </span>

                <strong>
                  £
                  {
                    project?.budget ||
                    0
                  }
                </strong>

              </div>

              <div>

                <span>
                  Status
                </span>

                <strong>
                  Completed
                </strong>

              </div>

            </div>

          </div>

        </section>

        {/* REVIEW FORM */}

        <section className="leaveReviewFormCard">

          <div className="leaveReviewFormHeader">

            <div className="leaveReviewIcon">
              ⭐
            </div>

            <div>

              <h2>
                Rate Your Experience
              </h2>

              <p>
                Your feedback becomes
                part of the freelancer's
                profile.
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

            <div className="reviewRatingSection">

              <label>
                Overall Rating
              </label>

              <div className="largeStarRating">

                {[1, 2, 3, 4, 5].map(
                  (star) => {
                    const active =
                      star <=
                      (
                        hoverRating ||
                        rating
                      );

                    return (
                      <button
                        key={
                          star
                        }
                        type="button"
                        className={
                          active
                            ? "active"
                            : ""
                        }
                        onMouseEnter={() =>
                          setHoverRating(
                            star
                          )
                        }
                        onMouseLeave={() =>
                          setHoverRating(
                            0
                          )
                        }
                        onClick={() =>
                          setRating(
                            star
                          )
                        }
                      >
                        ★
                      </button>
                    );
                  }
                )}

              </div>

              <div className="ratingSelectedText">

                <strong>
                  {
                    hoverRating ||
                    rating
                  }{" "}
                  / 5
                </strong>

                <span>
                  {getRatingLabel(
                    hoverRating ||
                      rating
                  )}
                </span>

              </div>

            </div>

            <div className="modernFormGroup">

              <label>
                Your Review
              </label>

              <textarea
                rows="8"
                placeholder="Tell us about the freelancer's communication, quality of work, professionalism and overall experience..."
                value={
                  review
                }
                onChange={(event) =>
                  setReview(
                    event.target.value
                  )
                }
              />

              <div className="reviewCharacterCount">
                {
                  review.length
                }{" "}
                characters
              </div>

            </div>

            <div className="reviewTipBox">

              <span>
                💡
              </span>

              <div>

                <strong>
                  Helpful feedback
                </strong>

                <p>
                  Mention communication,
                  quality, delivery and
                  anything future clients
                  should know.
                </p>

              </div>

            </div>

            <div className="leaveReviewActions">

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
                  submitting
                }
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Review →"}
              </button>

            </div>

          </form>

        </section>

      </div>

    </div>
  );
}

export default LeaveReview;