'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BG_COLOR_OPTIONS, slugify } from '@/lib/products';
import type { Order, OrderItem, DbProduct, ProductOption } from '@/types';

// ── Shared helpers ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  delivered: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

function inputCls(hasError = false) {
  return `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`;
}

function Spinner() {
  return (
    <svg className="w-10 h-10 text-brand-600 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ── Product Form Modal ────────────────────────────────────────────────────────
interface ProductFormData {
  name: string;
  emoji: string;
  description: string;
  bg_color: string;
  options: { label: string; price: string }[];
  active: boolean;
  image_url: string;
}

const EMPTY_PRODUCT: ProductFormData = {
  name: '',
  emoji: '📦',
  description: '',
  bg_color: 'bg-amber-50',
  options: [{ label: '', price: '' }],
  active: true,
  image_url: '',
};

interface ProductModalProps {
  mode: 'add' | 'edit';
  initial: ProductFormData;
  editId?: string;
  onClose: () => void;
  onSaved: (p: DbProduct) => void;
}

function ProductModal({ mode, initial, editId, onClose, onSaved }: ProductModalProps) {
  const [form, setForm] = useState<ProductFormData>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleImageUpload(file: File) {
    setUploading(true);
    setUploadError('');
    try {
      const productId = editId || slugify(form.name) || `product_${Date.now()}`;
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${productId}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(path);
      setField('image_url', urlData.publicUrl);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function setField<K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => { const next = { ...e }; delete next[k]; return next; });
  }

  function setOption(i: number, field: 'label' | 'price', val: string) {
    setForm((f) => {
      const opts = f.options.map((o, idx) => idx === i ? { ...o, [field]: val } : o);
      return { ...f, options: opts };
    });
    setErrors((e) => { const next = { ...e }; delete next[`opt_${i}_${field}`]; return next; });
  }

  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, { label: '', price: '' }] }));
  }

  function removeOption(i: number) {
    setForm((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.description.trim()) next.description = 'Description is required';
    if (form.options.length === 0) next.options = 'At least one quantity option is required';
    form.options.forEach((opt, i) => {
      if (!opt.label.trim()) next[`opt_${i}_label`] = 'Label required';
      const p = parseFloat(opt.price);
      if (!opt.price.trim() || isNaN(p) || p <= 0) next[`opt_${i}_price`] = 'Valid price required';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setServerError('');

    const options: ProductOption[] = form.options.map((o) => ({
      label: o.label.trim(),
      price: Math.round(parseFloat(o.price)),
    }));

    try {
      if (mode === 'add') {
        const id = slugify(form.name);
        if (!id) throw new Error('Could not generate an ID from that name');

        // Check for ID collision
        const { data: existing } = await supabase.from('products').select('id').eq('id', id).maybeSingle();
        if (existing) throw new Error(`A product with ID "${id}" already exists. Please use a different name.`);

        const { data: maxRow } = await supabase.from('products').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
        const sort_order = (maxRow?.sort_order ?? 0) + 1;

        const { data, error } = await supabase
          .from('products')
          .insert([{ id, name: form.name.trim(), emoji: form.emoji.trim() || '📦', description: form.description.trim(), bg_color: form.bg_color, options, active: true, sort_order, image_url: form.image_url || null }])
          .select()
          .single();
        if (error) throw error;
        onSaved(data as DbProduct);
      } else {
        const { data, error } = await supabase
          .from('products')
          .update({ name: form.name.trim(), emoji: form.emoji.trim() || '📦', description: form.description.trim(), bg_color: form.bg_color, options, active: form.active, image_url: form.image_url || null })
          .eq('id', editId!)
          .select()
          .single();
        if (error) throw error;
        onSaved(data as DbProduct);
      }
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'add' ? 'Add Product' : 'Edit Product'}
          </h2>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {serverError}
            </div>
          )}

          {/* Name + Emoji */}
          <div className="grid grid-cols-[1fr_90px] gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Garri" className={inputCls(!!errors.name)} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
              <input type="text" value={form.emoji} onChange={(e) => setField('emoji', e.target.value)}
                placeholder="📦" maxLength={4} className={inputCls()} style={{ fontSize: '1.4rem', textAlign: 'center' }} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea rows={2} value={form.description} onChange={(e) => setField('description', e.target.value)}
              placeholder="Brief description of the product…"
              className={`${inputCls(!!errors.description)} resize-none`} />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Background color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Background</label>
            <div className="flex flex-wrap gap-2">
              {BG_COLOR_OPTIONS.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setField('bg_color', opt.value)}
                  className={`${opt.value} border-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    form.bg_color === opt.value ? 'border-brand-600 scale-105 shadow' : 'border-gray-200 hover:border-gray-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Quantity Options <span className="text-red-500">*</span></label>
              <button type="button" onClick={addOption}
                className="text-xs text-brand-700 hover:text-brand-900 font-semibold cursor-pointer">
                + Add option
              </button>
            </div>
            {errors.options && <p className="text-red-500 text-xs mb-1">{errors.options}</p>}
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input type="text" value={opt.label}
                      onChange={(e) => setOption(i, 'label', e.target.value)}
                      placeholder="e.g. 25 kg bag"
                      className={inputCls(!!errors[`opt_${i}_label`])} />
                    {errors[`opt_${i}_label`] && <p className="text-red-500 text-xs mt-0.5">{errors[`opt_${i}_label`]}</p>}
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                      <input type="number" value={opt.price}
                        onChange={(e) => setOption(i, 'price', e.target.value)}
                        placeholder="0" min="0"
                        className={`${inputCls(!!errors[`opt_${i}_price`])} pl-7`} />
                    </div>
                    {errors[`opt_${i}_price`] && <p className="text-red-500 text-xs mt-0.5">{errors[`opt_${i}_price`]}</p>}
                  </div>
                  {form.options.length > 1 && (
                    <button type="button" onClick={() => removeOption(i)}
                      className="mt-2 text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image <span className="text-gray-400 font-normal">(optional)</span></label>
            {form.image_url && (
              <div className="relative mb-2 w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setField('image_url', '')}
                  className="absolute top-1.5 right-1.5 bg-white/80 hover:bg-white text-gray-700 rounded-full w-6 h-6 flex items-center justify-center shadow cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}
            <label className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition ${uploading ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 border-gray-300'}`}>
              {uploading
                ? <><svg className="w-4 h-4 animate-spin text-brand-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg><span className="text-sm text-gray-500">Uploading…</span></>
                : <><svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4l4 4"/></svg><span className="text-sm text-gray-600">{form.image_url ? 'Replace image' : 'Upload image'}</span></>
              }
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }}
              />
            </label>
            {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
          </div>

          {/* Active toggle (edit only) */}
          {mode === 'edit' && (
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setField('active', !form.active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${form.active ? 'bg-brand-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {form.active ? 'Visible on storefront' : 'Hidden from storefront'}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex-1 bg-brand-700 hover:bg-brand-800 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer">
              {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
              {saving ? 'Saving…' : mode === 'add' ? 'Add Product' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Products Tab ──────────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; product?: DbProduct } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DbProduct | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });
      if (err) throw err;
      setProducts(data ?? []);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message;
      setError(msg || JSON.stringify(e) || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(p: DbProduct) {
    const { error: err } = await supabase.from('products').update({ active: !p.active }).eq('id', p.id);
    if (err) { alert(err.message); return; }
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, active: !p.active } : x));
  }

  async function deleteProduct(p: DbProduct) {
    setDeletingId(p.id);
    const { error: err } = await supabase.from('products').delete().eq('id', p.id);
    if (err) { alert(err.message); }
    else { setProducts((prev) => prev.filter((x) => x.id !== p.id)); }
    setDeletingId(null);
    setConfirmDelete(null);
  }

  function handleSaved(saved: DbProduct) {
    setProducts((prev) => {
      const exists = prev.find((p) => p.id === saved.id);
      return exists
        ? prev.map((p) => p.id === saved.id ? saved : p)
        : [...prev, saved];
    });
    setModal(null);
  }

  function openEdit(p: DbProduct) {
    setModal({
      mode: 'edit',
      product: p,
    });
  }

  const formInitial = (p?: DbProduct): ProductFormData => p ? {
    name: p.name,
    emoji: p.emoji,
    description: p.description,
    bg_color: p.bg_color,
    options: p.options.map((o) => ({ label: o.label, price: String(o.price) })),
    active: p.active,
    image_url: p.image_url ?? '',
  } : EMPTY_PRODUCT;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500">{products.length} product{products.length !== 1 ? 's' : ''} in catalogue</p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add' })}
          className="bg-brand-700 hover:bg-brand-800 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors shadow cursor-pointer flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner />
          <p className="text-gray-500 text-sm">Loading products…</p>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-gray-700 font-semibold mb-1">Failed to load products</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button onClick={load} className="bg-brand-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">Retry</button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="text-5xl mb-3">🛒</div>
          <p className="text-gray-700 font-semibold mb-1">No products yet</p>
          <p className="text-gray-400 text-sm mb-4">Add your first product to start taking orders.</p>
          <button onClick={() => setModal({ mode: 'add' })}
            className="bg-brand-700 text-white font-semibold px-5 py-2 rounded-xl text-sm cursor-pointer">
            Add Product
          </button>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${!p.active ? 'opacity-60' : ''}`}>
              {/* Colour / image banner */}
              {p.image_url ? (
                <div className="relative border-b border-gray-100 overflow-hidden h-20">
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end px-3 pb-2 gap-2">
                    <span className="text-xl">{p.emoji}</span>
                    <p className="font-bold text-white text-sm truncate flex-1">{p.name}</p>
                    {!p.active && <span className="text-xs bg-gray-200 text-gray-600 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">Hidden</span>}
                  </div>
                </div>
              ) : (
                <div className={`${p.bg_color} flex items-center gap-3 px-4 py-3 border-b border-gray-100`}>
                  <span className="text-3xl">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 truncate">{p.description}</p>
                  </div>
                  {!p.active && (
                    <span className="text-xs bg-gray-200 text-gray-600 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">Hidden</span>
                  )}
                </div>
              )}

              {/* Options list */}
              <div className="px-4 py-3 space-y-1">
                {p.options.map((opt, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{opt.label}</span>
                    <span className="font-semibold text-gray-800">₦{opt.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex items-center gap-2">
                <button onClick={() => openEdit(p)}
                  className="flex-1 border border-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  Edit
                </button>
                <button onClick={() => toggleActive(p)}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer border ${
                    p.active
                      ? 'border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                      : 'border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100'
                  }`}>
                  {p.active ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => setConfirmDelete(p)}
                  disabled={deletingId === p.id}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50">
                  {deletingId === p.id
                    ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <ProductModal
          mode={modal.mode}
          initial={formInitial(modal.product)}
          editId={modal.product?.id}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Delete {confirmDelete.name}?</h3>
            <p className="text-gray-500 text-sm mb-5">This cannot be undone. The product will be permanently removed from the catalogue.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl cursor-pointer hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => deleteProduct(confirmDelete)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl cursor-pointer transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setOrders(data ?? []);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message;
      setError(msg || JSON.stringify(e) || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => {
    const id = setInterval(loadOrders, 60_000);
    return () => clearInterval(id);
  }, [loadOrders]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      orders.filter((o) => {
        const matchStatus = !statusFilter || o.status === statusFilter;
        const matchSearch =
          !q ||
          `${o.first_name} ${o.surname}`.toLowerCase().includes(q) ||
          o.phone?.toLowerCase().includes(q) ||
          o.address?.toLowerCase().includes(q) ||
          o.id?.toLowerCase().includes(q);
        return matchStatus && matchSearch;
      })
    );
  }, [orders, search, statusFilter]);

  async function updateStatus(id: string, status: string) {
    const { error: err } = await supabase.from('orders').update({ status }).eq('id', id);
    if (err) { alert('Failed to update: ' + err.message); return; }
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: status as Order['status'] } : o));
    if (selected?.id === id) setSelected((s) => s && { ...s, status: status as Order['status'] });
  }

  const stats = {
    total:     orders.length,
    pending:   orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    revenue:   orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + (o.total_amount || 0), 0),
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" placeholder="Search by name, phone, address or ID…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={loadOrders}
          className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Orders"   value={stats.total}     cls="bg-white border-gray-200 text-gray-900" />
        <StatCard label="Pending"        value={stats.pending}   cls="bg-yellow-50 border-yellow-200 text-yellow-700" />
        <StatCard label="Confirmed"      value={stats.confirmed} cls="bg-brand-50 border-brand-200 text-brand-700" />
        <StatCard label="Revenue (Est.)" value={`₦${stats.revenue.toLocaleString()}`} cls="bg-white border-gray-200 text-gray-900" />
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner />
          <p className="text-gray-500 text-sm">Loading orders…</p>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Failed to load orders</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button onClick={loadOrders} className="bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-800 cursor-pointer">Retry</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {orders.length === 0 ? 'No orders yet' : 'No matching orders'}
          </h3>
          <p className="text-gray-400 text-sm">
            {orders.length === 0 ? 'Orders will appear here once customers place them.' : 'Try adjusting your search or filter.'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Order ID', 'Customer', 'Phone', 'Items', 'Total', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((o) => {
                  const items: OrderItem[] = Array.isArray(o.items) ? o.items : [];
                  const itemSummary = items.slice(0, 2).map((i) => i.product_name).join(', ') + (items.length > 2 ? ` +${items.length - 2} more` : '');
                  const date = new Date(o.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
                  return (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{o.first_name} {o.surname}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap"><a href={`tel:${o.phone}`} className="hover:text-brand-700">{o.phone}</a></td>
                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate" title={itemSummary}>{itemSummary || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800 whitespace-nowrap">₦{(o.total_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 border-0 cursor-pointer focus:outline-none ${STATUS_STYLES[o.status] ?? ''}`}>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{date}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(o)} className="text-brand-700 hover:text-brand-900 font-medium text-xs hover:underline cursor-pointer">View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Order Detail</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Order ID</p>
                <p className="font-mono font-semibold text-gray-800 text-xs">{selected.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Name</p>
                  <p className="font-semibold">{selected.first_name} {selected.surname}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Phone</p>
                  <a href={`tel:${selected.phone}`} className="font-semibold text-brand-700">{selected.phone}</a>
                </div>
                {selected.email && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</p>
                    <p>{selected.email}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Delivery Address</p>
                <p className="text-gray-700">{selected.address}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Items Ordered</p>
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  {(Array.isArray(selected.items) ? selected.items : []).map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{item.product_name} <span className="text-gray-400">({item.quantity_label})</span></span>
                      <span className="font-semibold">₦{(item.price || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-brand-700">₦{(selected.total_amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              {selected.notes && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{selected.notes}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
                <select value={selected.status} onChange={(e) => updateStatus(selected.id, e.target.value)}
                  className={`text-xs font-semibold rounded-full px-3 py-1.5 border-0 cursor-pointer focus:outline-none ${STATUS_STYLES[selected.status] ?? ''}`}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ordered At</p>
                <p className="text-gray-600">{new Date(selected.created_at).toLocaleString('en-NG')}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <a href={`tel:${selected.phone}`} className="flex-1 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-center py-2.5 rounded-xl transition-colors text-sm">Call Customer</a>
                <a href={`https://wa.me/${selected.phone.replace(/^0/, '234').replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold text-center py-2.5 rounded-xl transition-colors text-sm">WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'agrofood2025';

export default function AdminPage() {
  const [tab, setTab] = useState<'orders' | 'products'>('orders');
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState('');

  function checkPw() {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError('');
    } else {
      setPwError('Incorrect password. Please try again.');
      setPw('');
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔒</div>
            <h1 className="text-xl font-bold text-gray-900">Admin Access</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your password to continue</p>
          </div>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setPwError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && checkPw()}
            placeholder="Password"
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent mb-3"
          />
          {pwError && <p className="text-red-500 text-xs mb-3">{pwError}</p>}
          <button
            onClick={checkPw}
            className="w-full bg-brand-700 hover:bg-brand-800 text-white font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-brand-700 text-sm transition-colors">← Back to Site</Link>
            <span className="text-gray-300">|</span>
            <h1 className="font-bold text-gray-900">FoodPod Admin</h1>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(['orders', 'products'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer capitalize ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {tab === 'orders'   && <OrdersTab />}
        {tab === 'products' && <ProductsTab />}
      </div>
    </div>
  );
}

function StatCard({ label, value, cls }: { label: string; value: string | number; cls: string }) {
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className="text-xs uppercase tracking-wide opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-extrabold">{value}</p>
    </div>
  );
}
