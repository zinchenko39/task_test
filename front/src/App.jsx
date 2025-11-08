import React, { useState, useEffect, useCallback } from "react";
import { indigo } from "@mui/material/colors";
import {
  Container,
  Grid,
  Typography,
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Button,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ItemsList from "./components/ItemsList";
import SelectedItemsList from "./components/SelectedItemsList";
import { fetchSelectedItems, addToSelected, removeFromSelected } from "./api";
import { LOCAL_STORAGE_KEY } from "./const.js";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  const [selectedItems, setSelectedItems] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedItemsSet, setSelectedItemsSet] = useState(
    new Set(selectedItems),
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadSelectedItems = async () => {
      try {
        let allItems = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const data = await fetchSelectedItems(page, 100, "");
          allItems = [...allItems, ...data.items];
          hasMore = data.items.length === 100;
          page++;
        }

        setSelectedItems(allItems);
        setSelectedItemsSet(new Set(allItems));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allItems));
      } catch (error) {
        console.error("Failed to load selected items:", error);
      }
    };

    loadSelectedItems();
  }, []);

  useEffect(() => {
    setSelectedItemsSet(new Set(selectedItems));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(selectedItems));
  }, [selectedItems]);

  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        let allItems = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const data = await fetchSelectedItems(page, 100, "");
          allItems = [...allItems, ...data.items];
          hasMore = data.items.length === 100;
          page++;
        }

        setSelectedItems((prev) => {
          const prevStr = JSON.stringify([...prev].sort());
          const newStr = JSON.stringify([...allItems].sort());
          if (prevStr !== newStr) {
            return allItems;
          }
          return prev;
        });
      } catch (error) {
        console.error("Failed to sync selected items:", error);
      }
    }, 2000);

    return () => clearInterval(syncInterval);
  }, []);

  const handleSelectionChange = useCallback(() => {
    setRefreshKey((prev) => prev + 1);

    const updateSelected = async () => {
      try {
        let allItems = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const data = await fetchSelectedItems(page, 100, "");
          allItems = [...allItems, ...data.items];
          hasMore = data.items.length === 100;
          page++;
        }

        setSelectedItems(allItems);
      } catch (error) {
        console.error("Failed to update selected items:", error);
      }
    };

    updateSelected();
  }, []);

  const [leftSelected, setLeftSelected] = useState(new Set());
  const [rightSelected, setRightSelected] = useState(new Set());
  const [isMoving, setIsMoving] = useState(false);
  const [leftVisibleItems, setLeftVisibleItems] = useState(new Set());
  const [rightVisibleItems, setRightVisibleItems] = useState(new Set());

  const handleMoveRight = useCallback(async () => {
    if (leftSelected.size === 0) return;

    try {
      const idsToAdd = Array.from(leftSelected).filter((id) =>
        leftVisibleItems.has(id),
      );

      if (idsToAdd.length === 0) {
        setLeftSelected(new Set());
        return;
      }

      setLeftSelected(new Set());
      setRightSelected(new Set());

      setIsMoving(true);

      addToSelected(idsToAdd).catch((error) => {
        console.error("Failed to add to selected:", error);
        setIsMoving(false);
      });

      setTimeout(() => {
        handleSelectionChange();
        setIsMoving(false);
      }, 1200);
    } catch (error) {
      console.error("Failed to move items right:", error);
      setIsMoving(false);
    }
  }, [leftSelected, leftVisibleItems, handleSelectionChange]);

  const handleMoveLeft = useCallback(async () => {
    if (rightSelected.size === 0) return;

    try {
      const idsToRemove = Array.from(rightSelected).filter((id) =>
        rightVisibleItems.has(id),
      );

      if (idsToRemove.length === 0) {
        setRightSelected(new Set());
        return;
      }

      setLeftSelected(new Set());
      setRightSelected(new Set());

      setIsMoving(true);

      removeFromSelected(idsToRemove).catch((error) => {
        console.error("Failed to remove from selected:", error);
        setIsMoving(false);
      });

      setTimeout(() => {
        handleSelectionChange();
        setIsMoving(false);
      }, 1200);
    } catch (error) {
      console.error("Failed to move items left:", error);
      setIsMoving(false);
    }
  }, [rightSelected, rightVisibleItems, handleSelectionChange]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: indigo[50],
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          py: 4,
          overflow: "hidden",
        }}
      >
        <Container maxWidth="xl" sx={{ width: "100%" }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            align="center"
            sx={{ mb: 3, fontWeight: 600 }}
          >
            Item Selector
          </Typography>

          <Grid
            container
            spacing={2}
            sx={{
              height: "80vh",
              overflow: "hidden",
              maxHeight: "80vh",
              justifyContent: "center",
            }}
          >
            <Grid
              item
              xs={12}
              md={5}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  p: 1,
                }}
              >
                <ItemsList
                  selectedItemsSet={selectedItemsSet}
                  onSelectionChange={handleSelectionChange}
                  onRefresh={refreshKey}
                  localSelected={leftSelected}
                  onLocalSelectedChange={setLeftSelected}
                  onVisibleItemsChange={setLeftVisibleItems}
                />
              </Box>
            </Grid>

            <Grid
              item
              xs={12}
              md={2}
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 2,
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleMoveRight}
                  disabled={leftSelected.size === 0 || isMoving}
                  sx={{ minWidth: 140 }}
                  endIcon={
                    isMoving ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <ArrowForwardIcon />
                    )
                  }
                  size="large"
                >
                  To the right
                </Button>
                <Button
                  variant="contained"
                  onClick={handleMoveLeft}
                  disabled={rightSelected.size === 0 || isMoving}
                  sx={{ minWidth: 140 }}
                  startIcon={
                    isMoving ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <ArrowBackIcon />
                    )
                  }
                  size="large"
                >
                  To the left
                </Button>
              </Box>
            </Grid>

            <Grid
              item
              xs={12}
              md={5}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  p: 1,
                }}
              >
                <SelectedItemsList
                  selectedItemsSet={selectedItemsSet}
                  onSelectionChange={handleSelectionChange}
                  onRefresh={refreshKey}
                  localSelected={rightSelected}
                  onLocalSelectedChange={setRightSelected}
                  onVisibleItemsChange={setRightVisibleItems}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isMoving}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" component="div">
            Moving elements...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait
          </Typography>
        </Box>
      </Backdrop>
    </ThemeProvider>
  );
}

export default App;
