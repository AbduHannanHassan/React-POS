import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getCollectionData } from "../../config/appwrite";
import { setProducts } from "./inventorySlice";
import { setPurchases } from "./purchaseSlice";
import { loadSales } from "./salesSlice";
import { setExpenses } from "./expenseSlice";
import { updateProfilePictureUrl } from "./userSlice";

const COLLECTIONS = ["inventory", "sales", "purchases", "expenses", "userdata"];

const DEFAULT_STATES = {
  inventory: { products: [] },
  sales:     { sales: [], todayTotal: 0 },
  purchases: { purchases: [] },
  expenses:  { expenses: [], categories: ["Rent","Salaries","Utilities","Supplies","Marketing","Insurance","Maintenance","Other"] },
  userdata:  { profilePictureUrl: "" },
};

export const syncUserData = createAsyncThunk(
  "auth/syncUserData",
  async (_, { dispatch }) => {
    try {
      const results = await Promise.allSettled(COLLECTIONS.map((c) => getCollectionData(c)));
      results.forEach((result, i) => {
        const key = COLLECTIONS[i];
        let data = DEFAULT_STATES[key];
        if (result.status === "fulfilled" && result.value?.success && result.value?.data) {
          data = { ...data, ...result.value.data };
        }
        switch (key) {
          case "inventory": dispatch(setProducts(data.products || [])); break;
          case "sales":     dispatch(loadSales(data.sales || [])); break;
          case "purchases": dispatch(setPurchases(data.purchases || [])); break;
          case "expenses":  dispatch(setExpenses(data)); break;
          case "userdata":  dispatch(updateProfilePictureUrl(data.profilePictureUrl || "")); break;
        }
      });
      return true;
    } catch (err) {
      console.error("Error syncing user data:", err);
      return false;
    }
  }
);

const initialState = {
  user: null,
  loading: false,
  error: null,
  syncing: false,
  dataLoaded: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const u = action.payload;
      state.user = {
        id:        u.id        || u.$id,
        email:     u.email,
        name:      u.name,
        role:      u.role      || "cashier",
        avatarUrl: u.avatarUrl || "",
        createdAt: u.createdAt || u.$createdAt,
      };
      state.loading = false;
      state.error   = null;
    },
    clearUser: (state) => {
      state.user      = null;
      state.loading   = false;
      state.error     = null;
      state.dataLoaded = false;
      sessionStorage.clear();
    },
    setLoading: (state, action) => { state.loading = action.payload; },
    setError:   (state, action) => { state.error = action.payload; state.loading = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncUserData.pending,   (state) => { state.syncing = true; })
      .addCase(syncUserData.fulfilled, (state) => { state.syncing = false; state.dataLoaded = true; })
      .addCase(syncUserData.rejected,  (state) => { state.syncing = false; state.error = "Failed to sync user data"; });
  },
});

export const { setUser, clearUser, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
