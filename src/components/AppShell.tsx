import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { Footer } from "./Footer";
import { DevFixtureBanner } from "./DevFixtureBanner";
import { SmoothScroll } from "./SmoothScroll";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SmoothScroll>
      <div className="flex min-h-full flex-col">
        <DevFixtureBanner />
        <TopNav />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </SmoothScroll>
  );
}
