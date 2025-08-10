import express from "express";
import {
  createHelper,
  updateHelper,
  deleteHelperById,
  getHelperById,
  getAllHelpers,
  downloadIdCard,
  getIDCard,
  verifyIDCard,
  getHelpersPaged,
} from "../controllers/helper.controller";

const helpersRouter = express.Router();

helpersRouter.delete("/:id", deleteHelperById);
helpersRouter.get("/page", getHelpersPaged);
helpersRouter.get("/:id", getHelperById);
helpersRouter.put("/:id", updateHelper);
helpersRouter.post("/", createHelper);
helpersRouter.get("/", getAllHelpers);
helpersRouter.get("/:id/id-card", getIDCard);
helpersRouter.get("/:id/id-card/verify", verifyIDCard);

export default helpersRouter;
