"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { getMerchantPageUrl } from "@/lib/utils"

interface FeaturedMerchant {
  id: string
  businessName: string
  city: string | null
  state: string | null
  slug: string | null
  logoUrl: string | null
  photos: string[] | null
  categoryName: string | null
}

function MerchantCard({ merchant }: { merchant: FeaturedMerchant }) {
  const href =
    merchant.city && merchant.state && merchant.slug
      ? getMerchantPageUrl(merchant.city, merchant.state, merchant.slug)
      : "#"

  const photo = merchant.photos?.[0]
  const hasImage = photo || merchant.logoUrl

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-[300px] h-[200px] shrink-0 rounded-lg overflow-hidden shadow-lg"
    >
      {photo ? (
        <Image
          src={photo}
          alt={merchant.businessName}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="260px"
        />
      ) : merchant.logoUrl ? (
        <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center p-6">
          <Image
            src={merchant.logoUrl}
            alt={merchant.businessName}
            width={200}
            height={100}
            className="object-contain max-h-[80px]"
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
          <span className="text-white/60 text-lg font-bold">
            {merchant.businessName.charAt(0)}
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white font-semibold text-sm leading-tight truncate">
          {merchant.businessName}
        </h3>
        {(merchant.city || merchant.categoryName) && (
          <p className="text-white/70 text-xs mt-0.5 truncate">
            {[merchant.city && merchant.state ? `${merchant.city}, ${merchant.state}` : merchant.city, merchant.categoryName].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </a>
  )
}

function MarqueeRow({
  merchants,
  direction,
  speed,
}: {
  merchants: FeaturedMerchant[]
  direction: "left" | "right"
  speed: number
}) {
  if (merchants.length === 0) return null

  // Duplicate items enough to fill the screen and create seamless loop
  const items = [...merchants, ...merchants, ...merchants, ...merchants]

  return (
    <div className="relative overflow-hidden">
      <div
        className={`flex gap-4 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        {items.map((merchant, i) => (
          <MerchantCard key={`${merchant.id}-${i}`} merchant={merchant} />
        ))}
      </div>
    </div>
  )
}

export function FeaturedMarquee() {
  const [merchants, setMerchants] = useState<FeaturedMerchant[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch("/api/featured-merchants")
        if (res.ok) {
          const data = await res.json()
          setMerchants(data.merchants)
        }
      } catch (err) {
        console.error("Error fetching featured merchants:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  if (!isLoading && merchants.length === 0) return null

  // Random shuffle for each row
  const shuffle = (arr: FeaturedMerchant[]) => {
    const shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  if (isLoading) {
    return (
      <section className="relative z-10 py-8">
        <h2 className="text-center text-lg font-bold uppercase tracking-[0.15em] text-white/80 mb-6">
          Featured Merchants
        </h2>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-4 overflow-hidden px-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <div
                  key={j}
                  className="w-[300px] h-[200px] shrink-0 rounded-lg bg-white/10 animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    )
  }

  const row1 = shuffle(merchants)
  const row2 = shuffle(merchants)
  const row3 = shuffle(merchants)

  return (
    <section className="relative z-10 py-8">
      <h2 className="text-center text-lg font-bold uppercase tracking-[0.15em] text-white/80 mb-6">
        Featured Merchants
      </h2>
      <div className="space-y-4">
        <MarqueeRow merchants={row1} direction="left" speed={40} />
        <MarqueeRow merchants={row2} direction="right" speed={50} />
        <MarqueeRow merchants={row3} direction="left" speed={45} />
      </div>
    </section>
  )
}
