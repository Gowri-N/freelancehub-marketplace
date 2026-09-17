import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

function EditProfile() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");

  const user = JSON.parse(
    localStorage.getItem("user") ||
      "null"
  );

  const [
    formData,
    setFormData,
  ] = useState({
    bio: "",
    skills: "",
    experience: "",
    hourlyRate: "",
    portfolio: "",
  });

  const [
    reviewData,
    setReviewData,
  ] = useState({
    reviews: [],
    totalReviews: 0,
    averageRating: 0,
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

  // =====================================
  // LOAD PROFILE
  // =====================================

  useEffect(() => {
    const loadProfile =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              "http://localhost:5000/api/profile",
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
                "Unable to load profile."
            );

            return;
          }

          setFormData({
            bio:
              data.bio || "",

            skills:
              data.skills || "",

            experience:
              data.experience || "",

            hourlyRate:
              data.hourlyRate || "",

            portfolio:
              data.portfolio || "",
          });

          // =====================================
          // LOAD REVIEWS
          // =====================================

          const freelancerId =
            data._id ||
            user?._id ||
            user?.id;

          if (
            freelancerId
          ) {
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
                const reviewResult =
                  await reviewResponse.json();

                setReviewData({
                  reviews:
                    reviewResult.reviews ||
                    [],

                  totalReviews:
                    reviewResult.totalReviews ||
                    0,

                  averageRating:
                    reviewResult.averageRating ||
                    0,
                });
              }
            } catch (
              reviewError
            ) {
              console.error(
                "Review load error:",
                reviewError
              );
            }
          }
        } catch (error) {
          console.error(
            "Profile load error:",
            error
          );

          setError(
            "Unable to connect to server."
          );
        } finally {
          setLoading(false);
        }
      };

    if (
      !token ||
      !user
    ) {
      navigate("/login");
      return;
    }

    loadProfile();
  }, []);

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
  // SAVE PROFILE
  // =====================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (
        formData.hourlyRate &&
        Number(
          formData.hourlyRate
        ) < 0
      ) {
        setError(
          "Hourly rate cannot be negative."
        );

        return;
      }

      try {
        setSaving(true);

        const response =
          await fetch(
            "http://localhost:5000/api/profile",
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
                  bio:
                    formData.bio.trim(),

                  skills:
                    formData.skills.trim(),

                  experience:
                    formData.experience.trim(),

                  hourlyRate:
                    formData.hourlyRate
                      ? Number(
                          formData.hourlyRate
                        )
                      : "",

                  portfolio:
                    formData.portfolio.trim(),
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to update profile."
          );

          return;
        }

        setSuccess(
          "Profile updated successfully."
        );

        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } catch (error) {
        console.error(
          "Profile update error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setSaving(false);
      }
    };

  // =====================================
  // HELPERS
  // =====================================

  const getSkills = () =>
    String(
      formData.skills || ""
    )
      .split(",")
      .map((skill) =>
        skill.trim()
      )
      .filter(Boolean);

  const getInitials = (
    name
  ) =>
    String(
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

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "";
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
    getSkills();

  const averageRating =
    Number(
      reviewData.averageRating ||
        0
    );

  if (loading) {
    return (
      <div className="editProfilePage">

        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            ⏳
          </div>

          <h3>
            Loading profile...
          </h3>

        </div>

      </div>
    );
  }

  return (
    <div className="editProfilePage">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="editProfileHeader">

        <div>
          <span className="pageEyebrow">
            Freelancer Profile
          </span>

          <h1>
            Edit Profile
          </h1>

          <p>
            Keep your profile updated
            so clients can understand
            your skills, experience
            and availability.
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
          PROFILE HERO
      ===================================== */}

      <section className="editProfileHero">

        <div className="editProfileHeroPattern"></div>

        <div className="editProfileHeroContent">

          <div className="editProfileAvatar">
            {getInitials(
              user?.name
            )}
          </div>

          <div className="editProfileHeroIdentity">

            <span>
              Freelancer
            </span>

            <h2>
              {
                user?.name ||
                "Your Profile"
              }
            </h2>

            <p>
              Build a strong profile
              that helps clients trust
              your experience and
              skills.
            </p>

            <div className="editProfileHeroStats">

              <div>
                <strong>
                  {reviewData.totalReviews >
                  0
                    ? averageRating.toFixed(
                        1
                      )
                    : "New"}
                </strong>

                <span>
                  Rating
                </span>
              </div>

              <div>
                <strong>
                  {
                    reviewData.totalReviews
                  }
                </strong>

                <span>
                  Reviews
                </span>
              </div>

              <div>
                <strong>
                  {
                    skills.length
                  }
                </strong>

                <span>
                  Skills
                </span>
              </div>

            </div>

          </div>

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

      {/* =====================================
          MAIN LAYOUT
      ===================================== */}

      <div className="editProfileLayout">

        {/* =====================================
            FORM
        ===================================== */}

        <main className="editProfileMain">

          <form
            onSubmit={
              handleSubmit
            }
          >

            {/* ABOUT */}

            <section className="editProfileCard">

              <div className="editProfileSectionHeader">

                <div className="editProfileSectionIcon">
                  👤
                </div>

                <div>
                  <h2>
                    About You
                  </h2>

                  <p>
                    Introduce yourself
                    to potential
                    clients.
                  </p>
                </div>

              </div>

              <div className="modernFormGroup">

                <label>
                  Professional Bio
                </label>

                <textarea
                  name="bio"
                  rows="6"
                  placeholder="Tell clients about yourself, the type of work you do and what makes you a good freelancer..."
                  value={
                    formData.bio
                  }
                  onChange={
                    handleChange
                  }
                />

                <div className="profileCharacterCount">
                  {
                    formData.bio
                      .length
                  }{" "}
                  characters
                </div>

              </div>

            </section>

            {/* SKILLS */}

            <section className="editProfileCard">

              <div className="editProfileSectionHeader">

                <div className="editProfileSectionIcon">
                  ⚡
                </div>

                <div>
                  <h2>
                    Skills
                  </h2>

                  <p>
                    Add technologies
                    and professional
                    skills.
                  </p>
                </div>

              </div>

              <div className="modernFormGroup">

                <label>
                  Your Skills
                </label>

                <input
                  type="text"
                  name="skills"
                  placeholder="React, Node.js, JavaScript, MongoDB, AWS"
                  value={
                    formData.skills
                  }
                  onChange={
                    handleChange
                  }
                />

                <small>
                  Separate each skill
                  with a comma.
                </small>

              </div>

              {skills.length >
                0 && (
                <div className="editProfileSkillPreview">

                  <span className="skillPreviewTitle">
                    Preview
                  </span>

                  <div className="profileSkillGrid">

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

            </section>

            {/* EXPERIENCE */}

            <section className="editProfileCard">

              <div className="editProfileSectionHeader">

                <div className="editProfileSectionIcon">
                  💼
                </div>

                <div>
                  <h2>
                    Experience
                  </h2>

                  <p>
                    Highlight your
                    professional
                    background.
                  </p>
                </div>

              </div>

              <div className="modernFormGroup">

                <label>
                  Work Experience
                </label>

                <textarea
                  name="experience"
                  rows="6"
                  placeholder="Describe your professional experience, major projects, responsibilities and achievements..."
                  value={
                    formData.experience
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

            </section>

            {/* RATE + PORTFOLIO */}

            <section className="editProfileCard">

              <div className="editProfileSectionHeader">

                <div className="editProfileSectionIcon">
                  🔗
                </div>

                <div>
                  <h2>
                    Professional Details
                  </h2>

                  <p>
                    Set your rate and
                    portfolio link.
                  </p>
                </div>

              </div>

              <div className="editProfileFormGrid">

                <div className="modernFormGroup">

                  <label>
                    Hourly Rate (£)
                  </label>

                  <div className="proposalInputWithIcon">

                    <span>
                      £
                    </span>

                    <input
                      type="number"
                      name="hourlyRate"
                      min="0"
                      placeholder="e.g. 25"
                      value={
                        formData.hourlyRate
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  <small>
                    Your preferred
                    hourly rate.
                  </small>

                </div>

                <div className="modernFormGroup">

                  <label>
                    Portfolio URL
                  </label>

                  <input
                    type="url"
                    name="portfolio"
                    placeholder="https://yourportfolio.com"
                    value={
                      formData.portfolio
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <small>
                    Add GitHub,
                    portfolio or
                    personal website.
                  </small>

                </div>

              </div>

            </section>

            {/* SAVE */}

            <div className="editProfileActions">

              <button
                type="button"
                className="proposalCancelButton"
                onClick={() =>
                  navigate(
                    "/freelancer-dashboard"
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

        </main>

        {/* =====================================
            RIGHT SIDEBAR
        ===================================== */}

        <aside className="editProfileSidebar">

          {/* PROFILE STRENGTH */}

          <section className="profileStrengthCard">

            <div className="profileStrengthIcon">
              ✨
            </div>

            <h3>
              Profile Strength
            </h3>

            <p>
              A detailed profile helps
              clients understand your
              experience before
              inviting you.
            </p>

            <div className="profileChecklist">

              <div
                className={
                  formData.bio
                    ? "complete"
                    : ""
                }
              >
                <span>
                  {formData.bio
                    ? "✓"
                    : "○"}
                </span>

                Bio added
              </div>

              <div
                className={
                  formData.skills
                    ? "complete"
                    : ""
                }
              >
                <span>
                  {formData.skills
                    ? "✓"
                    : "○"}
                </span>

                Skills added
              </div>

              <div
                className={
                  formData.experience
                    ? "complete"
                    : ""
                }
              >
                <span>
                  {formData.experience
                    ? "✓"
                    : "○"}
                </span>

                Experience added
              </div>

              <div
                className={
                  formData.hourlyRate
                    ? "complete"
                    : ""
                }
              >
                <span>
                  {formData.hourlyRate
                    ? "✓"
                    : "○"}
                </span>

                Rate added
              </div>

              <div
                className={
                  formData.portfolio
                    ? "complete"
                    : ""
                }
              >
                <span>
                  {formData.portfolio
                    ? "✓"
                    : "○"}
                </span>

                Portfolio added
              </div>

            </div>

          </section>

          {/* RATING */}

          <section className="profileRatingSummaryCard">

            <div className="profileRatingSummaryTop">

              <div>
                <span>
                  Client Rating
                </span>

                <strong>
                  {reviewData.totalReviews >
                  0
                    ? averageRating.toFixed(
                        1
                      )
                    : "New"}
                </strong>
              </div>

              <div className="profileRatingStars">
                {reviewData.totalReviews >
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

            </div>

            <p>
              Based on{" "}
              {
                reviewData.totalReviews
              }{" "}
              client review
              {
                reviewData.totalReviews ===
                  1
                  ? ""
                  : "s"
              }.
            </p>

          </section>

          {/* RECENT REVIEWS */}

          <section className="editProfileReviewsCard">

            <div className="editProfileReviewsHeader">

              <h3>
                Recent Reviews
              </h3>

              <span>
                {
                  reviewData.totalReviews
                }
              </span>

            </div>

            {reviewData.reviews.length ===
              0 ? (
              <div className="editProfileNoReviews">

                <span>
                  ☆
                </span>

                <p>
                  No reviews yet.
                </p>

              </div>
            ) : (
              <div className="editProfileReviewList">

                {reviewData.reviews
                  .slice(
                    0,
                    3
                  )
                  .map(
                    (review) => (
                      <div
                        className="editProfileReviewItem"
                        key={
                          review._id
                        }
                      >

                        <div>

                          <span>
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

          </section>

        </aside>

      </div>

    </div>
  );
}

export default EditProfile;