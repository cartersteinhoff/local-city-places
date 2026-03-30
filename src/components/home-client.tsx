"use client";

import { AnimatedFoodBackground } from "@/components/animated-food-background";
import { FeaturedMarquee } from "@/components/featured-marquee";
import { HomeHeader } from "@/components/home-header";
import { TopMarketsFooter } from "@/components/top-markets";

export function HomeClient() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedFoodBackground />

      <HomeHeader />

      {/* Spacer to push content down */}
      <div className="flex-1" />

      <FeaturedMarquee />

      <TopMarketsFooter />
    </div>
  );
}
