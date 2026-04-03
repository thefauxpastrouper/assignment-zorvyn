import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import v1Router from "./routes/v1";
import { globalErrorHandler } from "./middleware/error.middleware";
import { NotFoundError } from "./utils/error";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1", v1Router);

// 404 catch-all — any route that doesn't match above lands here
app.all("/{*path}", (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Global error handler (must be last middleware)
app.use(globalErrorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});