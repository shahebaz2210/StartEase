import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StartEase — One small step at a time.",
  description:
    "An adaptive, calm task initiation companion. Picks the right tool and guides you through one tiny, manageable step at a time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#EBF5EE] text-[#1A3323] antialiased">
        {children}
      </body>
    </html>
  );
}
