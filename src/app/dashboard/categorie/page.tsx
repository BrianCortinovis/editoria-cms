"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import slugify from "slugify";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  X,
  Check,
  FolderOpen,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  sort_order: number;
}

export default function CategoriePage() {
  const { currentTenant, currentRole } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#8B0000");

  const loadCategories = useCallback(async () => {
    if (!currentTenant) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("tenant_id", currentTenant.id)
      .order("sort_order");
    if (data) setCategories(data);
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setColor("#8B0000");
    setEditingId(null);
    setShowNew(false);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? "");
    setColor(cat.color);
    setShowNew(false);
  };

  const handleSave = async () => {
    if (!currentTenant || !name.trim()) {
      toast.error("Il nome è obbligatorio");
      return;
    }

    const supabase = createClient();
    const categorySlug = slug || slugify(name, { lower: true, strict: true, locale: "it" });

    if (editingId) {
      const { error } = await supabase
        .from("categories")
        .update({ name, slug: categorySlug, description: description || null, color })
        .eq("id", editingId);

      if (error) {
        toast.error("Errore: " + error.message);
      } else {
        toast.success("Categoria aggiornata");
        resetForm();
        loadCategories();
      }
    } else {
      const { error } = await supabase.from("categories").insert({
        tenant_id: currentTenant.id,
        name,
        slug: categorySlug,
        description: description || null,
        color,
        sort_order: categories.length,
      });

      if (error) {
        toast.error("Errore: " + error.message);
      } else {
        toast.success("Categoria creata");
        resetForm();
        loadCategories();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questa categoria?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error("Errore: " + error.message);
    } else {
      toast.success("Categoria eliminata");
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const canEdit = ["super_admin", "chief_editor", "editor"].includes(currentRole ?? "");

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {categories.length} categori{categories.length === 1 ? "a" : "e"}
        </p>
        {canEdit && (
          <button
            onClick={() => { resetForm(); setShowNew(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#8B0000] text-white text-sm font-semibold rounded-lg hover:bg-[#6d0000] transition"
          >
            <Plus className="w-4 h-4" /> Nuova Categoria
          </button>
        )}
      </div>

      {/* New / Edit form */}
      {(showNew || editingId) && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">
              {editingId ? "Modifica Categoria" : "Nuova Categoria"}
            </h3>
            <button onClick={resetForm}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingId) setSlug(slugify(e.target.value, { lower: true, strict: true, locale: "it" }));
                }}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]"
                placeholder="Es: Cronaca"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]"
                placeholder="cronaca"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Descrizione</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]"
                placeholder="Descrizione opzionale"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Colore</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#8B0000] text-white text-sm font-semibold rounded-lg hover:bg-[#6d0000] transition"
            >
              <Check className="w-4 h-4" /> Salva
            </button>
          </div>
        </div>
      )}

      {/* Categories list */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Caricamento...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nessuna categoria</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition"
              >
                <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" />
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                  <p className="text-xs text-gray-400">/{cat.slug}</p>
                </div>
                {cat.description && (
                  <p className="text-xs text-gray-400 hidden sm:block max-w-[200px] truncate">
                    {cat.description}
                  </p>
                )}
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(cat)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition"
                    >
                      <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
