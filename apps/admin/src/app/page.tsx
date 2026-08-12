import { redirect } from "next/navigation";

// Middleware bounces unauthenticated users to /login.
export default function Home() {
  redirect("/dashboard");
}
