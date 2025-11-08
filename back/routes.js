const express = require("express");
const router = express.Router();
const data = require("./data");
const {
  addToAddQueue,
  addToAddSelectedQueue,
  addToRemoveSelectedQueue,
  setUpdateSelectedOrderQueue,
} = require("./utils");

router.use(express.json());

router.get("/items", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = req.query.filter ? req.query.filter.toString() : null;

  let items = Array.from(data.allItems.values());

  const selectedItemsSet = new Set(data.selectedItems);
  items = items.filter((id) => !selectedItemsSet.has(id));
  items.sort((a, b) => a - b);

  if (filter) {
    items = items.filter((id) => id.toString().includes(filter));
  }

  const startIndex = (page - 1) * limit;
  const paginatedItems = items.slice(startIndex, startIndex + limit);

  res.json({
    items: paginatedItems,
    total: items.length,
  });
});

router.get("/selected-items", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = req.query.filter ? req.query.filter.toString() : null;

  let items = data.selectedItems;

  if (filter) {
    items = items.filter((id) => id.toString().includes(filter));
  }

  const startIndex = (page - 1) * limit;
  const paginatedItems = items.slice(startIndex, startIndex + limit);

  res.json({
    items: paginatedItems,
    total: items.length,
  });
});

router.post("/items", (req, res) => {
  const { id } = req.body;
  if (id === undefined || isNaN(parseInt(id))) {
    return res.status(400).json({ message: "Invalid ID provided." });
  }

  const numericId = parseInt(id);
  addToAddQueue(numericId);

  res
    .status(202)
    .json({ message: "Item accepted and will be added to the queue." });
});

router.post("/selected-items/add", (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res
      .status(400)
      .json({ message: "Invalid data. Expecting an array of IDs." });
  }

  const numericIds = ids.map((id) => parseInt(id)).filter((id) => !isNaN(id));
  if (numericIds.length === 0) {
    return res.status(400).json({ message: "No valid IDs provided." });
  }

  addToAddSelectedQueue(numericIds);

  res
    .status(202)
    .json({ message: "Add request accepted and will be processed." });
});

router.post("/selected-items/remove", (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res
      .status(400)
      .json({ message: "Invalid data. Expecting an array of IDs." });
  }

  const numericIds = ids.map((id) => parseInt(id)).filter((id) => !isNaN(id));
  if (numericIds.length === 0) {
    return res.status(400).json({ message: "No valid IDs provided." });
  }

  addToRemoveSelectedQueue(numericIds);

  res
    .status(202)
    .json({ message: "Remove request accepted and will be processed." });
});

/**
 * Обновление порядка элементов в selected-items (для drag & drop сортировки)
 *
 * Использование:
 * После drag & drop операции на фронтенде нужно отправить ПОЛНЫЙ массив всех ID
 * в том порядке, в котором они должны быть после перетаскивания.
 *
 * Пример запроса:
 * POST /selected-items/order
 * Body: { "ids": [5, 2, 8, 1, 3] }
 *
 * Где [5, 2, 8, 1, 3] - это полный список всех selected items в новом порядке.
 *
 * Логика обработки:
 * - Если массив содержит все элементы из selectedItems - применяется новый порядок
 * - Если массив частичный - элементы из массива идут в указанном порядке,
 *   остальные остаются в конце в исходном порядке
 * - Обработка происходит раз в секунду (батчинг)
 */
router.post("/selected-items/order", (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res
      .status(400)
      .json({ message: "Invalid data. Expecting an array of IDs." });
  }

  const numericIds = ids.map((id) => parseInt(id)).filter((id) => !isNaN(id));
  if (numericIds.length === 0) {
    return res.status(400).json({ message: "No valid IDs provided." });
  }

  setUpdateSelectedOrderQueue(numericIds);

  res
    .status(202)
    .json({ message: "Order update accepted and will be processed." });
});

module.exports = router;
