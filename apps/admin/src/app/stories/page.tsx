"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Pencil, Trash2, LogOut, Eye, EyeOff } from "lucide-react";
import { getStories, deleteStory, updateStory, isAuthenticated, logout, getUser } from "@/lib/api";

const LEVEL_COLORS: Record<string, string> = {
  beginner: "#FFB347",
  medium: "#4A6FA5",
  advanced: "#9982D4",
};

export default function StoriesPage() {
  const router = useRouter();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const data = await getStories();
      setStories(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteStory(id);
      setStories((s) => s.filter((x) => x.id !== id));
    } catch {}
  };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      await updateStory(id, { is_published: !isPublished });
      setStories((s) =>
        s.map((x) => (x.id === id ? { ...x, is_published: !isPublished } : x))
      );
    } catch {}
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <BookOpen size={20} color="#fff" />
          <span style={styles.sidebarTitle}>Little World</span>
        </div>
        <nav style={styles.nav}>
          <a style={{ ...styles.navItem, ...styles.navActive }}>
            <BookOpen size={18} /> Stories
          </a>
        </nav>
        <div style={styles.sidebarFooter}>
          <span style={styles.userName}>{user?.name || "Admin"}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.topBar}>
          <h1 style={styles.heading}>Stories</h1>
          <button onClick={() => router.push("/stories/new")} style={styles.primaryBtn}>
            <Plus size={18} /> New Story
          </button>
        </div>

        {loading ? (
          <p style={styles.muted}>Loading stories...</p>
        ) : stories.length === 0 ? (
          <div style={styles.emptyState}>
            <BookOpen size={48} color="#D9DBE9" />
            <p style={styles.muted}>No stories yet. Create your first story!</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Level</th>
                <th style={styles.th}>Pages</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Premium</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((s) => (
                <tr key={s.id} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={styles.storyTitle}>{s.title}</span>
                    <br />
                    <span style={styles.storyDesc}>{s.description?.slice(0, 60)}</span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        background: LEVEL_COLORS[s.level] || "#ccc",
                        color: "#fff",
                      }}
                    >
                      {s.level}
                    </span>
                  </td>
                  <td style={styles.td}>{s.page_count}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        background: s.is_published ? "#E8F5E9" : "#FFF3E0",
                        color: s.is_published ? "#2E7D32" : "#E65100",
                      }}
                    >
                      {s.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {s.is_premium && (
                      <span style={{ ...styles.badge, background: "#EDE7F6", color: "#5E35B1" }}>
                        Premium
                      </span>
                    )}
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <div style={styles.actions}>
                      <button
                        onClick={() => handleTogglePublish(s.id, s.is_published)}
                        style={styles.iconBtn}
                        title={s.is_published ? "Unpublish" : "Publish"}
                      >
                        {s.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => router.push(`/stories/${s.id}`)}
                        style={styles.iconBtn}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.title)}
                        style={{ ...styles.iconBtn, color: "#E74C3C" }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: { display: "flex", minHeight: "100vh" },
  sidebar: {
    width: 240,
    background: "#1A1A2E",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: "20px 0",
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 20px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  sidebarTitle: { fontSize: 18, fontWeight: 700 },
  nav: { flex: 1, padding: "12px 0" },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
  },
  navActive: { color: "#fff", background: "rgba(255,255,255,0.1)" },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  userName: { fontSize: 13, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 8 },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: 600,
    padding: 0,
  },

  main: { flex: 1, padding: "32px 40px" },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  heading: { fontSize: 28, fontWeight: 800, color: "#1A1A2E" },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#4A6FA5",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
  },
  muted: { color: "#6E7191", fontSize: 14 },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    paddingTop: 80,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    fontSize: 12,
    fontWeight: 700,
    color: "#6E7191",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottom: "1px solid #D9DBE9",
  },
  tr: { borderBottom: "1px solid #F0F0F5" },
  td: { padding: "14px 16px", fontSize: 14, verticalAlign: "middle" },
  storyTitle: { fontWeight: 700, color: "#1A1A2E" },
  storyDesc: { fontSize: 12, color: "#6E7191" },
  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  actions: { display: "flex", gap: 6, justifyContent: "flex-end" },
  iconBtn: {
    background: "none",
    border: "1px solid #D9DBE9",
    borderRadius: 8,
    padding: 6,
    color: "#6E7191",
    display: "flex",
    alignItems: "center",
  },
};
