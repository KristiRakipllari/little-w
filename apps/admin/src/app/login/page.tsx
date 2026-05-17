"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/stories");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h1 style={styles.title}>Little World</h1>
        <p style={styles.subtitle}>Admin Panel</p>

        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@littleworld.app"
          required
          style={styles.input}
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
          style={styles.input}
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F4F6F9",
    padding: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 40,
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: "#1A1A2E",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6E7191",
    marginBottom: 28,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#1A1A2E",
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
    border: "1px solid #D9DBE9",
    borderRadius: 10,
    outline: "none",
    color: "#1A1A2E",
  },
  button: {
    width: "100%",
    padding: "14px",
    fontSize: 16,
    fontWeight: 600,
    color: "#fff",
    background: "#4A6FA5",
    border: "none",
    borderRadius: 10,
    marginTop: 24,
  },
  error: {
    background: "#FEE",
    color: "#E74C3C",
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 8,
  },
};
