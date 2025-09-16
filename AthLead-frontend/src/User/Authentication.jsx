import React, { useState, useEffect } from "react";
import { setCookie, getCookie, eraseCookie } from "../utility/Utils";

const fetchUserProfile = async () => {
  const token = getCookie("authToken");
  const email = getCookie("userEmail");

  if (!token || !email) return null;

  const response = await fetch("http://localhost:8082/api/protected/home", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Failed to fetch user profile");

  return { username: email, id: "1" };
};

const Login = ({ onLoginSuccess, navigateTo }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    fetch("http://localhost:8082/api/public/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password: password }),
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Login failed");
        }
        return res.text();
      })
      .then((token) => {
        setCookie("authToken", token, 7);
        setCookie("userEmail", email, 7);
        onLoginSuccess();
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="bg-gray-800 p-8 rounded-3xl shadow-lg w-full max-w-md mx-4">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">
        Log In
      </h2>
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-400 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}
        <button
          type="submit"
          className="w-full py-3 bg-blue-500 rounded-lg text-white font-semibold hover:bg-blue-600 transition-colors duration-200"
          disabled={loading}
        >
          {loading ? "Logging In..." : "Log In"}
        </button>
      </form>
      <div className="mt-6 text-center">
        <p>
          Don't have an account?{" "}
          <button
            onClick={() => navigateTo("signup")}
            className="text-blue-400 hover:underline font-medium"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

const Signup = ({ navigateTo }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    fetch("http://localhost:8082/api/public/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password, roles: "USER" }),
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Signup failed");
        }
        return res.text();
      })
      .then((token) => {
        setCookie("authToken", token, 7);
        setCookie("userEmail", email, 7);
        navigateTo("dashboard");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="bg-gray-800 p-8 rounded-3xl shadow-lg w-full max-w-md mx-4">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">
        Sign Up
      </h2>
      <form onSubmit={handleSignup}>
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-400 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}
        <button
          type="submit"
          className="w-full py-3 bg-blue-500 rounded-lg text-white font-semibold hover:bg-blue-600 transition-colors duration-200"
          disabled={loading}
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>
      <div className="mt-6 text-center">
        <p>
          Already have an account?{" "}
          <button
            onClick={() => navigateTo("login")}
            className="text-blue-400 hover:underline font-medium"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
};

const ProfileDashboard = ({ user, onLogout }) => (
  <div className="bg-gray-800 p-8 rounded-3xl shadow-lg w-full max-w-md mx-4 text-center">
    <h2 className="text-3xl font-bold mb-4 text-blue-400">
      Welcome to your Profile!
    </h2>
    <p className="mb-2 text-lg">You are logged in.</p>
    <div className="bg-gray-700 rounded-lg p-4 mb-6">
      <p className="text-gray-400 text-sm">Your Email:</p>
      <p className="text-white text-md font-medium break-all">
        {user.username}
      </p>
      <p className="text-gray-400 text-sm mt-2">Your User ID:</p>
      <p className="text-white text-xs font-mono break-all">{user.id}</p>
    </div>
    <button
      onClick={onLogout}
      className="w-full py-3 bg-red-500 rounded-lg text-white font-semibold hover:bg-red-600 transition-colors duration-200"
    >
      Log Out
    </button>
  </div>
);

const Authenticate = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("login");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCookie("authToken");

    if (token) {
      fetchUserProfile()
        .then((user) => setCurrentUser(user))
        .catch(() => {
          eraseCookie("authToken");
          eraseCookie("userEmail");
          setCurrentUser(null);
        })
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const handleLoginSuccess = async () => {
    const user = await fetchUserProfile();
    if (user) {
      setCurrentUser(user);
      setCurrentPage("dashboard");
    }
  };

  const handleLogout = () => {
    eraseCookie("authToken");
    setCurrentUser(null);
    setCurrentPage("login");
  };

  const navigateTo = (page) => setCurrentPage(page);

  const renderView = () => {
    if (loading)
      return (
        <div className="text-lg text-gray-400 animate-pulse">Loading...</div>
      );
    if (currentUser)
      return <ProfileDashboard user={currentUser} onLogout={handleLogout} />;
    if (currentPage === "signup") return <Signup navigateTo={navigateTo} />;
    return (
      <Login onLoginSuccess={handleLoginSuccess} navigateTo={navigateTo} />
    );
  };

  return (
    <div className="min-h-screen font-sans antialiased bg-gray-900 text-white flex items-center justify-center">
      {renderView()}
    </div>
  );
};

export default Authenticate;
