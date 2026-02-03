"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Loader2, AlertCircle, RefreshCw, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | null) => void;
  onUpload: (file: File) => Promise<string>;
  aspectRatio?: "square" | "video" | "auto";
  maxSize?: number; // in bytes, default 10MB
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

type UploadState = "idle" | "dragging" | "uploading" | "error";

export function ImageUploader({
  value,
  onChange,
  onUpload,
  aspectRatio = "auto",
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  placeholder = "Drag image here or click to browse",
  disabled = false,
}: ImageUploaderProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);

  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "",
  }[aspectRatio];

  const validateFile = useCallback((file: File): string | null => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return "Invalid file type. Use JPEG, PNG, WebP, or GIF.";
    }
    if (file.size > maxSize) {
      return `File too large. Max size is ${Math.round(maxSize / 1024 / 1024)}MB.`;
    }
    return null;
  }, [maxSize]);

  const handleUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setState("error");
      return;
    }

    // Create preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setState("uploading");
    setError("");
    setProgress(0);
    pendingFileRef.current = file;

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90));
    }, 200);

    try {
      const url = await onUpload(file);
      clearInterval(progressInterval);
      setProgress(100);
      onChange(url);
      setPreviewUrl(null);
      setState("idle");
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Upload failed");
      setState("error");
    }
  }, [validateFile, onUpload, onChange]);

  const handleRetry = useCallback(() => {
    if (pendingFileRef.current) {
      handleUpload(pendingFileRef.current);
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setState("dragging");
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("idle");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("idle");
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
    }
  }, [disabled, handleUpload]);

  const handleClick = useCallback(() => {
    if (!disabled && state !== "uploading") {
      fileInputRef.current?.click();
    }
  }, [disabled, state]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  }, [handleUpload]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setPreviewUrl(null);
    setState("idle");
    setError("");
  }, [onChange]);

  const displayUrl = previewUrl || value;

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg transition-colors cursor-pointer",
        state === "dragging" && "border-primary bg-primary/5",
        state === "error" && "border-destructive",
        state === "idle" && !displayUrl && "border-muted-foreground/25 hover:border-muted-foreground/50",
        displayUrl && "border-transparent",
        disabled && "opacity-50 cursor-not-allowed",
        aspectRatioClass,
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {displayUrl ? (
        // Image preview
        <div className="relative w-full h-full min-h-[120px]">
          <img
            src={displayUrl}
            alt="Preview"
            className={cn(
              "w-full h-full object-cover rounded-lg",
              state === "uploading" && "opacity-50 blur-sm"
            )}
          />

          {/* Uploading overlay */}
          {state === "uploading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-lg">
              <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
              <span className="text-white text-sm font-medium">{progress}%</span>
            </div>
          )}

          {/* Remove button */}
          {state !== "uploading" && !disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Replace hint */}
          {state === "idle" && !disabled && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg">
              <p className="text-white text-xs text-center">Click or drag to replace</p>
            </div>
          )}
        </div>
      ) : state === "error" ? (
        // Error state
        <div className="flex flex-col items-center justify-center p-6 min-h-[120px]">
          <AlertCircle className="w-8 h-8 text-destructive mb-2" />
          <p className="text-sm text-destructive text-center mb-2">{error}</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleRetry(); }}
            className="flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      ) : state === "dragging" ? (
        // Dragging state
        <div className="flex flex-col items-center justify-center p-6 min-h-[120px]">
          <Upload className="w-8 h-8 text-primary mb-2" />
          <p className="text-sm text-primary font-medium">Drop to upload</p>
        </div>
      ) : (
        // Default state
        <div className="flex flex-col items-center justify-center p-6 min-h-[120px]">
          <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center">{placeholder}</p>
          <p className="text-xs text-muted-foreground mt-1">Max {Math.round(maxSize / 1024 / 1024)}MB</p>
        </div>
      )}
    </div>
  );
}

// Multi-image gallery uploader
interface GalleryUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  onUpload: (file: File) => Promise<string>;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

export function GalleryUploader({
  value,
  onChange,
  onUpload,
  maxSize = 10 * 1024 * 1024,
  className,
  disabled = false,
}: GalleryUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { progress: number; preview: string; error?: string }>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadingFiles((prev) => new Map(prev).set(id, {
        progress: 0,
        preview: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadingFiles((prev) => {
        const current = prev.get(id);
        if (current && current.progress < 90) {
          return new Map(prev).set(id, { ...current, progress: current.progress + 10 });
        }
        return prev;
      });
    }, 200);

    try {
      const url = await onUpload(file);
      clearInterval(progressInterval);
      setUploadingFiles((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      onChange([...value, url]);
    } catch (err) {
      clearInterval(progressInterval);
      setUploadingFiles((prev) => {
        const current = prev.get(id);
        if (current) {
          return new Map(prev).set(id, {
            ...current,
            error: err instanceof Error ? err.message : "Upload failed"
          });
        }
        return prev;
      });
    }
  }, [value, onChange, onUpload]);

  const handleFiles = useCallback((files: FileList) => {
    Array.from(files).forEach(handleUpload);
  }, [handleUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  const handleRemove = useCallback((index: number) => {
    onChange(value.filter((_, i) => i !== index));
  }, [value, onChange]);

  const handleRemoveUploading = useCallback((id: string) => {
    setUploadingFiles((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Existing images + uploading */}
      {(value.length > 0 || uploadingFiles.size > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {value.map((url, index) => (
            <div key={url} className="relative group aspect-video">
              <img
                src={url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {/* Uploading items */}
          {Array.from(uploadingFiles.entries()).map(([id, { progress, preview, error }]) => (
            <div key={id} className="relative aspect-video">
              <img
                src={preview}
                alt="Uploading"
                className={cn(
                  "w-full h-full object-cover rounded-lg border",
                  !error && "opacity-50 blur-sm"
                )}
              />
              {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-white mb-1" />
                  <p className="text-white text-xs text-center px-2">{error}</p>
                  <button
                    type="button"
                    onClick={() => handleRemoveUploading(id)}
                    className="mt-2 text-xs text-white underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin mb-1" />
                  <span className="text-white text-sm font-medium">{progress}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={disabled}
        />
        <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Drop images here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">Max {Math.round(maxSize / 1024 / 1024)}MB per image</p>
      </div>
    </div>
  );
}
