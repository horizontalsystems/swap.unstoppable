'use client'

import { create } from 'zustand'
import { ComponentType } from 'react'

interface DialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

interface DialogPayload<P = object> {
  Component: ComponentType<P & DialogProps>
  props: P
}

interface DialogStore {
  isOpen: boolean
  payload: DialogPayload<any> | null
  openDialog: <P>(Component: ComponentType<P & DialogProps>, props: Omit<P, 'isOpen' | 'onOpenChange'>) => void
  closeDialog: () => void
}

export const useDialog = create<DialogStore>(set => ({
  isOpen: false,
  payload: null,
  openDialog: (Component, props) => {
    set({ isOpen: true, payload: { Component, props } })
  },
  closeDialog: () => {
    set({ isOpen: false, payload: null })
  }
}))

export const GlobalDialog = () => {
  const { isOpen, payload, closeDialog } = useDialog()
  if (!isOpen || !payload) {
    return null
  }

  const { Component, props } = payload
  return <Component isOpen={isOpen} onOpenChange={closeDialog} {...props} />
}
