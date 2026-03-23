import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import loadsRouter from "./loads";
import offersRouter from "./offers";
import shipmentsRouter from "./shipments";
import vehiclesRouter from "./vehicles";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import messagesRouter from "./messages";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(loadsRouter);
router.use(offersRouter);
router.use(shipmentsRouter);
router.use(vehiclesRouter);
router.use(notificationsRouter);
router.use(adminRouter);
router.use(messagesRouter);

export default router;
