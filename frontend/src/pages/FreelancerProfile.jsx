import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

function FreelancerProfile() {
  const navigate = useNavigate();

  const {
    freelancerId,
  } = useParams();

  const token =
    localStorage.getItem("token");

  const [
    freelancer,
    setFreelancer,
  ] = useState(null);

  const [
    reviewData,
    setReviewData,
  ] = useState({
    reviews: [],
    totalReviews: 0,
    averageRating: 0,
  });

  const [
    projects,
    setProjects,
  ] = useState([]);

  const [
    selectedProject,
    setSelectedProject,
  ] = useState("");

  const [
    inviteMessage,
    setInviteMessage,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    sending,
    setSending,
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

          const profileResponse =
            await fetch(
              `https://freelancehub-marketplace.onrender.com/api/auth/freelancers/${freelancerId}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const profileData =
            await profileResponse.json();

          if (
            !profileResponse.ok
          ) {
            setError(
              profileData.message ||
                "Unable to load freelancer."
            );

            return;
          }

          setFreelancer(
            profileData
          );

          // REVIEWS
          try {
            const reviewResponse =
              await fetch(
                `https://freelancehub-marketplace.onrender.com/api/reviews/freelancer/${freelancerId}`,
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
              const data =
                await reviewResponse.json();

              setReviewData({
                reviews:
                  data.reviews ||
                  [],

                totalReviews:
                  data.totalReviews ||
                  0,

                averageRating:
                  data.averageRating ||
                  0,
              });
            }
          } catch (error) {
            console.error(
              "Review load error:",
              error
            );
          }

          // OPEN PROJECTS
          try {
            const projectResponse =
              await fetch(
                "https://freelancehub-marketplace.onrender.com/api/projects",
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              );

            const projectData =
              await projectResponse.json();

            if (
              projectResponse.ok
            ) {
              const user =
                JSON.parse(
                  localStorage.getItem(
                    "user"
                  ) || "{}"
                );

              const userId =
                user._id ||
                user.id;

              const openProjects =
                (
                  Array.isArray(
                    projectData
                  )
                    ? projectData
                    : []
                ).filter(
                  (project) =>
                    project.status ===
                      "open" &&
                    project.clientId ===
                      userId
                );

              setProjects(
                openProjects
              );
            }
          } catch (error) {
            console.error(
              "Project load error:",
              error
            );
          }
        } catch (error) {
          console.error(
            "Profile error:",
            error
          );

          setError(
            "Unable to connect to server."
          );
        } finally {
          setLoading(false);
        }
      };

    loadProfile();
  }, [
    freelancerId,
    token,
  ]);

  // =====================================
  // SEND INVITATION
  // =====================================

  const handleInvite =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (
        !selectedProject
      ) {
        setError(
          "Please select a project."
        );

        return;
      }

      try {
        setSending(true);

        const response =
          await fetch(
            "https://freelancehub-marketplace.onrender.com/api/invitations",
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
                  projectId:
                    selectedProject,

                  freelancerId,

                  message:
                    inviteMessage.trim(),
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to send invitation."
          );

          return;
        }

        setSuccess(
          "Invitation sent successfully."
        );

        setSelectedProject("");
        setInviteMessage("");

        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } catch (error) {
        console.error(
          "Invitation error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setSending(false);
      }
    };

  // =====================================
  // HELPERS
  // =====================================

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

  if (loading) {
    return (
      <div className="freelancerProfilePage">

        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            ⏳
          </div>

          <h3>
            Loading freelancer profile...
          </h3>

        </div>

      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="freelancerProfilePage">

        <button
          className="pageBackButton"
          onClick={() =>
            navigate(
              "/find-freelancers"
            )
          }
        >
          ← Find Freelancers
        </button>

        <div className="errorMessage">
          {error ||
            "Freelancer not found."}
        </div>

      </div>
    );
  }

  const skills =
    getSkills(
      freelancer.skills
    );

  const averageRating =
    Number(
      reviewData.averageRating ||
        0
    );

  return (
    <div className="freelancerProfilePage">

      {/* HEADER */}

      <div className="freelancerProfilePageHeader">

        <button
          className="pageBackButton"
          onClick={() =>
            navigate(
              "/find-freelancers"
            )
          }
        >
          ← Find Freelancers
        </button>

      </div>

      {/* PROFILE HERO */}

      <section className="freelancerProfileHero">

        <div className="profileHeroPattern"></div>

        <div className="freelancerProfileHeroInner">

          <div className="profileHeroAvatar">
            {getInitials(
              freelancer.name
            )}
          </div>

          <div className="profileHeroIdentity">

            <span>
              Freelancer Profile
            </span>

            <h1>
              {
                freelancer.name
              }
            </h1>

            <p>
              {
                freelancer.email
              }
            </p>

            <div className="profileHeroBadges">

              <span>
                ★{" "}
                {reviewData.totalReviews >
                0
                  ? averageRating.toFixed(
                      1
                    )
                  : "New"}
              </span>

              <span>
                {
                  reviewData.totalReviews
                }{" "}
                Review
                {
                  reviewData.totalReviews ===
                    1
                    ? ""
                    : "s"
                }
              </span>

              {freelancer.hourlyRate && (
                <span>
                  £
                  {
                    freelancer.hourlyRate
                  }
                  /hr
                </span>
              )}

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

      <div className="freelancerProfileLayout">

        {/* LEFT */}

        <div className="freelancerProfileMain">

          <section className="profileContentCard">

            <div className="profileSectionTitle">

              <div>
                👤
              </div>

              <div>
                <h2>
                  About
                </h2>

                <p>
                  Freelancer overview
                </p>
              </div>

            </div>

            <p className="profileAboutText">
              {
                freelancer.bio ||
                "This freelancer has not added a bio yet."
              }
            </p>

          </section>

          <section className="profileContentCard">

            <div className="profileSectionTitle">

              <div>
                ⚡
              </div>

              <div>
                <h2>
                  Skills
                </h2>

                <p>
                  Professional skills
                  and technologies
                </p>
              </div>

            </div>

            {skills.length >
            0 ? (
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
            ) : (
              <p className="profileEmptyText">
                No skills added yet.
              </p>
            )}

          </section>

          <section className="profileContentCard">

            <div className="profileSectionTitle">

              <div>
                💼
              </div>

              <div>
                <h2>
                  Experience
                </h2>

                <p>
                  Professional
                  background
                </p>
              </div>

            </div>

            <p className="profileAboutText">
              {
                freelancer.experience ||
                "Experience information has not been provided."
              }
            </p>

          </section>

          {freelancer.portfolio && (
            <section className="profileContentCard">

              <div className="profileSectionTitle">

                <div>
                  🔗
                </div>

                <div>
                  <h2>
                    Portfolio
                  </h2>

                  <p>
                    View previous work
                  </p>
                </div>

              </div>

              <a
                className="profilePortfolioButton"
                href={
                  freelancer.portfolio
                }
                target="_blank"
                rel="noreferrer"
              >
                Open Portfolio ↗
              </a>

            </section>
          )}

          {/* REVIEWS */}

          <section className="profileContentCard">

            <div className="profileReviewsHeading">

              <div className="profileSectionTitle">

                <div>
                  ⭐
                </div>

                <div>
                  <h2>
                    Client Reviews
                  </h2>

                  <p>
                    Feedback from
                    completed projects
                  </p>
                </div>

              </div>

              <div className="profileOverallRating">

                <strong>
                  {reviewData.totalReviews >
                  0
                    ? averageRating.toFixed(
                        1
                      )
                    : "New"}
                </strong>

                <span>
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
                </span>

              </div>

            </div>

            {reviewData.reviews.length ===
              0 ? (
              <div className="profileNoReviews">

                <span>
                  ☆
                </span>

                <p>
                  No reviews yet.
                </p>

              </div>
            ) : (
              <div className="profileReviewList">

                {reviewData.reviews.map(
                  (review) => (
                    <div
                      className="profileReviewCard"
                      key={
                        review._id
                      }
                    >

                      <div className="profileReviewTop">

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

        </div>

        {/* RIGHT */}

        <aside className="profileInviteSidebar">

          <div className="profileHireCard">

            <div className="profileHireIcon">
              ✉️
            </div>

            <h2>
              Work with{" "}
              {
                freelancer.name
                  .split(" ")[0]
              }
            </h2>

            <p>
              Select one of your open
              projects and send a
              direct invitation.
            </p>

            {projects.length ===
            0 ? (
              <div className="profileNoProject">

                <span>
                  📁
                </span>

                <strong>
                  No open projects
                </strong>

                <p>
                  Create a project
                  before inviting this
                  freelancer.
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
              <form
                onSubmit={
                  handleInvite
                }
              >

                <div className="modernFormGroup">

                  <label>
                    Select Project
                  </label>

                  <select
                    value={
                      selectedProject
                    }
                    onChange={(event) =>
                      setSelectedProject(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Choose a project
                    </option>

                    {projects.map(
                      (project) => (
                        <option
                          key={
                            project._id
                          }
                          value={
                            project._id
                          }
                        >
                          {
                            project.title
                          }{" "}
                          - £
                          {
                            project.budget
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div className="modernFormGroup">

                  <label>
                    Invitation Message
                  </label>

                  <textarea
                    rows="5"
                    placeholder="Tell the freelancer why you think they would be a good fit..."
                    value={
                      inviteMessage
                    }
                    onChange={(event) =>
                      setInviteMessage(
                        event.target.value
                      )
                    }
                  />

                </div>

                <button
                  className="profileInviteButton"
                  type="submit"
                  disabled={
                    sending
                  }
                >
                  {sending
                    ? "Sending..."
                    : "Send Invitation →"}
                </button>

              </form>
            )}

          </div>

          <div className="profileQuickInfo">

            <h3>
              Quick Details
            </h3>

            <div>

              <span>
                Hourly Rate
              </span>

              <strong>
                {freelancer.hourlyRate
                  ? `£${freelancer.hourlyRate}/hr`
                  : "Not specified"}
              </strong>

            </div>

            <div>

              <span>
                Reviews
              </span>

              <strong>
                {
                  reviewData.totalReviews
                }
              </strong>

            </div>

            <div>

              <span>
                Rating
              </span>

              <strong>
                {reviewData.totalReviews >
                0
                  ? `${averageRating.toFixed(
                      1
                    )}/5`
                  : "New"}
              </strong>

            </div>

          </div>

        </aside>

      </div>

    </div>
  );
}

export default FreelancerProfile;