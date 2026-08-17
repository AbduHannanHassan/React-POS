import { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";

export const CATEGORY_ICONS = {
  all:         "\uD83D\uDECD\uFE0F",
  electronics: "\u26A1",
  food:        "\uD83C\uDF54",
  beverages:   "\uD83E\uDD64",
  clothing:    "\uD83D\uDC55",
  medicines:   "\uD83D\uDC8A",
  cosmetics:   "\uD83D\uDC84",
  stationery:  "\uD83D\uDCDD",
  furniture:   "\uD83E\uDE91",
  sports:      "\u26BD",
  toys:        "\uD83E\uDDF8",
  grocery:     "\uD83D\uDED2",
  bakery:      "\uD83C\uDF5E",
  dairy:       "\uD83E\uDD5B",
  snacks:      "\uD83C\uDF7F",
  default:     "\uD83D\uDCE6",
};

export const CATEGORY_COLORS = [
  { light: "#f3e8ff", border: "#9333ea" },
  { light: "#dbeafe", border: "#3b82f6" },
  { light: "#d1fae5", border: "#10b981" },
  { light: "#ffedd5", border: "#f97316" },
  { light: "#fce7f3", border: "#ec4899" },
  { light: "#e0e7ff", border: "#6366f1" },
  { light: "#ccfbf1", border: "#14b8a6" },
  { light: "#fee2e2", border: "#ef4444" },
  { light: "#fef9c3", border: "#eab308" },
  { light: "#e0f2fe", border: "#0ea5e9" },
];

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category.toLowerCase()] || CATEGORY_ICONS.default;
}

function getCategoryColor(index) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

/* Arrow button */
const ArrowBtn = ({ direction, onClick, visible }) => (
  <button
    onClick={onClick}
    aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
    style={{
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? "auto" : "none",
      transition: "opacity 0.2s",
      background: "rgba(255,255,255,0.95)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    }}
    className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:border-accent-primary hover:text-accent-primary transition-colors duration-150 text-gray-500 z-10`}
  >
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
      {direction === "left"
        ? <path d="M12 5l-5 5 5 5V5z"/>
        : <path d="M8 5l5 5-5 5V5z"/>
      }
    </svg>
  </button>
);

function CategoryBar({ categories, selectedCategory, onSelectCategory, productCounts }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const allCategories = ["All", ...categories];

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    if (el) ro.observe(el);
    return () => { if (el) el.removeEventListener("scroll", checkScroll); ro.disconnect(); };
  }, [categories]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Left arrow */}
      <ArrowBtn direction="left" onClick={() => scroll("left")} visible={canScrollLeft} />

      {/* Scrollable pill strip */}
      <div className="relative flex-1 min-w-0">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {allCategories.map((category, index) => {
            const isAll = category === "All";
            const isSelected = selectedCategory === category;
            const colorIndex = isAll ? -1 : index - 1;
            const color = isAll
              ? { light: "#ede9fe", border: "#7c3aed" }
              : getCategoryColor(colorIndex);
            const icon = isAll ? CATEGORY_ICONS.all : getCategoryIcon(category);
            const count = isAll
              ? Object.values(productCounts).reduce((a, b) => a + b, 0)
              : productCounts[category] || 0;

            return (
              <button
                key={category}
                onClick={() => onSelectCategory(category)}
                style={
                  isSelected
                    ? {
                        background: color.border,
                        boxShadow: `0 4px 15px ${color.border}55`,
                        borderColor: "transparent",
                        color: "#ffffff",
                      }
                    : {
                        background: "var(--bg-secondary)",
                        borderColor: "#e5e7eb",
                        color: "#374151",
                      }
                }
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-semibold text-sm transition-all duration-250 hover:scale-105 hover:shadow-md focus:outline-none whitespace-nowrap cursor-pointer"
              >
                <span className="text-base leading-none">{icon}</span>
                <span className="capitalize">{category}</span>
                <span
                  style={
                    isSelected
                      ? { background: "rgba(255,255,255,0.22)", color: "#fff" }
                      : { background: color.light, color: color.border }
                  }
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none"
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right arrow */}
      <ArrowBtn direction="right" onClick={() => scroll("right")} visible={canScrollRight} />
    </div>
  );
}

CategoryBar.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedCategory: PropTypes.string.isRequired,
  onSelectCategory: PropTypes.func.isRequired,
  productCounts: PropTypes.objectOf(PropTypes.number).isRequired,
};

export default CategoryBar;