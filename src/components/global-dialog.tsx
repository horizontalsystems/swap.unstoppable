'use client'

import { create } from 'zustand'
import { ComponentType } from 'react'
import { generateId } from '@/lib/utils'

interface DialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

interface DialogPayload<P = object> {
  id: string
  Component: ComponentType<P & DialogProps>
  props: P
}

interface DialogStore {
  dialogs: DialogPayload<any>[]
  openDialog: <P>(Component: ComponentType<P & DialogProps>, props: Omit<P, 'isOpen' | 'onOpenChange'>) => void
  closeDialog: () => void
}

export const useDialog = create<DialogStore>(set => ({
  dialogs: [],
  openDialog: (Component, props) => {
    set(state => ({
      dialogs: [...state.dialogs, { Component, props, id: generateId() }]
    }))
  },
  closeDialog: () => {
    set(state => ({
      dialogs: state.dialogs.slice(0, -1)
    }))
  }
}))

export const GlobalDialog = () => {
  const { dialogs, closeDialog } = useDialog()

  return dialogs.map(payload => {
    const { Component, props, id } = payload
    return (
      <Component
        key={id}
        isOpen={true}
        onOpenChange={(open: any) => {
          if (!open) closeDialog()
        }}
        {...props}
      />
    )
  })
}
