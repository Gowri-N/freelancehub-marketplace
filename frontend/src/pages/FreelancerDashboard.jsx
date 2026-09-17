import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

function FreelancerDashboard() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");

  const storedUser =
    localStorage.getItem("user");

  const [user, setUser] =
    useState(null);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    pendingInvitations,
    setPendingInvitations,
  ] = useState(0);

  useEffect(() => {
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser =
        JSON.parse(storedUser);

      setUser(parsedUser);
    } catch (error) {
      console.error(
        "Invalid user:",
        error
      );

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      navigate("/login");
    }
  }, [
    token,
    storedUser,
    navigate,
  ]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadCounts =
      async () => {
        try {
          const messageResponse =
            await fetch(
              "http://localhost:5000/api/messages/unread-count",
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const messageData =
            await messageResponse.json();

          if (messageResponse.ok) {
            setUnreadCount(
              Number(
                messageData.unreadCount ||
                  messageData.count ||
                  0
              )
            );
          }

          const invitationResponse =
            await fetch(
              "http://localhost:5000/api/invitations/my-invitations",
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const invitationData =
            await invitationResponse.json();

          if (
            invitationResponse.ok &&
            Array.isArray(
              invitationData
            )
          ) {
            const count =
              invitationData.filter(
                (invitation) =>
                  invitation.status ===
                    "pending" &&
                  invitation.projectId
                    ?.status ===
                    "open"
              ).length;

            setPendingInvitations(
              count
            );
          }
        } catch (error) {
          console.error(
            "Dashboard count error:",
            error
          );
        }
      };

    loadCounts();

    const interval =
      setInterval(
        loadCounts,
        5000
      );

    return () =>
      clearInterval(interval);
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const initial =
    user?.name
      ?.charAt(0)
      ?.toUpperCase() || "F";

  return (
    <div className="modernDashboard">

      <aside className="modernSidebar">

        <div className="sidebarLogo">

          <div className="sidebarLogoIcon">
            💼
          </div>

          <span>
            Freelance
            <strong>
              Hub
            </strong>
          </span>

        </div>

        <div className="sidebarProfile">

          <div className="sidebarAvatar">
            {initial}
          </div>

          <div>
            <strong>
              {user?.name ||
                "Freelancer"}
            </strong>

            <span>
              Freelancer
            </span>
          </div>

        </div>

        <nav className="sidebarNav">

          <button
            className="sidebarNavItem active"
            onClick={() =>
              navigate(
                "/freelancer-dashboard"
              )
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className="sidebarNavItem"
            onClick={() =>
              navigate(
                "/find-projects"
              )
            }
          >
            <span>⌕</span>
            Find Projects
          </button>

          <button
            className="sidebarNavItem"
            onClick={() =>
              navigate(
                "/my-applications"
              )
            }
          >
            <span>▤</span>
            My Applications
          </button>

          <button
            className="sidebarNavItem"
            onClick={() =>
              navigate(
                "/my-invitations"
              )
            }
          >
            <span>✉</span>

            My Invitations

            {pendingInvitations >
              0 && (
              <span className="sidebarBadge">
                {
                  pendingInvitations
                }
              </span>
            )}
          </button>

          <button
            className="sidebarNavItem"
            onClick={() =>
              navigate(
                "/messages"
              )
            }
          >
            <span>◫</span>

            Messages

            {unreadCount > 0 && (
              <span className="sidebarBadge">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            className="sidebarNavItem"
            onClick={() =>
              navigate(
                "/edit-profile"
              )
            }
          >
            <span>♙</span>
            My Profile
          </button>

        </nav>

        <div className="sidebarBottom">

          <button
            className="sidebarNavItem sidebarLogout"
            onClick={
              handleLogout
            }
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      <main className="modernDashboardMain">

        <div className="dashboardTopbar">

          <div>
            <h1>
              Welcome back,{" "}
              {user?.name ||
                "Freelancer"}{" "}
              👋
            </h1>

            <p>
              Find your next
              opportunity and keep
              track of your
              freelance work.
            </p>
          </div>

          <button
            className="dashboardPrimaryButton"
            onClick={() =>
              navigate(
                "/find-projects"
              )
            }
          >
            🔍 Find Projects
          </button>

        </div>

        <section className="dashboardHero freelancerDashboardHero">

          <div className="dashboardHeroContent">

            <span className="dashboardHeroBadge">
              🚀 Grow your freelance career
            </span>

            <h2>
              Find Opportunities
              <br />
              That Match Your{" "}
              <span className="heroHighlight">
                Skills.
              </span>
            </h2>

            <p>
              Browse projects, send
              proposals and build your
              freelance career by
              working with clients
              looking for your skills.
            </p>

            <div className="dashboardHeroButtons">

              <button
                onClick={() =>
                  navigate(
                    "/find-projects"
                  )
                }
              >
                Browse Projects
              </button>

              <button
                className="dashboardSecondaryButton"
                onClick={() =>
                  navigate(
                    "/edit-profile"
                  )
                }
              >
                Update Profile
              </button>

            </div>

          </div>

          <div className="dashboardImageArea">

            <div className="dashboardImageShape" />

            <img
              className="dashboardPersonImage"
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=90"
              alt="Freelancer working on laptop"
            />

            <div className="imageFloatingCard imageCardTop">

              <div className="floatingAvatar">
                📁
              </div>

              <div>
                <strong>
                  New Projects Daily
                </strong>

                <span>
                  Quality opportunities
                </span>
              </div>

            </div>

            <div className="imageFloatingCard imageCardBottom">

              <div className="successCircle">
                ★
              </div>

              <div>
                <strong>
                  Build Reputation
                </strong>

                <span>
                  Grow with reviews
                </span>
              </div>

            </div>

          </div>

        </section>

        <section className="dashboardStatsGrid">

          <div className="dashboardStatCard">

            <div className="dashboardStatIcon">
              🔍
            </div>

            <div>
              <span>
                Find Projects
              </span>

              <strong>
                Explore
              </strong>
            </div>

          </div>

          <div className="dashboardStatCard">

            <div className="dashboardStatIcon">
              ✉️
            </div>

            <div>
              <span>
                Pending Invitations
              </span>

              <strong>
                {
                  pendingInvitations
                }
              </strong>
            </div>

          </div>

          <div className="dashboardStatCard">

            <div className="dashboardStatIcon">
              💬
            </div>

            <div>
              <span>
                Unread Messages
              </span>

              <strong>
                {unreadCount}
              </strong>
            </div>

          </div>

          <div className="dashboardStatCard">

            <div className="dashboardStatIcon">
              ⭐
            </div>

            <div>
              <span>
                Profile
              </span>

              <strong>
                Active
              </strong>
            </div>

          </div>

        </section>

        <section className="dashboardSection">

          <div className="dashboardSectionHeader">

            <div>
              <h2>
                Quick Actions
              </h2>

              <p>
                Manage your freelance
                activity from one
                place.
              </p>
            </div>

          </div>

          <div className="modernActionGrid">

            <button
              className="modernActionCard"
              onClick={() =>
                navigate(
                  "/find-projects"
                )
              }
            >
              <div className="actionIcon">
                🔍
              </div>

              <h3>
                Find Projects
              </h3>

              <p>
                Browse open projects
                that match your
                skills.
              </p>

              <span className="actionLink">
                Browse Projects →
              </span>
            </button>

            <button
              className="modernActionCard"
              onClick={() =>
                navigate(
                  "/my-applications"
                )
              }
            >
              <div className="actionIcon">
                📄
              </div>

              <h3>
                My Applications
              </h3>

              <p>
                Track pending,
                accepted and rejected
                proposals.
              </p>

              <span className="actionLink">
                View Applications →
              </span>
            </button>

            <button
              className="modernActionCard"
              onClick={() =>
                navigate(
                  "/my-invitations"
                )
              }
            >
              <div className="actionIcon">
                ✉️
              </div>

              {pendingInvitations >
                0 && (
                <span className="actionBadge">
                  {
                    pendingInvitations
                  }
                </span>
              )}

              <h3>
                Invitations
              </h3>

              <p>
                Review direct
                invitations sent by
                clients.
              </p>

              <span className="actionLink">
                View Invitations →
              </span>
            </button>

            <button
              className="modernActionCard"
              onClick={() =>
                navigate(
                  "/edit-profile"
                )
              }
            >
              <div className="actionIcon">
                👤
              </div>

              <h3>
                My Profile
              </h3>

              <p>
                Add skills,
                experience, rate and
                portfolio.
              </p>

              <span className="actionLink">
                Edit Profile →
              </span>
            </button>

            <button
              className="modernActionCard"
              onClick={() =>
                navigate(
                  "/messages"
                )
              }
            >
              <div className="actionIcon">
                💬
              </div>

              {unreadCount > 0 && (
                <span className="actionBadge">
                  {unreadCount}
                </span>
              )}

              <h3>
                Messages
              </h3>

              <p>
                Chat with clients
                after your proposal
                is accepted.
              </p>

              <span className="actionLink">
                Open Messages →
              </span>
            </button>

            <div className="profileTipCard">

              <div className="profileTipImage">
                👩‍💻
              </div>

              <div>
                <span>
                  Profile Tip
                </span>

                <h3>
                  Complete your
                  profile
                </h3>

                <p>
                  A detailed profile
                  helps clients
                  understand your
                  skills and
                  experience.
                </p>

                <button
                  onClick={() =>
                    navigate(
                      "/edit-profile"
                    )
                  }
                >
                  Update Profile
                </button>
              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default FreelancerDashboard;