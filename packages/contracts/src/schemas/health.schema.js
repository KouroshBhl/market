"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthResponseSchema = void 0;
const zod_1 = require("zod");
const zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
(0, zod_to_openapi_1.extendZodWithOpenApi)(zod_1.z);
exports.HealthResponseSchema = zod_1.z.object({
    ok: zod_1.z.boolean(),
}).openapi('HealthResponse');
//# sourceMappingURL=health.schema.js.map