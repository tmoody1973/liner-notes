import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Liner Notes",
  description:
    "Radio Milwaukee's musical brain — explore the influence graph behind four stations' airplay",
};

const NAV = [
  { href: "/", label: "Explore" },
  { href: "/pathfinder", label: "Pathfinder" },
  { href: "/neighborhoods", label: "Neighborhoods" },
  { href: "/about", label: "About" },
] as const;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <header className="sticky top-0 z-20 border-b border-edge bg-background/85 backdrop-blur">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3">
              <Link href="/" className="flex shrink-0 items-baseline gap-2">
                <span className="whitespace-nowrap text-lg font-bold tracking-tight">
                  Liner Notes
                </span>
                <span className="hidden text-[11px] uppercase tracking-[0.18em] text-muted md:inline">
                  Radio Milwaukee
                </span>
              </Link>
              <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto text-sm">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="whitespace-nowrap rounded-full px-2.5 py-1.5 text-muted transition hover:bg-raised hover:text-foreground sm:px-3"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <div className="flex flex-1 flex-col">{children}</div>
          <footer className="border-t border-edge px-4 py-6 text-center text-xs text-muted">
            Built on four stations&apos; airplay — every connection carries its
            receipt.{" "}
            <Link
              href="/about"
              className="underline decoration-dotted underline-offset-2"
            >
              About this data
            </Link>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
