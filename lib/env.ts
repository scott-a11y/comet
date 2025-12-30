import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

/**
 * Centralized env validation.
 *
 * Clerk keys are OPTIONAL here so that local dev / CI can run without Clerk.
 * Client-side code should only ever read NEXT_PUBLIC_* vars.
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // Optional Clerk secret key (starts with sk_)
    CLERK_SECRET_KEY: z
      .string()
      .min(1)
      .refine((key) => key.startsWith('sk_'), {
        message:
          'CLERK_SECRET_KEY must start with "sk_" (secret key). You may have accidentally used a publishable key.',
      })
      .optional(),
    SENTRY_DSN: z.string().url().optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
  },
  client: {
    // Optional Clerk publishable key (starts with pk_)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
      .string()
      .min(1)
      .refine((key) => key.startsWith('pk_'), {
        message:
          'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with "pk_" (publishable key). You may have accidentally used a secret key.',
      })
      .optional(),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
    NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: z.string().default('/'),
    NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: z.string().default('/'),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
})
