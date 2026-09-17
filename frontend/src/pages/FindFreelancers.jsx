import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

function FindFreelancers() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");

  const [
    freelancers,
    setFreelancers,
  ] = useState([]);

  const [
    ratings,
    setRatings,
  ] = useState({});

  const [
    savedIds,
    setSavedIds,
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
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    skillFilter,
    setSkillFilter,
  ] = useState("all");

  const [
    minRating,
    setMinRating,
  ] = useState("all");

  const [
    maxRate,
    setMaxRate,
  ] = useState("");

  const [
    sortOrder,
    setSortOrder,
  ] = useState("ratingHigh");

  const [
    savingId,
    setSavingId,
  ] = useState(null);

  // =====================================
  // LOAD DATA
  // =====================================

  useEffect(() => {
    const loadData =
      async () => {
        try {
          setLoading(true);
          setError("");

          const freelancerResponse =
            await fetch(
              "http://localhost:5000/api/auth/freelancers",
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const freelancerData =
            await freelancerResponse.json();

          if (
            !freelancerResponse.ok
          ) {
            setError(
              freelancerData.message ||
                "Unable to load freelancers."
            );

            return;
          }

          const freelancerList =
            Array.isArray(
              freelancerData
            )
              ? freelancerData
              : [];

          setFreelancers(
            freelancerList
          );

          // LOAD RATINGS
          const ratingResults = {};

          await Promise.all(
            freelancerList.map(
              async (
                freelancer
              ) => {
                try {
                  const response =
                    await fetch(
                      `http://localhost:5000/api/reviews/freelancer/${freelancer._id}`,
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
                      freelancer._id
                    ] = data;
                  }
                } catch (error) {
                  console.error(
                    "Rating load error:",
                    error
                  );
                }
              }
            )
          );

          setRatings(
            ratingResults
          );

          // LOAD SAVED
          try {
            const savedResponse =
              await fetch(
                "http://localhost:5000/api/favourites",
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              );

            const savedData =
              await savedResponse.json();

            if (
              savedResponse.ok
            ) {
              const ids =
                (
                  Array.isArray(
                    savedData
                  )
                    ? savedData
                    : []
                ).map(
                  (
                    favourite
                  ) =>
                    favourite
                      .freelancerId
                      ?._id ||
                    favourite
                      .freelancerId
                );

              setSavedIds(ids);
            }
          } catch (error) {
            console.error(
              "Saved freelancers error:",
              error
            );
          }
        } catch (error) {
          console.error(
            "Freelancer load error:",
            error
          );

          setError(
            "Unable to connect to server."
          );
        } finally {
          setLoading(false);
        }
      };

    loadData();
  }, [token]);

  // =====================================
  // FILTER OPTIONS
  // =====================================

  const skillOptions =
    useMemo(() => {
      const skills =
        new Set();

      freelancers.forEach(
        (freelancer) => {
          String(
            freelancer.skills || ""
          )
            .split(",")
            .map((skill) =>
              skill.trim()
            )
            .filter(Boolean)
            .forEach((skill) =>
              skills.add(skill)
            );
        }
      );

      return Array.from(
        skills
      ).sort();
    }, [freelancers]);

  // =====================================
  // FILTER + SORT
  // =====================================

  const filteredFreelancers =
    useMemo(() => {
      let result =
        [...freelancers];

      if (
        searchTerm.trim()
      ) {
        const search =
          searchTerm
            .toLowerCase()
            .trim();

        result =
          result.filter(
            (freelancer) =>
              String(
                freelancer.name || ""
              )
                .toLowerCase()
                .includes(search) ||
              String(
                freelancer.skills || ""
              )
                .toLowerCase()
                .includes(search) ||
              String(
                freelancer.bio || ""
              )
                .toLowerCase()
                .includes(search)
          );
      }

      if (
        skillFilter !== "all"
      ) {
        result =
          result.filter(
            (freelancer) =>
              String(
                freelancer.skills || ""
              )
                .toLowerCase()
                .includes(
                  skillFilter.toLowerCase()
                )
          );
      }

      if (
        minRating !== "all"
      ) {
        result =
          result.filter(
            (freelancer) =>
              Number(
                ratings[
                  freelancer._id
                ]
                  ?.averageRating ||
                  0
              ) >=
              Number(
                minRating
              )
          );
      }

      if (
        maxRate
      ) {
        result =
          result.filter(
            (freelancer) =>
              Number(
                freelancer.hourlyRate ||
                  0
              ) <=
              Number(
                maxRate
              )
          );
      }

      result.sort(
        (a, b) => {
          if (
            sortOrder ===
            "name"
          ) {
            return String(
              a.name || ""
            ).localeCompare(
              String(
                b.name || ""
              )
            );
          }

          if (
            sortOrder ===
            "rateLow"
          ) {
            return (
              Number(
                a.hourlyRate ||
                  0
              ) -
              Number(
                b.hourlyRate ||
                  0
              )
            );
          }

          if (
            sortOrder ===
            "rateHigh"
          ) {
            return (
              Number(
                b.hourlyRate ||
                  0
              ) -
              Number(
                a.hourlyRate ||
                  0
              )
            );
          }

          return (
            Number(
              ratings[b._id]
                ?.averageRating ||
                0
            ) -
            Number(
              ratings[a._id]
                ?.averageRating ||
                0
            )
          );
        }
      );

      return result;
    }, [
      freelancers,
      ratings,
      searchTerm,
      skillFilter,
      minRating,
      maxRate,
      sortOrder,
    ]);

  // =====================================
  // SAVE / UNSAVE
  // =====================================

  const toggleSave =
    async (
      freelancerId
    ) => {
      try {
        setSavingId(
          freelancerId
        );

        setError("");

        const isSaved =
          savedIds.includes(
            freelancerId
          );

        const response =
          await fetch(
            isSaved
              ? `http://localhost:5000/api/favourites/${freelancerId}`
              : "http://localhost:5000/api/favourites",
            {
              method:
                isSaved
                  ? "DELETE"
                  : "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                isSaved
                  ? undefined
                  : JSON.stringify({
                      freelancerId,
                    }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to update saved freelancer."
          );

          return;
        }

        if (isSaved) {
          setSavedIds(
            (previous) =>
              previous.filter(
                (id) =>
                  id !==
                  freelancerId
              )
          );
        } else {
          setSavedIds(
            (previous) => [
              ...previous,
              freelancerId,
            ]
          );
        }
      } catch (error) {
        console.error(
          "Favourite error:",
          error
        );

        setError(
          "Unable to connect to server."
        );
      } finally {
        setSavingId(
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

  const clearFilters = () => {
    setSearchTerm("");
    setSkillFilter("all");
    setMinRating("all");
    setMaxRate("");
    setSortOrder(
      "ratingHigh"
    );
  };

  return (
    <div className="talentMarketplacePage">

      {/* HEADER */}

      <div className="talentPageHeader">

        <div>
          <span className="pageEyebrow">
            Talent Marketplace
          </span>

          <h1>
            Find Freelancers
          </h1>

          <p>
            Discover skilled
            freelancers, compare
            their experience and
            reviews, and invite the
            right person to your
            project.
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
                "/saved-freelancers"
              )
            }
          >
            ♥ Saved Freelancers
          </button>

        </div>

      </div>

      {/* HERO */}

      <section className="talentHero">

        <div className="talentHeroContent">

          <span>
            👥 Discover top talent
          </span>

          <h2>
            Find the right skills
            for your next project.
          </h2>

          <p>
            Search through freelancer
            profiles, compare ratings
            and choose professionals
            who match your project
            requirements.
          </p>

          <div className="talentHeroStats">

            <div>
              <strong>
                {
                  freelancers.length
                }
              </strong>

              <span>
                Freelancers
              </span>
            </div>

            <div>
              <strong>
                {
                  savedIds.length
                }
              </strong>

              <span>
                Saved
              </span>
            </div>

          </div>

        </div>

        <div className="talentHeroImage">

          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=90"
            alt="Professional freelancers collaborating"
          />

        </div>

      </section>

      {/* FILTERS */}

      <section className="talentFilterPanel">

        <div className="talentSearchInput">

          <span>
            🔍
          </span>

          <input
            type="text"
            placeholder="Search by name, skill or profile..."
            value={
              searchTerm
            }
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

        </div>

        <select
          value={
            skillFilter
          }
          onChange={(event) =>
            setSkillFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Skills
          </option>

          {skillOptions.map(
            (skill) => (
              <option
                key={
                  skill
                }
                value={
                  skill
                }
              >
                {skill}
              </option>
            )
          )}

        </select>

        <select
          value={
            minRating
          }
          onChange={(event) =>
            setMinRating(
              event.target.value
            )
          }
        >
          <option value="all">
            Any Rating
          </option>

          <option value="4">
            4★ & Above
          </option>

          <option value="3">
            3★ & Above
          </option>

          <option value="2">
            2★ & Above
          </option>
        </select>

        <input
          type="number"
          min="1"
          placeholder="Max £/hr"
          value={
            maxRate
          }
          onChange={(event) =>
            setMaxRate(
              event.target.value
            )
          }
        />

        <select
          value={
            sortOrder
          }
          onChange={(event) =>
            setSortOrder(
              event.target.value
            )
          }
        >
          <option value="ratingHigh">
            Top Rated
          </option>

          <option value="name">
            Name A-Z
          </option>

          <option value="rateLow">
            Rate Low-High
          </option>

          <option value="rateHigh">
            Rate High-Low
          </option>
        </select>

        <button
          className="clearFilterButton"
          onClick={
            clearFilters
          }
        >
          Clear
        </button>

      </section>

      {error && (
        <div className="errorMessage">
          {error}
        </div>
      )}

      <div className="resultsHeader">

        <div>
          <h2>
            Available Talent
          </h2>

          <p>
            {
              filteredFreelancers.length
            }{" "}
            freelancer
            {
              filteredFreelancers.length ===
              1
                ? ""
                : "s"
            }{" "}
            found
          </p>
        </div>

      </div>

      {/* FREELANCERS */}

      {loading ? (
        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            ⏳
          </div>

          <h3>
            Loading freelancers...
          </h3>

        </div>
      ) : filteredFreelancers.length ===
        0 ? (
        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            👥
          </div>

          <h3>
            No freelancers found
          </h3>

          <p>
            Try changing your search
            or filters.
          </p>

          <button
            onClick={
              clearFilters
            }
          >
            Clear Filters
          </button>

        </div>
      ) : (
        <div className="talentGrid">

          {filteredFreelancers.map(
            (freelancer) => {
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

              const recentReviews =
                reviewData?.reviews ||
                [];

              const saved =
                savedIds.includes(
                  freelancer._id
                );

              return (
                <article
                  className="talentCard"
                  key={
                    freelancer._id
                  }
                >

                  <div className="talentCardTop">

                    <div className="talentAvatar">
                      {getInitials(
                        freelancer.name
                      )}
                    </div>

                    <button
                      className={
                        saved
                          ? "talentSaveButton saved"
                          : "talentSaveButton"
                      }
                      disabled={
                        savingId ===
                        freelancer._id
                      }
                      onClick={() =>
                        toggleSave(
                          freelancer._id
                        )
                      }
                    >
                      {saved
                        ? "♥"
                        : "♡"}
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
                      {totalReviews}
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

                    {skills.length >
                      5 && (
                      <span>
                        +
                        {
                          skills.length -
                          5
                        }
                      </span>
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

                  {recentReviews.length >
                    0 && (
                    <div className="talentRecentReview">

                      <div>
                        <span>
                          Recent Review
                        </span>

                        <strong>
                          {"★".repeat(
                            recentReviews[0]
                              .rating
                          )}
                        </strong>
                      </div>

                      <p>
                        {
                          recentReviews[0]
                            .review
                        }
                      </p>

                    </div>
                  )}

                  <div className="talentCardActions">

                    <button
                      className="talentSecondaryButton"
                      onClick={() =>
                        toggleSave(
                          freelancer._id
                        )
                      }
                    >
                      {saved
                        ? "♥ Saved"
                        : "♡ Save"}
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

export default FindFreelancers;