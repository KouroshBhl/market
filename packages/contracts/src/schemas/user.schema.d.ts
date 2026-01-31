import { z } from 'zod';
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
    email?: string;
    createdAt?: string;
}, {
    id?: string;
    email?: string;
    createdAt?: string;
}>;
export type User = z.infer<typeof UserSchema>;
