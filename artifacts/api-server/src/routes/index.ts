import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quizRouter from "./quiz";
import jumbledRouter from "./jumbled";
import crosswordRouter from "./crossword";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quizRouter);
router.use(jumbledRouter);
router.use(crosswordRouter);

export default router;
