'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'



let isSeeding = false

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase.from('categories').select('*').order('name')
      let dataToSet = data || []

      // Deduplicate on the fly
      const seenNames = new Set<string>()
      const duplicates: string[] = []
      const uniqueCats: Category[] = []
      
      for (const cat of dataToSet) {
        if (seenNames.has(cat.name)) {
          duplicates.push(cat.id)
        } else {
          seenNames.add(cat.name)
          uniqueCats.push(cat)
        }
      }
      
      if (duplicates.length > 0) {
        await supabase.from('categories').delete().in('id', duplicates)
        dataToSet = uniqueCats
      }

      if (dataToSet.length === 0 && !isSeeding) {
        isSeeding = true
        const defaultCats = [
          { id: crypto.randomUUID(), name: 'Alimentação', icon: '🍔', type: 'expense', color: '#F59E0B' },
          { id: crypto.randomUUID(), name: 'Transporte', icon: '🚗', type: 'expense', color: '#3B82F6' },
          { id: crypto.randomUUID(), name: 'Moradia', icon: '🏠', type: 'expense', color: '#8B5CF6' },
          { id: crypto.randomUUID(), name: 'Lazer', icon: '🎉', type: 'expense', color: '#EC4899' },
          { id: crypto.randomUUID(), name: 'Saúde', icon: '🏥', type: 'expense', color: '#10B981' },
          { id: crypto.randomUUID(), name: 'Educação', icon: '📚', type: 'expense', color: '#6366F1' },
          { id: crypto.randomUUID(), name: 'Compras', icon: '🛍️', type: 'expense', color: '#F43F5E' },
          { id: crypto.randomUUID(), name: 'Assinaturas', icon: '📺', type: 'expense', color: '#8B5CF6' },
          { id: crypto.randomUUID(), name: 'Salário', icon: '💰', type: 'income', color: '#10B981' },
          { id: crypto.randomUUID(), name: 'Rendimentos', icon: '📈', type: 'income', color: '#3B82F6' },
          { id: crypto.randomUUID(), name: 'Vendas', icon: '🏷️', type: 'income', color: '#F59E0B' },
        ]
        const { data: insertedData, error: insertErr } = await supabase.from('categories').insert(defaultCats).select()
        if (!insertErr && insertedData) {
          dataToSet = insertedData
        }
        isSeeding = false
      }
      setCategories(dataToSet)
    } catch (e) {
      console.error('Error fetching categories:', e)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const createCategory = async (payload: Omit<Category, 'id' | 'created_at'>) => {
    const { data, error: err } = await supabase.from('categories').insert(payload).select().single()
    if (err) throw err
    setCategories((prev) => [...prev, data])
    return data
  }

  const updateCategory = async (id: string, payload: Partial<Category>) => {
    const { data, error: err } = await supabase.from('categories').update(payload).eq('id', id).select().single()
    if (err) throw err
    setCategories((prev) => prev.map((c) => (c.id === id ? data : c)))
    return data
  }

  const deleteCategory = async (id: string) => {
    const { error: err } = await supabase.from('categories').delete().eq('id', id)
    if (err) throw err
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  const getCategoryById = (id: string) => categories.find((c) => c.id === id)

  return { categories, loading, error, getCategoryById, createCategory, updateCategory, deleteCategory, refetch: fetchCategories }
}
