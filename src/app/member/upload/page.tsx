"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Camera,
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Store,
  DollarSign,
  Calendar,
  Receipt,
  AlertTriangle,
  Trash2,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { memberNavItems } from "../nav";
import { useUser } from "@/hooks/use-user";

type UploadStatus = "pending" | "uploading" | "analyzing" | "complete" | "error" | "warning";

interface ImageItem {
  id: string;
  dataUrl: string;
  status: UploadStatus;
  result?: {
    receiptId?: string;
    amount?: number | null;
    extractedStoreName?: string | null;
    storeMismatch?: boolean;
    dateMismatch?: boolean;
    receiptDate?: string | null;
  };
  error?: string;
  warnings?: string[];
  pendingValidation?: {
    skippedReceiptId: string; // ID from skipped_receipts table
    validationResult: ValidationResult;
    warnings: string[];
    imageUrl: string;
  };
}

interface ActiveGRC {
  id: string;
  merchantName: string;
  denomination: number;
  groceryStore: string | null;
}

interface MonthlyProgress {
  approvedTotal: number;
  pendingTotal: number;
  targetAmount: number;
  receiptsThisMonth: number;
}

interface ValidationResult {
  amount: number | null;
  receiptDate: string | null;
  extractedStoreName: string | null;
  storeMismatch: boolean;
  dateMismatch: boolean;
}

export default function UploadReceiptPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const [activeGrc, setActiveGrc] = useState<ActiveGRC | null>(null);
  const [loading, setLoading] = useState(true);

  // Monthly progress state
  const [monthlyProgress, setMonthlyProgress] = useState<MonthlyProgress | null>(null);

  // Image queue state
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Warning dialog state
  const [warningImageId, setWarningImageId] = useState<string | null>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== "member" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  // Fetch active GRC
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchGRCs() {
      try {
        const grcsRes = await fetch("/api/member/grcs");
        if (grcsRes.ok) {
          const grcs = await grcsRes.json();
          if (grcs.active && grcs.active.length > 0) {
            setActiveGrc(grcs.active[0]);
          }
        }
      } catch {
        console.error("Failed to fetch GRCs");
      } finally {
        setLoading(false);
      }
    }

    fetchGRCs();
  }, [authLoading, isAuthenticated]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addImages = useCallback((dataUrls: string[]) => {
    const newImages: ImageItem[] = dataUrls.map((dataUrl) => ({
      id: generateId(),
      dataUrl,
      status: "pending" as UploadStatus,
    }));
    setImages((prev) => [...prev, ...newImages]);
    setCameraError(null);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const clearAllImages = useCallback(() => {
    setImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsCapturing(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setIsCapturing(false);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setCameraError("Camera access denied. Please allow camera access and try again.");
        } else if (err.name === "NotFoundError") {
          setCameraError("No camera found on this device.");
        } else {
          setCameraError("Failed to access camera. Try uploading a photo instead.");
        }
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      addImages([dataUrl]);
      stopCamera();
    }
  }, [stopCamera, addImages]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        return false;
      }
      if (file.size > 20 * 1024 * 1024) {
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      setCameraError("No valid images selected. Images must be under 20MB.");
      return;
    }

    if (validFiles.length < files.length) {
      setCameraError(`${files.length - validFiles.length} file(s) skipped (invalid format or too large).`);
    }

    const readPromises = validFiles.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readPromises)
      .then((dataUrls) => {
        addImages(dataUrls);
      })
      .catch(() => {
        setCameraError("Failed to read some files.");
      });

    // Reset input to allow selecting the same files again
    if (e.target) {
      e.target.value = "";
    }
  }, [addImages]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= 20 * 1024 * 1024
    );

    if (validFiles.length === 0) {
      setCameraError("No valid images dropped. Images must be under 20MB.");
      return;
    }

    const readPromises = validFiles.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readPromises).then((dataUrls) => {
      addImages(dataUrls);
    });
  }, [addImages]);

  const uploadSingleImage = async (imageId: string, acknowledgeWarnings = false) => {
    if (!activeGrc) return;

    const image = images.find((img) => img.id === imageId);
    if (!image) return;

    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, status: "uploading" as UploadStatus } : img
      )
    );

    try {
      // Brief delay for UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, status: "analyzing" as UploadStatus } : img
        )
      );

      const res = await fetch("/api/member/receipts/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grcId: activeGrc.id,
          image: image.dataUrl,
          acknowledgeWarnings,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId
              ? { ...img, status: "error" as UploadStatus, error: data.error || "Upload failed" }
              : img
          )
        );
        return;
      }

      // Check if validation warnings require confirmation
      if (data.requiresConfirmation) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId
              ? {
                  ...img,
                  status: "warning" as UploadStatus,
                  pendingValidation: {
                    skippedReceiptId: data.skippedReceiptId,
                    validationResult: data.validationResult,
                    warnings: data.warnings,
                    imageUrl: data.validationResult.imageUrl,
                  },
                  warnings: data.warnings,
                }
              : img
          )
        );
        setWarningImageId(imageId);
        setShowWarningDialog(true);
        return;
      }

      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                status: "complete" as UploadStatus,
                result: {
                  receiptId: data.receipt.id,
                  amount: data.receipt.amount,
                  extractedStoreName: data.receipt.extractedStoreName,
                  storeMismatch: data.receipt.storeMismatch,
                  dateMismatch: data.receipt.dateMismatch,
                  receiptDate: data.receipt.receiptDate,
                },
              }
            : img
        )
      );
    } catch (err) {
      console.error("Upload error:", err);
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? { ...img, status: "error" as UploadStatus, error: "Network error. Please try again." }
            : img
        )
      );
    }
  };

  const handleUploadAll = async () => {
    const pendingImages = images.filter((img) => img.status === "pending");
    if (pendingImages.length === 0 || !activeGrc) return;

    setIsUploading(true);

    for (const image of pendingImages) {
      await uploadSingleImage(image.id);
      // Check if we hit a warning dialog and need to pause
      const currentImage = images.find((img) => img.id === image.id);
      if (currentImage?.status === "warning") {
        break;
      }
    }

    setIsUploading(false);
  };

  const handleConfirmWarning = async () => {
    if (!warningImageId || !activeGrc) return;

    const image = images.find((img) => img.id === warningImageId);
    if (!image?.pendingValidation?.skippedReceiptId) return;

    setShowWarningDialog(false);

    // Update status to show we're processing
    setImages((prev) =>
      prev.map((img) =>
        img.id === warningImageId ? { ...img, status: "uploading" as UploadStatus } : img
      )
    );

    try {
      // Confirm the skipped receipt using its ID
      const res = await fetch("/api/member/receipts/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grcId: activeGrc.id,
          acknowledgeWarnings: true,
          skippedReceiptId: image.pendingValidation.skippedReceiptId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === warningImageId
              ? { ...img, status: "error" as UploadStatus, error: data.error || "Upload failed" }
              : img
          )
        );
      } else {
        setImages((prev) =>
          prev.map((img) =>
            img.id === warningImageId
              ? {
                  ...img,
                  status: "complete" as UploadStatus,
                  result: {
                    receiptId: data.receipt.id,
                    amount: data.receipt.amount,
                    extractedStoreName: data.receipt.extractedStoreName,
                    storeMismatch: data.receipt.storeMismatch,
                    dateMismatch: data.receipt.dateMismatch,
                    receiptDate: data.receipt.receiptDate,
                  },
                }
              : img
          )
        );
      }
    } catch (err) {
      console.error("Confirm upload error:", err);
      setImages((prev) =>
        prev.map((img) =>
          img.id === warningImageId
            ? { ...img, status: "error" as UploadStatus, error: "Network error" }
            : img
        )
      );
    }

    setWarningImageId(null);

    // Continue with remaining uploads
    const remainingImages = images.filter(
      (img) => img.status === "pending" && img.id !== warningImageId
    );
    if (remainingImages.length > 0) {
      setIsUploading(true);
      for (const remainingImage of remainingImages) {
        await uploadSingleImage(remainingImage.id);
      }
      setIsUploading(false);
    }
  };

  const handleSkipWarning = async () => {
    if (!warningImageId) return;

    setShowWarningDialog(false);

    // Remove the image from the queue - the skipped_receipts record stays in DB
    // so user can re-upload the same receipt later (will be detected and allowed)
    setImages((prev) => prev.filter((img) => img.id !== warningImageId));
    setWarningImageId(null);

    // Continue with remaining uploads
    const remainingImages = images.filter(
      (img) => img.status === "pending" && img.id !== warningImageId
    );
    if (remainingImages.length > 0) {
      setIsUploading(true);
      for (const remainingImage of remainingImages) {
        await uploadSingleImage(remainingImage.id);
      }
      setIsUploading(false);
    }
  };

  const pendingCount = images.filter((img) => img.status === "pending").length;
  const completedCount = images.filter((img) => img.status === "complete").length;
  const errorCount = images.filter((img) => img.status === "error").length;
  const processingCount = images.filter((img) => img.status === "uploading" || img.status === "analyzing").length;
  const warningImage = warningImageId ? images.find((img) => img.id === warningImageId) : null;

  // Loading or No active GRC
  if (loading || !activeGrc) {
    return (
      <DashboardLayout navItems={memberNavItems}>
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <PageHeader title="Upload Receipt" description="Submit your grocery receipts" />

            <div className="bg-card rounded-xl border p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No Active GRC</h2>
              <p className="text-muted-foreground mb-6">You need an active GRC to upload receipts.</p>
              <Button onClick={() => router.push("/member/grcs")}>View My GRCs</Button>
            </div>
          </>
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={memberNavItems}>
      <PageHeader
        title="Upload Receipts"
        description={`Submit receipts from ${activeGrc.groceryStore || "your grocery store"}`}
      />

      {/* Monthly Progress Card */}
      {monthlyProgress && (
        <div className="bg-card rounded-xl border p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">This Month's Progress</h3>
            <span className="text-sm text-muted-foreground">
              {monthlyProgress.receiptsThisMonth} receipt{monthlyProgress.receiptsThisMonth !== 1 ? "s" : ""} submitted
            </span>
          </div>
          <ProgressBar
            value={monthlyProgress.approvedTotal + monthlyProgress.pendingTotal}
            max={monthlyProgress.targetAmount}
            label="Monthly target"
          />
          {monthlyProgress.pendingTotal > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              ${monthlyProgress.pendingTotal.toFixed(2)} pending review
            </p>
          )}
        </div>
      )}

      {/* Upload Summary */}
      {images.length > 0 && (
        <div className="bg-card rounded-xl border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium">{images.length} receipt{images.length !== 1 ? "s" : ""}</span>
              {pendingCount > 0 && (
                <span className="text-muted-foreground">{pendingCount} pending</span>
              )}
              {processingCount > 0 && (
                <span className="text-blue-600">{processingCount} processing</span>
              )}
              {completedCount > 0 && (
                <span className="text-green-600">{completedCount} complete</span>
              )}
              {errorCount > 0 && (
                <span className="text-red-600">{errorCount} failed</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearAllImages} disabled={isUploading}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
              {pendingCount > 0 && (
                <Button size="sm" onClick={handleUploadAll} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit for Review ({pendingCount})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera Error */}
      {cameraError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">{cameraError}</p>
        </div>
      )}

      <div className="bg-card rounded-xl border p-6">
        {/* Camera View */}
        {isCapturing && (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={stopCamera}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={capturePhoto}>
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            </div>
          </div>
        )}

        {/* Image Grid Preview */}
        {images.length > 0 && !isCapturing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden group"
                >
                  <img
                    src={image.dataUrl}
                    alt="Receipt"
                    className="w-full h-full object-cover"
                  />

                  {/* Status overlay */}
                  {image.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white mb-1" />
                      <span className="text-xs text-white">Uploading...</span>
                    </div>
                  )}
                  {image.status === "analyzing" && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white mb-1" />
                      <span className="text-xs text-white">Analyzing...</span>
                    </div>
                  )}
                  {image.status === "complete" && (
                    <div className="absolute inset-0 bg-green-600/80 flex flex-col items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white mb-1" />
                      <span className="text-xs text-white font-medium">
                        {image.result?.amount ? `$${image.result.amount.toFixed(2)}` : "Done"}
                      </span>
                    </div>
                  )}
                  {image.status === "error" && (
                    <div className="absolute inset-0 bg-red-600/80 flex flex-col items-center justify-center p-2">
                      <AlertCircle className="w-6 h-6 text-white mb-1" />
                      <span className="text-xs text-white text-center">{image.error || "Failed"}</span>
                    </div>
                  )}
                  {image.status === "warning" && (
                    <div className="absolute inset-0 bg-yellow-600/80 flex flex-col items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white mb-1" />
                      <span className="text-xs text-white">Needs Review</span>
                    </div>
                  )}

                  {/* Remove button (only for pending) */}
                  {image.status === "pending" && (
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}

                  {/* Pending indicator */}
                  {image.status === "pending" && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-1 px-2">
                      <span className="text-xs text-white">Ready</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Add more button */}
              <label className="aspect-[3/4] bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/80 transition-colors cursor-pointer flex flex-col items-center justify-center">
                <Plus className="w-8 h-8 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Add More</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={startCamera}>
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
              {completedCount === images.length && images.length > 0 && (
                <Button onClick={() => router.push("/member/receipts")}>
                  <Receipt className="w-4 h-4 mr-2" />
                  View Receipts
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Initial State - Capture Options */}
        {!isCapturing && images.length === 0 && (
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="space-y-6 relative"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Add Your Receipts</h2>
              <p className="text-sm text-muted-foreground">
                Take photos or upload multiple images at once
              </p>
            </div>

            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all ${
                isDragging ? "opacity-50 scale-[0.98]" : ""
              }`}
            >
              <button
                onClick={startCamera}
                className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <Camera className="w-10 h-10 text-muted-foreground mb-3" />
                <span className="font-medium">Take Photo</span>
                <span className="text-sm text-muted-foreground">Use your camera</span>
              </button>

              <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
                <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                <span className="font-medium">Upload Photos</span>
                <span className="text-sm text-muted-foreground">Select multiple or drag & drop</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
                  <p className="font-medium text-primary">Drop your receipts here</p>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Tips for good receipt photos:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Make sure the entire receipt is visible</li>
                <li>- Ensure good lighting and avoid shadows</li>
                <li>- Keep the receipt flat and unwrinkled</li>
                <li>- The total amount should be clearly readable</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="w-14 h-14 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
            </div>
            <DialogTitle className="text-center text-xl">Receipt Needs Review</DialogTitle>
            <DialogDescription className="text-center text-base">
              We found some issues with this receipt. You can still submit it, but it will be flagged for admin review.
            </DialogDescription>
          </DialogHeader>

          {warningImage?.pendingValidation && (
            <div className="space-y-4">
              {/* Warnings */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <ul className="space-y-2">
                  {warningImage.pendingValidation.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2 text-base text-yellow-700 dark:text-yellow-300">
                      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Detected Receipt Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Detected Receipt Info:</p>
                <div className="grid grid-cols-2 gap-3 text-base">
                  {warningImage.pendingValidation.validationResult.amount && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">
                        ${warningImage.pendingValidation.validationResult.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {warningImage.pendingValidation.validationResult.extractedStoreName && (
                    <div className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-muted-foreground" />
                      <span>{warningImage.pendingValidation.validationResult.extractedStoreName}</span>
                    </div>
                  )}
                  {warningImage.pendingValidation.validationResult.receiptDate && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <span>
                        {new Date(warningImage.pendingValidation.validationResult.receiptDate).toLocaleDateString(
                          "en-US",
                          { month: "long", day: "numeric", year: "numeric" }
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={handleSkipWarning}>
              <X className="w-4 h-4 mr-2" />
              Skip This Receipt
            </Button>
            <Button onClick={handleConfirmWarning} className="bg-yellow-600 hover:bg-yellow-700 text-white">
              <Upload className="w-4 h-4 mr-2" />
              Submit Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
