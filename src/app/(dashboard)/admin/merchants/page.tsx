"use client";

import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RadioTower,
  RefreshCw,
  Search,
  Store,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@/hooks/use-user";
import { cn, formatPhoneNumber } from "@/lib/utils";
import { adminNavItems } from "../nav";

interface Category {
  id: string;
  name: string;
}

interface MerchantOwner {
  id: string;
  email: string;
  role: string;
  name: string | null;
}

interface MerchantPageData {
  id: string;
  businessName: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  vimeoUrl: string | null;
  slug: string | null;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
  completionPercentage: number;
  reviewCount: number;
  owners: MerchantOwner[];
  urls: {
    full: string | null;
    short: string | null;
  };
}

export default function MerchantPagesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [merchants, setMerchants] = useState<MerchantPageData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters and sorting
  const [categoryFilter, setCategoryFilter] = useState("");
  const [completionFilter, setCompletionFilter] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] =
    useState<MerchantPageData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Owner dialog
  const [ownerDialogOpen, setOwnerDialogOpen] = useState(false);
  const [ownerMerchant, setOwnerMerchant] = useState<MerchantPageData | null>(
    null,
  );
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState<MerchantOwner[]>([]);
  const [isOwnerSearchLoading, setIsOwnerSearchLoading] = useState(false);
  const [isOwnerSaving, setIsOwnerSaving] = useState(false);
  const [ownerError, setOwnerError] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
    fetchCategories();
  }, []);

  const fetchMerchants = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      });
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }
      if (categoryFilter) {
        params.set("categoryId", categoryFilter);
      }
      if (completionFilter) {
        params.set("completion", completionFilter);
      }

      const res = await fetch(`/api/admin/merchant-pages?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMerchants(data.merchants);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching merchant pages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    categoryFilter,
    completionFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchMerchants();
    }
  }, [authLoading, isAuthenticated, fetchMerchants]);

  useEffect(() => {
    if (!ownerDialogOpen || !ownerMerchant || ownerSearch.trim().length < 2) {
      setOwnerResults([]);
      setIsOwnerSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsOwnerSearchLoading(true);
      setOwnerError("");

      try {
        const res = await fetch(
          `/api/admin/users/search?q=${encodeURIComponent(ownerSearch.trim())}`,
          { signal: controller.signal },
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to search users");
        }

        const currentOwnerIds = new Set(
          ownerMerchant.owners.map((owner) => owner.id),
        );

        setOwnerResults(
          (data.users || []).filter(
            (user: MerchantOwner) =>
              !currentOwnerIds.has(user.id) &&
              (user.role === "merchant" || user.role === "admin"),
          ),
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          setOwnerError(
            err instanceof Error ? err.message : "Failed to search users",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsOwnerSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [ownerDialogOpen, ownerMerchant, ownerSearch]);

  // Reset page when filters change
  const handleFilterChange =
    (setter: (value: string) => void) => (value: string) => {
      setter(value === "all" ? "" : value);
      setPage(1);
    };

  const handleDelete = async () => {
    if (!selectedMerchant) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/merchant-pages/${selectedMerchant.id}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        setDeleteDialogOpen(false);
        setSelectedMerchant(null);
        await fetchMerchants();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete merchant page");
      }
    } catch (error) {
      console.error("Error deleting merchant page:", error);
      alert("Failed to delete merchant page");
    } finally {
      setIsDeleting(false);
    }
  };

  const getOwnerDisplayName = (owner: MerchantOwner) =>
    owner.name || owner.email;

  const getOwnerSummary = (owners: MerchantOwner[]) =>
    owners.length > 0
      ? owners.map(getOwnerDisplayName).join(", ")
      : "Unassigned";

  const getPrimaryManagerName = (owners: MerchantOwner[]) =>
    owners[0] ? getOwnerDisplayName(owners[0]) : "Unassigned";

  const getAdditionalManagerCount = (owners: MerchantOwner[]) =>
    Math.max(0, owners.length - 1);

  const handleOwnerDialogChange = (open: boolean) => {
    setOwnerDialogOpen(open);

    if (!open) {
      setOwnerMerchant(null);
      setOwnerSearch("");
      setOwnerResults([]);
      setOwnerError("");
      setIsOwnerSearchLoading(false);
    }
  };

  const openOwnerDialog = (merchant: MerchantPageData) => {
    setOwnerMerchant(merchant);
    setOwnerSearch("");
    setOwnerResults([]);
    setOwnerError("");
    setOwnerDialogOpen(true);
  };

  const saveOwners = async (nextOwners: MerchantOwner[]) => {
    if (!ownerMerchant) return;

    if (nextOwners.length === 0) {
      setOwnerError("At least one manager is required");
      return;
    }

    setIsOwnerSaving(true);
    setOwnerError("");

    try {
      const res = await fetch(
        `/api/admin/merchant-pages/${ownerMerchant.id}/owners`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerUserIds: nextOwners.map((owner) => owner.id),
          }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update managers");
      }

      const updatedOwners = data.owners || nextOwners;
      setOwnerMerchant({ ...ownerMerchant, owners: updatedOwners });
      setMerchants((currentMerchants) =>
        currentMerchants.map((merchant) =>
          merchant.id === ownerMerchant.id
            ? { ...merchant, owners: updatedOwners }
            : merchant,
        ),
      );
      setOwnerSearch("");
      setOwnerResults([]);
      await fetchMerchants();
    } catch (err) {
      setOwnerError(
        err instanceof Error ? err.message : "Failed to update managers",
      );
    } finally {
      setIsOwnerSaving(false);
    }
  };

  const addOwner = (owner: MerchantOwner) => {
    if (!ownerMerchant) return;
    if (
      ownerMerchant.owners.some((currentOwner) => currentOwner.id === owner.id)
    ) {
      return;
    }

    saveOwners([...ownerMerchant.owners, owner]);
  };

  const removeOwner = (ownerId: string) => {
    if (!ownerMerchant) return;

    if (ownerMerchant.owners.length <= 1) {
      setOwnerError("At least one manager is required");
      return;
    }

    saveOwners(ownerMerchant.owners.filter((owner) => owner.id !== ownerId));
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getFullUrl = (path: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`;
    }
    return path;
  };

  const copyShortUrl = (merchant: MerchantPageData) => {
    const shortUrl = merchant.urls.short;
    if (!shortUrl) return;
    copyToClipboard(getFullUrl(shortUrl), merchant.id);
  };

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <PageHeader
              title="Merchant Pages"
              description="Create and manage public merchant pages"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchMerchants}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn("w-4 h-4", isLoading && "animate-spin")}
                />
              </Button>
              <Button asChild>
                <Link href="/admin/merchants/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Page
                </Link>
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by business name, city, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select
                value={categoryFilter || "all"}
                onValueChange={handleFilterChange(setCategoryFilter)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={completionFilter || "all"}
                onValueChange={handleFilterChange(setCompletionFilter)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split("-");
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder as "asc" | "desc");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt-desc">
                    Updated (newest)
                  </SelectItem>
                  <SelectItem value="updatedAt-asc">
                    Updated (oldest)
                  </SelectItem>
                  <SelectItem value="createdAt-desc">
                    Created (newest)
                  </SelectItem>
                  <SelectItem value="createdAt-asc">
                    Created (oldest)
                  </SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="completion-desc">
                    Completion (high)
                  </SelectItem>
                  <SelectItem value="completion-asc">
                    Completion (low)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {merchants.length === 0 && !isLoading ? (
            <EmptyState
              icon={Store}
              title="No merchant pages yet"
              description="Create your first merchant page to showcase a local business."
              action={
                <Button asChild>
                  <Link href="/admin/merchants/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Page
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              {/* Top Pagination */}
              {totalPages > 1 && (
                <div className="mb-4">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    limit={20}
                    onPageChange={setPage}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border border rounded-lg">
                {merchants.map((merchant) => (
                  <div key={merchant.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">
                          {merchant.businessName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {[merchant.city, merchant.state]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                          merchant.completionPercentage === 100 &&
                            "bg-green-100 text-green-700",
                          merchant.completionPercentage >= 50 &&
                            merchant.completionPercentage < 100 &&
                            "bg-yellow-100 text-yellow-700",
                          merchant.completionPercentage < 50 &&
                            "bg-red-100 text-red-700",
                        )}
                      >
                        {merchant.completionPercentage}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      {merchant.phone && (
                        <span>{formatPhoneNumber(merchant.phone)}</span>
                      )}
                      {merchant.phone && <span>·</span>}
                      <span>{merchant.reviewCount} reviews</span>
                      <span>·</span>
                      <span>
                        Updated{" "}
                        {new Date(merchant.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mb-3 flex items-start gap-2 text-sm text-muted-foreground">
                      <Users className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="min-w-0 truncate">
                        <span className="font-medium text-foreground">
                          Managers:
                        </span>{" "}
                        {getPrimaryManagerName(merchant.owners)}
                        {getAdditionalManagerCount(merchant.owners) > 0 && (
                          <button
                            type="button"
                            className="ml-1 font-medium text-primary underline-offset-2 hover:underline"
                            onClick={() => openOwnerDialog(merchant)}
                          >
                            +{getAdditionalManagerCount(merchant.owners)} more
                          </button>
                        )}
                      </span>
                    </div>

                    {merchant.urls.short && (
                      <div className="flex items-center gap-2 mb-3">
                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                          {getFullUrl(merchant.urls.short)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => copyShortUrl(merchant)}
                        >
                          {copiedId === merchant.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {merchant.urls.full && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={merchant.urls.full}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/admin/merchants/${merchant.id}/merchant-page`}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Merchant Page
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/merchants/${merchant.id}/edit`}>
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openOwnerDialog(merchant)}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Managers
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedMerchant(merchant);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="border rounded-lg hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead className="w-[180px]">Managers</TableHead>
                      <TableHead className="w-[80px] text-center">
                        Complete
                      </TableHead>
                      <TableHead className="w-[70px] text-center">
                        Reviews
                      </TableHead>
                      <TableHead className="w-[120px]">Location</TableHead>
                      <TableHead className="w-[180px]">Short URL</TableHead>
                      <TableHead className="w-[90px]">Updated</TableHead>
                      <TableHead className="w-[180px] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isLoading && merchants.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No merchant pages found
                        </TableCell>
                      </TableRow>
                    ) : (
                      merchants.map((merchant) => (
                        <TableRow key={merchant.id}>
                          <TableCell>
                            <div className="font-medium">
                              {merchant.businessName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {[
                                merchant.categoryName,
                                merchant.phone
                                  ? formatPhoneNumber(merchant.phone)
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <div className="min-w-0">
                                <div
                                  className="truncate text-sm"
                                  title={getOwnerSummary(merchant.owners)}
                                >
                                  {getPrimaryManagerName(merchant.owners)}
                                </div>
                                {getAdditionalManagerCount(merchant.owners) >
                                0 ? (
                                  <button
                                    type="button"
                                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                                    onClick={() => openOwnerDialog(merchant)}
                                  >
                                    +
                                    {getAdditionalManagerCount(merchant.owners)}{" "}
                                    more
                                  </button>
                                ) : (
                                  merchant.owners.length === 1 && (
                                    <div className="text-xs text-muted-foreground">
                                      1 manager
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                merchant.completionPercentage === 100 &&
                                  "bg-green-100 text-green-700",
                                merchant.completionPercentage >= 50 &&
                                  merchant.completionPercentage < 100 &&
                                  "bg-yellow-100 text-yellow-700",
                                merchant.completionPercentage < 50 &&
                                  "bg-red-100 text-red-700",
                              )}
                            >
                              {merchant.completionPercentage}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {merchant.reviewCount}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {[merchant.city, merchant.state]
                              .filter(Boolean)
                              .join(", ")}
                          </TableCell>
                          <TableCell>
                            {merchant.urls.short ? (
                              <div className="flex items-center gap-1">
                                <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[120px]">
                                  {merchant.urls.short}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 flex-shrink-0"
                                  onClick={() => copyShortUrl(merchant)}
                                >
                                  {copiedId === merchant.id ? (
                                    <Check className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(merchant.updatedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {merchant.urls.full && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  asChild
                                >
                                  <a
                                    href={merchant.urls.full}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="View page"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openOwnerDialog(merchant)}
                                title="Assign managers"
                                aria-label={`Assign managers for ${merchant.businessName}`}
                              >
                                <Users className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <Link
                                  href={`/admin/merchants/${merchant.id}/merchant-page`}
                                  title="Merchant Page"
                                >
                                  <FileText className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <Link
                                  href={`/admin/merchants/${merchant.id}/on-air-studio`}
                                  title="On-Air Studio"
                                >
                                  <RadioTower className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <Link
                                  href={`/admin/merchants/${merchant.id}/edit`}
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedMerchant(merchant);
                                  setDeleteDialogOpen(true);
                                }}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    limit={20}
                    onPageChange={setPage}
                    disabled={isLoading}
                  />
                </div>
              )}
            </>
          )}

          {/* Manager Dialog */}
          <Dialog open={ownerDialogOpen} onOpenChange={handleOwnerDialogChange}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Assign Merchant Managers</DialogTitle>
                <DialogDescription>
                  {ownerMerchant?.businessName
                    ? `${ownerMerchant.businessName} dashboard access`
                    : "Manage merchant dashboard access"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div>
                  <div className="flex min-h-[24px] items-center justify-between gap-3">
                    <Label>Current Managers</Label>
                    {isOwnerSaving && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-2">
                    {(ownerMerchant?.owners || []).map((owner) => (
                      <div
                        key={owner.id}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {getOwnerDisplayName(owner)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {owner.email} · {owner.role}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => removeOwner(owner.id)}
                          disabled={
                            isOwnerSaving ||
                            (ownerMerchant?.owners.length || 0) <= 1
                          }
                          title={
                            (ownerMerchant?.owners.length || 0) <= 1
                              ? "At least one manager is required"
                              : "Remove manager"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="merchant-owner-search">
                    Add Existing User
                  </Label>
                  <Input
                    id="merchant-owner-search"
                    value={ownerSearch}
                    onChange={(event) => setOwnerSearch(event.target.value)}
                    placeholder="Search name or email"
                    disabled={isOwnerSaving}
                  />

                  {(isOwnerSearchLoading || ownerResults.length > 0) && (
                    <div className="mt-3 overflow-hidden rounded-lg border">
                      {isOwnerSearchLoading ? (
                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching users
                        </div>
                      ) : (
                        ownerResults.map((owner) => (
                          <button
                            key={owner.id}
                            type="button"
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => addOwner(owner)}
                            disabled={isOwnerSaving}
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-medium">
                                {getOwnerDisplayName(owner)}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {owner.email} · {owner.role}
                              </span>
                            </span>
                            <Plus className="h-4 w-4 shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {!isOwnerSearchLoading &&
                    ownerSearch.trim().length >= 2 &&
                    ownerResults.length === 0 && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No matching assignable users found.
                      </p>
                    )}
                </div>

                {ownerError && (
                  <p className="text-sm text-destructive">{ownerError}</p>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleOwnerDialogChange(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Merchant Page</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the page for &quot;
                  {selectedMerchant?.businessName}&quot;? This action cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
}
