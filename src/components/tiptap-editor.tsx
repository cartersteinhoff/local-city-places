"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Heading3,
  UnderlineIcon,
  Upload,
  Loader2,
  Palette,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useCallback, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QueuedImage {
  tempId: string;
  file: File;
  base64Url: string;
}

interface TipTapEditorProps {
  content: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  className?: string;
  uploadEndpoint?: string;
}

export interface TipTapEditorRef {
  processImageQueue: () => Promise<Map<string, string>>;
  hasQueuedImages: () => boolean;
  clearQueue: () => void;
}

export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(
  (
    {
      content,
      onChange,
      placeholder = "Write your content here...",
      className,
      uploadEndpoint = "/api/admin/emails/upload-image",
    },
    ref
  ) => {
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [customColor, setCustomColor] = useState("#000000");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Queue for images that need to be uploaded on save
    const imageQueueRef = useRef<Map<string, QueuedImage>>(new Map());

    // Color palette
    const colorPalette = [
      { name: "Black", value: "#000000" },
      { name: "Gray", value: "#6B7280" },
      { name: "Red", value: "#EF4444" },
      { name: "Orange", value: "#F97316" },
      { name: "Yellow", value: "#EAB308" },
      { name: "Green", value: "#22C55E" },
      { name: "Blue", value: "#3B82F6" },
      { name: "Purple", value: "#A855F7" },
      { name: "Pink", value: "#EC4899" },
    ];

    // Convert file to base64
    const fileToBase64 = useCallback((file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
    }, []);

    // Add image to queue and return temporary URL
    const queueImageForUpload = useCallback(
      async (file: File): Promise<string> => {
        const base64Url = await fileToBase64(file);
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        imageQueueRef.current.set(base64Url, {
          tempId,
          file,
          base64Url,
        });

        return base64Url;
      },
      [fileToBase64]
    );

    // Process all queued images and upload them
    const processImageQueue = async (): Promise<Map<string, string>> => {
      const urlMapping = new Map<string, string>();
      const queue = Array.from(imageQueueRef.current.entries());

      if (queue.length === 0) {
        return urlMapping;
      }

      setUploading(true);

      try {
        for (const [base64Url, queuedImage] of queue) {
          const formData = new FormData();
          formData.append("file", queuedImage.file);

          const response = await fetch(uploadEndpoint, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            console.error(`Failed to upload image: ${queuedImage.tempId}`);
            continue;
          }

          const data = await response.json();
          if (data.url) {
            urlMapping.set(base64Url, data.url);
          }
        }

        imageQueueRef.current.clear();
        return urlMapping;
      } finally {
        setUploading(false);
      }
    };

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      processImageQueue,
      hasQueuedImages: () => imageQueueRef.current.size > 0,
      clearQueue: () => imageQueueRef.current.clear(),
    }));

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [2, 3],
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline",
          },
        }),
        Image.configure({
          inline: false,
          allowBase64: true,
          HTMLAttributes: {
            class: "rounded-md max-w-full h-auto my-4",
          },
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        Underline,
        TextStyle,
        Color,
      ],
      content: content || "",
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const text = editor.getText();
        onChange(html, text);
      },
      editorProps: {
        attributes: {
          class: "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[350px] px-4 py-3",
        },
        handleDrop: (view, event, _slice, moved) => {
          if (!moved && event.dataTransfer && event.dataTransfer.files.length > 0) {
            const files = Array.from(event.dataTransfer.files);
            const imageFile = files.find((file) => file.type.startsWith("image/"));

            if (imageFile) {
              event.preventDefault();
              handleImageAdd(imageFile);
              return true;
            }
          }
          return false;
        },
        handlePaste: (_view, event) => {
          const items = Array.from(event.clipboardData?.items || []);
          const imageItem = items.find((item) => item.type.startsWith("image/"));

          if (imageItem) {
            const file = imageItem.getAsFile();
            if (file) {
              event.preventDefault();
              handleImageAdd(file);
              return true;
            }
          }
          return false;
        },
      },
      immediatelyRender: false,
    });

    // Update editor content when prop changes
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content || "");
      }
    }, [content, editor]);

    const handleImageAdd = async (file: File) => {
      if (!editor) return;

      try {
        const base64Url = await queueImageForUpload(file);
        editor.chain().focus().setImage({ src: base64Url }).run();
        toast.success("Image added. It will be uploaded when you save.");
      } catch {
        toast.error("Failed to add image");
      }
    };

    const handleContainerDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(true);
    }, []);

    const handleContainerDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
    }, []);

    const handleContainerDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
    }, []);

    if (!editor) {
      return (
        <div className="border rounded-md h-[500px] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    const addLink = () => {
      if (linkUrl) {
        editor.chain().focus().setLink({ href: linkUrl }).run();
        setLinkUrl("");
        setLinkDialogOpen(false);
      }
    };

    const removeLink = () => {
      editor.chain().focus().unsetLink().run();
    };

    const addImageFromUrl = () => {
      if (imageUrl) {
        editor.chain().focus().setImage({ src: imageUrl }).run();
        setImageUrl("");
        setImageDialogOpen(false);
      }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleImageAdd(file);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    };

    return (
      <div
        className={cn("border rounded-md relative flex flex-col bg-background", className, {
          "ring-2 ring-primary": dragActive,
        })}
        onDragOver={handleContainerDragOver}
        onDragLeave={handleContainerDragLeave}
        onDrop={handleContainerDrop}
      >
        {/* Toolbar */}
        <div className="sticky top-0 z-20 bg-muted/50 border-b p-2 flex flex-wrap gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-accent")}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-accent")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            className={cn("h-8 w-8 p-0", editor.isActive("underline") && "bg-accent")}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>

          {/* Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2 gap-1">
                <Palette className="h-4 w-4" />
                {editor.getAttributes("textStyle").color && (
                  <div
                    className="w-3 h-3 rounded-full border border-border"
                    style={{ backgroundColor: editor.getAttributes("textStyle").color }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <div className="text-sm font-medium">Text Color</div>
                <div className="grid grid-cols-5 gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className="w-8 h-8 rounded-md border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.value }}
                      onClick={() => editor.chain().focus().setColor(color.value).run()}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-12 h-8 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 h-8"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => editor.chain().focus().setColor(customColor).run()}
                    className="h-8"
                  >
                    Apply
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => editor.chain().focus().unsetColor().run()}
                >
                  Remove Color
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-8 bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 2 }) && "bg-accent")}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 3 }) && "bg-accent")}
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <div className="w-px h-8 bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn("h-8 w-8 p-0", editor.isActive("bulletList") && "bg-accent")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn("h-8 w-8 p-0", editor.isActive("orderedList") && "bg-accent")}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn("h-8 w-8 p-0", editor.isActive("blockquote") && "bg-accent")}
          >
            <Quote className="h-4 w-4" />
          </Button>

          <div className="w-px h-8 bg-border mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2">
                <AlignLeft className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("left").run()}>
                <AlignLeft className="mr-2 h-4 w-4" />
                Left
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("center").run()}>
                <AlignCenter className="mr-2 h-4 w-4" />
                Center
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("right").run()}>
                <AlignRight className="mr-2 h-4 w-4" />
                Right
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-8 bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setLinkDialogOpen(true)}
            className={cn("h-8 w-8 p-0", editor.isActive("link") && "bg-accent")}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          {editor.isActive("link") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeLink}
              className="h-8 w-8 p-0"
            >
              <Unlink className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setImageDialogOpen(true)}
            className="h-8 w-8 p-0"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </Button>

          <div className="w-px h-8 bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor Content */}
        <div className="relative flex-1 overflow-auto">
          <EditorContent editor={editor} />
          {dragActive && (
            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none">
              <div className="bg-background p-4 rounded-lg shadow-lg">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Drop image here</p>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Link Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Link</DialogTitle>
              <DialogDescription>Enter the URL you want to link to</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLink();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={addLink}>
                Add Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Image</DialogTitle>
              <DialogDescription>
                Upload an image from your computer or enter a URL
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  fileInputRef.current?.click();
                  setImageDialogOpen(false);
                }}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </>
                )}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImageFromUrl();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setImageDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={addImageFromUrl} disabled={!imageUrl}>
                Add Image
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

TipTapEditor.displayName = "TipTapEditor";
