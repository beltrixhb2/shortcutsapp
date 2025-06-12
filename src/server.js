const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
// Serve static assets from public folder
app.use(express.static(path.join(__dirname, "..", "public")));

// API route for AI shortcuts
const aiRouter = require("./routes/ai");
app.use("/api/ai", aiRouter);

// Fallback to index.html for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
