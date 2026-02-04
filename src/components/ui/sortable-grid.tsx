"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  defaultAnimateLayoutChanges,
  AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

// Custom animateLayoutChanges - prevents snap-back on drop
// When wasDragging is true, return false to skip the "return to origin" animation
const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;

  // Don't animate the dropped item - it should stay where it landed
  if (wasDragging) {
    return false;
  }

  // Animate other items shifting during sort
  if (isSorting) {
    return defaultAnimateLayoutChanges(args);
  }

  return true;
};

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

function SortableItem({ id, children, className }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    animateLayoutChanges,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none select-none cursor-grab active:cursor-grabbing",
        isDragging && "shadow-xl ring-2 ring-primary/50 rounded-lg scale-[1.02]",
        className
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

interface SortableGridProps<T> {
  items: T[];
  getItemId: (item: T, index: number) => string;
  onReorder: (newItems: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  itemClassName?: string;
}

export function SortableGrid<T>({
  items,
  getItemId,
  onReorder,
  renderItem,
  className,
  itemClassName,
}: SortableGridProps<T>) {
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

  const itemIds = items.map((item, index) => getItemId(item, index));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = itemIds.indexOf(active.id as string);
      const newIndex = itemIds.indexOf(over.id as string);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }
  }

  // Measuring config for smooth layout animations
  const measuring = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      measuring={measuring}
    >
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div className={className}>
          {items.map((item, index) => (
            <SortableItem
              key={getItemId(item, index)}
              id={getItemId(item, index)}
              className={itemClassName}
            >
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
