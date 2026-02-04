"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Camera, Loader2, X, Upload } from "lucide-react";
import Image from "next/image";

interface EditableImageProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  onUpload: (file: File) => Promise<string>;
  alt?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "auto";
  placeholder?: string;
  showRemove?: boolean;
  width?: number;
  height?: number;
}

export function EditableImage({
  value,
  onChange,
  onUpload,
  alt = "Image",
  className,
  aspectRatio = "auto",
  placeholder = "Click to add image",
  showRemove = true,
  width,
  height,
}: EditableImageProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, onChange]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "",
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative cursor-pointer group overflow-hidden rounded-lg",
        "transition-all duration-150",
        isDragging && "ring-2 ring-blue-500 ring-offset-2",
        aspectClasses[aspectRatio],
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {value ? (
        <>
          <Image
            src={value}
            alt={alt}
            fill={!width && !height}
            width={width}
            height={height}
            className={cn(
              "object-cover transition-transform group-hover:scale-105",
              width && height ? "" : "absolute inset-0"
            )}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <div className="bg-white/90 rounded-full p-2">
              <Camera className="w-5 h-5 text-gray-700" />
            </div>
            {showRemove && (
              <button
                onClick={handleRemove}
                className="bg-red-500 rounded-full p-2 hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
          {isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 mb-2" />
              <span className="text-sm">{placeholder}</span>
            </>
          )}
        </div>
      )}

      {/* Upload overlay */}
      {isUploading && value && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/50 flex items-center justify-center">
          <Upload className="w-12 h-12 text-white" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-2 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
