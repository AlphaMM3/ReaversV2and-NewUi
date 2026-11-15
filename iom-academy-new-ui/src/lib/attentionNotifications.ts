import { useEffect, useState } from 'react'

export interface AttentionNotificationItem {
  key: string
  text: string
  route: string
}

interface AttentionQueueState {
  docked: boolean
  items: AttentionNotificationItem[]
}

const EVENT_NAME = 'iom-attention-queue-change'

let state: AttentionQueueState = {
  docked: false,
  items: [],
}

function emitChange() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME))
}

export function publishAttentionQueue(items: AttentionNotificationItem[]): void {
  const prev = state.items
  const changed =
    prev.length !== items.length ||
    prev.some((p, i) => p.key !== items[i]?.key || p.text !== items[i]?.text || p.route !== items[i]?.route)
  if (!changed) return
  state = { ...state, items }
  emitChange()
}

export function setAttentionDocked(docked: boolean): void {
  if (state.docked === docked) return
  state = { ...state, docked }
  emitChange()
}

export function getAttentionQueueSnapshot(): AttentionQueueState {
  return state
}

export function useAttentionQueue(): AttentionQueueState {
  const [snapshot, setSnapshot] = useState<AttentionQueueState>(getAttentionQueueSnapshot)

  useEffect(() => {
    const sync = () => setSnapshot(getAttentionQueueSnapshot())
    window.addEventListener(EVENT_NAME, sync)
    return () => window.removeEventListener(EVENT_NAME, sync)
  }, [])

  return snapshot
}

