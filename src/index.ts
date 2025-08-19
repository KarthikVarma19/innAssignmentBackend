import express, { Application, Request as ExpressRequest, Response as ExpressResponse } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import { APP_CONFIG } from "./env";
import { connectToMongoDB } from "./config/db.config";
import { connectToCloudinaryCloudService } from "./config/cloudinary.config";
import uploadsRouter from "./routes/upload.routes";
import helpersRouter from "./routes/helper.routes";
import { verifySupabaseServiceConnection } from "./config/supabase.config";

const app: Application = express();
const PORT = APP_CONFIG.PORT;

/**
 * Database and Cloud Services Connection
 */
connectToMongoDB();
connectToCloudinaryCloudService();
verifySupabaseServiceConnection();

/**
 * Middlwares
 */
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

/**
 * Routes
 */
app.get("/test", (_req: ExpressRequest, _res: ExpressResponse) => {
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

/**
 * Server Runner
 */
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
