"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionResponseSchema = void 0;
const zod_1 = require("zod");
const zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
(0, zod_to_openapi_1.extendZodWithOpenApi)(zod_1.z);
exports.VersionResponseSchema = zod_1.z.object({
    name: zod_1.z.string(),
    version: zod_1.z.string(),
}).openapi('VersionResponse');
//# sourceMappingURL=version.schema.js.map