export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>🧠 Calm Stories API</h1>
      <p>The API is running. Available endpoints:</p>
      <ul>
        <li>POST /api/auth/login</li>
        <li>POST /api/auth/register</li>
        <li>GET /api/stories</li>
        <li>POST /api/stories</li>
        <li>GET /api/stories/:id</li>
        <li>PUT /api/stories/:id</li>
        <li>DELETE /api/stories/:id</li>
        <li>GET /api/stories/:id/pages</li>
        <li>POST /api/stories/:id/pages</li>
        <li>PUT /api/stories/:id/pages/:pageId</li>
        <li>DELETE /api/stories/:id/pages/:pageId</li>
        <li>PUT /api/stories/:id/pages/reorder</li>
        <li>POST /api/upload</li>
      </ul>
    </main>
  );
}
