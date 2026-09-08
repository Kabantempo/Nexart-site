'use client'

import { useCallback } from 'react'
import { nanoid } from 'nanoid'
import { type PortfolioBlock, type PageSettings } from '@/lib/page-settings'

export function usePortfolioBlocks(
  blocks: PortfolioBlock[],
  onSave: (patch: Partial<PageSettings>) => Promise<{ ok: boolean }>,
  onUpdate: (patch: Partial<PageSettings>) => void,
) {
  const updateBlocks = useCallback((next: PortfolioBlock[]) => {
    onUpdate({ portfolio_blocks: next })
  }, [onUpdate])

  const saveBlocks = useCallback(async (next: PortfolioBlock[]) => {
    return onSave({ portfolio_blocks: next })
  }, [onSave])

  const addImage = useCallback((url: string) => {
    const next = [...blocks, {
      id: nanoid(), type: 'image' as const, content: url,
      x: 5, y: 5, width: 40, height: 30, rotation: 0,
    }]
    updateBlocks(next)
    return next
  }, [blocks, updateBlocks])

  const addText = useCallback(() => {
    const next = [...blocks, {
      id: nanoid(), type: 'text' as const, content: 'Mon texte…',
      x: 10, y: 10, width: 40, height: 15, rotation: 0, font: 'default' as const, fontSize: 16,
    }]
    updateBlocks(next)
    return next
  }, [blocks, updateBlocks])

  const updateBlock = useCallback((id: string, patch: Partial<PortfolioBlock>) => {
    const next = blocks.map(b => b.id === id ? { ...b, ...patch } : b)
    updateBlocks(next)
    return next
  }, [blocks, updateBlocks])

  const removeBlock = useCallback((id: string) => {
    const next = blocks.filter(b => b.id !== id)
    updateBlocks(next)
    return next
  }, [blocks, updateBlocks])

  return { addImage, addText, updateBlock, removeBlock, saveBlocks }
}
