"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createStory, isAuthenticated } from "@/lib/api";
import { useEffect } from "react";

export default function NewStoryPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("beginner");
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/login");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required");
    setSaving(true);
    setError("");
    try {
      const story = await createStory({
        title: title.trim(),
        description: description.trim(),
        level,
        is_premium: isPremium,
      });
      router.push(`/stories/${story.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={() => router.back()} style={styles.backBtn}>
        <ArrowLeft size={18} /> Back to Stories
      </button>

      <div style={styles.card}>
        <h1 style={styles.heading}>Create Story</h1>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Story title"
            style={styles.input}
            required
          />

          <label style={styles.label}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            style={{ ...styles.input, height: 80, resize: "vertical" }}
          />

          <label style={styles.label}>Difficulty Level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} style={styles.input}>
            <option value="beginner">Beginner</option>
            <option value="medium">Medium</option>
            <option value="advanced">Advanced</option>
          </select>

          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              style={styles.checkbox}
            />
            Premium story (requires subscription)
          </label>

          <div style={styles.btnRow}>
            <button type="button" onClick={() => router.back()} style={styles.ghostBtn}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={styles.primaryBtn}>
              {saving ? "Creating..." : "Create Story"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 640, margin: "0 auto", padding: "32px 20px" },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    color: "#6E7191",
    marginBottom: 20,
    padding: 0,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 32,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  heading: { fontSize: 24, fontWeight: 800, color: "#1A1A2E", marginBottom: 24 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "#1A1A2E",
    marginBottom: 6,
    marginTop: 18,
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
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#1A1A2E",
    marginTop: 20,
    cursor: "pointer",
  },
  checkbox: { width: 18, height: 18 },
  btnRow: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    marginTop: 28,
  },
  ghostBtn: {
    background: "none",
    border: "1px solid #D9DBE9",
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    color: "#6E7191",
  },
  primaryBtn: {
    background: "#4A6FA5",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 600,
  },
  error: {
    background: "#FEE",
    color: "#E74C3C",
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 12,
  },
};
