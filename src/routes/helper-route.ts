import express from "express";
import {
  createHelper,
  updateHelper,
  deleteHelper,
  getAllHelpersMetaData,
  getHelperById,
} from "../controllers/helper-controller";

const helpersRouter = express.Router();

helpersRouter.post("/", createHelper);
helpersRouter.get("/", getAllHelpersMetaData);
helpersRouter.get("/:id", getHelperById);
helpersRouter.put("/:id", updateHelper);
helpersRouter.delete("/:id", deleteHelper);

export default helpersRouter;
