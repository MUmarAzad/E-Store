import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  OrdersState, 
  OrderFilters, 
  OrderStatus,
  CheckoutFormData 
} from '@/types';
import { orderService } from '@/services/order.service';

const initialState: OrdersState = {
  orders: [],
  selectedOrder: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (filters: OrderFilters = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { orders: OrdersState };
      const { pagination } = state.orders;
      const response = await orderService.getOrders({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrderById(id);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch order');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (data: CheckoutFormData, { rejectWithValue }) => {
    try {
      const response = await orderService.createOrder(data);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to create order');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await orderService.cancelOrder(id);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to cancel order');
    }
  }
);

// Admin thunks
export const fetchAllOrders = createAsyncThunk(
  'orders/fetchAllOrders',
  async (filters: OrderFilters = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { orders: OrdersState };
      const { pagination } = state.orders;
      const response = await orderService.getAllOrders({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch orders');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status, note }: { id: string; status: OrderStatus; note?: string }, { rejectWithValue }) => {
    try {
      const response = await orderService.updateOrderStatus(id, status, note);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to update order status');
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Orders (user)
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data;
        state.pagination = {
          ...state.pagination,
          total: action.payload.pagination.total,
          totalPages: action.payload.pagination.totalPages,
        };
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Order By ID
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Order
    builder
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.unshift(action.payload);
        state.selectedOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancel Order
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex((o) => o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.selectedOrder?._id === action.payload._id) {
          state.selectedOrder = action.payload;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch All Orders (admin)
    builder
      .addCase(fetchAllOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data;
        state.pagination = {
          ...state.pagination,
          total: action.payload.pagination.total,
          totalPages: action.payload.pagination.totalPages,
        };
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Order Status (admin)
    builder
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex((o) => o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.selectedOrder?._id === action.payload._id) {
          state.selectedOrder = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setPage, setLimit, clearSelectedOrder, clearError } = ordersSlice.actions;
export default ordersSlice.reducer;
