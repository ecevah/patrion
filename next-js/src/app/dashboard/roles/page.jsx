"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
    fetchRoles(token);
  }, [router, currentPage, itemsPerPage]);

  const fetchRoles = (token) => {
    setLoading(true);
    
    fetch(`http://localhost:3232/role?page=${currentPage}&limit=${itemsPerPage}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setRoles(data.data);
          
          
          if (data.pagination) {
            setTotalPages(data.pagination.total_page);
            setTotalItems(data.pagination.total_item);
          }
        } else {
          setError(data.message || "Roller alınamadı");
        }
      })
      .catch(() => setError("Sunucu hatası"))
      .finally(() => setLoading(false));
  };

  
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

  
  const confirmDelete = (role) => {
    setRoleToDelete(role);
    setDeleteModalOpen(true);
    setDeleteError("");
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setRoleToDelete(null);
  };

  const deleteRole = async () => {
    if (!roleToDelete) return;
    
    setDeleteLoading(true);
    setDeleteError("");
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3232/role/${roleToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status) {
        
        fetchRoles(token);
        setDeleteModalOpen(false);
        setRoleToDelete(null);
      } else {
        setDeleteError(data.message || "Rol silinemedi");
      }
    } catch (err) {
      setDeleteError("Sunucu hatası");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading && roles.length === 0) return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  if (error) return <div className="text-red-600 text-center p-10">{error}</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Rol Yönetimi</h2>
        <Link href="/dashboard/roles/create">
          <button className="btn-primary flex items-center gap-2 px-5 py-2 rounded-lg shadow-md">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
            Yeni Rol
          </button>
        </Link>
      </div>

      <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-dark-200 text-text-tertiary">
                <th className="px-4 py-2 text-left font-semibold">Rol Adı</th>
                <th className="px-4 py-2 text-left font-semibold">Şirket Ekle</th>
                <th className="px-4 py-2 text-left font-semibold">Kullanıcı Ekle</th>
                <th className="px-4 py-2 text-left font-semibold">Cihaz Ata</th>
                <th className="px-4 py-2 text-left font-semibold">Veri Gör</th>
                <th className="px-4 py-2 text-left font-semibold">Log Gör</th>
                <th className="px-4 py-2 text-left font-semibold">IoT Yönet</th>
                <th className="px-4 py-2 text-left font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-dark-200 transition-all border-b border-border-primary">
                  <td className="px-4 py-3 text-text-primary font-medium">{role.role}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${role.can_add_company ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary' : 'bg-dark-300 text-text-tertiary border border-border-primary'}`}>
                      {role.can_add_company ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${role.can_add_user ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary' : 'bg-dark-300 text-text-tertiary border border-border-primary'}`}>
                      {role.can_add_user ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${role.can_assign_device ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary' : 'bg-dark-300 text-text-tertiary border border-border-primary'}`}>
                      {role.can_assign_device ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${role.can_view_data ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary' : 'bg-dark-300 text-text-tertiary border border-border-primary'}`}>
                      {role.can_view_data ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${role.can_view_log ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary' : 'bg-dark-300 text-text-tertiary border border-border-primary'}`}>
                      {role.can_view_log ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${role.can_manage_iot ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary' : 'bg-dark-300 text-text-tertiary border border-border-primary'}`}>
                      {role.can_manage_iot ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex flex-wrap gap-2">
                    <Link href={`/dashboard/roles/edit/${role.id}`}>
                      <button className="px-3 py-1 text-xs rounded-lg border border-accent-primary text-accent-primary hover:bg-dark-200 transition">Düzenle</button>
                    </Link>
                    <button onClick={() => confirmDelete(role)} className="px-3 py-1 text-xs rounded-lg border border-red-500 text-red-500 hover:bg-dark-200 transition">Sil</button>
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
            <h3 className="text-lg font-bold text-text-primary mb-4">Rol Silme</h3>
            <p className="text-text-secondary mb-6">
              <span className="font-bold text-accent-primary">{roleToDelete?.role}</span> rolünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve bu role sahip kullanıcılar etkilenebilir.
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
                onClick={deleteRole}
                className="px-4 py-2 rounded-lg border border-accent-primary bg-accent-primary text-white hover:bg-accent-primary/90 transition"
                disabled={deleteLoading}
              >
                {deleteLoading ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 