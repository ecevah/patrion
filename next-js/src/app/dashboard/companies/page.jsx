"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Deletion state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
    fetchCompanies(token);
  }, [router, currentPage, itemsPerPage]);

  const fetchCompanies = (token) => {
    setLoading(true);
    
    fetch(`http://localhost:3232/company?page=${currentPage}&limit=${itemsPerPage}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setCompanies(data.data);
          
          // Update pagination info if available
          if (data.pagination) {
            setTotalPages(data.pagination.total_page);
            setTotalItems(data.pagination.total_item);
          }
        } else {
          setError(data.message || "Şirketler alınamadı");
        }
      })
      .catch(() => setError("Sunucu hatası"))
      .finally(() => setLoading(false));
  };

  // Page navigation functions
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Delete company
  const confirmDelete = (company) => {
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
    setDeleteError("");
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setCompanyToDelete(null);
  };

  const deleteCompany = async () => {
    if (!companyToDelete) return;
    
    setDeleteLoading(true);
    setDeleteError("");
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3232/company/${companyToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status) {
        // Refresh companies after deletion
        fetchCompanies(token);
        setDeleteModalOpen(false);
        setCompanyToDelete(null);
      } else {
        setDeleteError(data.message || "Şirket silinemedi");
      }
    } catch (err) {
      setDeleteError("Sunucu hatası");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Edit company
  const openEditModal = (company) => {
    setCompanyToEdit(company);
    setEditName(company.name);
    setEditModalOpen(true);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditModalOpen(false);
    setCompanyToEdit(null);
    setEditName("");
  };

  const updateCompany = async (e) => {
    e.preventDefault();
    
    if (!companyToEdit) return;
    if (!editName.trim()) {
      setEditError("Şirket adı boş olamaz");
      return;
    }
    
    setEditLoading(true);
    setEditError("");
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3232/company/${companyToEdit.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName
        })
      });
      
      const data = await response.json();
      
      if (data.status) {
        // Refresh companies after update
        fetchCompanies(token);
        setEditModalOpen(false);
        setCompanyToEdit(null);
        setEditName("");
      } else {
        setEditError(data.message || "Şirket güncellenemedi");
      }
    } catch (err) {
      setEditError("Sunucu hatası");
    } finally {
      setEditLoading(false);
    }
  };

  // Create company
  const openCreateModal = () => {
    setCreateModalOpen(true);
    setCreateName("");
    setCreateError("");
  };

  const cancelCreate = () => {
    setCreateModalOpen(false);
    setCreateName("");
  };

  const createCompany = async (e) => {
    e.preventDefault();
    
    if (!createName.trim()) {
      setCreateError("Şirket adı boş olamaz");
      return;
    }
    
    setCreateLoading(true);
    setCreateError("");
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3232/company`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: createName
        })
      });
      
      const data = await response.json();
      
      if (data.status) {
        // Refresh companies after creation
        fetchCompanies(token);
        setCreateModalOpen(false);
        setCreateName("");
      } else {
        setCreateError(data.message || "Şirket oluşturulamadı");
      }
    } catch (err) {
      setCreateError("Sunucu hatası");
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading && companies.length === 0) return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  if (error) return <div className="text-red-600 text-center p-10">{error}</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Şirket Yönetimi</h2>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2 px-5 py-2 rounded-lg shadow-md"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
          Yeni Şirket
        </button>
      </div>

      <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-dark-200 text-text-tertiary">
                <th className="px-4 py-2 text-left font-semibold">Şirket Adı</th>
                <th className="px-4 py-2 text-left font-semibold">Oluşturulma Tarihi</th>
                <th className="px-4 py-2 text-left font-semibold">Güncelleme Tarihi</th>
                <th className="px-4 py-2 text-left font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-dark-200 transition-all border-b border-border-primary">
                  <td className="px-4 py-3 text-text-primary font-medium">{company.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(company.create_at).toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(company.update_at).toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-3 flex flex-wrap gap-2">
                    <button onClick={() => openEditModal(company)} className="px-3 py-1 text-xs rounded-lg border border-accent-primary text-accent-primary hover:bg-dark-200 transition">Düzenle</button>
                    <button onClick={() => confirmDelete(company)} className="px-3 py-1 text-xs rounded-lg border border-red-500 text-red-500 hover:bg-dark-200 transition">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6 px-2">
            <div className="text-xs text-text-tertiary">
              Toplam {totalItems} kayıt, {totalPages} sayfa
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 text-xs rounded-lg border border-border-primary transition ${currentPage === 1 ? 'bg-dark-200 text-text-tertiary cursor-not-allowed' : 'bg-dark-200 text-text-primary hover:bg-dark-300'}`}
              >
                Önceki
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`h-8 w-8 rounded-lg border border-border-primary text-xs font-medium transition ${currentPage === pageNum ? 'bg-accent-primary text-white border-accent-primary' : 'bg-dark-200 text-text-primary hover:bg-dark-300'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 text-xs rounded-lg border border-border-primary transition ${currentPage === totalPages ? 'bg-dark-200 text-text-tertiary cursor-not-allowed' : 'bg-dark-200 text-text-primary hover:bg-dark-300'}`}
              >
                Sonraki
              </button>
            </div>
            <div>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs rounded-lg border border-border-primary bg-dark-200 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value={5}>5 kayıt</option>
                <option value={10}>10 kayıt</option>
                <option value={20}>20 kayıt</option>
                <option value={50}>50 kayıt</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Şirket Silme</h3>
            <p className="text-text-secondary mb-6">
              <span className="font-bold text-accent-primary">{companyToDelete?.name}</span> şirketini silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve bu şirkete ait kullanıcılar etkilenebilir.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-accent-primary/10 text-accent-primary border border-accent-primary rounded-md text-sm">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-lg border border-border-primary bg-dark-200 text-text-primary hover:bg-dark-300 transition"
                disabled={deleteLoading}
              >
                İptal
              </button>
              <button
                onClick={deleteCompany}
                className="px-4 py-2 rounded-lg border border-accent-primary bg-accent-primary text-white hover:bg-accent-primary/90 transition"
                disabled={deleteLoading}
              >
                {deleteLoading ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Şirket Düzenle</h3>
            {editError && (
              <div className="mb-4 p-3 bg-accent-primary/10 text-accent-primary border border-accent-primary rounded-md text-sm">
                {editError}
              </div>
            )}
            <form onSubmit={updateCompany} className="space-y-4">
              <div>
                <label htmlFor="editName" className="block text-sm font-medium text-text-secondary mb-1">
                  Şirket Adı*
                </label>
                <input
                  id="editName"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-lg border border-border-primary bg-dark-200 text-text-primary hover:bg-dark-300 transition"
                  disabled={editLoading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg border border-accent-primary bg-accent-primary text-white hover:bg-accent-primary/90 transition"
                  disabled={editLoading}
                >
                  {editLoading ? "Güncelleniyor..." : "Güncelle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Company Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Yeni Şirket</h3>
            {createError && (
              <div className="mb-4 p-3 bg-accent-primary/10 text-accent-primary border border-accent-primary rounded-md text-sm">
                {createError}
              </div>
            )}
            <form onSubmit={createCompany} className="space-y-4">
              <div>
                <label htmlFor="createName" className="block text-sm font-medium text-text-secondary mb-1">
                  Şirket Adı*
                </label>
                <input
                  id="createName"
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={cancelCreate}
                  className="px-4 py-2 rounded-lg border border-border-primary bg-dark-200 text-text-primary hover:bg-dark-300 transition"
                  disabled={createLoading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg border border-accent-primary bg-accent-primary text-white hover:bg-accent-primary/90 transition"
                  disabled={createLoading}
                >
                  {createLoading ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 