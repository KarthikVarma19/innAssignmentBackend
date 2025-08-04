import express from "express";
import {
  createHelper,
  updateHelper,
  deleteHelper,
  getHelperById,
  getAllHelpers,
} from "../controllers/helper-controller";

const helpersRouter = express.Router();

helpersRouter.post("/", createHelper);
helpersRouter.get("/", getAllHelpers);
helpersRouter.get("/:id", getHelperById);
helpersRouter.put("/:id", updateHelper);
helpersRouter.delete("/:id", deleteHelper);

export default helpersRouter;
