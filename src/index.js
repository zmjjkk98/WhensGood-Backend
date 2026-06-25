require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoute = require("./routes/auth.route");
const eventRoute = require("./routes/event.route");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/events", eventRoute);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
