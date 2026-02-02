import { Phone, Globe, Tag } from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";

interface MerchantInfoProps {
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  categoryName?: string | null;
}

export function MerchantInfo({ phone, website, description, categoryName }: MerchantInfoProps) {
  const hasContactInfo = phone || website;
  const hasAbout = description || categoryName;

  if (!hasContactInfo && !hasAbout) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Contact Info */}
      {hasContactInfo && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Contact</h2>
          <div className="space-y-2">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>{formatPhoneNumber(phone)}</span>
              </a>
            )}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{website.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Category */}
      {categoryName && (
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{categoryName}</span>
        </div>
      )}

      {/* About */}
      {description && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">About</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
        </div>
      )}
    </div>
  );
}
