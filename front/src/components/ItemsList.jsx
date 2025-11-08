import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  TextField,
  List,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  InputAdornment,
} from "@mui/material";
import { indigo } from "@mui/material/colors";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ItemCard from "./ItemCard";
import { fetchItems, addItem } from "../api";
import { PAGE_SIZE } from "../const.js";

const ItemsList = ({
  selectedItemsSet,
  onRefresh,
  localSelected,
  onLocalSelectedChange,
  onVisibleItemsChange,
}) => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newItemId, setNewItemId] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const observerTarget = useRef(null);
  const listContainerRef = useRef(null);
  const isLoadingRef = useRef(false);
  const previousFilterRef = useRef("");
  const hasLoadedInitiallyRef = useRef(false);

  useEffect(() => {
    if (
      !hasLoadedInitiallyRef.current &&
      debouncedFilter === "" &&
      filter === ""
    ) {
      hasLoadedInitiallyRef.current = true;
      previousFilterRef.current = "";
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (previousFilterRef.current !== filter) {
        const oldFilter = previousFilterRef.current;
        previousFilterRef.current = filter;

        if (oldFilter !== "") {
          isLoadingRef.current = false;
          setItems([]);
          setHasMore(true);
          onLocalSelectedChange(new Set());
          setPage(1);
        }
        setDebouncedFilter(filter);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filter, onLocalSelectedChange]);

  useEffect(() => {
    if (onVisibleItemsChange) {
      onVisibleItemsChange(new Set(items));
    }
  }, [items, onVisibleItemsChange]);

  useEffect(() => {
    if (page <= 0) return;

    let cancelled = false;
    const requestPage = page;
    const requestFilter = debouncedFilter;

    const loadItems = async () => {
      if (isLoadingRef.current) {
        return;
      }

      if (!hasMore && page > 1) return;

      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const data = await fetchItems(requestPage, PAGE_SIZE, requestFilter);

        if (cancelled) {
          isLoadingRef.current = false;
          return;
        }

        if (requestPage === 1) {
          setItems(data.items);
        } else {
          setItems((prev) => {
            if (prev.length === 0) {
              console.warn(
                `Trying to load page ${requestPage} but page 1 hasn't loaded yet`,
              );
              return prev;
            }

            const existingIds = new Set(prev);
            const newItems = data.items.filter((id) => !existingIds.has(id));
            return [...prev, ...newItems];
          });
        }

        setTotalItems(data.total);
        setHasMore(data.items.length === PAGE_SIZE);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          isLoadingRef.current = false;
        }
      }
    };

    loadItems();

    return () => {
      cancelled = true;
      isLoadingRef.current = false;
    };
  }, [page, debouncedFilter, hasMore]);

  const previousRefreshKeyRef = useRef(onRefresh || 0);
  const previousSelectedItemsSetStrRef = useRef("");

  useEffect(() => {
    const currentRefresh = onRefresh || 0;
    if (
      currentRefresh > 0 &&
      currentRefresh !== previousRefreshKeyRef.current
    ) {
      previousRefreshKeyRef.current = currentRefresh;
      onLocalSelectedChange(new Set());

      isLoadingRef.current = false;
      setItems([]);
      setHasMore(true);

      setPage((prev) => {
        if (prev === 1) {
          setTimeout(() => setPage(1), 0);
          return 2;
        }
        return 1;
      });
    }
  }, [onRefresh, onLocalSelectedChange]);

  useEffect(() => {
    const currentSetStr = JSON.stringify(Array.from(selectedItemsSet).sort());
    const prevSetStr = previousSelectedItemsSetStrRef.current;

    if (currentSetStr !== prevSetStr && prevSetStr !== "") {
      previousSelectedItemsSetStrRef.current = currentSetStr;
    } else if (prevSetStr === "") {
      previousSelectedItemsSetStrRef.current = currentSetStr;
    }
  }, [selectedItemsSet]);

  useEffect(() => {
    if (items.length === 0 || loading || isLoadingRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loading &&
          !isLoadingRef.current &&
          items.length > 0 &&
          page > 0 &&
          page === Math.ceil(items.length / PAGE_SIZE)
        ) {
          setPage((prev) => {
            if (
              !isLoadingRef.current &&
              items.length > 0 &&
              prev === Math.ceil(items.length / PAGE_SIZE)
            ) {
              return prev + 1;
            }
            return prev;
          });
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (
      currentTarget &&
      items.length > 0 &&
      !loading &&
      !isLoadingRef.current
    ) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, page, items.length, PAGE_SIZE]);

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

  const handleAddItem = useCallback(async () => {
    const id = parseInt(newItemId);
    if (isNaN(id) || id <= 0) {
      setError("Please enter a valid positive number");
      return;
    }

    setAddingItem(true);
    setError(null);

    try {
      await addItem(id);
      setNewItemId("");

      isLoadingRef.current = false;
      setItems([]);
      setHasMore(true);

      setPage((prev) => {
        if (prev === 1) {
          setTimeout(() => setPage(1), 0);
          return 0;
        }
        return 1;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingItem(false);
    }
  }, [newItemId]);

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
        All Items
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Filter by ID..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        sx={{ mb: 2, flexShrink: 0 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ display: "flex", gap: 1, mb: 2, flexShrink: 0 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="New Item ID"
          type="number"
          value={newItemId}
          onChange={(e) => setNewItemId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddItem();
            }
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddItem}
          disabled={!newItemId || addingItem}
        >
          Add
        </Button>
      </Box>

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
        ref={listContainerRef}
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
        {items.length === 0 && !loading && (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ py: 4 }}
          >
            No items found
          </Typography>
        )}

        <List dense>
          {items?.map((item) => (
            <ItemCard
              key={item}
              itemId={item}
              isSelected={localSelected.has(item)}
              onToggle={handleToggle}
              isInSelectedList={selectedItemsSet.has(item)}
            />
          ))}
        </List>

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

export default ItemsList;
