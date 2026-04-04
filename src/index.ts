import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import v1Router from "./routes/v1";
import { globalErrorHandler } from "./middleware/error.middleware";
import { rateLimiter } from "./middleware/rateLimit.middleware";
import { NotFoundError } from "./utils/error";
import { apiReference } from "@scalar/express-api-reference";
import openApiSpec from './docs/openapi.json';
import path from "node:path";

dotenv.config();

const app = express();

app.use(rateLimiter);
app.use(cors());
app.use(express.json());

app.use("/api/v1", v1Router);
app.use(
  '/reference',
  apiReference({
    theme: 'kepler', // Options: 'default', 'blue', 'purple', 'moon', 'mars'
    content: openApiSpec,
  })
);

app.get('/openapi.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs/openapi.json'));
});

// 404 catch-all — any route that doesn't match above lands here
app.all("/{*path}", (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Global error handler (must be last middleware)
app.use(globalErrorHandler);

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${process.env.PORT || 3000}`);
  console.log(`📖 Documentation: http://0.0.0.0:${process.env.PORT || 3000}/reference`);
});