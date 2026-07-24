'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

const SEED_CATEGORIES: Omit<Category, 'created_at'>[] = [
  { id: 'cat-1', name: 'Alimentação', color: '#F97316', icon: '🍔', type: 'expense', budget: 1000 },
  { id: 'cat-2', name: 'Transporte', color: '#3B82F6', icon: '🚗', type: 'expense', budget: 500 },
  { id: 'cat-3', name: 'Moradia', color: '#8B5CF6', icon: '🏠', type: 'expense', budget: 2000 },
  { id: 'cat-4', name: 'Saúde', color: '#10B981', icon: '💊', type: 'expense', budget: 300 },
  { id: 'cat-5', name: 'Lazer', color: '#EC4899', icon: '🎮', type: 'expense', budget: 400 },
  { id: 'cat-6', name: 'Educação', color: '#14B8A6', icon: '📚', type: 'expense', budget: 600 },
  { id: 'cat-7', name: 'Vestuário', color: '#F59E0B', icon: '👔', type: 'expense', budget: 300 },
  { id: 'cat-8', name: 'Salário', color: '#10B981', icon: '💼', type: 'income' },
  { id: 'cat-9', name: 'Freelance', color: '#6366F1', icon: '💻', type: 'income' },
  { id: 'cat-10', name: 'Investimentos', color: '#0EA5E9', icon: '📈', type: 'income' },
]

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase.from('categories').select('*').order('name')
      if (err) throw err
      setCategories(!data || data.length === 0 ? (SEED_CATEGORIES as Category[]) : data)
    } catch {
      setCategories(SEED_CATEGORIES as Category[])
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
