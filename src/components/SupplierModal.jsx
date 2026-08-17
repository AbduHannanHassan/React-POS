import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { addSupplier, updateSupplier } from "../store/slices/suppliersSlice";

const EMPTY_FORM = { name: "", contactPerson: "", phone: "", email: "", address: "", notes: "" };

function SupplierModal({ isOpen, onClose, supplier }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (supplier) setForm({ name: supplier.name, contactPerson: supplier.contactPerson || "", phone: supplier.phone || "", email: supplier.email || "", address: supplier.address || "", notes: supplier.notes || "" });
    else setForm(EMPTY_FORM);
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (supplier) dispatch(updateSupplier({ ...supplier, ...form }));
    else dispatch(addSupplier(form));
    onClose();
  };

  const Field = ({ label, name, type = "text", placeholder, required }) => (
    <div>
      <label className="block text-sm font-semibold text-text-secondary mb-1">{label}{required && " *"}</label>
      <input type={type} className="input" placeholder={placeholder} value={form[name]} onChange={set(name)} required={required} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-bg-secondary rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border-color sticky top-0 bg-bg-secondary z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">\uD83D\uDE9A</span>
            <h2 className="text-xl font-bold text-text-primary">{supplier ? "Edit Supplier" : "Add Supplier"}</h2>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Supplier / Company Name" name="name" placeholder="e.g. ABC Wholesale Ltd." required />
          <Field label="Contact Person" name="contactPerson" placeholder="e.g. John Smith" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" name="phone" type="tel" placeholder="+92 300 0000000" />
            <Field label="Email" name="email" type="email" placeholder="supplier@email.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1">Address</label>
            <textarea className="input resize-none" rows={2} placeholder="Street, City, Country" value={form.address} onChange={set("address")} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1">Notes</label>
            <textarea className="input resize-none" rows={2} placeholder="Payment terms, lead time, etc." value={form.notes} onChange={set("notes")} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn btn-primary flex-1">{supplier ? "Save Changes" : "Add Supplier"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

SupplierModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  supplier: PropTypes.object,
};

export default SupplierModal;