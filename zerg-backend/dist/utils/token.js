import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "zerg-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";
export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
//# sourceMappingURL=token.js.map