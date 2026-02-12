"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Store,
  Search,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../nav";
import { formatPhoneNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
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
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantPageData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  }, [page, debouncedSearch, categoryFilter, completionFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchMerchants();
    }
  }, [authLoading, isAuthenticated, fetchMerchants]);

  // Reset page when filters change
  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value === "all" ? "" : value);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!selectedMerchant) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/merchant-pages/${selectedMerchant.id}`, {
        method: "DELETE",
      });
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
              <Button variant="outline" size="icon" onClick={fetchMerchants} disabled={isLoading}>
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
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
              <Select value={categoryFilter || "all"} onValueChange={handleFilterChange(setCategoryFilter)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={completionFilter || "all"} onValueChange={handleFilterChange(setCompletionFilter)}>
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
                  <SelectItem value="updatedAt-desc">Updated (newest)</SelectItem>
                  <SelectItem value="updatedAt-asc">Updated (oldest)</SelectItem>
                  <SelectItem value="createdAt-desc">Created (newest)</SelectItem>
                  <SelectItem value="createdAt-asc">Created (oldest)</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="completion-desc">Completion (high)</SelectItem>
                  <SelectItem value="completion-asc">Completion (low)</SelectItem>
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
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border border rounded-lg">
                {merchants.map((merchant) => (
                  <div key={merchant.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{merchant.businessName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {[merchant.city, merchant.state].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                        merchant.completionPercentage === 100 && "bg-green-100 text-green-700",
                        merchant.completionPercentage >= 50 && merchant.completionPercentage < 100 && "bg-yellow-100 text-yellow-700",
                        merchant.completionPercentage < 50 && "bg-red-100 text-red-700"
                      )}>
                        {merchant.completionPercentage}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      {merchant.phone && <span>{formatPhoneNumber(merchant.phone)}</span>}
                      {merchant.phone && <span>·</span>}
                      <span>{merchant.reviewCount} reviews</span>
                      <span>·</span>
                      <span>Updated {new Date(merchant.updatedAt).toLocaleDateString()}</span>
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
                          onClick={() => copyToClipboard(getFullUrl(merchant.urls.short!), merchant.id)}
                        >
                          {copiedId === merchant.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {merchant.urls.full && (
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <a href={merchant.urls.full} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/admin/merchants/${merchant.id}/edit`}>
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
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
                      <TableHead className="w-[80px] text-center">Complete</TableHead>
                      <TableHead className="w-[70px] text-center">Reviews</TableHead>
                      <TableHead className="w-[120px]">Location</TableHead>
                      <TableHead className="w-[180px]">Short URL</TableHead>
                      <TableHead className="w-[90px]">Updated</TableHead>
                      <TableHead className="w-[110px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isLoading && merchants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          No merchant pages found
                        </TableCell>
                      </TableRow>
                    ) : (
                      merchants.map((merchant) => (
                        <TableRow key={merchant.id}>
                          <TableCell>
                            <div className="font-medium">{merchant.businessName}</div>
                            <div className="text-sm text-muted-foreground">
                              {[merchant.categoryName, merchant.phone ? formatPhoneNumber(merchant.phone) : null].filter(Boolean).join(" · ")}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                              merchant.completionPercentage === 100 && "bg-green-100 text-green-700",
                              merchant.completionPercentage >= 50 && merchant.completionPercentage < 100 && "bg-yellow-100 text-yellow-700",
                              merchant.completionPercentage < 50 && "bg-red-100 text-red-700"
                            )}>
                              {merchant.completionPercentage}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {merchant.reviewCount}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {[merchant.city, merchant.state].filter(Boolean).join(", ")}
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
                                  onClick={() => copyToClipboard(getFullUrl(merchant.urls.short!), merchant.id)}
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
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <a href={merchant.urls.full} target="_blank" rel="noopener noreferrer" title="View page">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <Link href={`/admin/merchants/${merchant.id}/edit`} title="Edit">
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

          {/* Delete Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Merchant Page</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the page for &quot;{selectedMerchant?.businessName}&quot;? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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
