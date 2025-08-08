import express from "express";
import {
  createHelper,
  updateHelper,
  deleteHelperById,
  getHelperById,
  getAllHelpers,
} from "../controllers/helper.controller";
import { downloadIdCard } from "../controllers/idcard.controller";

const helpersRouter = express.Router();

helpersRouter.get("/id", downloadIdCard);
helpersRouter.delete("/:id", deleteHelperById);
helpersRouter.get("/:id", getHelperById);
helpersRouter.put("/:id", updateHelper);
helpersRouter.post("/", createHelper);
helpersRouter.get("/", getAllHelpers);

export default helpersRouter;
