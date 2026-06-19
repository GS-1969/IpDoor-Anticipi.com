import "./globals.css";
import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Incassi Settimanali",
  description: "Pianificazione incassi previsti per cliente, settimana e mese.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="min-h-screen antialiased font-sans">
        <Nav />
        <main className="px-4 sm:px-6 lg:px-8 pt-4 pb-16 max-w-[1800px] mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
