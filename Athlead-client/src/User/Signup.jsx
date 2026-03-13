const Signup = ({ navigateTo }) => {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
          <label className="block text-gray-400 mb-2">Full Name</label>
          <input
            type="text"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

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

        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-400 mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {password !== confirmPassword ? (
            <p className="mt-2.5 text-sm text-red-600">
              <span className="font-medium">incorrect!</span> Password mismatch
            </p>
          ) : (
            <span></span>
          )}
          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}
        </div>

        {password == confirmPassword ? (
          <button
            type="submit"
            className="w-full py-3 bg-blue-500 rounded-lg text-white font-semibold hover:bg-blue-600 transition-colors duration-200"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        ) : (
          <button
          type="submit"
          className="w-full py-3 bg-gray-700 rounded-lg text-white font-semibold  " disabled
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>

        )}
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

export default Signup;