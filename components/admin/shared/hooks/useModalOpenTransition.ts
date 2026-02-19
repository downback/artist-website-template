"use client"

import { useEffect, useRef } from "react"

type UseModalOpenTransitionInput = {
  open: boolean
  onOpen: () => void
}

export const useModalOpenTransition = ({
  open,
  onOpen,
}: UseModalOpenTransitionInput) => {
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const animationFrameId = requestAnimationFrame(onOpen)
      wasOpenRef.current = open
      return () => cancelAnimationFrame(animationFrameId)
    }

    wasOpenRef.current = open
    return undefined
  }, [open, onOpen])
}
