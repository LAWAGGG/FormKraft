import React, { createContext, useContext } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableContext = createContext(null);

export function useSortableContext() {
    return useContext(SortableContext);
}

export function SortableSection({ id, children }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative',
        zIndex: isDragging ? 0 : 1,
    };

    return (
        <SortableContext.Provider value={{ attributes, listeners }}>
            <div ref={setNodeRef} style={style} className={`sortable-item ${isDragging ? 'is-dragging-placeholder' : ''}`}>
                {children}
            </div>
        </SortableContext.Provider>
    );
}

export function DragHandle({ children, className }) {
    const { attributes, listeners } = useSortableContext();
    return (
        <div {...attributes} {...listeners} className={className}>
            {children}
        </div>
    );
}
