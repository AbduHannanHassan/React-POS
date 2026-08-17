import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { deleteSupplier } from "../store/slices/suppliersSlice";
import SupplierModal from "../components/SupplierModal";

function Suppliers() {
  const dispatch = useDispatch();
  const { suppliers } = useSelector(s => s.suppliers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState("card");

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contactPerson || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (sup) => { setEditingSupplier(sup); setIsModalOpen(true); };
  const handleAdd = () => { setEditingSupplier(null); setIsModalOpen(true); };

  const AVATARS = ["#9333ea","#3b82f6","#10b981","#f97316","#ec4899","#6366f1","#14b8a6","#ef4444"];
  const avatar = (name, i) => AVATARS[i % AVATARS.length];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">\uD83D\uDE9A Suppliers</h1>
          <p className="text-text-secondary text-sm mt-1">{suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""} registered</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <span className="text-lg">+</span> Add Supplier
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center flex-wrap">
        <input type="text" placeholder="Search suppliers..." className="input max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2 ml-auto">
          <button onClick={() => setViewMode("card")} className={`btn text-sm ${viewMode === "card" ? "btn-primary" : "btn-secondary"}`}>\uD83D\uDCF3 Cards</button>
          <button onClick={() => setViewMode("table")} className={`btn text-sm ${viewMode === "table" ? "btn-primary" : "btn-secondary"}`}>\uD83D\uDCCB List</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl">\uD83D\uDE9A</span>
          <p className="text-text-secondary mt-3 font-medium">
            {suppliers.length === 0 ? "No suppliers yet" : "No suppliers match your search"}
          </p>
          {suppliers.length === 0 && <button onClick={handleAdd} className="btn btn-primary mt-4">Add First Supplier</button>}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sup, i) => (
            <div key={sup.id} className="bg-bg-secondary rounded-2xl p-5 border border-border-color hover:shadow-lg transition-all duration-200 group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: avatar(sup.name, i) }}>
                  {sup.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text-primary truncate">{sup.name}</h3>
                  {sup.contactPerson && <p className="text-sm text-text-secondary truncate">\uD83D\uDC64 {sup.contactPerson}</p>}
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                {sup.phone && <p className="flex items-center gap-2 text-text-secondary"><span>\uD83D\uDCDE</span>{sup.phone}</p>}
                {sup.email && <p className="flex items-center gap-2 text-text-secondary truncate"><span>\uD83D\uDCE7</span>{sup.email}</p>}
                {sup.address && <p className="flex items-center gap-2 text-text-secondary"><span>\uD83D\uDCCD</span>{sup.address}</p>}
                {sup.notes && <p className="flex items-center gap-2 text-text-tertiary italic truncate"><span>\uD83D\uDCCB</span>{sup.notes}</p>}
              </div>
              <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(sup)} className="btn btn-secondary text-xs flex-1">Edit</button>
                <button onClick={() => setDeleteConfirm(sup)} className="btn text-xs flex-1 bg-red-50 text-red-500 border border-red-200 hover:bg-red-100">Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-bg-secondary rounded-2xl border border-border-color overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-color bg-bg-tertiary">
                <th className="table-header p-3 text-left">Supplier</th>
                <th className="table-header p-3 text-left">Contact</th>
                <th className="table-header p-3 text-left">Phone</th>
                <th className="table-header p-3 text-left">Email</th>
                <th className="table-header p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sup, i) => (
                <tr key={sup.id} className="table-row">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: avatar(sup.name, i) }}>
                        {sup.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-text-primary">{sup.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-text-secondary">{sup.contactPerson || "-"}</td>
                  <td className="p-3 text-text-secondary">{sup.phone || "-"}</td>
                  <td className="p-3 text-text-secondary">{sup.email || "-"}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(sup)} className="btn btn-secondary text-xs py-1 px-2">Edit</button>
                      <button onClick={() => setDeleteConfirm(sup)} className="btn text-xs py-1 px-2 bg-red-50 text-red-500 border border-red-200">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SupplierModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingSupplier(null); }} supplier={editingSupplier} />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-bg-secondary rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <span className="text-4xl">\u26A0\uFE0F</span>
            <h3 className="text-lg font-bold text-text-primary mt-3">Delete Supplier?</h3>
            <p className="text-text-secondary text-sm mt-2">Remove <strong>{deleteConfirm.name}</strong> from your suppliers list?</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={() => { dispatch(deleteSupplier(deleteConfirm.id)); setDeleteConfirm(null); }} className="btn flex-1 bg-red-500 text-white hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;