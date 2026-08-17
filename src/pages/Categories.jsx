import { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { deleteCategory } from "../store/slices/categoriesSlice";
import CategoryModal from "../components/CategoryModal";

function Categories() {
  const dispatch = useDispatch();
  const { categories } = useSelector(s => s.categories);
  const { products } = useSelector(s => s.inventory);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const productCounts = useMemo(() => {
    const counts = {};
    products.forEach(p => { if (p.category) counts[p.category] = (counts[p.category] || 0) + 1; });
    return counts;
  }, [products]);

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleEdit = (cat) => { setEditingCategory(cat); setIsModalOpen(true); };
  const handleAdd = () => { setEditingCategory(null); setIsModalOpen(true); };
  const handleDelete = (id) => { dispatch(deleteCategory(id)); setDeleteConfirm(null); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">\uD83C\uDFF7\uFE0F Categories</h1>
          <p className="text-text-secondary text-sm mt-1">{categories.length} categories defined</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <span className="text-lg">+</span> Add Category
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search categories..."
        className="input max-w-sm"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl">\uD83D\uDCED</span>
          <p className="text-text-secondary mt-3 font-medium">No categories found</p>
          <button onClick={handleAdd} className="btn btn-primary mt-4">Add First Category</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(cat => {
            const count = productCounts[cat.name] || 0;
            return (
              <div
                key={cat.id}
                className="bg-bg-secondary rounded-2xl p-4 border-2 transition-all duration-200 hover:shadow-lg group"
                style={{ borderColor: cat.color + "40" }}
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3 mx-auto"
                  style={{ background: cat.color + "20" }}
                >
                  {cat.icon}
                </div>
                {/* Info */}
                <p className="font-bold text-text-primary text-center capitalize truncate">{cat.name}</p>
                <p className="text-xs text-center mt-1 font-semibold" style={{ color: cat.color }}>
                  {count} product{count !== 1 ? "s" : ""}
                </p>
                {/* Actions */}
                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="flex-1 py-1 text-xs rounded-lg font-semibold transition-all"
                    style={{ background: cat.color + "20", color: cat.color }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(cat)}
                    className="flex-1 py-1 text-xs rounded-lg font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {/* Add new card */}
          <button
            onClick={handleAdd}
            className="bg-bg-tertiary rounded-2xl p-4 border-2 border-dashed border-border-color hover:border-accent-primary hover:bg-bg-secondary transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[140px]"
          >
            <span className="text-3xl text-text-tertiary">+</span>
            <p className="text-sm text-text-secondary font-medium">New Category</p>
          </button>
        </div>
      )}

      <CategoryModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCategory(null); }} category={editingCategory} />

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-bg-secondary rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <span className="text-4xl">\u26A0\uFE0F</span>
            <h3 className="text-lg font-bold text-text-primary mt-3">Delete Category?</h3>
            <p className="text-text-secondary text-sm mt-2">
              Delete <strong>{deleteConfirm.name}</strong>? Products in this category will not be affected.
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="btn flex-1 bg-red-500 text-white hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;