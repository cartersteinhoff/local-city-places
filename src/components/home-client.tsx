"use client";

import { AnimatedFoodBackground } from "@/components/animated-food-background";
import { FeaturedMarquee } from "@/components/featured-marquee";
import { Footer } from "@/components/footer";
import { HomeHeader } from "@/components/home-header";
import { HomeLiveLocalMedia } from "@/components/home-live-local-media";
import type { FeaturedMerchant } from "@/lib/featured-merchants-types";

interface HomeClientProps {
  featuredMerchants: FeaturedMerchant[];
}

export function HomeClient({ featuredMerchants }: HomeClientProps) {
  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{
        display: "flex",
        minHeight: "100vh",
        position: "relative",
        flexDirection: "column",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <AnimatedFoodBackground forceOrangeGradient />
      </div>

      <HomeHeader />

      <FeaturedMarquee initialMerchants={featuredMerchants} />

      <HomeLiveLocalMedia />

      <Footer variant="dark" />
    </div>
  );
}
