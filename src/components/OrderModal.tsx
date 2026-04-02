'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { OrderItem, Product } from '@/types';

interface SelectedItem {
  label: string;
  price: number;
  name: string;
}

interface OrderModalProps {
  isOpen: boolean;
  products: Product[];
  preselectedProductId: string | null;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

interface FormData {
  first_name: string;
  surname: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const EMPTY_FORM: FormData = {
  first_name: '',
  surname: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

export default function OrderModal({
  isOpen,
  products,
  preselectedProductId,
  onClose,
  onSuccess,
}: OrderModalProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({});
  const [customQtys, setCustomQtys] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'products', string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  // Reset whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (preselectedProductId) {
        const product = products.find((p) => p.id === preselectedProductId);
        setSelectedItems(product ? {
          [preselectedProductId]: {
            label: product.options[0].label,
            price: product.options[0].price,
            name: product.name,
          },
        } : {});
      } else {
        setSelectedItems({});
      }
      setCustomQtys({});
      setForm(EMPTY_FORM);
      setErrors({});
      setToast('');
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isOpen, preselectedProductId]);

  // Escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    },
    [onClose, submitting]
  );
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 5000);
  };

  // ── Toggle a product on/off ────────────────────────────────────────────────
  function toggleProduct(productId: string, checked: boolean) {
    if (checked) {
      const product = products.find((p) => p.id === productId)!;
      setSelectedItems((prev) => ({
        ...prev,
        [productId]: {
          label: product.options[0].label,
          price: product.options[0].price,
          name: product.name,
        },
      }));
    } else {
      setSelectedItems((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      setCustomQtys((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }
    setErrors((prev) => ({ ...prev, products: undefined }));
  }

  // ── Select a preset quantity option ───────────────────────────────────────
  function selectQty(productId: string, label: string, price: number) {
    const product = products.find((p) => p.id === productId)!;
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: { label, price, name: product.name },
    }));
    setCustomQtys((prev) => ({ ...prev, [productId]: '' }));
  }

  // ── Enter a custom quantity ────────────────────────────────────────────────
  function handleCustomQty(productId: string, value: string) {
    setCustomQtys((prev) => ({ ...prev, [productId]: value }));
    const product = products.find((p) => p.id === productId)!;
    if (value.trim()) {
      setSelectedItems((prev) => ({
        ...prev,
        [productId]: { label: value.trim(), price: 0, name: product.name },
      }));
    } else {
      // revert to first preset option when custom is cleared
      setSelectedItems((prev) => ({
        ...prev,
        [productId]: {
          label: product.options[0].label,
          price: product.options[0].price,
          name: product.name,
        },
      }));
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const itemList = Object.entries(selectedItems);
  const total = itemList.reduce((sum, [, v]) => sum + v.price, 0);

  // ── Validate ───────────────────────────────────────────────────────────────
  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.first_name.trim()) next.first_name = 'Please enter your first name';
    if (!form.surname.trim()) next.surname = 'Please enter your surname';

    const phone = form.phone.trim().replace(/\s/g, '');
    if (!phone) {
      next.phone = 'Please enter your phone number';
    } else if (!/^(\+?234|0)[7-9][0-1]\d{8}$/.test(phone)) {
      next.phone = 'Please enter a valid Nigerian phone number (e.g. 08012345678)';
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Please enter a valid email address';
    }

    if (!form.address.trim()) next.address = 'Please enter your delivery address';

    if (itemList.length === 0) next.products = 'Please select at least one product';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    try {
      const items: OrderItem[] = itemList.map(([id, v]) => ({
        product_id: id,
        product_name: v.name,
        quantity_label: v.label,
        price: v.price,
      }));

      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            first_name: form.first_name.trim(),
            surname: form.surname.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            address: form.address.trim(),
            items,
            total_amount: total,
            notes: form.notes.trim() || null,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      onSuccess(data.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to place order. Please try again.';
      showToast(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
      />

      {/* Panel */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-[fadeInUp_0.3s_ease]">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Place Your Order</h2>
            <p className="text-sm text-gray-500">Fill in your details and select what you need</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-6">
          {/* ── Customer Details ── */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Your Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="First Name"
                required
                error={errors.first_name}
              >
                <input
                  type="text"
                  placeholder="e.g. Amaka"
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  className={inputCls(!!errors.first_name)}
                  autoComplete="given-name"
                />
              </Field>

              <Field label="Surname" required error={errors.surname}>
                <input
                  type="text"
                  placeholder="e.g. Okafor"
                  value={form.surname}
                  onChange={(e) => setForm((f) => ({ ...f, surname: e.target.value }))}
                  className={inputCls(!!errors.surname)}
                  autoComplete="family-name"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label="Phone Number" required error={errors.phone}>
                <input
                  type="tel"
                  placeholder="e.g. 08012345678"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className={inputCls(!!errors.phone)}
                  autoComplete="tel"
                />
              </Field>

              <Field label="Email" hint="optional" error={errors.email}>
                <input
                  type="email"
                  placeholder="e.g. amaka@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputCls(!!errors.email)}
                  autoComplete="email"
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Delivery Address" required error={errors.address}>
                <textarea
                  rows={2}
                  placeholder="e.g. 12 Adeola Street, Lagos Island, Lagos"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className={`${inputCls(!!errors.address)} resize-none`}
                  autoComplete="street-address"
                />
              </Field>
            </div>
          </div>

          {/* ── Product Selection ── */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Select Products
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Check the items you want and choose a quantity for each.
            </p>

            {errors.products && (
              <p className="text-red-500 text-xs mb-2">{errors.products}</p>
            )}

            <div className="space-y-2">
              {products.map((product) => {
                const isChecked = !!selectedItems[product.id];
                const selected = selectedItems[product.id];
                return (
                  <div
                    key={product.id}
                    className={`border rounded-xl p-3 transition-colors ${
                      isChecked
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-brand-300'
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleProduct(product.id, e.target.checked)}
                          className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
                        />
                      </div>
                      {product.imageUrl && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {!product.imageUrl && <span className="text-lg leading-none">{product.emoji}</span>}
                          <span className="font-semibold text-gray-800 text-sm">{product.name}</span>
                        </div>

                        {isChecked && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1.5">Select quantity:</p>
                            <div className="flex flex-wrap gap-2">
                              {product.options.map((opt) => (
                                <button
                                  key={opt.label}
                                  type="button"
                                  onClick={() => selectQty(product.id, opt.label, opt.price)}
                                  className={`text-xs rounded-lg px-3 py-1.5 border transition-colors cursor-pointer ${
                                    selected?.label === opt.label && !customQtys[product.id]
                                      ? 'bg-brand-700 text-white border-brand-700'
                                      : 'border-gray-300 text-gray-600 hover:border-brand-500 hover:text-brand-700'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={customQtys[product.id] || ''}
                              onChange={(e) => handleCustomQty(product.id, e.target.value)}
                              placeholder="Specify preferred brand"
                              className="mt-2 w-full text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Order Summary ── */}
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-brand-800">Order Summary</span>
              <span className="text-xs text-gray-500">
                {itemList.length} item{itemList.length !== 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="mt-2 space-y-1">
              {itemList.length === 0 ? (
                <p className="text-xs text-gray-400">No products selected yet.</p>
              ) : (
                itemList.map(([id, v]) => (
                  <div key={id} className="text-sm text-gray-700">
                    {v.name}{' '}
                    <span className="text-gray-400">({v.label})</span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-brand-200">
              <p className="text-xs text-gray-500">
                Pricing will be confirmed when we contact you before delivery.
              </p>
            </div>
          </div>

          {/* ── Notes ── */}
          <Field label="Additional Notes" hint="optional">
            <textarea
              rows={2}
              placeholder="Any special instructions or delivery preferences..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className={`${inputCls(false)} resize-none`}
            />
          </Field>

          {/* ── Submit ── */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-700 hover:bg-brand-800 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-base shadow cursor-pointer"
            >
              {submitting && (
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {submitting ? 'Placing Order…' : 'Confirm Order'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              {"We'll contact you via phone to confirm your order."}
            </p>
          </div>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-red-600 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg animate-[fadeInUp_0.3s_ease]">
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function inputCls(hasError: boolean) {
  return `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`;
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="text-gray-400 text-xs font-normal ml-1">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
