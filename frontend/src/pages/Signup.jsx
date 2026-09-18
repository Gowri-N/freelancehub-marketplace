import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://freelancehub-marketplace.onrender.com/api/auth/signup",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          "Account created successfully! Redirecting to login..."
        );

        setTimeout(() => {
          navigate("/login");
        }, 1200);
      } else {
        setError(
          data.message ||
          "Unable to create your account. Please try again."
        );
      }
    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">

        <h2>Create Account</h2>

        <p>Join FreelanceHub today</p>

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

        <form onSubmit={handleSignup}>

          <input
            type="text"
            placeholder="Full name"
            value={name}
            disabled={loading}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <select
            value={role}
            disabled={loading}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="">
              Select account type
            </option>

            <option value="client">
              Client
            </option>

            <option value="freelancer">
              Freelancer
            </option>
          </select>

          <button
            type="submit"
            disabled={loading || Boolean(success)}
          >
            {loading
              ? "Creating Account..."
              : success
              ? "Account Created"
              : "Create Account"}
          </button>

        </form>

        <p className="authBottom">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  );
}

export default Signup;