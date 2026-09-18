import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

function SavedFreelancers() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");

  const [
    favourites,
    setFavourites,
  ] = useState([]);

  const [
    ratings,
    setRatings,
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
    removingId,
    setRemovingId,
  ] = useState(null);

  // =====================================
  // LOAD SAVED
  // =====================================

  const loadSaved =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "https://freelancehub-marketplace.onrender.com/api/favourites",
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
              "Unable to load saved freelancers."
          );

          return;
        }

        const savedList =
          Array.isArray(data)
            ? data
            : [];

        setFavourites(
          savedList
        );

        const ratingResults =
          {};

        await Promise.all(
          savedList.map(
            async (
              favourite
            ) => {
              const freelancer =
                favourite.freelancerId;

              const freelancerId =
                freelancer?._id ||
                freelancer;

              if (
                !freelancerId
              ) {
                return;
              }

              try {
                const response =
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
                  response.ok
                ) {
                  const data =
                    await response.json();

                  ratingResults[
                    freelancerId
                  ] = data;
                }
              } catch (error) {
                console.error(
                  "Rating error:",
                  error
                );
              }
            }
          )
        );

        setRatings(
          ratingResults
        );
      } catch (error) {
        console.error(
          "Saved freelancers error:",
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
    loadSaved();
  }, []);

  // =====================================
  // REMOVE
  // =====================================

  const removeFavourite =
    async (
      freelancerId
    ) => {
      try {
        setRemovingId(
          freelancerId
        );

        setError("");

        const response =
          await fetch(
            `https://freelancehub-marketplace.onrender.com/api/favourites/${freelancerId}`,
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
              "Unable to remove freelancer."
          );

          return;
        }

        setFavourites(
          (previous) =>
            previous.filter(
              (
                favourite
              ) => {
                const id =
                  favourite
                    .freelancerId
                    ?._id ||
                  favourite
                    .freelancerId;

                return (
                  id !==
                  freelancerId
                );
              }
            )
        );
      } catch (error) {
        console.error(
          "Remove favourite error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setRemovingId(
          null
        );
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

  return (
    <div className="savedTalentPage">

      {/* HEADER */}

      <div className="talentPageHeader">

        <div>
          <span className="pageEyebrow">
            Saved Talent
          </span>

          <h1>
            Saved Freelancers
          </h1>

          <p>
            Keep your favourite
            freelancer profiles in
            one place and return to
            them when you have the
            right project.
          </p>
        </div>

        <div className="talentHeaderActions">

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
            🔍 Find Freelancers
          </button>

        </div>

      </div>

      {/* HERO */}

      <section className="savedTalentHero">

        <div className="savedTalentHeroContent">

          <span>
            ♥ Your shortlist
          </span>

          <h2>
            Great talent,
            ready when you are.
          </h2>

          <p>
            Review the freelancers
            you saved earlier and
            invite them whenever a
            suitable project is open.
          </p>

          <div className="savedTalentCount">

            <strong>
              {
                favourites.length
              }
            </strong>

            <span>
              saved freelancer
              {
                favourites.length ===
                1
                  ? ""
                  : "s"
              }
            </span>

          </div>

        </div>

        <div className="savedTalentHeroImage">

          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=90"
            alt="Professional team collaboration"
          />

        </div>

      </section>

      {error && (
        <div className="errorMessage">
          {error}
        </div>
      )}

      <div className="resultsHeader">

        <div>
          <h2>
            Your Shortlist
          </h2>

          <p>
            {
              favourites.length
            }{" "}
            saved freelancer
            {
              favourites.length ===
                1
                ? ""
                : "s"
            }
          </p>
        </div>

      </div>

      {loading ? (
        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            ⏳
          </div>

          <h3>
            Loading saved freelancers...
          </h3>

        </div>
      ) : favourites.length ===
        0 ? (
        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            ♡
          </div>

          <h3>
            No saved freelancers
          </h3>

          <p>
            Browse the marketplace
            and save freelancers you
            may want to work with.
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
        <div className="talentGrid">

          {favourites.map(
            (favourite) => {
              const freelancer =
                favourite.freelancerId;

              if (
                !freelancer ||
                typeof freelancer ===
                  "string"
              ) {
                return null;
              }

              const skills =
                getSkills(
                  freelancer.skills
                );

              const reviewData =
                ratings[
                  freelancer._id
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

              return (
                <article
                  className="talentCard savedTalentCard"
                  key={
                    favourite._id
                  }
                >

                  <div className="talentCardTop">

                    <div className="talentAvatar">
                      {getInitials(
                        freelancer.name
                      )}
                    </div>

                    <button
                      className="talentSaveButton saved"
                      disabled={
                        removingId ===
                        freelancer._id
                      }
                      onClick={() =>
                        removeFavourite(
                          freelancer._id
                        )
                      }
                    >
                      ♥
                    </button>

                  </div>

                  <div className="talentIdentity">

                    <h3>
                      {
                        freelancer.name
                      }
                    </h3>

                    <p>
                      {
                        freelancer.email
                      }
                    </p>

                  </div>

                  <div className="talentRatingRow">

                    <span className="talentRatingStars">
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
                    </span>

                    <strong>
                      {totalReviews >
                      0
                        ? averageRating.toFixed(
                            1
                          )
                        : "New"}
                    </strong>

                    <small>
                      (
                      {
                        totalReviews
                      }
                      )
                    </small>

                  </div>

                  <p className="talentBio">
                    {
                      freelancer.bio ||
                      "This freelancer has not added a bio yet."
                    }
                  </p>

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

                  <div className="talentMetaGrid">

                    <div>
                      <span>
                        Experience
                      </span>

                      <strong>
                        {
                          freelancer.experience ||
                          "Not specified"
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Hourly Rate
                      </span>

                      <strong>
                        {freelancer.hourlyRate
                          ? `£${freelancer.hourlyRate}/hr`
                          : "Not set"}
                      </strong>
                    </div>

                  </div>

                  <div className="talentCardActions">

                    <button
                      className="removeSavedTalentButton"
                      disabled={
                        removingId ===
                        freelancer._id
                      }
                      onClick={() =>
                        removeFavourite(
                          freelancer._id
                        )
                      }
                    >
                      {removingId ===
                      freelancer._id
                        ? "Removing..."
                        : "♥ Remove"}
                    </button>

                    <button
                      onClick={() =>
                        navigate(
                          `/freelancer/${freelancer._id}`
                        )
                      }
                    >
                      View Profile →
                    </button>

                  </div>

                </article>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}

export default SavedFreelancers;