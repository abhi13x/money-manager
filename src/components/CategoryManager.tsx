import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import type { Category } from '@/types/finance';
import { Plus, Folder, ChevronRight, Trash2, Tag, X } from 'lucide-react';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ isOpen, onClose }) => {
  const categories = useLiveQuery(() => db.categories.toArray());
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [selectedParentId, setSelectedParentId] = useState<string | 'none'>('none');

  if (!isOpen) return null;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: newCatName.trim(),
      type: newCatType,
      icon: 'Tag',
      color: '#3b82f6',
      parentId: selectedParentId === 'none' ? null : selectedParentId,
    };

    await db.categories.add(newCategory);
    setNewCatName('');
    setSelectedParentId('none');
  };

  const deleteCategory = async (id: string) => {
    if (confirm('Delete this category and all its subcategories?')) {
      // Simple recursive delete logic
      const children = await db.categories.where('parentId').equals(id).toArray();
      for (const child of children) {
        await deleteCategory(child.id);
      }
      await db.categories.delete(id);
    }
  };

  const parents = categories?.filter(c => !c.parentId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-bold">Manage Categories</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Add New Category Form */}
          <form onSubmit={handleAddCategory} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Add New Category</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Category Name</label>
                <input 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Groceries"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Type</label>
                <select 
                  value={newCatType} 
                  onChange={e => setNewCatType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Parent Category (Optional)</label>
              <select 
                value={selectedParentId} 
                onChange={e => setSelectedParentId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None (Main Category)</option>
                {parents?.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </form>

          {/* Categories Tree View */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Your Hierarchy</h4>
            <div className="space-y-2">
              {parents?.map(parent => (
                <div key={parent.id} className="space-y-1">
                  <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700 rounded-xl group">
                    <div className="flex items-center gap-3">
                      <Folder className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{parent.name}</span>
                    </div>
                    <button onClick={() => deleteCategory(parent.id)} className="p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="ml-6 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                    {categories?.filter(c => c.parentId === parent.id).map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors group">
                        <div className="flex items-center gap-3">
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">{sub.name}</span>
                        </div>
                        <button onClick={() => deleteCategory(sub.id)} className="p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Note: Missing X import in the created file, adding it implicitly as it's standard in Lucide
// I will use an inline SVG or just add it to the imports if I were editing an existing file.
// Since I'm creating, I'll just use a basic button if X isn't explicitly available, 
// but I'll add it to the import list now.
export default CategoryManager;
