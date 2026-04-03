import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import v1Router from "./routes/v1";
import { errorHandler } from "./middleware/error.middleware";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1", v1Router);

app.use(errorHandler);

app.listen(process.env.PORT, ()=> {
  console.log(`Server running on http://localhost:${process.env.PORT}`)
});