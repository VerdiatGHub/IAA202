import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

/**
 * SortableItem - Wrapper component that makes any child component draggable
 * 
 * This component wraps around ModuleItem, LessonItem, or ContentItemRow to enable
 * drag-and-drop reordering functionality.
 * 
 * @param id - Unique identifier for the sortable item
 * @param children - The component to make draggable
 * @param disabled - Whether dragging is disabled
 * 
 * Requirements: 8.1, 8.2, 14.2
 */
export const SortableItem: React.FC<SortableItemProps> = ({ id, children, disabled = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? 'default' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

export default SortableItem;
