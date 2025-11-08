const API_BASE_URL = "http://localhost:3001";

/**
 * Получить список всех элементов (кроме выбранных)
 */
export const fetchItems = async (page = 1, limit = 20, filter = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (filter) {
    params.append("filter", filter);
  }

  const response = await fetch(`${API_BASE_URL}/items?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch items");
  }
  return response.json();
};

/**
 * Получить список выбранных элементов
 */
export const fetchSelectedItems = async (page = 1, limit = 20, filter = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (filter) {
    params.append("filter", filter);
  }

  const response = await fetch(`${API_BASE_URL}/selected-items?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch selected items");
  }
  return response.json();
};

/**
 * Добавить новый элемент
 */
export const addItem = async (id) => {
  const response = await fetch(`${API_BASE_URL}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add item");
  }
  return response.json();
};

/**
 * Добавить элементы в selected-items
 */
export const addToSelected = async (ids) => {
  const response = await fetch(`${API_BASE_URL}/selected-items/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add to selected");
  }
  return response.json();
};

/**
 * Удалить элементы из selected-items
 */
export const removeFromSelected = async (ids) => {
  const response = await fetch(`${API_BASE_URL}/selected-items/remove`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to remove from selected");
  }
  return response.json();
};

/**
 * Обновить порядок selected-items
 */
export const updateSelectedOrder = async (ids) => {
  const response = await fetch(`${API_BASE_URL}/selected-items/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update order");
  }
  return response.json();
};
