import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";

import ClientDashboard from "./pages/ClientDashboard";
import FreelancerDashboard from "./pages/FreelancerDashboard";

import PostProject from "./pages/PostProject";
import EditProject from "./pages/EditProject";
import MyProjects from "./pages/MyProjects";

import Applications from "./pages/Applications";

import FindProjects from "./pages/FindProjects";
import ApplyProject from "./pages/ApplyProject";
import MyApplications from "./pages/MyApplications";

import EditProfile from "./pages/EditProfile";

import Messages from "./pages/Messages";

import LeaveReview from "./pages/LeaveReview";

import FindFreelancers from "./pages/FindFreelancers";
import FreelancerProfile from "./pages/FreelancerProfile";
import SavedFreelancers from "./pages/SavedFreelancers";

import MyInvitations from "./pages/MyInvitations";
import SentInvitations from "./pages/SentInvitations";

// =====================================
// PROTECTED ROUTE
// =====================================

function ProtectedRoute({
  children,
  role,
}) {
  const token =
    localStorage.getItem("token");

  const storedUser =
    localStorage.getItem("user");

  if (!token || !storedUser) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  let user;

  try {
    user =
      JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    role &&
    user.role !== role
  ) {
    if (
      user.role === "client"
    ) {
      return (
        <Navigate
          to="/client-dashboard"
          replace
        />
      );
    }

    if (
      user.role ===
      "freelancer"
    ) {
      return (
        <Navigate
          to="/freelancer-dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

// =====================================
// APP
// =====================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* DEFAULT */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* AUTH */}

        <Route
          path="/signup"
          element={
            <Signup />
          }
        />

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        {/* =====================================
            CLIENT ROUTES
        ===================================== */}

        <Route
          path="/client-dashboard"
          element={
            <ProtectedRoute role="client">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/post-project"
          element={
            <ProtectedRoute role="client">
              <PostProject />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-project/:projectId"
          element={
            <ProtectedRoute role="client">
              <EditProject />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-projects"
          element={
            <ProtectedRoute role="client">
              <MyProjects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications/:projectId"
          element={
            <ProtectedRoute role="client">
              <Applications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leave-review/:projectId"
          element={
            <ProtectedRoute role="client">
              <LeaveReview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/find-freelancers"
          element={
            <ProtectedRoute role="client">
              <FindFreelancers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/saved-freelancers"
          element={
            <ProtectedRoute role="client">
              <SavedFreelancers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sent-invitations"
          element={
            <ProtectedRoute role="client">
              <SentInvitations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/freelancer/:freelancerId"
          element={
            <ProtectedRoute role="client">
              <FreelancerProfile />
            </ProtectedRoute>
          }
        />

        {/* =====================================
            FREELANCER ROUTES
        ===================================== */}

        <Route
          path="/freelancer-dashboard"
          element={
            <ProtectedRoute role="freelancer">
              <FreelancerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/find-projects"
          element={
            <ProtectedRoute role="freelancer">
              <FindProjects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/apply/:projectId"
          element={
            <ProtectedRoute role="freelancer">
              <ApplyProject />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-applications"
          element={
            <ProtectedRoute role="freelancer">
              <MyApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-invitations"
          element={
            <ProtectedRoute role="freelancer">
              <MyInvitations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute role="freelancer">
              <EditProfile />
            </ProtectedRoute>
          }
        />

        {/* =====================================
            SHARED ROUTES
        ===================================== */}

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;