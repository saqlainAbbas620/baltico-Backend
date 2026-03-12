import { Router } from "express";
import { googleAuth } from "../controllers/oauth.controller.js";

const router = Router();

router.post("/google", googleAuth);

export default router;
