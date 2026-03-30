import { Router, type IRouter } from "express";
import healthRouter from "./health";
import subjectsRouter from "./subjects";

const router: IRouter = Router();

router.use(healthRouter);
router.use(subjectsRouter);

export default router;
