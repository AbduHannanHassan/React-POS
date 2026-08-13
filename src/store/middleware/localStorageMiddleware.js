import { getCollectionData, saveCollectionData, getToken } from "../../config/appwrite";
import { setProducts } from "../slices/inventorySlice";
import { loadSales } from "../slices/salesSlice";
import { setPurchases } from "../slices/purchaseSlice";
import { setExpenses } from "../slices/expenseSlice";
import { updateProfilePictureUrl } from "../slices/userSlice";

const SYNC_DEBOUNCE_TIME = 2000;
let syncTimeout = null;
let isSyncing = false;
let hasInitialDataLoaded = false;

const DEFAULT_STATES = {
  inventory: { products: [] },
  sales:     { sales: [], todayTotal: 0 },
  purchases: { purchases: [] },
  expenses:  {
    expenses: [],
    categories: ["Rent","Salaries","Utilities","Supplies","Marketing","Insurance","Maintenance","Other"],
  },
  userdata:  { profilePictureUrl: "" },
};

// ─── Fetch initial data from SQLite backend ────────────────────────────────────
const fetchInitialData = async (store) => {
  if (hasInitialDataLoaded || !getToken()) return;

  try {
    const collections = ["inventory", "sales", "purchases", "expenses", "userdata"];
    const results = await Promise.allSettled(collections.map((c) => getCollectionData(c)));

    results.forEach((result, index) => {
      const key = collections[index];
      let data = DEFAULT_STATES[key];

      if (result.status === "fulfilled" && result.value?.success && result.value?.data) {
        data = { ...data, ...result.value.data };
      }

      switch (key) {
        case "inventory": store.dispatch(setProducts(data.products || [])); break;
        case "sales":     store.dispatch(loadSales(data.sales || [])); break;
        case "purchases": store.dispatch(setPurchases(data.purchases || [])); break;
        case "expenses":  store.dispatch(setExpenses(data)); break;
        case "userdata":  store.dispatch(updateProfilePictureUrl(data.profilePictureUrl || "")); break;
      }
    });

    hasInitialDataLoaded = true;
  } catch (err) {
    console.error("Error fetching initial data:", err);
    // Dispatch defaults so the app isn't blank
    store.dispatch(setProducts([]));
    store.dispatch(loadSales([]));
    store.dispatch(setPurchases([]));
    store.dispatch(setExpenses(DEFAULT_STATES.expenses));
    store.dispatch(updateProfilePictureUrl(""));
  }
};

// ─── Sync state back to SQLite backend ────────────────────────────────────────
const performSync = async (state) => {
  if (isSyncing || !hasInitialDataLoaded || !getToken()) return;

  try {
    isSyncing = true;
    await Promise.allSettled([
      saveCollectionData("inventory", state.inventory),
      saveCollectionData("sales",     state.sales),
      saveCollectionData("purchases", state.purchases),
      saveCollectionData("expenses",  state.expenses),
      saveCollectionData("userdata",  state.userdata),
    ]);
  } catch (err) {
    console.error("Sync error:", err);
  } finally {
    isSyncing = false;
  }
};

/** Reset the initial-load flag (call after login / user change) */
export const resetInitialDataFlag = () => { hasInitialDataLoaded = false; };

// ─── Redux middleware ──────────────────────────────────────────────────────────
export const localStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();
  const { user } = state.auth;

  // Session storage for temporary persistence (page refresh resilience)
  try {
    sessionStorage.setItem("pos_inventory", JSON.stringify(state.inventory));
    sessionStorage.setItem("pos_sales",     JSON.stringify(state.sales));
    sessionStorage.setItem("pos_purchases", JSON.stringify(state.purchases));
    sessionStorage.setItem("pos_expenses",  JSON.stringify(state.expenses));
    sessionStorage.setItem("pos_user",      JSON.stringify(state.userdata));
  } catch {}

  // Fetch initial data when user logs in
  if (user?.id && !hasInitialDataLoaded) {
    fetchInitialData(store);
  }

  // Debounce sync on subsequent changes
  if (user?.id && hasInitialDataLoaded) {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => performSync(state), SYNC_DEBOUNCE_TIME);
  }

  return result;
};
