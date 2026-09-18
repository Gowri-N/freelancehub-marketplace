import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

function FindProjects() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");

  const [projects, setProjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    skillFilter,
    setSkillFilter,
  ] = useState("");

  const [
    budgetFilter,
    setBudgetFilter,
  ] = useState("all");

  const [
    sortOrder,
    setSortOrder,
  ] = useState("newest");

  useEffect(() => {
    const loadProjects =
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
                "Unable to load projects."
            );

            return;
          }

          if (Array.isArray(data)) {
            const openProjects =
              data.filter(
                (project) =>
                  project.status ===
                  "open"
              );

            setProjects(
              openProjects
            );
          }
        } catch (error) {
          console.error(
            "Find projects error:",
            error
          );

          setError(
            "Unable to connect to server."
          );
        } finally {
          setLoading(false);
        }
      };

    loadProjects();
  }, [token]);

  const availableSkills =
    useMemo(() => {
      const allSkills =
        projects.flatMap(
          (project) =>
            String(
              project.skills || ""
            )
              .split(",")
              .map((skill) =>
                skill.trim()
              )
              .filter(Boolean)
        );

      return [
        ...new Set(allSkills),
      ].sort();
    }, [projects]);

  const filteredProjects =
    useMemo(() => {
      let result =
        [...projects];

      if (searchTerm.trim()) {
        const search =
          searchTerm
            .trim()
            .toLowerCase();

        result =
          result.filter(
            (project) =>
              String(
                project.title || ""
              )
                .toLowerCase()
                .includes(search) ||
              String(
                project.description ||
                  ""
              )
                .toLowerCase()
                .includes(search) ||
              String(
                project.skills || ""
              )
                .toLowerCase()
                .includes(search) ||
              String(
                project.clientName ||
                  ""
              )
                .toLowerCase()
                .includes(search)
          );
      }

      if (skillFilter) {
        result =
          result.filter(
            (project) =>
              String(
                project.skills || ""
              )
                .toLowerCase()
                .includes(
                  skillFilter.toLowerCase()
                )
          );
      }

      if (
        budgetFilter !== "all"
      ) {
        result =
          result.filter(
            (project) => {
              const budget =
                Number(
                  project.budget
                );

              if (
                budgetFilter ===
                "under250"
              ) {
                return budget < 250;
              }

              if (
                budgetFilter ===
                "250to500"
              ) {
                return (
                  budget >= 250 &&
                  budget <= 500
                );
              }

              if (
                budgetFilter ===
                "500to1000"
              ) {
                return (
                  budget > 500 &&
                  budget <= 1000
                );
              }

              if (
                budgetFilter ===
                "above1000"
              ) {
                return (
                  budget > 1000
                );
              }

              return true;
            }
          );
      }

      result.sort((a, b) => {
        if (
          sortOrder === "oldest"
        ) {
          return (
            new Date(
              a.createdAt
            ) -
            new Date(
              b.createdAt
            )
          );
        }

        if (
          sortOrder === "budgetHigh"
        ) {
          return (
            Number(
              b.budget
            ) -
            Number(
              a.budget
            )
          );
        }

        if (
          sortOrder === "budgetLow"
        ) {
          return (
            Number(
              a.budget
            ) -
            Number(
              b.budget
            )
          );
        }

        return (
          new Date(
            b.createdAt
          ) -
          new Date(
            a.createdAt
          )
        );
      });

      return result;
    }, [
      projects,
      searchTerm,
      skillFilter,
      budgetFilter,
      sortOrder,
    ]);

  const clearFilters = () => {
    setSearchTerm("");
    setSkillFilter("");
    setBudgetFilter("all");
    setSortOrder("newest");
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

  const getSkillArray = (
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

  return (
    <div className="marketplacePage">

      <div className="marketplacePageHeader">

        <div>
          <span className="pageEyebrow">
            FreelanceHub Marketplace
          </span>

          <h1>
            Find Your Next
            Project
          </h1>

          <p>
            Browse open projects,
            discover work that
            matches your skills and
            send your proposal.
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

      <section className="projectSearchHero">

        <div className="projectSearchHeroContent">

          <span>
            🚀 New opportunities
            are waiting
          </span>

          <h2>
            Work on projects
            that match your
            talent.
          </h2>

          <p>
            Search by project
            title, technology,
            skill or client and
            find the right
            opportunity for you.
          </p>

        </div>

        <div className="projectSearchHeroImage">
          <img
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=90"
            alt="Freelancer working with a team"
          />
        </div>

      </section>

      <section className="modernFilterPanel">

        <div className="filterSearchBox">

          <span>
            🔍
          </span>

          <input
            type="text"
            placeholder="Search projects, skills or clients..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

        </div>

        <select
          value={skillFilter}
          onChange={(event) =>
            setSkillFilter(
              event.target.value
            )
          }
        >
          <option value="">
            All Skills
          </option>

          {availableSkills.map(
            (skill) => (
              <option
                key={skill}
                value={skill}
              >
                {skill}
              </option>
            )
          )}
        </select>

        <select
          value={budgetFilter}
          onChange={(event) =>
            setBudgetFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Budgets
          </option>

          <option value="under250">
            Under £250
          </option>

          <option value="250to500">
            £250 - £500
          </option>

          <option value="500to1000">
            £500 - £1,000
          </option>

          <option value="above1000">
            Above £1,000
          </option>
        </select>

        <select
          value={sortOrder}
          onChange={(event) =>
            setSortOrder(
              event.target.value
            )
          }
        >
          <option value="newest">
            Newest First
          </option>

          <option value="oldest">
            Oldest First
          </option>

          <option value="budgetHigh">
            Budget: High to Low
          </option>

          <option value="budgetLow">
            Budget: Low to High
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

      <div className="resultsHeader">

        <div>
          <h2>
            Available Projects
          </h2>

          <p>
            {
              filteredProjects.length
            }{" "}
            project
            {
              filteredProjects.length ===
              1
                ? ""
                : "s"
            }{" "}
            found
          </p>
        </div>

      </div>

      {error && (
        <div className="errorMessage">
          {error}
        </div>
      )}

      {loading ? (
        <div className="marketplaceEmptyState">
          <div className="emptyStateIcon">
            ⏳
          </div>

          <h3>
            Loading projects...
          </h3>
        </div>
      ) : filteredProjects.length ===
        0 ? (
        <div className="marketplaceEmptyState">

          <div className="emptyStateIcon">
            🔍
          </div>

          <h3>
            No projects found
          </h3>

          <p>
            Try changing your
            search or filters.
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
        <div className="modernProjectGrid">

          {filteredProjects.map(
            (project) => {
              const skills =
                getSkillArray(
                  project.skills
                );

              return (
                <article
                  className="modernProjectCard"
                  key={
                    project._id
                  }
                >

                  <div className="projectCardTop">

                    <div className="projectCardIcon">
                      💻
                    </div>

                    <div className="projectCardStatus">
                      Open
                    </div>

                  </div>

                  <div className="projectClientRow">

                    <span>
                      Posted by
                    </span>

                    <strong>
                      {
                        project.clientName
                      }
                    </strong>

                  </div>

                  <h3>
                    {project.title}
                  </h3>

                  <p className="projectDescription">
                    {
                      project.description
                    }
                  </p>

                  <div className="projectSkillTags">

                    {skills
                      .slice(0, 4)
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
                      4 && (
                      <span>
                        +
                        {
                          skills.length -
                          4
                        }
                      </span>
                    )}

                  </div>

                  <div className="projectDetailsGrid">

                    <div>

                      <span className="projectDetailLabel">
                        Budget
                      </span>

                      <strong>
                        £
                        {
                          project.budget
                        }
                      </strong>

                    </div>

                    <div>

                      <span className="projectDetailLabel">
                        Deadline
                      </span>

                      <strong>
                        {formatDate(
                          project.deadline
                        )}
                      </strong>

                    </div>

                  </div>

                  <div className="projectCardFooter">

                    <span className="projectPostedDate">
                      Posted{" "}
                      {formatDate(
                        project.createdAt
                      )}
                    </span>

                    <button
                      onClick={() =>
                        navigate(
                          `/apply/${project._id}`
                        )
                      }
                    >
                      View & Apply →
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

export default FindProjects;