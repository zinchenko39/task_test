const data = require("./data");

let addQueue = [];
let addSelectedQueue = [];
let removeSelectedQueue = [];
let updateSelectedOrderQueue = null;

/**
 * Generates the initial set of items asynchronously in batches.
 * @param {number} count - The total number of items to generate.
 * @param {number} batchSize - The number of items to add in each batch.
 * @param {number} delay - The delay in milliseconds between batches.
 */
const generateInitialItems = (count, batchSize, delay) => {
  let i = 1;
  const addBatch = () => {
    const end = Math.min(i + batchSize, count + 1);
    for (; i < end; i++) {
      data.allItems.set(i, i);
    }
    if (i <= count) {
      setTimeout(addBatch, delay);
    } else {
      console.log(`Finished generating ${count} initial items.`);
    }
  };
  addBatch();
};

/**
 * Processes the queue for adding new items.
 * It ensures that duplicate IDs are not added.
 */
const processAddQueue = () => {
  if (addQueue.length === 0) {
    return;
  }
  const uniqueIds = [...new Set(addQueue)];
  let itemsAdded = 0;
  uniqueIds.forEach((id) => {
    const isPresentInSelected = data.selectedItems.some((item) => item === id);
    if (!data.allItems.has(id) && !isPresentInSelected) {
      data.allItems.set(id, id);
      itemsAdded++;
    }
  });
  addQueue = [];
  if (itemsAdded > 0) {
    console.log(`Processed add queue. ${itemsAdded} new unique items added.`);
  }
};

/**
 * Processes the queues for adding and removing items from selected items.
 * Ensures no duplicates are added and resolves conflicts between add/remove operations.
 */
const processAddSelectedQueue = () => {
  if (addSelectedQueue.length === 0 && removeSelectedQueue.length === 0) {
    return;
  }

  const addQueueCopy = [...addSelectedQueue];
  const removeQueueCopy = [...removeSelectedQueue];

  const removeSet = new Set(removeQueueCopy);
  const filteredAddQueue = addQueueCopy.filter((id) => !removeSet.has(id));

  const currentSelectedSet = new Set(data.selectedItems);
  let itemsAdded = 0;
  let itemsRemoved = 0;

  const uniqueIdsToRemove = [...new Set(removeQueueCopy)];
  uniqueIdsToRemove.forEach((id) => {
    if (currentSelectedSet.has(id)) {
      const index = data.selectedItems.indexOf(id);
      if (index > -1) {
        data.selectedItems.splice(index, 1);
        currentSelectedSet.delete(id);
        itemsRemoved++;
      }
      data.allItems.set(id, id);
    }
  });

  const uniqueIdsToAdd = [...new Set(filteredAddQueue)];
  uniqueIdsToAdd.forEach((id) => {
    if (!currentSelectedSet.has(id)) {
      data.selectedItems.push(id);
      currentSelectedSet.add(id);
      itemsAdded++;
    }
    if (data.allItems.has(id)) {
      data.allItems.delete(id);
    }
  });

  addSelectedQueue = [];
  removeSelectedQueue = [];

  if (itemsAdded > 0 || itemsRemoved > 0) {
    console.log(
      `Processed selected items queues. ${itemsAdded} items added, ${itemsRemoved} items removed.`,
    );
  }
};

/**
 * Processes the queue for updating the order of selected items.
 * This is used for drag & drop sorting.
 */
const processUpdateSelectedOrderQueue = () => {
  if (updateSelectedOrderQueue === null) {
    return;
  }

  const newOrder = updateSelectedOrderQueue;
  const currentSelected = [...data.selectedItems]; // Копия текущего списка
  const currentSelectedSet = new Set(currentSelected);

  const validNewOrder = newOrder.filter((id) => currentSelectedSet.has(id));

  if (validNewOrder.length === 0) {
    console.log("Warning: Order update contains no valid IDs. Skipping.");
    updateSelectedOrderQueue = null;
    return;
  }

  if (
    validNewOrder.length === currentSelected.length &&
    new Set(validNewOrder).size === currentSelected.length
  ) {
    data.selectedItems = validNewOrder;
    updateSelectedOrderQueue = null;
    console.log(
      "Processed update selected items order queue. Full order updated.",
    );
    return;
  }

  const orderedIds = new Set(validNewOrder);
  const remainingIds = currentSelected.filter((id) => !orderedIds.has(id));
  data.selectedItems = [...validNewOrder, ...remainingIds];

  updateSelectedOrderQueue = null;
  console.log(
    `Processed update selected items order queue. ${validNewOrder.length} items reordered, ${remainingIds.length} items kept in original order.`,
  );
};

const addToAddQueue = (id) => {
  if (!addQueue.includes(id)) {
    addQueue.push(id);
  }
};

const addToAddSelectedQueue = (ids) => {
  ids.forEach((id) => {
    if (!addSelectedQueue.includes(id)) {
      addSelectedQueue.push(id);
    }
  });
};

const addToRemoveSelectedQueue = (ids) => {
  ids.forEach((id) => {
    if (!removeSelectedQueue.includes(id)) {
      removeSelectedQueue.push(id);
    }
  });
};

const setUpdateSelectedOrderQueue = (ids) => {
  updateSelectedOrderQueue = ids;
};

module.exports = {
  generateInitialItems,
  processAddQueue,
  processAddSelectedQueue,
  processUpdateSelectedOrderQueue,
  addToAddQueue,
  addToAddSelectedQueue,
  addToRemoveSelectedQueue,
  setUpdateSelectedOrderQueue,
};
