import express from "express";
import { createHelper, updateHelper, deleteHelperById, getHelperById, getAllHelpers, getIDCard, getHelpersPaged, generateIDCard } from "../controllers/helper.controller";

const helpersRouter = express.Router();

helpersRouter.delete("/:id", deleteHelperById);
helpersRouter.post("/page", getHelpersPaged);
helpersRouter.get("/:id", getHelperById);
helpersRouter.put("/:id", updateHelper);
helpersRouter.post("/", createHelper);
helpersRouter.get("/", getAllHelpers);
helpersRouter.get("/:id/id-card", generateIDCard);
helpersRouter.get("/:id/id-card/verify", getIDCard);
export default helpersRouter;
