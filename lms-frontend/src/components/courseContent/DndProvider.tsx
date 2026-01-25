import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface DndProviderProps {
  children: React.ReactNode;
  items: string[]; // Array of IDs for sortable items
  onDragEnd: (event: DragEndEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
  strategy?: typeof verticalListSortingStrategy;
}

/**
 * DndProvider - Wrapper component for drag-and-drop functionality
 * 
 * This component provides drag-and-drop context for reordering modules, lessons, and content items.
 * It uses @dnd-kit/core and @dnd-kit/sortable for a smooth, accessible drag-and-drop experience.
 * 
 * @param children - Child components that will be draggable
 * @param items - Array of item IDs in their current order
 * @param onDragEnd - Callback when drag operation completes
 * @param onDragStart - Optional callback when drag operation starts
 * @param strategy - Sorting strategy (defaults to verticalListSortingStrategy)
 * 
 * Requirements: 8.1, 8.2, 14.2
 */
export const DndProvider: React.FC<DndProviderProps> = ({
  children,
  items,
  onDragEnd,
  onDragStart,
  strategy = verticalListSortingStrategy,
}) => {
  // Configure sensors for drag detection
  // PointerSensor: Mouse and touch events
  // KeyboardSensor: Keyboard navigation for accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items} strategy={strategy}>
        {children}
      </SortableContext>
      <DragOverlay>{/* Optional: Add drag overlay for better UX */}</DragOverlay>
    </DndContext>
  );
};

export default DndProvider;
