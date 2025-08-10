// src/index.ts

import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

import { config } from "./env";

//db
import { connectDB } from "./config/db.config";
// cloudinary
import { connectCloudinary } from "./config/cloudinary.config";
// routes
import uploadsRouter from "./routes/upload.routes";
import helpersRouter from "./routes/helper.routes";
import { checkSupabaseConnection } from "./config/supabase.config";

// connect databases
connectDB();
connectCloudinary();
checkSupabaseConnection();

const app: Application = express();
const PORT = config.PORT;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Routes

app.use((req, res, next) => {
  console.log(req.body, req.file, req.files);
  next();
});

app.get("/test", (_req: Request, _res: Response) => {
  _res.status(200).json({
    status: "ok",
    message: `Server is running on http://localhost:${PORT}`,
  });
});

app.use("/api/helpers", helpersRouter);
app.use("/api/upload", uploadsRouter);

app.use("*", (_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Server listener
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
