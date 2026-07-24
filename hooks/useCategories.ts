'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'



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
      setCategories(data || [])
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
