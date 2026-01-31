import { z } from 'zod';
export declare const HealthResponseSchema: z.ZodObject<{
    ok: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    ok?: boolean;
}, {
    ok?: boolean;
}>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
