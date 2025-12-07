import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CartState, Cart, AddToCartData, UpdateCartItemData } from '@/types';
import { cartService } from '@/services/cart.service';

const initialState: CartState = {
  cart: null,
  itemCount: 0,
  isLoading: false,
  isSyncing: false,
  error: null,
};

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartService.getCart();
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (data: AddToCartData, { rejectWithValue }) => {
    try {
      const response = await cartService.addItem(data);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to add item to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async (data: UpdateCartItemData, { rejectWithValue }) => {
    try {
      const response = await cartService.updateItem(data);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to update cart item');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await cartService.removeItem(productId);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to remove item from cart');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await cartService.clearCart();
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to clear cart');
    }
  }
);

export const mergeGuestCart = createAsyncThunk(
  'cart/mergeGuestCart',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await cartService.mergeCart(sessionId);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to merge cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<Cart>) => {
      state.cart = action.payload;
      state.itemCount = action.payload.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    },
    clearCartState: (state) => {
      state.cart = null;
      state.itemCount = 0;
      state.error = null;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
        state.itemCount = action.payload.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add to Cart
    builder
      .addCase(addToCart.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.cart = action.payload;
        state.itemCount = action.payload.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });

    // Update Cart Item
    builder
      .addCase(updateCartItem.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.cart = action.payload;
        state.itemCount = action.payload.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });

    // Remove from Cart
    builder
      .addCase(removeFromCart.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.cart = action.payload;
        state.itemCount = action.payload.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });

    // Clear Cart
    builder
      .addCase(clearCart.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.isSyncing = false;
        state.cart = null;
        state.itemCount = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });

    // Merge Guest Cart
    builder
      .addCase(mergeGuestCart.pending, (state) => {
        state.isSyncing = true;
      })
      .addCase(mergeGuestCart.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.cart = action.payload;
        state.itemCount = action.payload.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      })
      .addCase(mergeGuestCart.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCart, clearCartState, setSyncing, clearError } = cartSlice.actions;
export default cartSlice.reducer;
