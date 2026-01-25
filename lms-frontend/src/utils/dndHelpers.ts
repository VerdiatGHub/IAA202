import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

/**
 * Utility functions for drag-and-drop operations
 * 
 * These helpers process drag events and calculate new item orders
 * for modules, lessons, and content items.
 * 
 * Requirements: 8.1, 8.2, 14.2
 */

/**
 * Handle drag end event and return reordered array of IDs
 * 
 * @param event - DragEndEvent from @dnd-kit/core
 * @param items - Current array of items with id property
 * @returns Array of IDs in new order, or null if no change
 */
export function handleDragEnd<T extends { id: string }>(
  event: DragEndEvent,
  items: T[]
): string[] | null {
  const { active, over } = event;

  // No change if dropped in same position or outside droppable area
  if (!over || active.id === over.id) {
    return null;
  }

  // Find indices
  const oldIndex = items.findIndex((item) => item.id === active.id);
  const newIndex = items.findIndex((item) => item.id === over.id);

  if (oldIndex === -1 || newIndex === -1) {
    return null;
  }

  // Reorder items
  const reorderedItems = arrayMove(items, oldIndex, newIndex);
  
  // Return array of IDs in new order
  return reorderedItems.map((item) => item.id);
}

/**
 * Calculate new order indices for items after reordering
 * 
 * @param itemIds - Array of item IDs in new order
 * @returns Array of objects with id and orderIndex
 */
export function calculateNewOrderIndices(itemIds: string[]): Array<{ id: string; orderIndex: number }> {
  return itemIds.map((id, index) => ({
    id,
    orderIndex: index,
  }));
}

/**
 * Reorder array based on drag event
 * 
 * @param event - DragEndEvent from @dnd-kit/core
 * @param items - Current array of items
 * @returns Reordered array, or original array if no change
 */
export function reorderArray<T extends { id: string }>(
  event: DragEndEvent,
  items: T[]
): T[] {
  const { active, over } = event;

  if (!over || active.id === over.id) {
    return items;
  }

  const oldIndex = items.findIndex((item) => item.id === active.id);
  const newIndex = items.findIndex((item) => item.id === over.id);

  if (oldIndex === -1 || newIndex === -1) {
    return items;
  }

  return arrayMove(items, oldIndex, newIndex);
}
