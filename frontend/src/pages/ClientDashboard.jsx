import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

function ClientDashboard() {
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
    pendingApplications,
    setPendingApplications,
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
        "Invalid user data:",
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

          const applicationResponse =
            await fetch(
              "http://localhost:5000/api/applications/client/pending-count",
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const applicationData =
            await applicationResponse.json();

          if (
            applicationResponse.ok
          ) {
            setPendingApplications(
              Number(
                applicationData.pendingCount ||
                  0
              )
            );
          }

          const invitationResponse =
            await fetch(
              "http://localhost:5000/api/invitations/sent",
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
                  "pending"
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
      ?.toUpperCase() || "C";

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
                "Client"}
            </strong>

            <span>
              Client
            </span>
          </div>

        </div>

        <nav className="sidebarNav">

          <button
            className="sidebarNavItem active"
            onClick={() =>
              navigate(
                "/client-dashboard"
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
                "/my-projects"
              )
            }
          >
            <span>▣</span>

            My Projects

            {pendingApplications >
              0 && (
              <span className="sidebarBadge">
                {
                  pendingApplications
                }
              </span>
            )}
          </button>

          <button
            className="sidebarNavItem"
            onClick={() =>
              navigate(
                "/post-project"
              )
            }
          >
            <span>＋</span>
            Post Project
          </button>

          <button
            className="sidebarNavItem"
            onClick={() =>
              navigate(
                "/find-freelancers"
              )
            }
          >
            <span>⌕</span>
            Find Freelancers
          </button>

          <button
            className="sidebarNavItem"
            onClick={() =>
              navigate(
                "/saved-freelancers"
              )
            }
          >
            <span>♡</span>
            Saved Freelancers
          </button>

          <button
            className="sidebarNavItem"
            onClick={() =>
              navigate(
                "/sent-invitations"
              )
            }
          >
            <span>✉</span>

            Sent Invitations

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
                "Client"}{" "}
              👋
            </h1>

            <p>
              Manage your projects
              and find the right
              freelancers for your
              work.
            </p>
          </div>

          <button
            className="dashboardPrimaryButton"
            onClick={() =>
              navigate(
                "/post-project"
              )
            }
          >
            ＋ Post New Project
          </button>

        </div>

        <section className="dashboardHero clientDashboardHero">

          <div className="dashboardHeroContent">

            <span className="dashboardHeroBadge">
              ✨ Build your idea
            </span>

            <h2>
              Turn Your Ideas
              <br />
              Into{" "}
              <span className="heroHighlight">
                Reality.
              </span>
            </h2>

            <p>
              Post your project,
              receive proposals from
              talented freelancers
              and get quality work
              completed with
              confidence.
            </p>

            <div className="dashboardHeroButtons">

              <button
                onClick={() =>
                  navigate(
                    "/post-project"
                  )
                }
              >
                ＋ Post New Project
              </button>

              <button
                className="dashboardSecondaryButton"
                onClick={() =>
                  navigate(
                    "/find-freelancers"
                  )
                }
              >
                Find Freelancers
              </button>

            </div>

          </div>

          <div className="dashboardImageArea">

            <div className="dashboardImageShape" />

            <img
              className="dashboardPersonImage"
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=90"
              alt="Professional working on laptop"
            />

            <div className="imageFloatingCard imageCardTop">

              <div className="floatingAvatar">
                👩‍💻
              </div>

              <div>
                <strong>
                  5000+ Freelancers
                </strong>

                <span>
                  Skilled professionals
                </span>
              </div>

            </div>

            <div className="imageFloatingCard imageCardBottom">

              <div className="successCircle">
                ✓
              </div>

              <div>
                <strong>
                  Get Quality Work
                </strong>

                <span>
                  On Time & On Budget
                </span>
              </div>

            </div>

          </div>

        </section>

        <section className="dashboardStatsGrid">

          <div className="dashboardStatCard">

            <div className="dashboardStatIcon">
              📁
            </div>

            <div>
              <span>
                Pending Applications
              </span>

              <strong>
                {
                  pendingApplications
                }
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
                Marketplace
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
                Everything you need
                to manage your work.
              </p>
            </div>

          </div>

          <div className="modernActionGrid">

            <button
              className="modernActionCard"
              onClick={() =>
                navigate(
                  "/post-project"
                )
              }
            >
              <div className="actionIcon">
                ＋
              </div>

              <h3>
                Post Project
              </h3>

              <p>
                Create a new project
                and start receiving
                proposals.
              </p>

              <span className="actionLink">
                Create Project →
              </span>
            </button>

            <button
              className="modernActionCard"
              onClick={() =>
                navigate(
                  "/my-projects"
                )
              }
            >
              <div className="actionIcon">
                📁
              </div>

              {pendingApplications >
                0 && (
                <span className="actionBadge">
                  {
                    pendingApplications
                  }
                </span>
              )}

              <h3>
                My Projects
              </h3>

              <p>
                View projects,
                applications and
                project progress.
              </p>

              <span className="actionLink">
                Manage Projects →
              </span>
            </button>

            <button
              className="modernActionCard"
              onClick={() =>
                navigate(
                  "/find-freelancers"
                )
              }
            >
              <div className="actionIcon">
                👥
              </div>

              <h3>
                Find Freelancers
              </h3>

              <p>
                Search by skill,
                rating and hourly
                rate.
              </p>

              <span className="actionLink">
                Browse Talent →
              </span>
            </button>

            <button
              className="modernActionCard"
              onClick={() =>
                navigate(
                  "/saved-freelancers"
                )
              }
            >
              <div className="actionIcon">
                ♡
              </div>

              <h3>
                Saved Freelancers
              </h3>

              <p>
                Quickly return to
                freelancers you
                liked.
              </p>

              <span className="actionLink">
                View Saved →
              </span>
            </button>

            <button
              className="modernActionCard"
              onClick={() =>
                navigate(
                  "/sent-invitations"
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
                Track invitations
                you've sent to
                freelancers.
              </p>

              <span className="actionLink">
                View Invitations →
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
                Communicate with
                accepted
                freelancers.
              </p>

              <span className="actionLink">
                Open Messages →
              </span>
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default ClientDashboard;