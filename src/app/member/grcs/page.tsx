"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Gift,
  Loader2,
  ChevronRight,
  Calendar,
  Store,
  Lock,
  GripVertical,
} from "lucide-react";
import { memberNavItems } from "../nav";
import { useUser } from "@/hooks/use-user";

interface PendingGRC {
  id: string;
  merchantName: string;
  denomination: number;
  monthsRemaining: number;
  totalRebates: number;
  issuedAt: string;
}

interface ActiveGRC {
  id: string;
  merchantName: string;
  denomination: number;
  monthsRemaining: number;
  groceryStore: string | null;
  startMonth: number | null;
  startYear: number | null;
  registeredAt: string;
  status: string;
}

interface GRCsData {
  hasActiveGrc: boolean;
  pending: PendingGRC[];
  active: ActiveGRC[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MemberGRCsPage() {
  const router = useRouter();
  const { user, userName, isLoading: authLoading, isAuthenticated } = useUser();
  const [grcsData, setGrcsData] = useState<GRCsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag and drop state
  const [pendingGrcs, setPendingGrcs] = useState<PendingGRC[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== "member" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  // Fetch GRCs
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchGRCs() {
      try {
        const grcsRes = await fetch("/api/member/grcs");
        if (!grcsRes.ok) {
          throw new Error("Failed to fetch GRCs");
        }
        const grcs = await grcsRes.json();
        setGrcsData(grcs);
        setPendingGrcs(grcs.pending || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load GRCs");
      } finally {
        setLoading(false);
      }
    }

    fetchGRCs();
  }, [authLoading, isAuthenticated]);

  const handleActivateGRC = (grcId: string) => {
    router.push(`/member?grc=${grcId}`);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());

    // Add slight delay for visual feedback
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = "0.5";
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Only clear if we're actually leaving the list area
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget?.closest("[data-grc-list]")) {
      setDragOverIndex(null);
    }
  };

  // Save order to backend
  const saveGrcOrder = async (grcIds: string[]) => {
    try {
      await fetch("/api/member/grcs/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grcIds }),
      });
    } catch (err) {
      console.error("Failed to save GRC order:", err);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    // Reorder the array
    const newList = [...pendingGrcs];
    const [draggedItem] = newList.splice(draggedIndex, 1);
    newList.splice(dropIndex, 0, draggedItem);

    setPendingGrcs(newList);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Persist order to backend
    saveGrcOrder(newList.map((grc) => grc.id));
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = "1";
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  };

  return (
    <DashboardLayout navItems={memberNavItems}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
        <PageHeader
        title="My GRCs"
        description="View and manage your Grocery Rebate Certificates"
      />

      {error ? (
        <div className="bg-destructive/10 text-destructive rounded-lg p-4">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active GRC */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-500" />
              Active GRC
            </h2>

            {grcsData?.active && grcsData.active.length > 0 ? (
              <div className="bg-card rounded-xl border border-border divide-y divide-border">
                {grcsData.active.map((grc) => (
                  <div
                    key={grc.id}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                          <Gift className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">{grc.merchantName}</h3>
                          <p className="text-sm text-muted-foreground">
                            ${grc.denomination} &middot; {grc.monthsRemaining} months remaining
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/member")}
                        className="flex-shrink-0"
                      >
                        View Progress
                      </Button>
                    </div>

                    {(grc.groceryStore || (grc.startMonth && grc.startYear)) && (
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm text-muted-foreground">
                        {grc.groceryStore && (
                          <div className="flex items-center gap-1.5">
                            <Store className="w-4 h-4" />
                            <span className="truncate max-w-[200px]">{grc.groceryStore}</span>
                          </div>
                        )}
                        {grc.startMonth && grc.startYear && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>Started {MONTH_NAMES[grc.startMonth - 1]} {grc.startYear}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No active GRC</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Activate a pending GRC to start earning rebates
                </p>
              </div>
            )}
          </section>

          {/* Pending GRCs */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-orange-500" />
              Pending GRCs
              {pendingGrcs.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">
                  {pendingGrcs.length} available
                </span>
              )}
            </h2>

            {pendingGrcs.length > 0 ? (
              <>
                {pendingGrcs.length > 1 && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Drag to set your preferred order. The first GRC in the list will activate next when your current one ends.
                  </p>
                )}
                <div
                  className="bg-card rounded-xl border border-border divide-y divide-border"
                  data-grc-list
                >
                {pendingGrcs.map((grc, index) => (
                  <div
                    key={grc.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-4 transition-all cursor-grab active:cursor-grabbing ${
                      dragOverIndex === index && draggedIndex !== index
                        ? "bg-primary/10 border-l-4 border-l-primary"
                        : "hover:bg-muted/50"
                    } ${draggedIndex === index ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Position Number + Drag Handle */}
                      {pendingGrcs.length > 1 && (
                        <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                          <span className="w-5 h-5 rounded-full bg-muted text-xs font-medium flex items-center justify-center">
                            {index + 1}
                          </span>
                          <GripVertical className="w-5 h-5" />
                        </div>
                      )}

                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                        <Gift className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">{grc.merchantName}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${grc.denomination} &middot; {grc.monthsRemaining} months &middot;{" "}
                          <span className="text-green-600 dark:text-green-400">
                            ${grc.totalRebates} rebates
                          </span>
                        </p>
                      </div>
                    </div>

                    {grcsData?.hasActiveGrc ? (
                      <Button variant="outline" disabled className="flex-shrink-0">
                        <Lock className="w-4 h-4 mr-2" />
                        Locked
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleActivateGRC(grc.id)}
                        className="flex-shrink-0"
                      >
                        Activate
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                ))}
                </div>
              </>
            ) : (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No pending GRCs</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When a merchant sends you a GRC, it will appear here
                </p>
              </div>
            )}
          </section>
        </div>
      )}
        </>
      )}
    </DashboardLayout>
  );
}
