import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../lib/auth";
import SessionProvider from "../components/SessionProvider";

export const viewport = {
  themeColor: "#C4993A",
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: { default: "PREVIA EVENTS – Find the people behind your best days", template: "%s | PREVIA EVENTS" },
  description: "Find trusted event professionals and upcoming experiences in Vadodara, Gujarat.",
  keywords: "Vadodara events, event planning, wedding vendors, photographers, decorators, caterers, mehendi, DJ, venues",
  openGraph: {
    title: "PREVIA EVENTS – Vadodara events and experiences",
    description: "Discover memorable events and trusted event professionals in Vadodara, Gujarat.",
    type: "website",
    siteName: "Eventora",
  },
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          <Navbar />
          <main id="main-content">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
