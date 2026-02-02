import { MapPin } from "lucide-react";

interface MerchantHeaderProps {
  businessName: string;
  city?: string | null;
  state?: string | null;
  logoUrl?: string | null;
}

export function MerchantHeader({ businessName, city, state, logoUrl }: MerchantHeaderProps) {
  // Get initials for fallback avatar
  const initials = businessName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const location = [city, state].filter(Boolean).join(", ");

  return (
    <div className="relative">
      {/* Gradient background */}
      <div className="h-32 sm:h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />

      {/* Content overlay */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
          {/* Logo/Avatar */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-background bg-card shadow-lg overflow-hidden flex-shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl sm:text-3xl font-bold">
                {initials}
              </div>
            )}
          </div>

          {/* Business info */}
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{businessName}</h1>
            {location && (
              <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
