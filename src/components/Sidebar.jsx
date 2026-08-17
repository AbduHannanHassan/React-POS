import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import LogoIcon from "../assets/icon.svg";
import LogoText from "../assets/order-up.svg";
import lineSVG from "../assets/line.svg";

/* ============================================================
   SVG Icons  (all use fill-current to inherit text color)
   ============================================================ */
const DashIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
  </svg>
);

const InvIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>
);

const SalesIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM5.82 6l-.94-2H1v2h2l3.6 7.59L5.25 15c-.16.28-.25.61-.25.95C5 17.1 5.9 18 7 18h14v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 23.46 5H7.21l-.94-2H1v2h2.6L5.82 6z"/>
  </svg>
);

const PurchIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
  </svg>
);

const ExpIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
  </svg>
);

const SuppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5L21.46 12H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2.22-3c-.55-.61-1.33-1-2.22-1s-1.67.39-2.22 1H3V6h12v9H8.22zm9.78 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
  </svg>
);

const SettIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
  </svg>
);

const ChevDownIcon = ({ open }) => (
  <svg viewBox="0 0 20 20" className={`w-3 h-3 fill-current flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
    <path d="M5 7l5 5 5-5H5z"/>
  </svg>
);

/* ============================================================
   Reusable NavItem
   ============================================================ */
function NavItem({ to, icon, label, active, showLine }) {
  // Icon bubble style
  const bubbleCls = active ? "bg-white/25" : "bg-gray-100";
  const iconColor = active ? "text-white" : "text-[#555]";

  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center w-[95px] min-h-[68px] rounded-[8px] m-[3px_auto] relative transition-all duration-200 ${
        active
          ? "bg-[#9747FF] shadow-[0_4px_14px_rgba(151,71,255,0.35)]"
          : "hover:bg-[#9747FF0D]"
      }`}
    >
      {showLine && !active && (
        <img src={lineSVG} alt="" className="absolute top-0 left-1/2 -translate-x-1/2 opacity-60" />
      )}
      <span className={`flex items-center justify-center w-[36px] h-[36px] rounded-full mb-1 ${bubbleCls}`}>
        <span className={iconColor}>{icon}</span>
      </span>
      <span className={`text-[11px] font-semibold leading-tight ${active ? "text-white" : "text-[#888]"}`}>
        {label}
      </span>
    </Link>
  );
}

/* ============================================================
   Sub-link inside collapsible section
   ============================================================ */
function SubLink({ to, emoji, label }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all mx-2 mb-1 ${
        active
          ? "bg-[#9747FF] text-white shadow-sm"
          : "text-[#666] hover:bg-[#9747FF12] hover:text-[#9747FF]"
      }`}
    >
      <span className="text-sm">{emoji}</span>
      {label}
    </Link>
  );
}

/* ============================================================
   Sidebar
   ============================================================ */
export default function Sidebar() {
  const location = useLocation();
  const { posName, logoUrl } = useSelector(s => s.settings);

  const [inventoryOpen, setInventoryOpen] = useState(
    location.pathname.startsWith("/inventory")
  );

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="bg-white flex sm:flex-col sm:w-[140px] sm:h-[calc(100%-8px)] w-[calc(100%-10px)] h-[50px] flex-row justify-between items-center flex-shrink-0 sm:m-[4px_5px] sm:rounded-[10px] rounded-[6px] shadow fixed sm:static top-[5px] left-[5px] z-20">

      {/* ── Logo (desktop) ── */}
      <div className="hidden sm:flex flex-col items-center py-3 w-full cursor-pointer">
        <a href="/" className="flex flex-col items-center gap-1">
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="w-10 h-10 object-contain rounded-lg" />
          ) : (
            <img src={LogoIcon} alt="logo" className="w-8 h-8" />
          )}
          <span className="text-[13px] font-bold text-[#333] leading-none">
            {posName || <img src={LogoText} alt="OrderUp" className="h-[22px]" />}
          </span>
        </a>
      </div>

      {/* ── Logo (mobile) ── */}
      <div className="sm:hidden ml-2">
        <a href="/" className="flex items-center gap-1">
          {logoUrl
            ? <img src={logoUrl} alt="logo" className="w-7 h-7 object-contain rounded" />
            : <img src={LogoIcon} alt="logo" className="w-7 h-7" />
          }
          <span className="text-sm font-bold text-[#333]">{posName || "OrderUp"}</span>
        </a>
      </div>

      {/* ── Desktop nav ── */}
      <nav
        className="hidden sm:flex flex-col items-center flex-1 w-full overflow-y-auto py-1"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Dashboard */}
        <NavItem to="/" icon={<DashIcon />} label="Dashboard" active={isActive("/")} showLine={false} />

        {/* Inventory + sub-menu */}
        <div className="w-full">
          <button
            onClick={() => setInventoryOpen(o => !o)}
            className={`flex flex-col items-center justify-center w-[95px] min-h-[68px] rounded-[8px] m-[3px_auto] relative transition-all duration-200 cursor-pointer w-full ${
              isActive("/inventory")
                ? "bg-[#9747FF] shadow-[0_4px_14px_rgba(151,71,255,0.35)]"
                : "hover:bg-[#9747FF0D]"
            }`}
          >
            {!isActive("/inventory") && (
              <img src={lineSVG} alt="" className="absolute top-0 left-1/2 -translate-x-1/2 opacity-60" />
            )}
            <span className={`flex items-center justify-center w-[36px] h-[36px] rounded-full mb-1 ${isActive("/inventory") ? "bg-white/25" : "bg-gray-100"}`}>
              <span className={isActive("/inventory") ? "text-white" : "text-[#555]"}><InvIcon /></span>
            </span>
            <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${isActive("/inventory") ? "text-white" : "text-[#888]"}`}>
              Inventory <ChevDownIcon open={inventoryOpen} />
            </span>
          </button>
          <div className={`transition-all duration-300 overflow-hidden ${inventoryOpen ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}>
            <SubLink to="/inventory"            emoji={"\uD83D\uDCE6"} label="Products" />
            <SubLink to="/inventory/categories" emoji={"\uD83C\uDFF7\uFE0F"} label="Categories" />
          </div>
        </div>

        {/* Sales */}
        <NavItem to="/sales"     icon={<SalesIcon />}  label="Sales"      active={isActive("/sales")}     showLine />

        {/* Remaining items */}
        <NavItem to="/purchases" icon={<PurchIcon />}  label="Purchases"  active={isActive("/purchases")} showLine />
        <NavItem to="/expenses"  icon={<ExpIcon />}    label="Expenses"   active={isActive("/expenses")}  showLine />
        <NavItem to="/suppliers" icon={<SuppIcon />}   label="Suppliers"  active={isActive("/suppliers")} showLine />
        <NavItem to="/settings"  icon={<SettIcon />}   label="Settings"   active={isActive("/settings")}  showLine />
      </nav>

      {/* ── Mobile bottom nav ── */}
      <nav className="flex sm:hidden items-center justify-around fixed bottom-[5px] left-[5px] w-[calc(100%-10px)] h-[72px] bg-white rounded-[8px] shadow z-10">
        {[
          { to: "/",          icon: <DashIcon />,  label: "Home" },
          { to: "/inventory", icon: <InvIcon />,   label: "Inventory" },
          { to: "/sales",     icon: <SalesIcon />, label: "Sales" },
          { to: "/purchases", icon: <PurchIcon />, label: "Purchases" },
          { to: "/suppliers", icon: <SuppIcon />,  label: "Suppliers" },
        ].map(item => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] font-semibold ${
                active ? "text-[#9747FF]" : "text-[#9DB2CE]"
              }`}
            >
              <span
                className={`flex items-center justify-center w-[34px] h-[34px] rounded-full mb-0.5 ${
                  active ? "bg-[#9747FF] text-white" : "text-[#9DB2CE]"
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}