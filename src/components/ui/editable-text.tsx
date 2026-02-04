"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  editIconClassName?: string;
  maxLength?: number;
}

export function EditableText({
  value,
  onChange,
  placeholder = "Click to edit...",
  as: Component = "span",
  multiline = false,
  className,
  inputClassName,
  editIconClassName,
  maxLength,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const sharedProps = {
      ref: inputRef as any,
      value: editValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEditValue(e.target.value),
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      maxLength,
      className: cn(
        "w-full bg-transparent border-2 border-blue-500 rounded px-2 py-1 outline-none",
        "text-inherit font-inherit",
        inputClassName
      ),
      placeholder,
    };

    if (multiline) {
      return (
        <textarea
          {...sharedProps}
          rows={4}
          className={cn(sharedProps.className, "resize-none min-h-[100px]")}
        />
      );
    }

    return <input type="text" {...sharedProps} />;
  }

  return (
    <Component
      onClick={handleClick}
      className={cn(
        "cursor-pointer relative group inline-block",
        "hover:outline hover:outline-2 hover:outline-blue-500 hover:outline-offset-2 rounded",
        "transition-all duration-150",
        !value && "text-gray-400 italic",
        className
      )}
    >
      {value || placeholder}
      <Pencil
        className={cn(
          "absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity",
          editIconClassName
        )}
      />
    </Component>
  );
}
