import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { addCategory, updateCategory } from "../store/slices/categoriesSlice";

const EMOJI_OPTIONS = [
  "\u26A1","\uD83C\uDF54","\uD83E\uDD64","\uD83D\uDC55","\uD83D\uDC8A","\uD83D\uDC84",
  "\uD83D\uDCDD","\uD83E\uDE91","\u26BD","\uD83E\uDDF8","\uD83D\uDED2","\uD83C\uDF5E",
  "\uD83E\uDD5B","\uD83C\uDF7F","\uD83D\uDCE6","\uD83D\uDD26","\uD83D\uDCBB","\uD83D\uDCF1",
  "\uD83C\uDFE0","\uD83D\uDE97","\u2615","\uD83C\uDF6F","\uD83E\uDD69","\uD83C\uDF3F",
  "\uD83D\uDEE0\uFE0F","\uD83C\uDFA8","\uD83D\uDCDA","\uD83E\uDDF9","\uD83D\uDC36","\uD83C\uDF89"
];

const COLOR_OPTIONS = [
  "#9333ea","#3b82f6","#10b981","#f97316",
  "#ec4899","#6366f1","#14b8a6","#ef4444",
  "#eab308","#0ea5e9","#84cc16","#f43f5e"
];

function CategoryModal({ isOpen, onClose, category }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: "", icon: "\uD83D\uDCE6", color: "#9333ea" });

  useEffect(() => {
    if (category) setForm({ name: category.name, icon: category.icon, color: category.color });
    else setForm({ name: "", icon: "\uD83D\uDCE6", color: "#9333ea" });
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (category) dispatch(updateCategory({ ...category, ...form }));
    else dispatch(addCategory(form));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-bg-secondary rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border-color">
          <h2 className="text-xl font-bold text-text-primary">
            {category ? "Edit Category" : "Add Category"}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: form.color + "20", border: `2px solid ${form.color}` }}>
            <span className="text-3xl">{form.icon}</span>
            <div>
              <p className="font-bold text-text-primary">{form.name || "Category Name"}</p>
              <p className="text-xs text-text-secondary">Preview</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1">Category Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Electronics"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">Icon</label>
            <div className="grid grid-cols-10 gap-1.5">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, icon: emoji }))}
                  className="text-xl p-1.5 rounded-lg transition-all hover:scale-110"
                  style={form.icon === emoji ? { background: form.color + "30", outline: `2px solid ${form.color}` } : { background: "var(--bg-tertiary)" }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color }))}
                  className="w-8 h-8 rounded-full transition-all hover:scale-110"
                  style={{
                    background: color,
                    outline: form.color === color ? `3px solid ${color}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn btn-primary flex-1">
              {category ? "Save Changes" : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

CategoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  category: PropTypes.object,
};

export default CategoryModal;