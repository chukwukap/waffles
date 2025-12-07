'use client'
import { env } from '@/lib/env'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Only init if key is present to avoid errors in dev/build
        if (env.nextPublicPosthogKey) {
            posthog.init(env.nextPublicPosthogKey, {
                api_host: env.nextPublicPosthogHost,
                person_profiles: 'identified_only',
                capture_pageview: true, // Automatically capture pageviews
                // Enable debug mode in development
                loaded: (posthog) => {
                    if (process.env.NODE_ENV === 'development') posthog.debug()
                }
            })
        }
    }, [])

    return <PHProvider client={posthog}>{children}</PHProvider>
}
