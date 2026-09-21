import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/store/provider";

export const metadata: Metadata = {
  title: "Rig State Detector — Real-Time Drilling Dashboard",
  description:
    "Interactive drilling dashboard visualizing real-time rig telemetry, operational state detection, and anomaly alerts for SEBL field operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
