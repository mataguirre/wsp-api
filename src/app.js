const appRouter = require("./routers/appRouter.js");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`server initialized at http://localhost:${PORT}`);
});

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", appRouter);

app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    message: "Not found",
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({
    status: "error",
    message: err.message,
  });
});
