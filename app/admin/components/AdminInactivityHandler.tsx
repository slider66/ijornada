'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function AdminInactivityHandler() {
    const router = useRouter()
    // 10 minutes in milliseconds
    // 10 * 60 * 1000 = 600000
    const INACTIVITY_LIMIT_MS = 600000
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const resetTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }

            timerRef.current = setTimeout(() => {
                router.push('/')
            }, INACTIVITY_LIMIT_MS)
        }

        // Events to detect activity
        const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart']

        const handleActivity = () => {
            resetTimer()
        }

        // Apply listeners
        events.forEach((event) => {
            window.addEventListener(event, handleActivity)
        })

        // Start timer initially
        resetTimer()

        return () => {
            // Cleanup
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity)
            })
        }
    }, [router, INACTIVITY_LIMIT_MS])

    return null
}
