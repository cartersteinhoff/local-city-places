"use client";

import { AnimatedFoodBackground } from "@/components/animated-food-background";
import { FeaturedMarquee } from "@/components/featured-marquee";
import { HomeHeader } from "@/components/home-header";
import { TopMarketsFooter } from "@/components/top-markets";

export function HomeClient() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnimatedFoodBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <HomeHeader />

        <main className="flex flex-1 items-center">
          <FeaturedMarquee />
        </main>

        <TopMarketsFooter />
      </div>
    </div>
  );
}
