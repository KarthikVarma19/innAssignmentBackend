// src/index.ts

import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

import { config } from "./env";

// route imports
import helperRoute from "./routes/helper-route";

//db
import { connectDB } from "./config/db";
connectDB();

const app: Application = express();
const PORT = config.PORT;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/test", (_req: Request, _res: Response) => {
  _res.status(200).json({
    status: "ok",
    message: `Server is running on http://localhost:${PORT}`,
  });
});

app.use("/api/helpers", helperRoute);

app.use("*", (_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Server listener
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
