const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");
const { generateInitialItems } = require("./utils");
const { startSchedulers } = require("./scheduler");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use("/", apiRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  generateInitialItems(1000000, 10000, 10);

  startSchedulers();
});
