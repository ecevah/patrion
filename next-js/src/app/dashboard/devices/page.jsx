"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("user");
  const router = useRouter();
  
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState(null);
  const [editName, setEditName] = useState("");
  const [editMac, setEditMac] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createMac, setCreateMac] = useState("");
  const [createCompanyId, setCreateCompanyId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [deviceToAssign, setDeviceToAssign] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const roleFromStorage = localStorage.getItem("role") || "user";
    
    if (!token) {
      router.push("/");
      return;
    }
    
    setUserRole(roleFromStorage);
    fetchDevices(token);
    fetchCompanies(token);
    fetchUsers(token);
  }, [router, currentPage, itemsPerPage]);

  const fetchDevices = (token) => {
    setLoading(true);
    
    fetch(`http://localhost:3232/device?page=${currentPage}&limit=${itemsPerPage}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setDevices(data.data);
          
          
          if (data.pagination) {
            setTotalPages(data.pagination.total_page);
            setTotalItems(data.pagination.total_item);
          }
        } else {
          setError(data.message || "Cihazlar alınamadı");
        }
      })
      .catch(() => setError("Sunucu hatası"))
      .finally(() => setLoading(false));
  };

  const fetchCompanies = (token) => {
    fetch(`http://localhost:3232/company`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setCompanies(data.data);
          
          if (data.data.length > 0 && !createCompanyId) {
            setCreateCompanyId(data.data[0].id.toString());
          }
          
          if (userRole !== "System Admin" && data.data.length > 0) {
            
            const userCompany = localStorage.getItem("companyId");
            if (userCompany) {
              setCreateCompanyId(userCompany);
              setEditCompanyId(userCompany);
            } else {
              setCreateCompanyId(data.data[0].id.toString());
              setEditCompanyId(data.data[0].id.toString());
            }
          }
        }
      })
      .catch((err) => console.error("Şirketler yüklenirken hata oluştu:", err));
  };

  const fetchUsers = (token) => {
    fetch(`http://localhost:3232/user/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setUsers(data.data);
          
          if (data.data.length > 0 && !selectedUserId) {
            setSelectedUserId(data.data[0].id.toString());
          }
        }
      })
      .catch((err) => console.error("Kullanıcılar yüklenirken hata oluştu:", err));
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

  
  const confirmDelete = (device) => {
    setDeviceToDelete(device);
    setDeleteModalOpen(true);
    setDeleteError("");
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setDeviceToDelete(null);
  };

  const deleteDevice = async () => {
    if (!deviceToDelete) return;
    
    setDeleteLoading(true);
    setDeleteError("");
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3232/device/${deviceToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status) {
        
        fetchDevices(token);
        setDeleteModalOpen(false);
        setDeviceToDelete(null);
      } else {
        setDeleteError(data.message || "Cihaz silinemedi");
      }
    } catch (err) {
      setDeleteError("Sunucu hatası");
    } finally {
      setDeleteLoading(false);
    }
  };

  
  const openEditModal = (device) => {
    setDeviceToEdit(device);
    setEditName(device.name);
    setEditMac(device.mac);
    setEditCompanyId(device.company.id.toString());
    setEditModalOpen(true);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditModalOpen(false);
    setDeviceToEdit(null);
    setEditName("");
    setEditMac("");
    setEditCompanyId("");
  };

  const updateDevice = async (e) => {
    e.preventDefault();
    
    if (!deviceToEdit) return;
    if (!editName.trim()) {
      setEditError("Cihaz adı boş olamaz");
      return;
    }

    if (!editMac.trim()) {
      setEditError("MAC adresi boş olamaz");
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
      const topic = `${editMac}/data`;
      const response = await fetch(`http://localhost:3232/device/${deviceToEdit.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          mqtt_topic: topic,
          mac: editMac,
          companyId: parseInt(editCompanyId)
        })
      });
      
      const data = await response.json();
      
      if (data.status) {
        
        fetchDevices(token);
        setEditModalOpen(false);
        setDeviceToEdit(null);
        setEditName("");
        setEditMac("");
        setEditCompanyId("");
      } else {
        setEditError(data.message || "Cihaz güncellenemedi");
      }
    } catch (err) {
      setEditError("Sunucu hatası");
    } finally {
      setEditLoading(false);
    }
  };

  
  const openCreateModal = () => {
    setCreateModalOpen(true);
    setCreateName("");
    setCreateMac("");
    
    if (companies.length > 0) {
      setCreateCompanyId(companies[0].id.toString());
    } else {
      setCreateCompanyId("");
    }
    setCreateError("");
  };

  const cancelCreate = () => {
    setCreateModalOpen(false);
    setCreateName("");
    setCreateMac("");
    setCreateCompanyId("");
  };

  const createDevice = async (e) => {
    e.preventDefault();
    
    if (!createName.trim()) {
      setCreateError("Cihaz adı boş olamaz");
      return;
    }

    if (!createMac.trim()) {
      setCreateError("MAC adresi boş olamaz");
      return;
    }

    if (!createCompanyId) {
      setCreateError("Şirket seçilmelidir");
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
      const topic = `${createMac}/data`;
      const response = await fetch(`http://localhost:3232/device`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: createName,
          mqtt_topic: topic,
          mac: createMac,
          companyId: parseInt(createCompanyId)
        })
      });
      
      const data = await response.json();
      
      if (data.status) {
        
        fetchDevices(token);
        setCreateModalOpen(false);
        setCreateName("");
        setCreateMac("");
      } else {
        setCreateError(data.message || "Cihaz oluşturulamadı");
      }
    } catch (err) {
      setCreateError("Sunucu hatası");
    } finally {
      setCreateLoading(false);
    }
  };

  
  const openAssignModal = (device) => {
    setDeviceToAssign(device);
    setAssignModalOpen(true);
    setAssignError("");
    setAssignSuccess("");
  };

  const cancelAssign = () => {
    setAssignModalOpen(false);
    setDeviceToAssign(null);
    setSelectedUserId("");
  };

  const assignUserToDevice = async (e) => {
    e.preventDefault();
    
    if (!deviceToAssign) return;
    if (!selectedUserId) {
      setAssignError("Kullanıcı seçilmelidir");
      return;
    }
    
    setAssignLoading(true);
    setAssignError("");
    setAssignSuccess("");
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
    try {
      
      const response = await fetch(`http://localhost:3232/user-device-access/create/${deviceToAssign.id}/${selectedUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status) {
        setAssignSuccess("Kullanıcı cihaza başarıyla atandı!");
        
        setTimeout(() => {
          setAssignSuccess("");
        }, 3000);
      } else {
        setAssignError(data.message || "Kullanıcı cihaza atanamadı");
      }
    } catch (err) {
      setAssignError("Sunucu hatası");
    } finally {
      setAssignLoading(false);
    }
  };

  
  const renderCompanyField = (value, setValue, label = "Şirket*") => {
    return (
      <div>
        
        {userRole === "System Admin" ? (
          <>
          <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Şirket Seçin</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          </>
        ) : null}
      </div>
    );
  };

  if (loading && devices.length === 0) return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  if (error) return <div className="text-red-600 text-center p-10">{error}</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Cihaz Yönetimi</h2>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2 px-5 py-2 rounded-lg shadow-md"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
          Yeni Cihaz
        </button>
      </div>

      <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-dark-200 text-text-tertiary">
                <th className="px-4 py-2 text-left font-semibold">Cihaz Adı</th>
                <th className="px-4 py-2 text-left font-semibold">Şirket</th>
                <th className="px-4 py-2 text-left font-semibold">MQTT Topic</th>
                <th className="px-4 py-2 text-left font-semibold">MAC Adresi</th>
                <th className="px-4 py-2 text-left font-semibold">Oluşturulma Tarihi</th>
                <th className="px-4 py-2 text-left font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className="hover:bg-dark-200 transition-all border-b border-border-primary">
                  <td className="px-4 py-3 text-text-primary font-medium">{device.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{device.company?.name || "Şirket Yok"}</td>
                  <td className="px-4 py-3 text-accent-tertiary font-mono">{device.mqtt_topic}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono">{device.mac}</td>
                  <td className="px-4 py-3 text-xs text-text-tertiary">{new Date(device.create_at).toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-3 flex flex-wrap gap-2">
                    <button onClick={() => openAssignModal(device)} className="px-3 py-1 text-xs rounded-lg border border-accent-tertiary text-accent-tertiary hover:bg-dark-200 transition">Kullanıcı Ata</button>
                    <button onClick={() => openEditModal(device)} className="px-3 py-1 text-xs rounded-lg border border-accent-primary text-accent-primary hover:bg-dark-200 transition">Düzenle</button>
                    <button onClick={() => confirmDelete(device)} className="px-3 py-1 text-xs rounded-lg border border-red-500 text-red-500 hover:bg-dark-200 transition">Sil</button>
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
            <h3 className="text-lg font-bold text-text-primary mb-4">Cihaz Silme</h3>
            <p className="text-text-secondary mb-6">
              <span className="font-bold text-accent-primary">{deviceToDelete?.name}</span> cihazını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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
                onClick={deleteDevice}
                className="px-4 py-2 rounded-lg border border-accent-primary bg-accent-primary text-white hover:bg-accent-primary/90 transition"
                disabled={deleteLoading}
              >
                {deleteLoading ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto">
            <h3 className="text-lg font-bold text-text-primary mb-4">Cihaz Düzenle: <span className="text-accent-primary">{deviceToEdit.name}</span></h3>
            {editError && (
              <div className="bg-accent-primary/10 text-accent-primary border border-accent-primary p-3 rounded mb-4 text-sm">{editError}</div>
            )}
            <form onSubmit={updateDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Cihaz Adı*</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">MAC Adresi*</label>
                <input type="text" value={editMac} onChange={(e) => setEditMac(e.target.value)} className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary" required />
              </div>
              {renderCompanyField(editCompanyId, setEditCompanyId, "Şirket*")}
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-lg border border-border-primary bg-dark-200 text-text-primary hover:bg-dark-300 transition">İptal</button>
                <button type="submit" className="px-4 py-2 rounded-lg border border-accent-primary bg-accent-primary text-white hover:bg-accent-primary/90 transition" disabled={editLoading}>{editLoading ? "Güncelleniyor..." : "Güncelle"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Device Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto">
            <h3 className="text-lg font-bold text-text-primary mb-4">Yeni Cihaz Oluştur</h3>
            {createError && (
              <div className="bg-accent-primary/10 text-accent-primary border border-accent-primary p-3 rounded mb-4 text-sm">{createError}</div>
            )}
            <form onSubmit={createDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Cihaz Adı*</label>
                <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">MAC Adresi*</label>
                <input type="text" value={createMac} onChange={(e) => setCreateMac(e.target.value)} className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary" required />
              </div>
              {renderCompanyField(createCompanyId, setCreateCompanyId, "Şirket*")}
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={cancelCreate} className="px-4 py-2 rounded-lg border border-border-primary bg-dark-200 text-text-primary hover:bg-dark-300 transition">İptal</button>
                <button type="submit" className="px-4 py-2 rounded-lg border border-accent-primary bg-accent-primary text-white hover:bg-accent-primary/90 transition" disabled={createLoading}>{createLoading ? "Oluşturuluyor..." : "Oluştur"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Kullanıcı Ata</h3>
            <p className="text-text-secondary mb-4">
              <span className="font-bold text-accent-primary">{deviceToAssign?.name}</span> cihazına kullanıcı erişimi atayın.
            </p>
            {assignError && (
              <div className="mb-4 p-3 bg-accent-primary/10 text-accent-primary border border-accent-primary rounded-md text-sm">{assignError}</div>
            )}
            {assignSuccess && (
              <div className="mb-4 p-3 bg-accent-tertiary/10 text-accent-tertiary border border-accent-tertiary rounded-md text-sm">{assignSuccess}</div>
            )}
            <form onSubmit={assignUserToDevice} className="space-y-4">
              <div>
                <label htmlFor="assignUser" className="block text-sm font-medium text-text-secondary mb-1">Kullanıcı*</label>
                <select
                  id="assignUser"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary"
                  required
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email}) - {user.company?.name || "Şirket Yok"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={cancelAssign} className="px-4 py-2 rounded-lg border border-border-primary bg-dark-200 text-text-primary hover:bg-dark-300 transition" disabled={assignLoading}>İptal</button>
                <button type="submit" className="px-4 py-2 rounded-lg border border-accent-tertiary bg-accent-tertiary text-white hover:bg-accent-tertiary/90 transition" disabled={assignLoading}>{assignLoading ? "Atanıyor..." : "Kullanıcı Ata"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 