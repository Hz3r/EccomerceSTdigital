import type { Request } from "express";
import type { TokenPayload } from "../utils/token.js";
export interface AuthRequest extends Request {
    user?: TokenPayload;
}
//# sourceMappingURL=index.d.ts.map