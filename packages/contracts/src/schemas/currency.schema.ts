import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const CurrencySchema = z.enum(['USD', 'EUR', 'UAH', 'RUB', 'IRR']).openapi('Currency');

export type Currency = z.infer<typeof CurrencySchema>;
