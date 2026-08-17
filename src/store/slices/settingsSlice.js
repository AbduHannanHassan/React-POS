import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cardSize: "md",      // sm | md | lg | custom
  customColumns: 3,
  theme: "light",
  posName: "OrderUp",
  logoUrl: "",         // empty = use default SVG logo
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setCardSize:      (state, action) => { state.cardSize      = action.payload; },
    setCustomColumns: (state, action) => { state.customColumns = action.payload; },
    setTheme:         (state, action) => { state.theme         = action.payload; },
    setPosName:       (state, action) => { state.posName       = action.payload; },
    setLogoUrl:       (state, action) => { state.logoUrl       = action.payload; },
  },
});

export const { setCardSize, setCustomColumns, setTheme, setPosName, setLogoUrl } = settingsSlice.actions;
export default settingsSlice.reducer;