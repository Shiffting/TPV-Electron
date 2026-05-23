import jwt from "jsonwebtoken";

export function authMiddleware(
    req,
    res,
    next,
) {
    try {
        // =====================================
        // HEADER
        // =====================================

        const auth =
            req.headers.authorization;

        if (!auth) {
            return res.status(401).json({
                error: "TOKEN_REQUERIDO",
            });
        }

        // =====================================
        // TOKEN
        // =====================================

        const token =
            auth.replace("Bearer ", "");

        // =====================================
        // VERIFY
        // =====================================

        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET,
        );

        // =====================================
        // USER
        // =====================================

        req.user = {
            uid: payload.uid,
            email: payload.email,
            role: payload.role,
        };

        next();
    } catch (e) {
        return res.status(401).json({
            error: "TOKEN_INVALIDO",
        });
    }
}