import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ItemCard from "./ItemCard.jsx";
import React from "react";

const SortableItemCard = ({
  itemId,
  isSelected,
  onToggle,
  selectedItemsList,
  isInSelectedList,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ItemCard
        itemId={itemId}
        isSelected={isSelected}
        onToggle={onToggle}
        isDraggable={true}
        dragHandleProps={{ ...attributes, ...listeners }}
        isInSelectedList={isInSelectedList}
      />
    </div>
  );
};

export default SortableItemCard;
