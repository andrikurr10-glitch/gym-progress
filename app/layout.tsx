import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gym Progress",
  description: "Track your gym progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white">
        <div className="relative min-h-screen overflow-x-hidden">

          {/* BACKGROUND */}
          <div
            className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/bgmerah.jpg')",
            }}
          />

          {/* DARK OVERLAY */}
          <div className="fixed inset-0 -z-10 bg-black/75" />

          {/* CONTENT */}
          <div className="relative">
            {children}
          </div>

        </div>
      </body>
    </html>
  );
}