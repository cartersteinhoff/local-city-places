import { Phone, Globe, Clock, Star, MessageSquare, Info, Sparkles } from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";

interface MerchantContentProps {
  businessName: string;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  categoryName?: string | null;
}

export function MerchantContent({
  businessName,
  phone,
  website,
  description,
  categoryName,
}: MerchantContentProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content - 2/3 width on desktop */}
        <div className="lg:col-span-2 space-y-8">
          {/* About section */}
          {description && (
            <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">About</h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-lg">
                  {description}
                </p>
              </div>
            </section>
          )}

          {/* Reviews section */}
          <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-semibold">Reviews</h2>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Be the first to share your experience with {businessName}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar - 1/3 width on desktop */}
        <div className="space-y-6">
          {/* Contact card */}
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden sticky top-6">
            <div className="px-6 py-4 border-b bg-muted/30">
              <h3 className="font-semibold">Contact Information</h3>
            </div>
            <div className="p-6 space-y-4">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{formatPhoneNumber(phone)}</p>
                  </div>
                </a>
              )}

              {website && (
                <a
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Website</p>
                    <p className="font-medium truncate">{website.replace(/^https?:\/\//, "")}</p>
                  </div>
                </a>
              )}

              {/* Hours placeholder */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours</p>
                  <p className="text-sm text-muted-foreground/70">Coming soon</p>
                </div>
              </div>
            </div>

            {/* CTA section */}
            <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-primary/10 border-t">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Local City Places Partner</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Earn rewards when you shop here
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category badge */}
          {categoryName && (
            <div className="bg-card rounded-2xl border shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Category</span>
              </div>
              <p className="font-medium mt-1 ml-5">{categoryName}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
