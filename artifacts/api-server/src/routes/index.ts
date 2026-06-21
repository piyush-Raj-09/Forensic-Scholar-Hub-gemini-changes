import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quizRouter from "./quiz";
import jumbledRouter from "./jumbled";
import crosswordRouter from "./crossword";
import crimeSceneRouter from "./crime-scene";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quizRouter);
router.use(jumbledRouter);
router.use(crosswordRouter);
router.use(crimeSceneRouter);

export default router;
