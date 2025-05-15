"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserDetailPage({ params }) {
  const unwrappedParams = use(params);
  const userId = unwrappedParams.id;
  
  const [user, setUser] = useState(null);
  const [assignedDevices, setAssignedDevices] = useState([]);
  const [userLogs, setUserLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  
  // Logs pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
    fetchUserDetails(token);
    fetchUserDevices(token);
    fetchUserLogs(token);
  }, [router, userId, currentPage, itemsPerPage]);

  const fetchUserDetails = (token) => {
    setLoading(true);
    
    fetch(`http://localhost:3232/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setUser(data.data);
          console.log("User data:", data.data);
        } else {
          setError(data.message || "Kullanıcı bilgileri alınamadı");
        }
      })
      .catch(() => setError("Sunucu hatası"))
      .finally(() => setLoading(false));
  };

  const fetchUserDevices = (token) => {
    fetch(`http://localhost:3232/user-device-access/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setAssignedDevices(data.data);
          console.log("User devices:", data.data);
        } else {
          console.error("Cihaz erişimleri alınamadı:", data.message);
        }
      })
      .catch((err) => console.error("Cihaz erişimleri alınırken hata oluştu:", err));
  };

  const fetchUserLogs = (token) => {
    fetch(`http://localhost:3232/log/user/${userId}?page=${currentPage}&limit=${itemsPerPage}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setUserLogs(data.data);
          console.log("User logs:", data.data);
          
          // Update pagination info
          if (data.pagination) {
            setTotalPages(data.pagination.total_page);
            setTotalItems(data.pagination.total_item);
          }
        } else {
          console.error("Kullanıcı logları alınamadı:", data.message);
        }
      })
      .catch((err) => console.error("Kullanıcı logları alınırken hata oluştu:", err));
  };

  // Format JSON data for better display
  const formatJson = (data) => {
    try {
      if (typeof data === 'string') {
        return JSON.stringify(JSON.parse(data), null, 2);
      }
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return typeof data === 'string' ? data : JSON.stringify(data);
    }
  };

  // Format timestamp
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('tr-TR');
  };

  // Format log details
  const formatDetails = (details) => {
    try {
      const detailsObj = JSON.parse(details);
      return JSON.stringify(detailsObj, null, 2);
    } catch (e) {
      return details;
    }
  };

  // Pagination functions
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

  // Get color for log action type
  const getActionTypeColor = (actionType) => {
    if (actionType.startsWith("GET")) {
      return "bg-blue-100 text-blue-800";
    } else if (actionType.startsWith("POST")) {
      return "bg-green-100 text-green-800";
    } else if (actionType.startsWith("PATCH") || actionType.startsWith("PUT")) {
      return "bg-yellow-100 text-yellow-800";
    } else if (actionType.startsWith("DELETE")) {
      return "bg-red-100 text-red-800";
    } else if (actionType.includes("LOGIN") || actionType.includes("LOGOUT")) {
      return "bg-purple-100 text-purple-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  if (error) return <div className="text-red-600 text-center p-10">{error}</div>;
  if (!user) return <div className="text-center p-10">Kullanıcı bulunamadı</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Kullanıcı Detayı</h2>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/users/edit/${user.id}`}>
            <button className="btn-primary flex items-center gap-2 px-5 py-2 rounded-lg shadow-md">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
              Düzenle
            </button>
          </Link>
          <Link href="/dashboard/users">
            <button className="btn-secondary flex items-center gap-2 px-5 py-2 rounded-lg shadow-md">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
              Kullanıcı Listesi
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {/* Basic Info Panel */}
          <div className="bg-dark-200 rounded-xl shadow-sm border border-border-primary overflow-hidden">
            <div className="bg-dark-300 px-4 py-2 border-b border-border-primary">
              <h3 className="font-medium text-text-secondary">Temel Bilgiler</h3>
            </div>
            <div className="p-4 space-y-3">
              <InfoItem label="Kullanıcı ID" value={user.id} />
              <InfoItem label="Kullanıcı Adı" value={user.username} />
              <InfoItem label="E-posta" value={user.email} />
              <InfoItem label="Şirket" value={user.company?.name} />
              <InfoItem 
                label="Rol" 
                value={user.role?.role}
                badge={true}
                badgeColor="bg-accent-tertiary/10 text-accent-tertiary border border-accent-tertiary"
              />
            </div>
          </div>

          {/* Permissions Panel */}
          <div className="bg-dark-200 rounded-xl shadow-sm border border-border-primary overflow-hidden">
            <div className="bg-dark-300 px-4 py-2 border-b border-border-primary">
              <h3 className="font-medium text-text-secondary">Yetkiler</h3>
            </div>
            <div className="p-4 space-y-3">
              <PermissionItem 
                label="Şirket Ekleyebilir" 
                hasPermission={user.role?.can_add_company} 
              />
              <PermissionItem 
                label="Kullanıcı Ekleyebilir" 
                hasPermission={user.role?.can_add_user} 
              />
              <PermissionItem 
                label="Cihaz Atayabilir" 
                hasPermission={user.role?.can_assign_device} 
              />
              <PermissionItem 
                label="Verileri Görüntüleyebilir" 
                hasPermission={user.role?.can_view_data} 
              />
              <PermissionItem 
                label="Logları Görüntüleyebilir" 
                hasPermission={user.role?.can_view_log} 
              />
              <PermissionItem 
                label="IoT Cihazları Yönetebilir" 
                hasPermission={user.role?.can_manage_iot} 
              />
            </div>
          </div>

          {/* System Info Panel */}
          <div className="bg-dark-200 rounded-xl shadow-sm border border-border-primary overflow-hidden">
            <div className="bg-dark-300 px-4 py-2 border-b border-border-primary">
              <h3 className="font-medium text-text-secondary">Sistem Bilgileri</h3>
            </div>
            <div className="p-4 space-y-3">
              <InfoItem 
                label="Oluşturulma Tarihi" 
                value={new Date(user.create_at).toLocaleString('tr-TR')} 
              />
              <InfoItem 
                label="Son Güncelleme" 
                value={new Date(user.update_at).toLocaleString('tr-TR')} 
              />
              {user.create_by && (
                <InfoItem 
                  label="Oluşturan" 
                  value={`${user.create_by.username || ''} (ID: ${user.create_by.id})`} 
                />
              )}
              {user.update_by && (
                <InfoItem 
                  label="Son Güncelleyen" 
                  value={`${user.update_by.username || ''} (ID: ${user.update_by.id})`} 
                />
              )}
            </div>
          </div>
        </div>

        {/* Second row with Assigned Devices and User Logs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-6">
          {/* Assigned Devices Panel */}
          <div className="bg-dark-200 rounded-xl shadow-sm border border-border-primary overflow-hidden">
            <div className="bg-dark-300 px-4 py-2 border-b border-border-primary">
              <h3 className="font-medium text-text-secondary">Atanmış Cihazlar</h3>
            </div>
            <div className="p-4">
              {assignedDevices.length === 0 ? (
                <div className="text-center py-6 text-text-secondary">
                  Bu kullanıcıya atanmış cihaz bulunmamaktadır.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border-primary">
                    <thead className="bg-dark-300">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Cihaz Adı
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Şirket
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Atanma Tarihi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-dark-200 divide-y divide-border-primary">
                      {assignedDevices.map((access) => (
                        <tr key={access.id} className="hover:bg-dark-300">
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="font-medium text-text-primary">{access.device?.name}</div>
                            <div className="text-xs text-text-secondary">{access.device?.mac}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="text-sm text-text-primary">{access.device?.company?.name || "Şirket Yok"}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="text-sm text-text-secondary">{formatDate(access.create_at)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* User Logs Panel */}
          <div className="bg-dark-200 rounded-xl shadow-sm border border-border-primary overflow-hidden">
            <div className="bg-dark-300 px-4 py-2 border-b border-border-primary">
              <h3 className="font-medium text-text-secondary">Kullanıcı Logları</h3>
            </div>
            <div className="p-4">
              {userLogs.length === 0 ? (
                <div className="text-center py-6 text-text-secondary">
                  Bu kullanıcıya ait log kaydı bulunmamaktadır.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border-primary">
                      <thead className="bg-dark-300">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Tarih
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            İşlem Türü
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Detaylar
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-dark-200 divide-y divide-border-primary">
                        {userLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-dark-300">
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-sm text-text-primary">{formatDate(log.timestamp)}</div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-sm text-text-primary">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getActionTypeColor(log.action_type)}`}>
                                  {log.action_type}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="text-sm text-text-primary">
                                <pre className="text-xs bg-dark-300 p-2 rounded overflow-x-auto max-w-xs">
                                  {formatDetails(log.details)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-xs text-text-secondary">
                        Toplam {totalItems} kayıt, {totalPages} sayfa
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className={`px-2 py-1 text-xs rounded ${currentPage === 1 ? 'bg-dark-300 text-text-secondary cursor-not-allowed' : 'bg-dark-300 text-text-primary hover:bg-dark-200'}`}
                        >
                          Önceki
                        </button>
                        
                        {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage <= 2) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 1) {
                            pageNum = totalPages - 2 + i;
                          } else {
                            pageNum = currentPage - 1 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`h-6 w-6 text-xs rounded ${currentPage === pageNum ? 'bg-accent-tertiary text-accent-tertiary' : 'bg-dark-300 text-text-primary hover:bg-dark-200'}`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className={`px-2 py-1 text-xs rounded ${currentPage === totalPages ? 'bg-dark-300 text-text-secondary cursor-not-allowed' : 'bg-dark-300 text-text-primary hover:bg-dark-200'}`}
                        >
                          Sonraki
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper components
const InfoItem = ({ label, value, badge = false, badgeColor = "" }) => {
  if (value === undefined || value === null) {
    value = "-";
  }
  
  return (
    <div className="flex flex-col">
      <span className="text-sm text-text-secondary">{label}</span>
      {badge ? (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor} w-fit`}>
          {value}
        </span>
      ) : (
        <span className="font-medium text-text-primary">{value}</span>
      )}
    </div>
  );
};

const PermissionItem = ({ label, hasPermission }) => {
  return (
    <div className="flex items-center">
      <span className={`flex-shrink-0 w-5 h-5 rounded-full mr-2 flex items-center justify-center ${hasPermission ? 'bg-green-100' : 'bg-red-100'}`}>
        {hasPermission ? (
          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </span>
      <span className="font-medium text-text-primary">{label}</span>
    </div>
  );
}; 