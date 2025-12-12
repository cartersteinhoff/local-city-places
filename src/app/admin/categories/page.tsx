"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
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
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard,
  ClipboardCheck,
  CreditCard,
  Users,
  FolderOpen,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Receipt,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Moderation", href: "/admin/moderation", icon: ClipboardCheck },
  { label: "Orders", href: "/admin/orders", icon: Receipt },
  { label: "Gift Cards", href: "/admin/gift-cards", icon: CreditCard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

interface CategoryData {
  id: string;
  name: string;
  createdAt: string;
  merchantCount: number;
}

export default function CategoriesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchCategories();
    }
  }, [authLoading, isAuthenticated]);

  const handleAdd = async () => {
    if (!categoryName.trim()) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName }),
      });
      if (res.ok) {
        setAddDialogOpen(false);
        setCategoryName("");
        await fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Failed to add category");
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory || !categoryName.trim()) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName }),
      });
      if (res.ok) {
        setEditDialogOpen(false);
        setSelectedCategory(null);
        setCategoryName("");
        await fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteDialogOpen(false);
        setSelectedCategory(null);
        await fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    } finally {
      setProcessing(false);
    }
  };

  const openEditDialog = (category: CategoryData) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (category: CategoryData) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
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
              title="Categories"
              description="Manage business categories for merchants"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchCategories} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button onClick={() => { setCategoryName(""); setAddDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="border rounded-lg">
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No categories yet"
              description="Create your first category to organize merchants."
              action={
                <Button onClick={() => { setCategoryName(""); setAddDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              }
            />
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[120px] text-center">Merchants</TableHead>
                    <TableHead className="w-[150px]">Created</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-center">{category.merchantCount}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(category)}
                            title="Edit category"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(category)}
                            title="Delete category"
                            disabled={category.merchantCount > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Add Dialog */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Category</DialogTitle>
                <DialogDescription>
                  Create a new business category for merchants.
                </DialogDescription>
              </DialogHeader>
              <div>
                <Label>Category Name</Label>
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Restaurants, Retail, Services..."
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={!categoryName.trim() || processing}>
                  {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Update the category name.
                </DialogDescription>
              </DialogHeader>
              <div>
                <Label>Category Name</Label>
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Category name..."
                  onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEdit} disabled={!categoryName.trim() || processing}>
                  {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Category</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete &quot;{selectedCategory?.name}&quot;? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                  {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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
