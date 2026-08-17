import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  suppliers: [],
};

const suppliersSlice = createSlice({
  name: "suppliers",
  initialState,
  reducers: {
    addSupplier: (state, action) => {
      const newSupplier = {
        ...action.payload,
        id: `sup_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      state.suppliers.push(newSupplier);
    },
    updateSupplier: (state, action) => {
      const idx = state.suppliers.findIndex((s) => s.id === action.payload.id);
      if (idx !== -1) state.suppliers[idx] = { ...state.suppliers[idx], ...action.payload };
    },
    deleteSupplier: (state, action) => {
      state.suppliers = state.suppliers.filter((s) => s.id !== action.payload);
    },
  },
});

export const { addSupplier, updateSupplier, deleteSupplier } = suppliersSlice.actions;
export default suppliersSlice.reducer;