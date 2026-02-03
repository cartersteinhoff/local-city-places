"use client";

import { ReactNode, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableItemProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
}

export function SortableItem({ id, children, disabled = false }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        {!disabled && (
          <button
            type="button"
            className="mt-2 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

interface SortableListProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  getItemId: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  renderDragOverlay?: (item: T) => ReactNode;
  disabled?: boolean;
  className?: string;
}

export function SortableList<T>({
  items,
  onChange,
  getItemId,
  renderItem,
  renderDragOverlay,
  disabled = false,
  className,
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => getItemId(item) === active.id);
      const newIndex = items.findIndex((item) => getItemId(item) === over.id);
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  const activeItem = activeId ? items.find((item) => getItemId(item) === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(getItemId)}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <div className={cn("space-y-3", className)}>
          {items.map((item, index) => (
            <SortableItem key={getItemId(item)} id={getItemId(item)} disabled={disabled}>
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem && renderDragOverlay ? (
          <div className="bg-card border rounded-lg shadow-lg p-4">
            {renderDragOverlay(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Simpler grid-based sortable for images
interface SortableImageGridProps {
  images: string[];
  onChange: (images: string[]) => void;
  onRemove?: (index: number) => void;
  disabled?: boolean;
  className?: string;
}

function SortableImageItem({ id, url, onRemove, disabled }: {
  id: string;
  url: string;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group aspect-video",
        isDragging && "opacity-50 z-50"
      )}
    >
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover rounded-lg border"
      />
      {!disabled && (
        <>
          {/* Drag handle overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors rounded-lg cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
          {/* Remove button */}
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function SortableImageGrid({
  images,
  onChange,
  onRemove,
  disabled = false,
  className,
}: SortableImageGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Use index as ID since URLs might have special chars
  const ids = images.map((_, i) => `image-${i}`);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const activeIndex = activeId ? ids.indexOf(activeId) : -1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy} disabled={disabled}>
        <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-3", className)}>
          {images.map((url, index) => (
            <SortableImageItem
              key={ids[index]}
              id={ids[index]}
              url={url}
              onRemove={onRemove ? () => onRemove(index) : undefined}
              disabled={disabled}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeIndex >= 0 && (
          <div className="aspect-video rounded-lg overflow-hidden shadow-2xl">
            <img
              src={images[activeIndex]}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
