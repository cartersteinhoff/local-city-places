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
  RotateCcw,
  Image as ImageIcon,
  Store,
  DollarSign,
  Calendar,
  Receipt,
  AlertTriangle,
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

type UploadStage = "idle" | "uploading" | "analyzing" | "complete" | "error";

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

interface RecentReceipt {
  id: string;
  amount: number | null;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

interface UploadResult {
  success: boolean;
  receipt?: {
    id: string;
    amount: number | null;
    extractedStoreName: string | null;
    storeMismatch: boolean;
    dateMismatch: boolean;
    receiptDate: string | null;
  };
  error?: string;
}

interface ValidationResult {
  amount: number | null;
  receiptDate: string | null;
  extractedStoreName: string | null;
  storeMismatch: boolean;
  dateMismatch: boolean;
}

interface PendingValidation {
  validationResult: ValidationResult;
  warnings: string[];
  imageUrl: string;
}

export default function UploadReceiptPage() {
  const router = useRouter();
  const { user, userName, isLoading: authLoading, isAuthenticated } = useUser();
  const [activeGrc, setActiveGrc] = useState<ActiveGRC | null>(null);
  const [loading, setLoading] = useState(true);

  // Monthly progress state
  const [monthlyProgress, setMonthlyProgress] = useState<MonthlyProgress | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<RecentReceipt[]>([]);

  // Image capture state
  const [imageData, setImageData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Upload state
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // Warning dialog state
  const [pendingValidation, setPendingValidation] = useState<PendingValidation | null>(null);
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

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsCapturing(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Prefer back camera on mobile
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

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setImageData(dataUrl);
      stopCamera();
    }
  }, [stopCamera]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setCameraError("Please select an image file.");
      return;
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      setCameraError("Image too large. Maximum size is 20MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageData(event.target?.result as string);
      setCameraError(null);
    };
    reader.onerror = () => {
      setCameraError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = useCallback(() => {
    setImageData(null);
    setUploadResult(null);
    setCameraError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

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

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCameraError("Please drop an image file.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setCameraError("Image too large. Maximum size is 20MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageData(event.target?.result as string);
      setCameraError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = async (acknowledgeWarnings = false) => {
    if (!imageData || !activeGrc) return;

    setUploadStage("uploading");
    setUploadResult(null);

    try {
      // Simulate upload stage (actual upload happens in one request)
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUploadStage("analyzing");

      const res = await fetch("/api/member/receipts/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grcId: activeGrc.id,
          image: imageData,
          acknowledgeWarnings,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadStage("error");
        setUploadResult({
          success: false,
          error: data.error || "Upload failed",
        });
        return;
      }

      // Check if validation warnings require confirmation
      if (data.requiresConfirmation) {
        setUploadStage("idle");
        setPendingValidation({
          validationResult: data.validationResult,
          warnings: data.warnings,
          imageUrl: data.imageUrl,
        });
        setShowWarningDialog(true);
        return;
      }

      setUploadStage("complete");
      setUploadResult({
        success: true,
        receipt: data.receipt,
      });
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStage("error");
      setUploadResult({
        success: false,
        error: "Network error. Please try again.",
      });
    }
  };

  const handleConfirmSubmit = async () => {
    setShowWarningDialog(false);
    await handleUpload(true);
  };

  const handleCancelWarning = () => {
    setShowWarningDialog(false);
    setPendingValidation(null);
  };

  const isProcessing = uploadStage === "uploading" || uploadStage === "analyzing";

  // Loading or No active GRC
  if (loading || !activeGrc) {
    return (
      <DashboardLayout
        navItems={memberNavItems}
        userEmail={user?.email}
        userName={userName}
        userRole={user?.role ?? "member"}
      >
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <PageHeader
          title="Upload Receipt"
          description="Submit your grocery receipts"
        />

        <div className="bg-card rounded-xl border p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Active GRC</h2>
          <p className="text-muted-foreground mb-6">
            You need an active GRC to upload receipts.
          </p>
          <Button onClick={() => router.push("/member/grcs")}>
            View My GRCs
          </Button>
        </div>
          </>
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      navItems={memberNavItems}
      userEmail={user?.email}
      userName={userName}
      userRole={user?.role ?? "member"}
    >
      <PageHeader
        title="Upload Receipt"
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

      {/* Success State */}
      {uploadResult?.success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Receipt Uploaded Successfully
              </h3>

              {/* Extracted details */}
              <div className="flex flex-wrap gap-4 text-sm text-green-700 dark:text-green-300 mb-3">
                {uploadResult.receipt?.amount && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">${uploadResult.receipt.amount.toFixed(2)}</span>
                  </div>
                )}
                {uploadResult.receipt?.extractedStoreName && (
                  <div className="flex items-center gap-1.5">
                    <Store className="w-4 h-4" />
                    <span>{uploadResult.receipt.extractedStoreName}</span>
                  </div>
                )}
                {uploadResult.receipt?.receiptDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(uploadResult.receipt.receiptDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {(uploadResult.receipt?.storeMismatch || uploadResult.receipt?.dateMismatch) && (
                <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg px-3 py-2 mb-3 space-y-1">
                  {uploadResult.receipt?.storeMismatch && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      <AlertCircle className="w-4 h-4 inline mr-1.5" />
                      Store name doesn't match your registered grocery store.
                    </p>
                  )}
                  {uploadResult.receipt?.dateMismatch && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      <AlertCircle className="w-4 h-4 inline mr-1.5" />
                      Receipt date is not from the current month.
                    </p>
                  )}
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    This receipt has been flagged for admin review.
                  </p>
                </div>
              )}

              {!uploadResult.receipt?.amount && (
                <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                  We couldn't automatically read the total. An admin will review this receipt.
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearImage();
                    setUploadStage("idle");
                  }}
                  className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Upload Another
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push("/member")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  View Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {uploadResult && !uploadResult.success && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                Upload Failed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {uploadResult.error}
              </p>
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

        {/* Image Preview */}
        {imageData && !isCapturing && !uploadResult?.success && (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
              <img
                src={imageData}
                alt="Receipt preview"
                className="w-full h-full object-contain"
              />
              {/* Processing overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-white mb-3" />
                  <p className="text-white font-medium">
                    {uploadStage === "uploading" ? "Uploading..." : "Analyzing receipt..."}
                  </p>
                  <p className="text-white/70 text-sm mt-1">
                    {uploadStage === "uploading"
                      ? "Sending your image"
                      : "Reading receipt details"}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={clearImage} disabled={isProcessing}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button onClick={() => handleUpload()} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadStage === "uploading" ? "Uploading..." : "Analyzing..."}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Receipt
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Initial State - Capture Options */}
        {!isCapturing && !imageData && (
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Add Your Receipt</h2>
              <p className="text-sm text-muted-foreground">
                Take a photo, upload, or drag and drop an image
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
                <span className="font-medium">Upload Photo</span>
                <span className="text-sm text-muted-foreground">Or drag & drop</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
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
                  <p className="font-medium text-primary">Drop your receipt here</p>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Tips for a good receipt photo:</h3>
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
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <DialogTitle className="text-center">Receipt Needs Review</DialogTitle>
            <DialogDescription className="text-center">
              We found some issues with this receipt. You can still submit it, but it will be flagged for admin review.
            </DialogDescription>
          </DialogHeader>

          {pendingValidation && (
            <div className="space-y-4">
              {/* Warnings */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <ul className="space-y-2">
                  {pendingValidation.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Detected Receipt Info */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Detected Receipt Info:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {pendingValidation.validationResult.amount && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">${pendingValidation.validationResult.amount.toFixed(2)}</span>
                    </div>
                  )}
                  {pendingValidation.validationResult.extractedStoreName && (
                    <div className="flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-muted-foreground" />
                      <span>{pendingValidation.validationResult.extractedStoreName}</span>
                    </div>
                  )}
                  {pendingValidation.validationResult.receiptDate && (
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(pendingValidation.validationResult.receiptDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={handleCancelWarning}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Cancel & Retake
            </Button>
            <Button onClick={handleConfirmSubmit} className="bg-yellow-600 hover:bg-yellow-700 text-white">
              <Upload className="w-4 h-4 mr-2" />
              Submit Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
