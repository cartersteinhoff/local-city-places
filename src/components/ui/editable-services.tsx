"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { EditableText } from "./editable-text";

interface Service {
  name: string;
  description?: string;
  price?: string;
}

interface EditableServicesProps {
  value: Service[];
  onChange: (services: Service[]) => void;
  className?: string;
  itemClassName?: string;
  renderItem?: (
    service: Service,
    index: number,
    handlers: {
      updateName: (name: string) => void;
      updateDescription: (desc: string) => void;
      updatePrice: (price: string) => void;
      remove: () => void;
    }
  ) => React.ReactNode;
}

export function EditableServices({
  value,
  onChange,
  className,
  itemClassName,
  renderItem,
}: EditableServicesProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const updateService = (index: number, updates: Partial<Service>) => {
    const newServices = [...value];
    newServices[index] = { ...newServices[index], ...updates };
    onChange(newServices);
  };

  const addService = () => {
    onChange([...value, { name: "", description: "", price: "" }]);
  };

  const removeService = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null) return;

    const newServices = [...value];
    const [removed] = newServices.splice(dragIndex, 1);
    newServices.splice(index, 0, removed);
    onChange(newServices);

    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {value.map((service, index) => {
        const handlers = {
          updateName: (name: string) => updateService(index, { name }),
          updateDescription: (desc: string) => updateService(index, { description: desc }),
          updatePrice: (price: string) => updateService(index, { price }),
          remove: () => removeService(index),
        };

        if (renderItem) {
          return (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "transition-all duration-150",
                dragIndex === index && "opacity-50",
                dropIndex === index && dragIndex !== index && "border-t-2 border-blue-500"
              )}
            >
              {renderItem(service, index, handlers)}
            </div>
          );
        }

        // Default rendering
        return (
          <div
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "group relative p-4 border rounded-lg bg-white/5 hover:bg-white/10 transition-all",
              dragIndex === index && "opacity-50",
              dropIndex === index && dragIndex !== index && "border-t-2 border-blue-500",
              itemClassName
            )}
          >
            <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab opacity-0 group-hover:opacity-50 hover:opacity-100">
              <GripVertical className="w-4 h-4" />
            </div>
            <button
              onClick={() => removeService(index)}
              className="absolute right-2 top-2 p-1 rounded hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="pl-6 pr-8">
              <div className="flex items-start justify-between gap-4">
                <EditableText
                  value={service.name}
                  onChange={handlers.updateName}
                  placeholder="Service name"
                  as="h3"
                  className="font-semibold text-lg"
                />
                <EditableText
                  value={service.price || ""}
                  onChange={handlers.updatePrice}
                  placeholder="Price"
                  className="text-sm font-medium"
                />
              </div>
              <EditableText
                value={service.description || ""}
                onChange={handlers.updateDescription}
                placeholder="Description"
                as="p"
                className="text-sm opacity-80 mt-1"
              />
            </div>
          </div>
        );
      })}

      <button
        onClick={addService}
        className="w-full p-4 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2 text-sm opacity-60 hover:opacity-100"
      >
        <Plus className="w-4 h-4" />
        Add Service
      </button>
    </div>
  );
}
