"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserDeviceAccessPage() {
  const [accessList, setAccessList] = useState([]);
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
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
  const [accessToDelete, setAccessToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [accessToEdit, setAccessToEdit] = useState(null);
  const [editUserId, setEditUserId] = useState("");
  const [editDeviceId, setEditDeviceId] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createUserId, setCreateUserId] = useState("");
  const [createDeviceId, setCreateDeviceId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
    fetchAccessList(token);
    fetchUsers(token);
    fetchDevices(token);
  }, [router, currentPage, itemsPerPage]);

  const fetchAccessList = (token) => {
    setLoading(true);
    
    fetch(`http://localhost:3232/user-device-access/all?page=${currentPage}&limit=${itemsPerPage}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setAccessList(data.data);
          
          // Update pagination info if available
          if (data.pagination) {
            setTotalPages(data.pagination.total_page);
            setTotalItems(data.pagination.total_item);
          }
        } else {
          setError(data.message || "Erişim listesi alınamadı");
        }
      })
      .catch(() => setError("Sunucu hatası"))
      .finally(() => setLoading(false));
  };

  const fetchUsers = (token) => {
    fetch(`http://localhost:3232/user/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setUsers(data.data);
          // Set default value for create form if users exist
          if (data.data.length > 0 && !createUserId) {
            setCreateUserId(data.data[0].id.toString());
          }
        }
      })
      .catch((err) => console.error("Kullanıcılar yüklenirken hata oluştu:", err));
  };

  const fetchDevices = (token) => {
    fetch(`http://localhost:3232/device`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setDevices(data.data);
          // Set default value for create form if devices exist
          if (data.data.length > 0 && !createDeviceId) {
            setCreateDeviceId(data.data[0].id.toString());
          }
        }
      })
      .catch((err) => console.error("Cihazlar yüklenirken hata oluştu:", err));
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

  // Delete access
  const confirmDelete = (access) => {
    setAccessToDelete(access);
    setDeleteModalOpen(true);
    setDeleteError("");
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setAccessToDelete(null);
  };

  const deleteAccess = async () => {
    if (!accessToDelete) return;
    
    setDeleteLoading(true);
    setDeleteError("");
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3232/user-device-access/${accessToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status) {
        // Refresh access list after deletion
        fetchAccessList(token);
        setDeleteModalOpen(false);
        setAccessToDelete(null);
      } else {
        setDeleteError(data.message || "Erişim silinemedi");
      }
    } catch (err) {
      setDeleteError("Sunucu hatası");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Edit access
  const openEditModal = (access) => {
    setAccessToEdit(access);
    setEditUserId(access.user.id.toString());
    setEditDeviceId(access.device.id.toString());
    setEditModalOpen(true);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditModalOpen(false);
    setAccessToEdit(null);
    setEditUserId("");
    setEditDeviceId("");
  };

  const updateAccess = async (e) => {
    e.preventDefault();
    
    if (!accessToEdit) return;
    if (!editUserId) {
      setEditError("Kullanıcı seçilmelidir");
      return;
    }

    if (!editDeviceId) {
      setEditError("Cihaz seçilmelidir");
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
      const response = await fetch(`http://localhost:3232/user-device-access/${accessToEdit.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: parseInt(editUserId),
          deviceId: parseInt(editDeviceId)
        })
      });
      
      const data = await response.json();
      
      if (data.status) {
        // Refresh access list after update
        fetchAccessList(token);
        setEditModalOpen(false);
        setAccessToEdit(null);
        setEditUserId("");
        setEditDeviceId("");
      } else {
        setEditError(data.message || "Erişim güncellenemedi");
      }
    } catch (err) {
      setEditError("Sunucu hatası");
    } finally {
      setEditLoading(false);
    }
  };

  // Create access
  const openCreateModal = () => {
    setCreateModalOpen(true);
    setCreateError("");
    
    // Set default values if available
    if (users.length > 0) {
      setCreateUserId(users[0].id.toString());
    }
    if (devices.length > 0) {
      setCreateDeviceId(devices[0].id.toString());
    }
  };

  const cancelCreate = () => {
    setCreateModalOpen(false);
    setCreateUserId("");
    setCreateDeviceId("");
  };

  const createAccess = async (e) => {
    e.preventDefault();
    
    if (!createUserId) {
      setCreateError("Kullanıcı seçilmelidir");
      return;
    }

    if (!createDeviceId) {
      setCreateError("Cihaz seçilmelidir");
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
      const response = await fetch(`http://localhost:3232/user-device-access/create/${createDeviceId}/${createUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status) {
        // Refresh access list after creation
        fetchAccessList(token);
        setCreateModalOpen(false);
        setCreateUserId("");
        setCreateDeviceId("");
      } else {
        setCreateError(data.message || "Erişim oluşturulamadı");
      }
    } catch (err) {
      setCreateError("Sunucu hatası");
    } finally {
      setCreateLoading(false);
    }
  };

  // Helper function to find user or device name from ID
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : "Bilinmeyen Kullanıcı";
  };

  const getDeviceName = (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : "Bilinmeyen Cihaz";
  };

  if (loading && accessList.length === 0) return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  if (error) return <div className="text-red-600 text-center p-10">{error}</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-primary">
            <path d="M12 4v16m8-8H4"/>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Kullanıcı Cihaz Erişim Yönetimi
        </h2>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2 px-5 py-2 rounded-lg shadow-md"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
          Yeni Erişim
        </button>
      </div>

      <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-dark-200 text-text-tertiary">
                <th className="px-4 py-2 text-left font-semibold">ID</th>
                <th className="px-4 py-2 text-left font-semibold">Kullanıcı</th>
                <th className="px-4 py-2 text-left font-semibold">Cihaz</th>
                <th className="px-4 py-2 text-left font-semibold">Oluşturulma Tarihi</th>
                <th className="px-4 py-2 text-left font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {accessList.map((access) => (
                <tr key={access.id} className="hover:bg-dark-200 transition-all border-b border-border-primary">
                  <td className="px-4 py-3 text-text-primary font-medium">{access.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-text-primary font-medium">{access.user?.username || "Bilinmeyen"}</div>
                    <div className="text-xs text-text-secondary">{access.user?.email || ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-text-primary font-medium">{access.device?.name || "Bilinmeyen"}</div>
                    <div className="text-xs text-text-secondary">{access.device?.mqtt_topic || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(access.create_at).toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-3 flex flex-wrap gap-2">
                    <button 
                      onClick={() => openEditModal(access)} 
                      className="px-3 py-1 text-xs rounded-lg border border-accent-primary text-accent-primary hover:bg-dark-200 transition"
                    >
                      Düzenle
                    </button>
                    <button 
                      onClick={() => confirmDelete(access)} 
                      className="px-3 py-1 text-xs rounded-lg border border-red-500 text-red-500 hover:bg-dark-200 transition"
                    >
                      Sil
                    </button>
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
            <h3 className="text-lg font-bold text-text-primary mb-4">Erişim Silme</h3>
            <p className="text-text-secondary mb-6">
              <span className="font-bold text-accent-primary">{accessToDelete?.user?.username || "Bilinmeyen"}</span> kullanıcısının <span className="font-bold text-accent-primary">{accessToDelete?.device?.name || "Bilinmeyen"}</span> cihazına olan erişimini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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
                onClick={deleteAccess}
                className="px-4 py-2 rounded-lg border border-accent-primary bg-accent-primary text-white hover:bg-accent-primary/90 transition"
                disabled={deleteLoading}
              >
                {deleteLoading ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Access Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Erişim Düzenle</h3>
            {editError && (
              <div className="mb-4 p-3 bg-accent-primary/10 text-accent-primary border border-accent-primary rounded-md text-sm">
                {editError}
              </div>
            )}
            <form onSubmit={updateAccess} className="space-y-4">
              <div>
                <label htmlFor="editUser" className="block text-sm font-medium text-text-secondary mb-1">
                  Kullanıcı*
                </label>
                <select
                  id="editUser"
                  value={editUserId}
                  onChange={(e) => setEditUserId(e.target.value)}
                  className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary"
                  required
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id} className="bg-dark-200 text-text-primary">
                      {user.username} ({user.email}) - {user.company?.name || "Şirket Yok"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="editDevice" className="block text-sm font-medium text-text-secondary mb-1">
                  Cihaz*
                </label>
                <select
                  id="editDevice"
                  value={editDeviceId}
                  onChange={(e) => setEditDeviceId(e.target.value)}
                  className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary"
                  required
                >
                  {devices.map(device => (
                    <option key={device.id} value={device.id} className="bg-dark-200 text-text-primary">
                      {device.name} (Topic: {device.mqtt_topic})
                    </option>
                  ))}
                </select>
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

      {/* Create Access Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Yeni Erişim</h3>
            {createError && (
              <div className="mb-4 p-3 bg-accent-primary/10 text-accent-primary border border-accent-primary rounded-md text-sm">
                {createError}
              </div>
            )}
            <form onSubmit={createAccess} className="space-y-4">
              <div>
                <label htmlFor="createUser" className="block text-sm font-medium text-text-secondary mb-1">
                  Kullanıcı*
                </label>
                <select
                  id="createUser"
                  value={createUserId}
                  onChange={(e) => setCreateUserId(e.target.value)}
                  className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary"
                  required
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id} className="bg-dark-200 text-text-primary">
                      {user.username} ({user.email}) - {user.company?.name || "Şirket Yok"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="createDevice" className="block text-sm font-medium text-text-secondary mb-1">
                  Cihaz*
                </label>
                <select
                  id="createDevice"
                  value={createDeviceId}
                  onChange={(e) => setCreateDeviceId(e.target.value)}
                  className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary"
                  required
                >
                  {devices.map(device => (
                    <option key={device.id} value={device.id} className="bg-dark-200 text-text-primary">
                      {device.name} (Topic: {device.mqtt_topic})
                    </option>
                  ))}
                </select>
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