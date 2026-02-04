"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { useEditor } from "./editor-context";
import { Pencil, Upload, Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// =============================================================================
// EDITABLE TEXT
// In view mode: renders as the specified element (h1, p, span, etc.)
// In edit mode: shows edit icon, click to edit inline
// =============================================================================

interface EditableTextProps {
  field: string;
  value: string;
  placeholder?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  children?: ReactNode; // For when you want custom rendering
}

export function EditableText({
  field,
  value,
  placeholder = "Click to edit",
  as: Component = "span",
  className,
  inputClassName,
  multiline = false,
}: EditableTextProps) {
  const { editable, onUpdate, showEditHints } = useEditor();
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onUpdate(field, localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  // View mode - just render the content
  if (!editable) {
    return <Component className={className}>{value || placeholder}</Component>;
  }

  // Edit mode - editing state
  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input;
    return (
      <InputComponent
        ref={inputRef as any}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "bg-transparent border-[#D4AF37]/50 focus:border-[#D4AF37] text-inherit font-inherit",
          inputClassName
        )}
        rows={multiline ? 4 : undefined}
      />
    );
  }

  // Edit mode - display state (clickable)
  return (
    <Component
      className={cn(
        className,
        "cursor-pointer group relative",
        showEditHints && "hover:ring-1 hover:ring-[#D4AF37]/50 hover:ring-offset-2 hover:ring-offset-transparent rounded"
      )}
      onClick={() => setIsEditing(true)}
    >
      {value || <span className="opacity-50">{placeholder}</span>}
      {showEditHints && (
        <Pencil className="w-3 h-3 inline-block ml-2 opacity-0 group-hover:opacity-70 text-[#D4AF37] transition-opacity" />
      )}
    </Component>
  );
}

// =============================================================================
// EDITABLE IMAGE
// In view mode: renders as img
// In edit mode: shows upload overlay on hover
// =============================================================================

interface EditableImageProps {
  field: string;
  value: string | null | undefined;
  alt: string;
  className?: string;
  placeholderIcon?: ReactNode;
  placeholderText?: string;
  aspectRatio?: string;
  onUpload?: (file: File) => Promise<string>;
}

export function EditableImage({
  field,
  value,
  alt,
  className,
  placeholderIcon,
  placeholderText = "Add Image",
  aspectRatio,
  onUpload,
}: EditableImageProps) {
  const { editable, onUpdate, onLogoUpload, onPhotoUpload, showEditHints } = useEditor();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadHandler = onUpload || (field === "logoUrl" ? onLogoUpload : onPhotoUpload);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadHandler) return;

    setIsUploading(true);
    try {
      const url = await uploadHandler(file);
      onUpdate(field, url);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // View mode without image
  if (!value && !editable) {
    return null;
  }

  // Edit mode - no image yet (show placeholder)
  if (!value && editable) {
    return (
      <div
        className={cn(
          "border-2 border-dashed border-[#D4AF37]/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5 transition-colors",
          className
        )}
        style={{ aspectRatio }}
        onClick={handleClick}
      >
        {placeholderIcon || <Upload className="w-8 h-8 text-[#D4AF37]/60" />}
        <span className="text-sm text-[#D4AF37]/60">{placeholderText}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  // View mode with image
  if (!editable) {
    return (
      <img
        src={value!}
        alt={alt}
        className={className}
      />
    );
  }

  // Edit mode with image
  return (
    <div
      className={cn("relative group cursor-pointer", className)}
      style={{ aspectRatio }}
      onClick={handleClick}
    >
      <img
        src={value!}
        alt={alt}
        className="w-full h-full object-cover"
      />
      {showEditHints && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {isUploading ? (
            <span className="text-white text-sm">Uploading...</span>
          ) : (
            <Upload className="w-8 h-8 text-white" />
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// =============================================================================
// EDITABLE LINK
// In view mode: normal link behavior
// In edit mode: click opens popover to edit URL
// =============================================================================

interface EditableLinkProps {
  field: string;
  value: string;
  href?: string;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

export function EditableLink({
  field,
  value,
  href,
  children,
  className,
  target,
  rel,
}: EditableLinkProps) {
  const { editable, onUpdate, showEditHints } = useEditor();
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // View mode - normal link
  if (!editable) {
    if (!href && !value) return null;
    return (
      <a
        href={href || value}
        className={className}
        target={target}
        rel={rel}
      >
        {children}
      </a>
    );
  }

  // Edit mode - popover to edit
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            className,
            "cursor-pointer",
            showEditHints && "hover:ring-1 hover:ring-[#D4AF37]/50 rounded"
          )}
          onClick={(e) => e.preventDefault()}
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <label className="text-sm font-medium">URL</label>
          <Input
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => onUpdate(field, localValue)}
            placeholder="https://..."
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// EDITABLE SELECT
// In view mode: renders the selected value
// In edit mode: shows dropdown on click
// =============================================================================

interface EditableSelectProps {
  field: string;
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  displayClassName?: string;
}

export function EditableSelect({
  field,
  value,
  options,
  placeholder = "Select...",
  className,
  displayClassName,
}: EditableSelectProps) {
  const { editable, onUpdate, showEditHints } = useEditor();

  const selectedOption = options.find((o) => o.value === value);
  const displayValue = selectedOption?.label || placeholder;

  // View mode
  if (!editable) {
    if (!value) return null;
    return <span className={displayClassName}>{displayValue}</span>;
  }

  // Edit mode
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            className,
            "cursor-pointer text-left",
            showEditHints && "hover:ring-1 hover:ring-[#D4AF37]/50 rounded px-2 py-1"
          )}
        >
          {displayValue}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <div className="max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              className={cn(
                "w-full text-left px-3 py-2 hover:bg-muted transition-colors",
                option.value === value && "bg-muted"
              )}
              onClick={() => onUpdate(field, option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// PREVENT LINK
// Wrapper that prevents link navigation in edit mode
// =============================================================================

interface PreventLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

export function PreventLink({
  href,
  children,
  className,
  target,
  rel,
}: PreventLinkProps) {
  const { editable } = useEditor();

  if (editable) {
    return <div className={className}>{children}</div>;
  }

  return (
    <a href={href} className={className} target={target} rel={rel}>
      {children}
    </a>
  );
}
