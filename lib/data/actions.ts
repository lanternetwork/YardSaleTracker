'use server'

import { createSale, updateSale, deleteSale, createItem, toggleFavorite } from './sales'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Server actions for sales
export async function createSaleAction(input: Parameters<typeof createSale>[0]) {
  try {
    const sale = await createSale(input)
    revalidatePath('/sales')
    revalidatePath('/dashboard/sales')
    return { success: true, data: sale }
  } catch (error) {
    console.error('Error in createSaleAction:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function updateSaleAction(id: string, input: Parameters<typeof updateSale>[1]) {
  try {
    const sale = await updateSale(id, input)
    revalidatePath('/sales')
    revalidatePath(`/sales/${id}`)
    revalidatePath('/dashboard/sales')
    return { success: true, data: sale }
  } catch (error) {
    console.error('Error in updateSaleAction:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function deleteSaleAction(id: string) {
  try {
    await deleteSale(id)
    revalidatePath('/sales')
    revalidatePath('/dashboard/sales')
    redirect('/sales')
  } catch (error) {
    console.error('Error in deleteSaleAction:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Server actions for items
export async function createItemAction(saleId: string, input: Parameters<typeof createItem>[1]) {
  try {
    const item = await createItem(saleId, input)
    revalidatePath(`/sales/${saleId}`)
    return { success: true, data: item }
  } catch (error) {
    console.error('Error in createItemAction:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Server actions for favorites
export async function toggleFavoriteAction(saleId: string) {
  try {
    const result = await toggleFavorite(saleId)
    revalidatePath('/sales')
    revalidatePath(`/sales/${saleId}`)
    revalidatePath('/favorites')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error in toggleFavoriteAction:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
