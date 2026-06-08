"use client";

import { createContext, type ReactNode } from "react";

interface EditorContextValue {
  editable: boolean;
  onUpdate: <T>(field: string, value: T) => void;
  onPhotoUpload?: (file: File) => Promise<string>;
  onLogoUpload?: (file: File) => Promise<string>;
  showEditHints?: boolean;
}

const EditorContext = createContext<EditorContextValue>({
  editable: false,
  onUpdate: () => {},
});

interface EditorProviderProps {
  children: ReactNode;
  editable?: boolean;
  onUpdate?: <T>(field: string, value: T) => void;
  onPhotoUpload?: (file: File) => Promise<string>;
  onLogoUpload?: (file: File) => Promise<string>;
  showEditHints?: boolean;
}

export function EditorProvider({
  children,
  editable = false,
  onUpdate = () => {},
  onPhotoUpload,
  onLogoUpload,
  showEditHints = true,
}: EditorProviderProps) {
  return (
    <EditorContext.Provider
      value={{
        editable,
        onUpdate,
        onPhotoUpload,
        onLogoUpload,
        showEditHints,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}
