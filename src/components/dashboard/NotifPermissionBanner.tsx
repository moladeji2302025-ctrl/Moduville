'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { requestNotificationPermission, getNotificationPermission } from '@/lib/notifications'

export function NotifPermissionBanner() {
  const [status,    setStatus]    = useState<'loading' | 'default' | 'granted' | 'denied' | 'unsupported'>('loading')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setStatus(getNotificationPermission() as typeof status)
  }, [])

  async function handleEnable() {
    const result = await requestNotificationPermission()
    setStatus(result as typeof status)
  }

  const show = status === 'default' && !dismissed

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden mb-4"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gold/6 border border-gold/22">
            <Bell className="w-3.5 h-3.5 text-gold/70 flex-shrink-0" />
            <p className="flex-1 text-muted/80 text-xs font-body">
              Get reminders before each block starts.
            </p>
            <button
              onClick={handleEnable}
              className="text-gold text-xs font-body hover:text-gold/80 transition-colors flex-shrink-0"
            >
              Enable
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-muted/40 hover:text-muted transition-colors flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
