import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import '../i18n'
import { CartProvider } from './CartProvider'
import { useCart } from './useCart'
import * as cartApi from '../api/cart'
import type { Cart } from '../api/cart'

vi.mock('../api/cart')

function makeCart(overrides: Partial<Cart> = {}): Cart {
  return { items: [], subtotal: 0, totalQuantity: 0, ...overrides }
}

function CartProbe() {
  const { cart, loading, addItem } = useCart()
  if (loading) return <p>loading</p>
  return (
    <div>
      <p>quantity: {cart.totalQuantity}</p>
      <button onClick={() => addItem(1, 2)}>add</button>
    </div>
  )
}

describe('CartProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('loads the cart on mount', async () => {
    vi.mocked(cartApi.fetchCart).mockResolvedValue(makeCart({ totalQuantity: 3 }))

    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    )

    expect(screen.getByText('loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('quantity: 3')).toBeInTheDocument())
  })

  it('addItem() replaces the cart with the server response', async () => {
    vi.mocked(cartApi.fetchCart).mockResolvedValue(makeCart({ totalQuantity: 0 }))
    vi.mocked(cartApi.addToCart).mockResolvedValue(makeCart({ totalQuantity: 2 }))

    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    )

    await waitFor(() => expect(screen.getByText('quantity: 0')).toBeInTheDocument())
    await act(async () => {
      screen.getByText('add').click()
    })

    await waitFor(() => expect(screen.getByText('quantity: 2')).toBeInTheDocument())
    expect(cartApi.addToCart).toHaveBeenCalledWith(1, 2, expect.any(String))
  })
})
