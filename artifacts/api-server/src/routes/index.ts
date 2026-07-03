import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import adoptionRouter from "./adoption";
import investmentRouter from "./investment";
import toolsRouter from "./tools";
import forecastRouter from "./forecast";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(adoptionRouter);
router.use(investmentRouter);
router.use(toolsRouter);
router.use(forecastRouter);

export default router;
