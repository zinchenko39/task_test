import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  TextField,
  List,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  InputAdornment,
} from "@mui/material";
import { indigo } from "@mui/material/colors";
import SearchIcon from "@mui/icons-material/Search";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableItemCard from "./SortableItemCard.jsx";
import { fetchSelectedItems, updateSelectedOrder } from "../api";
import { PAGE_SIZE } from "../const.js";

const SelectedItemsList = ({
  selectedItemsSet,
  onSelectionChange,
  onRefresh,
  localSelected,
  onLocalSelectedChange,
  onVisibleItemsChange,
}) => {
  const [items, setItems] = useState([]);
  const [allSelectedItems, setAllSelectedItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [isReordering, setIsReordering] = useState(false);

  const observerTarget = useRef(null);
  const orderUpdateTimeoutRef = useRef(null);
  const hasLoadedFullListRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const prevFilter = debouncedFilter;
      setDebouncedFilter(filter);
      setPage(1);
      if (prevFilter !== filter && prevFilter !== "") {
        onLocalSelectedChange(new Set());
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filter, debouncedFilter, onLocalSelectedChange]);

  const loadSelectedItems = useCallback(
    async (pageNum = 1, reset = false) => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchSelectedItems(
          pageNum,
          PAGE_SIZE,
          debouncedFilter,
        );

        if (reset || pageNum === 1) {
          setItems(data.items);
        } else {
          setItems((prev) => [...prev, ...data.items]);
        }

        setTotalItems(data.total);
        setHasMore(data.items.length === PAGE_SIZE);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [debouncedFilter],
  );

  const loadFullSelectedList = useCallback(async () => {
    try {
      let allItems = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const data = await fetchSelectedItems(currentPage, 100, "");
        allItems = [...allItems, ...data.items];
        hasMorePages = data.items.length === 100;
        currentPage++;
      }

      setAllSelectedItems(allItems);
    } catch (err) {
      console.error("Failed to load full selected list:", err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!cancelled) {
        await loadSelectedItems(1, true);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [debouncedFilter, loadSelectedItems]);

  useEffect(() => {
    if (!hasLoadedFullListRef.current) {
      loadFullSelectedList();
      hasLoadedFullListRef.current = true;
    }
  }, [loadFullSelectedList]);

  useEffect(() => {
    let cancelled = false;

    if (page > 1 && !cancelled) {
      loadSelectedItems(page, false);
    }

    return () => {
      cancelled = true;
    };
  }, [page, loadSelectedItems]);

  const previousRefreshKeyRef = useRef(onRefresh || 0);
  const previousSelectedItemsSetStrRef = useRef("");

  useEffect(() => {
    const currentRefresh = onRefresh || 0;
    if (
      currentRefresh > 0 &&
      currentRefresh !== previousRefreshKeyRef.current
    ) {
      previousRefreshKeyRef.current = currentRefresh;
      setPage(1);
      setItems([]);
      setHasMore(true);
      loadSelectedItems(1, true);
      loadFullSelectedList();
      onLocalSelectedChange(new Set());
    }
  }, [onRefresh, onLocalSelectedChange]);

  useEffect(() => {
    const currentSetStr = JSON.stringify(Array.from(selectedItemsSet).sort());
    const prevSetStr = previousSelectedItemsSetStrRef.current;

    if (currentSetStr !== prevSetStr) {
      previousSelectedItemsSetStrRef.current = currentSetStr;
      setPage(1);
      setItems([]);
      setHasMore(true);
      loadSelectedItems(1, true);
      loadFullSelectedList();
    }
  }, [selectedItemsSet]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loading &&
          !debouncedFilter
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, debouncedFilter]);

  const handleToggle = useCallback(
    (itemId) => {
      const newSelected = new Set(localSelected);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      onLocalSelectedChange(newSelected);
    },
    [localSelected, onLocalSelectedChange],
  );

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const itemsToUse = debouncedFilter ? items : allSelectedItems;
      const oldIndex = itemsToUse.indexOf(active.id);
      const newIndex = itemsToUse.indexOf(over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      setIsReordering(true);

      const newDisplayOrder = arrayMove(itemsToUse, oldIndex, newIndex);

      if (debouncedFilter) {
        setItems(newDisplayOrder);

        const fullOldIndex = allSelectedItems.indexOf(active.id);
        const fullNewIndex = allSelectedItems.indexOf(over.id);

        if (fullOldIndex !== -1 && fullNewIndex !== -1) {
          const newFullOrder = arrayMove(
            allSelectedItems,
            fullOldIndex,
            fullNewIndex,
          );
          setAllSelectedItems(newFullOrder);

          if (orderUpdateTimeoutRef.current) {
            clearTimeout(orderUpdateTimeoutRef.current);
          }

          orderUpdateTimeoutRef.current = setTimeout(async () => {
            try {
              await updateSelectedOrder(newFullOrder);
              setIsReordering(false);
            } catch (err) {
              setError(err.message);
              setIsReordering(false);
              loadFullSelectedList();
            }
          }, 300);
        }
      } else {
        setItems(newDisplayOrder.slice(0, page * PAGE_SIZE));
        setAllSelectedItems(newDisplayOrder);

        if (orderUpdateTimeoutRef.current) {
          clearTimeout(orderUpdateTimeoutRef.current);
        }

        orderUpdateTimeoutRef.current = setTimeout(async () => {
          try {
            await updateSelectedOrder(newDisplayOrder);
            setIsReordering(false);
          } catch (err) {
            setError(err.message);
            setIsReordering(false);
            loadFullSelectedList();
          }
        }, 300);
      }
    },
    [allSelectedItems, items, debouncedFilter, page, loadFullSelectedList],
  );

  useEffect(() => {
    return () => {
      if (orderUpdateTimeoutRef.current) {
        clearTimeout(orderUpdateTimeoutRef.current);
      }
    };
  }, []);

  const displayedItems = items;

  useEffect(() => {
    if (onVisibleItemsChange) {
      onVisibleItemsChange(new Set(displayedItems));
    }
  }, [displayedItems, onVisibleItemsChange]);

  return (
    <Paper
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
        backgroundColor: indigo[100],
      }}
      elevation={2}
    >
      <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
        Selected Items
        {isReordering && <CircularProgress size={16} sx={{ ml: 1 }} />}
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Filter by ID..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        sx={{ mb: 2, flexShrink: 0 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      {!!error && (
        <Alert
          severity="error"
          sx={{ mb: 2, flexShrink: 0 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          p: 1,
          minHeight: 0,
        }}
      >
        {displayedItems.length === 0 && !loading && (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ py: 4 }}
          >
            No selected items
          </Typography>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayedItems}
            strategy={verticalListSortingStrategy}
          >
            <List dense>
              {displayedItems?.map((item) => (
                <SortableItemCard
                  key={item}
                  itemId={item}
                  isSelected={localSelected.has(item)}
                  onToggle={handleToggle}
                  selectedItemsList={allSelectedItems}
                  isInSelectedList={true}
                />
              ))}
            </List>
          </SortableContext>
        </DndContext>

        {!debouncedFilter && (
          <>
            <div ref={observerTarget} style={{ height: "20px" }} />

            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {!hasMore && items.length > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                align="center"
                sx={{ py: 2, display: "block" }}
              >
                No more items
              </Typography>
            )}
          </>
        )}
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, textAlign: "right", flexShrink: 0 }}
      >
        Total: {totalItems}
      </Typography>
    </Paper>
  );
};

export default SelectedItemsList;
