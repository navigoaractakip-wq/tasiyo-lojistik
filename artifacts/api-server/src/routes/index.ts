import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import loadsRouter from "./loads";
import offersRouter from "./offers";
import shipmentsRouter from "./shipments";
import vehiclesRouter from "./vehicles";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import messagesRouter from "./messages";
import settingsRouter from "./settings";
import contractsRouter from "./contracts";
import supportRouter from "./support";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(loadsRouter);
router.use(offersRouter);
router.use(shipmentsRouter);
router.use(vehiclesRouter);
router.use(notificationsRouter);
router.use(adminRouter);
router.use(messagesRouter);
router.use(settingsRouter);
router.use(contractsRouter);
router.use(supportRouter);

export default router;
