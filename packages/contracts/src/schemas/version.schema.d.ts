import { z } from 'zod';
export declare const VersionResponseSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name?: string;
    version?: string;
}, {
    name?: string;
    version?: string;
}>;
export type VersionResponse = z.infer<typeof VersionResponseSchema>;
