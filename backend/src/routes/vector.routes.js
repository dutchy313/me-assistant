import express from "express";
import {
  embedChunks,
  prepareCollection,
  searchVectors,
  vectorStats
} from "../controllers/vector.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.post("/prepare-collection", prepareCollection);
router.post("/embed-chunks", embedChunks);
router.get("/stats", vectorStats);
router.post("/search", searchVectors);

export default router;