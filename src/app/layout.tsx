import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthHashHandler } from "@/components/auth-hash-handler";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Phero",
  description: "Sua evolucao continua aqui. Acesse seus treinos, acompanhe seu progresso e alcance seus objetivos.",
  icons: {
    icon: "/phero-logo-transparent.png",
    shortcut: "/phero-logo-transparent.png",
    apple: "/phero-logo-transparent.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-neutral-950">
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
