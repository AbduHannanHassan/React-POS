import { createSlice } from "@reduxjs/toolkit";

const DEFAULT_CATEGORIES = [
  { id: "cat_1", name: "Electronics", icon: "\u26A1", color: "#3b82f6" },
  { id: "cat_2", name: "Food",        icon: "\uD83C\uDF54", color: "#10b981" },
  { id: "cat_3", name: "Beverages",   icon: "\uD83E\uDD64", color: "#0ea5e9" },
  { id: "cat_4", name: "Clothing",    icon: "\uD83D\uDC55", color: "#ec4899" },
  { id: "cat_5", name: "Medicines",   icon: "\uD83D\uDC8A", color: "#ef4444" },
  { id: "cat_6", name: "Grocery",     icon: "\uD83D\uDED2", color: "#f97316" },
  { id: "cat_7", name: "Snacks",      icon: "\uD83C\uDF7F", color: "#eab308" },
];

const initialState = {
  categories: DEFAULT_CATEGORIES,
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    addCategory: (state, action) => {
      const newCat = {
        ...action.payload,
        id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      state.categories.push(newCat);
    },
    updateCategory: (state, action) => {
      const idx = state.categories.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) state.categories[idx] = { ...state.categories[idx], ...action.payload };
    },
    deleteCategory: (state, action) => {
      state.categories = state.categories.filter((c) => c.id !== action.payload);
    },
  },
});

export const { addCategory, updateCategory, deleteCategory } = categoriesSlice.actions;
export default categoriesSlice.reducer;