import { Router } from "express";

import { pinLogin } from "../../domain/empleados/pinLogin.js";

const router = Router();

router.post(
    "/pin-login",
    pinLogin,
);

export default router;