# Drag-and-Drop Setup Guide

This document explains how to use the drag-and-drop functionality for reordering modules, lessons, and content items in the course content management system.

## Overview

The drag-and-drop implementation uses `@dnd-kit` libraries:
- `@dnd-kit/core` - Core drag-and-drop functionality
- `@dnd-kit/sortable` - Sortable list utilities
- `@dnd-kit/utilities` - CSS transformation utilities

## Components

### 1. DndProvider
Wrapper component that provides drag-and-drop context.

**Props:**
- `items: string[]` - Array of item IDs in current order
- `onDragEnd: (event: DragEndEvent) => void` - Callback when drag completes
- `onDragStart?: (event: DragStartEvent) => void` - Optional callback when drag starts
- `strategy?: SortingStrategy` - Sorting strategy (defaults to vertical list)

### 2. SortableItem
Wrapper that makes any component draggable.

**Props:**
- `id: string` - Unique identifier for the item
- `children: React.ReactNode` - Component to make draggable
- `disabled?: boolean` - Whether dragging is disabled

## Usage Examples

### Example 1: Making ModuleList Draggable

```tsx
import { DndProvider } from './DndProvider';
import { SortableItem } from './SortableItem';
import { handleDragEnd } from '../../utils/dndHelpers';
import { useCourseContent } from '../../contexts/useCourseContent';

export const ModuleList: React.FC<ModuleListProps> = ({ onAddModule }) => {
  const { modules, reorderModules } = useCourseContent();
  
  const handleModuleDragEnd = async (event: DragEndEvent) => {
    const newOrder = handleDragEnd(event, modules);
    if (newOrder) {
      await reorderModules(newOrder);
    }
  };

  const moduleIds = modules.map(m => m.id);

  return (
    <div className="module-list">
      <DndProvider items={moduleIds} onDragEnd={handleModuleDragEnd}>
        {modules.map((module) => (
          <SortableItem key={module.id} id={module.id}>
            <ModuleItem module={module} {...otherProps} />
          </SortableItem>
        ))}
      </DndProvider>
    </div>
  );
};
```

### Example 2: Making LessonList Draggable

```tsx
import { DndProvider } from './DndProvider';
import { SortableItem } from './SortableItem';
import { handleDragEnd } from '../../utils/dndHelpers';
import { useCourseContent } from '../../contexts/useCourseContent';

export const LessonList: React.FC<LessonListProps> = ({ moduleId, lessons }) => {
  const { reorderLessons } = useCourseContent();
  
  const handleLessonDragEnd = async (event: DragEndEvent) => {
    const newOrder = handleDragEnd(event, lessons);
    if (newOrder) {
      await reorderLessons(moduleId, newOrder);
    }
  };

  const lessonIds = lessons.map(l => l.id);

  return (
    <div className="lesson-list">
      <DndProvider items={lessonIds} onDragEnd={handleLessonDragEnd}>
        {lessons.map((lesson) => (
          <SortableItem key={lesson.id} id={lesson.id}>
            <LessonItem lesson={lesson} {...otherProps} />
          </SortableItem>
        ))}
      </DndProvider>
    </div>
  );
};
```

### Example 3: Making ContentItemList Draggable

```tsx
import { DndProvider } from './DndProvider';
import { SortableItem } from './SortableItem';
import { handleDragEnd } from '../../utils/dndHelpers';
import { useCourseContent } from '../../contexts/useCourseContent';

export const ContentItemList: React.FC<ContentItemListProps> = ({ lessonId, items }) => {
  const { reorderContentItems } = useCourseContent();
  
  const handleContentDragEnd = async (event: DragEndEvent) => {
    const newOrder = handleDragEnd(event, items);
    if (newOrder) {
      await reorderContentItems(lessonId, newOrder);
    }
  };

  const itemIds = items.map(i => i.id);

  return (
    <div className="content-item-list">
      <DndProvider items={itemIds} onDragEnd={handleContentDragEnd}>
        {items.map((item) => (
          <SortableItem key={item.id} id={item.id}>
            <ContentItemRow item={item} {...otherProps} />
          </SortableItem>
        ))}
      </DndProvider>
    </div>
  );
};
```

## Utility Functions

### handleDragEnd
Processes drag event and returns reordered array of IDs.

```tsx
const newOrder = handleDragEnd(event, items);
if (newOrder) {
  // newOrder is string[] of IDs in new order
  await reorderFunction(newOrder);
}
```

### calculateNewOrderIndices
Calculates new order indices for items.

```tsx
const orderData = calculateNewOrderIndices(itemIds);
// Returns: [{ id: 'id1', orderIndex: 0 }, { id: 'id2', orderIndex: 1 }, ...]
```

### reorderArray
Reorders array based on drag event.

```tsx
const reordered = reorderArray(event, items);
// Returns reordered array of items
```

## Accessibility

The drag-and-drop implementation includes:
- **Keyboard navigation**: Use arrow keys to move items
- **Screen reader support**: Announces drag operations
- **Focus management**: Maintains focus during drag operations

### Keyboard Controls
- `Space` or `Enter`: Pick up item
- `Arrow Up/Down`: Move item up/down
- `Space` or `Enter`: Drop item
- `Escape`: Cancel drag operation

## Styling

Add visual feedback for drag operations:

```css
/* Dragging item */
.sortable-item[data-dragging="true"] {
  opacity: 0.5;
  cursor: grabbing;
}

/* Drop target */
.sortable-item[data-over="true"] {
  border: 2px dashed #007bff;
}

/* Drag handle (optional) */
.drag-handle {
  cursor: grab;
  padding: 8px;
}

.drag-handle:active {
  cursor: grabbing;
}
```

## Error Handling

The context handles errors automatically:
- Optimistic updates for smooth UX
- Automatic rollback on API failure
- Error messages displayed to user

```tsx
const handleDragEnd = async (event: DragEndEvent) => {
  const newOrder = handleDragEnd(event, items);
  if (newOrder) {
    try {
      await reorderFunction(newOrder);
      // Success - optimistic update already applied
    } catch (error) {
      // Error - context automatically rolls back
      console.error('Reorder failed:', error);
    }
  }
};
```

## Requirements Validation

This implementation validates:
- **Requirement 8.1**: Module reordering with order_index updates
- **Requirement 8.2**: Lesson reordering within modules
- **Requirement 14.2**: Content item reordering within lessons
- **Requirement 10.6**: Drag-and-drop UI controls

## Next Steps

To complete the drag-and-drop implementation:

1. **Task 14.2**: Integrate DndProvider into ModuleList component
2. **Task 14.3**: Integrate DndProvider into LessonList component
3. **Task 14.4**: Integrate DndProvider into ContentItemList component

Each integration involves:
- Wrapping the list with DndProvider
- Wrapping each item with SortableItem
- Implementing the onDragEnd handler
- Testing the reordering functionality
