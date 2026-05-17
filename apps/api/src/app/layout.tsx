export const metadata = {
  title: "Calm Stories API",
  description: "Backend API for Calm Stories app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
