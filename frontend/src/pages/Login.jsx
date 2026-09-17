import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState({
      email: "",
      password: "",
    });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    if (
      !formData.email.trim() ||
      !formData.password
    ) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            formData
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Login failed"
        );
        return;
      }

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(
          data.user
        )
      );

      if (
        data.user.role ===
        "client"
      ) {
        navigate(
          "/client-dashboard"
        );
      } else {
        navigate(
          "/freelancer-dashboard"
        );
      }
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modernAuthPage">

      {/* LEFT IMAGE */}

      <div
        className="authImageSection loginImage"
      >
        <div className="authImageOverlay" />

        <div className="authImageContent">

          <div className="authBrand authBrandLight">
            <div className="brandIcon">
              💼
            </div>

            <span>
              Freelance
              <strong>
                Hub
              </strong>
            </span>
          </div>

          <div className="authHeroText">
            <span className="authMiniBadge">
              ✨ Connect. Work.
              Grow.
            </span>

            <h1>
              Work Without
              <span>
                {" "}
                Limits.
              </span>
            </h1>

            <p>
              Connect with talented
              freelancers and clients,
              collaborate on exciting
              projects and build
              something amazing
              together.
            </p>
          </div>

          <div className="authStats">
            <div>
              <strong>
                1K+
              </strong>
              <span>
                Projects
              </span>
            </div>

            <div>
              <strong>
                5K+
              </strong>
              <span>
                Freelancers
              </span>
            </div>

            <div>
              <strong>
                98%
              </strong>
              <span>
                Satisfaction
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT LOGIN */}

      <div className="authFormSection">

        <div className="authFormWrapper">

          <div className="mobileAuthBrand">
            <div className="brandIcon">
              💼
            </div>

            <span>
              Freelance
              <strong>
                Hub
              </strong>
            </span>
          </div>

          <div className="authFormHeader">
            <h2>
              Welcome back 👋
            </h2>

            <p>
              Sign in to continue to
              your FreelanceHub
              account.
            </p>
          </div>

          {error && (
            <div className="errorMessage">
              {error}
            </div>
          )}

          <form
            onSubmit={
              handleSubmit
            }
          >
            <div className="modernFormGroup">
              <label>
                Email Address
              </label>

              <div className="authInputWrapper">
                <span className="inputIcon">
                  ✉
                </span>

                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>
            </div>

            <div className="modernFormGroup">
              <div className="labelRow">
                <label>
                  Password
                </label>
              </div>

              <div className="authInputWrapper">
                <span className="inputIcon">
                  🔒
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Enter your password"
                  value={
                    formData.password
                  }
                  onChange={
                    handleChange
                  }
                />

                <button
                  type="button"
                  className="passwordToggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? "🙈"
                    : "👁"}
                </button>
              </div>
            </div>

            <div className="authOptions">
              <label className="rememberBox">
                <input
                  type="checkbox"
                />

                <span>
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className="forgotButton"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="primaryAuthButton"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>

          <div className="authDivider">
            <span>
              or
            </span>
          </div>

          <div className="authInfoBox">
            <span>
              🔐
            </span>

            <p>
              Your account is
              securely protected.
            </p>
          </div>

          <p className="authSwitchText">
            Don't have an
            account?{" "}
            <Link to="/signup">
              Create Account
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}

export default Login;