import React from "react";
import { ListItem, ListItemText, Checkbox, IconButton } from "@mui/material";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import { indigo } from "@mui/material/colors";

const ItemCard = ({
  itemId,
  isSelected,
  onToggle,
  isDraggable = false,
  dragHandleProps = null,
}) => (
  <ListItem
    secondaryAction={
      <Checkbox
        edge="end"
        checked={isSelected}
        onChange={() => onToggle(itemId)}
        slotProps={{ input: { "aria-labelledby": `item-${itemId}` } }}
      />
    }
    sx={{
      backgroundColor: indigo[50],
      marginBottom: 1,
      borderRadius: 1,
      boxShadow: 1,
      "&:hover": {
        boxShadow: 2,
      },
    }}
  >
    {isDraggable && (
      <IconButton
        {...dragHandleProps}
        sx={{
          cursor: "grab",
          mr: 1,
          "&:active": { cursor: "grabbing" },
        }}
      >
        <DragHandleIcon />
      </IconButton>
    )}
    <ListItemText primary={`Item ID: ${itemId}`} id={`item-${itemId}`} />
  </ListItem>
);

export default ItemCard;
