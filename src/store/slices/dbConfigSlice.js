import { createSlice } from "@reduxjs/toolkit";
import { getStoredConfig, saveConfig, clearConfig } from "../../config/appwrite";

// Try to load saved config from localStorage on startup
const storedConfig = getStoredConfig();

const initialState = {
  configured: !!(storedConfig?.endpoint && storedConfig?.projectId && storedConfig?.setupComplete),
  setupComplete: storedConfig?.setupComplete || false,
  connected: false, // will be set after test
  provider: "appwrite",
  config: storedConfig || {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || "",
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || "",
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || "",
    collectionIds: {
      inventory: import.meta.env.VITE_INVENTORY_COLLECTION || "",
      sales: import.meta.env.VITE_SALES_COLLECTION || "",
      purchases: import.meta.env.VITE_PURCHASES_COLLECTION || "",
      expenses: import.meta.env.VITE_EXPENSES_COLLECTION || "",
      user: import.meta.env.VITE_USERS_COLLECTION || "",
    },
    bucketId: import.meta.env.VITE_PROFILE_PICTURES_BUCKET_ID || "",
    setupComplete: false,
  },
  error: null,
};

// If env vars are set and no localStorage config, mark as configured (backwards compat)
if (
  !initialState.configured &&
  import.meta.env.VITE_APPWRITE_ENDPOINT &&
  import.meta.env.VITE_APPWRITE_PROJECT_ID &&
  import.meta.env.VITE_APPWRITE_DATABASE_ID
) {
  initialState.configured = true;
  initialState.setupComplete = true;
}

const dbConfigSlice = createSlice({
  name: "dbConfig",
  initialState,
  reducers: {
    setDbConfig: (state, action) => {
      state.config = { ...state.config, ...action.payload };
      state.configured = !!(action.payload.endpoint && action.payload.projectId);
      if (action.payload.setupComplete) state.setupComplete = true;
      saveConfig(state.config);
    },
    setConnectionStatus: (state, action) => {
      state.connected = action.payload.connected;
      state.error = action.payload.error || null;
    },
    markSetupComplete: (state) => {
      state.setupComplete = true;
      state.configured = true;
      state.config.setupComplete = true;
      saveConfig(state.config);
    },
    resetDbConfig: (state) => {
      clearConfig();
      state.configured = false;
      state.setupComplete = false;
      state.connected = false;
      state.config = initialState.config;
      state.error = null;
    },
  },
});

export const {
  setDbConfig,
  setConnectionStatus,
  markSetupComplete,
  resetDbConfig,
} = dbConfigSlice.actions;

export default dbConfigSlice.reducer;
