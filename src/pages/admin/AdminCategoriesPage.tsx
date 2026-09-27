import React, { useState, useEffect, useRef } from 'react';
import { Category } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useToast } from '../../contexts/ToastContext';
import { insforge } from '../../lib/insforge';
import api from '../../lib/api';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingCatId, setUploadingCatId] = useState<string | null>(null);

  // Edit category state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const [targetCategoryForUpload, setTargetCategoryForUpload] = useState<Category | null>(null);

  const { showToast } = useToast();

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch categories', 'error');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Upload file directly into InsForge storage bucket
  const handleUploadCoverPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `category_covers/cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`;

      const res = await insforge.storage
        .from('media')
        .upload(fileName, file);

      if (res && res.data && (res.data as any).url) {
        return (res.data as any).url;
      }

      if (res && res.data && (res.data as any).key) {
        return `https://nr5f6grt.us-east.insforge.app/api/storage/buckets/media/objects/${encodeURIComponent((res.data as any).key)}`;
      }

      const publicUrl = `https://nr5f6grt.us-east.insforge.app/api/storage/buckets/media/objects/${encodeURIComponent(fileName)}`;
      return publicUrl;
    } catch (err: any) {
      console.error('Storage upload failed:', err);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }
  };

  // Upload for new category modal
  const handleModalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      showToast('Uploading cover photo to InsForge storage...', 'info');
      const uploadedUrl = await handleUploadCoverPhoto(file);
      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
        showToast('Cover photo uploaded successfully!');
      } else {
        showToast('Failed to upload image', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Upload for edit category modal
  const handleEditModalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      showToast('Uploading cover photo...', 'info');
      const uploadedUrl = await handleUploadCoverPhoto(file);
      if (uploadedUrl) {
        setEditImageUrl(uploadedUrl);
        showToast('Cover photo uploaded successfully!');
      } else {
        showToast('Failed to upload image', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Upload cover directly from category card
  const handleCardFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetCategoryForUpload) return;

    const cat = targetCategoryForUpload;
    try {
      setUploadingCatId(cat.id);
      showToast(`Uploading cover for "${cat.name}"...`, 'info');
      const uploadedUrl = await handleUploadCoverPhoto(file);

      if (uploadedUrl) {
        await api.put(`/categories/${cat.id}`, { image_url: uploadedUrl });
        showToast(`Cover updated for "${cat.name}"!`);
        fetchCategories();
      } else {
        showToast('Failed to upload image', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update cover', 'error');
    } finally {
      setUploadingCatId(null);
      setTargetCategoryForUpload(null);
      if (cardFileInputRef.current) cardFileInputRef.current.value = '';
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      await api.post('/categories', { name, description, image_url: imageUrl });
      showToast('Category created successfully in InsForge DB');
      setName('');
      setDescription('');
      setImageUrl('');
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      showToast(err.message || 'Failed to create category', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditDescription(cat.description || '');
    setEditImageUrl(cat.image_url || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;

    try {
      setIsLoading(true);
      await api.put(`/categories/${editingCategory.id}`, {
        name: editName,
        description: editDescription,
        image_url: editImageUrl,
      });
      showToast('Category updated successfully');
      setIsEditModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      showToast(err.message || 'Failed to update category', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!window.confirm(`Are you sure you want to delete the category "${cat.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/categories/${cat.id}`);
      showToast(`Category "${cat.name}" deleted successfully`);
      fetchCategories();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hidden file input for card clicks */}
      <input
        type="file"
        ref={cardFileInputRef}
        onChange={handleCardFileSelect}
        accept="image/*"
        className="hidden"
      />

      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">Categories Management</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Create, edit, and delete video categories stored directly in InsForge PostgreSQL DB.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>＋ New Category</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {categories
          .filter((cat, idx, arr) => cat?.id && arr.findIndex((c) => c?.id === cat.id) === idx)
          .map((cat, idx) => {
            const hasCustomImage = typeof cat?.image_url === 'string' && cat.image_url.trim().length > 0;
            const isCurrentlyUploading = uploadingCatId === cat.id;

            return (
              <div
                key={`${cat.id}-${idx}`}
                className="relative group rounded-3xl bg-[#151821] border border-white/10 hover:border-red-500/50 transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[220px] shadow-xl"
              >
                {/* Background image preview (uploaded or fallback) */}
                {cat.image_url && (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover brightness-40 group-hover:brightness-50 transition-all"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                {/* Top Badge Strip & Action Controls */}
                <div className="relative z-10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[var(--accent-red)] text-white font-bold flex items-center justify-center text-xs shadow-lg">
                      ●
                    </span>
                    <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md text-white rounded text-[11px] font-bold border border-white/10">
                      {Number(cat.video_count || cat.count || 0).toLocaleString()} Videos
                    </span>
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(cat)}
                      className="p-1.5 bg-black/60 hover:bg-black/90 text-zinc-200 hover:text-white rounded-lg border border-white/10 text-xs transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 bg-red-950/70 hover:bg-red-900/90 text-red-300 hover:text-red-100 rounded-lg border border-red-500/30 text-xs transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Middle Action: Upload Cover Photo Button */}
                <div className="relative z-10 px-4 flex items-center justify-center my-2 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setTargetCategoryForUpload(cat);
                      cardFileInputRef.current?.click();
                    }}
                    disabled={isCurrentlyUploading}
                    className="px-3 py-1 bg-black/70 hover:bg-black/95 text-white font-bold text-[11px] rounded-xl border border-white/20 hover:border-[var(--accent-red)] shadow-xl transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
                  >
                    {isCurrentlyUploading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin text-xs text-[var(--accent-red)]" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-camera text-xs text-red-400" />
                        <span>{hasCustomImage ? 'Change Cover' : 'Upload Cover'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Bottom Details */}
                <div className="relative z-10 p-4 pt-1">
                  <h3 className="text-lg font-black text-white group-hover:text-red-400 transition-colors drop-shadow">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-zinc-300 line-clamp-1 mt-0.5 font-normal drop-shadow">
                    {cat.description || `Browse all ${cat.name} streams`}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1">slug: /{cat.slug}</p>
                </div>
              </div>
            );
          })}
      </div>

      {/* Modal: Create Category */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Category">
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input label="Category Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Category Cover Photo (InsForge Storage)
            </label>

            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleModalFileSelect}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
                className="text-xs font-bold"
              >
                Upload Photo
              </Button>
              <span className="text-xs text-zinc-400">or enter image link below</span>
            </div>

            <Input
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />

            {imageUrl && (
              <div className="relative w-full h-28 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Category */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Category">
        <form onSubmit={handleUpdateCategory} className="space-y-4">
          <Input label="Category Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          <Input label="Description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Category Cover Photo
            </label>

            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={editFileInputRef}
                onChange={handleEditModalFileSelect}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => editFileInputRef.current?.click()}
                isLoading={isUploading}
                className="text-xs font-bold"
              >
                Upload Photo
              </Button>
              <span className="text-xs text-zinc-400">or edit URL below</span>
            </div>

            <Input
              placeholder="https://..."
              value={editImageUrl}
              onChange={(e) => setEditImageUrl(e.target.value)}
            />

            {editImageUrl && (
              <div className="relative w-full h-28 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                <img src={editImageUrl} alt="Edit Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Update Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
