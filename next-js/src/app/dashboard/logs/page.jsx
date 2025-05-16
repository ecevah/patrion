"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  
  
  const [selectedUserId, setSelectedUserId] = useState("all");
  
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
    fetchUsers(token);
    
    if (selectedUserId === "all") {
      fetchAllLogs(token);
    } else {
      fetchUserLogs(token, selectedUserId);
    }
  }, [router, currentPage, itemsPerPage, selectedUserId]);

  const fetchAllLogs = (token) => {
    setLoading(true);
    
    fetch(`http://localhost:3232/log/all?page=${currentPage}&limit=${itemsPerPage}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setLogs(data.data);
          
          
          if (data.pagination) {
            setTotalPages(data.pagination.total_page);
            setTotalItems(data.pagination.total_item);
          }
        } else {
          setError(data.message || "Loglar alınamadı");
        }
      })
      .catch(() => setError("Sunucu hatası"))
      .finally(() => setLoading(false));
  };

  const fetchUserLogs = (token, userId) => {
    setLoading(true);
    
    fetch(`http://localhost:3232/log/user/${userId}?page=${currentPage}&limit=${itemsPerPage}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setLogs(data.data);
          
          
          if (data.pagination) {
            setTotalPages(data.pagination.total_page);
            setTotalItems(data.pagination.total_item);
          }
        } else {
          setError(data.message || "Kullanıcı logları alınamadı");
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

  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('tr-TR');
  };

  
  const formatDetails = (details) => {
    try {
      const detailsObj = JSON.parse(details);
      return JSON.stringify(detailsObj, null, 2);
    } catch (e) {
      return details;
    }
  };

  
  const handleUserFilterChange = (e) => {
    setSelectedUserId(e.target.value);
    setCurrentPage(1); 
  };

  if (loading && logs.length === 0) return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  if (error) return <div className="text-red-600 text-center p-10">{error}</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Sistem Log Kayıtları</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor="userFilter" className="text-sm font-medium text-text-secondary">
            Kullanıcı Filtresi:
          </label>
          <select
            id="userFilter"
            value={selectedUserId}
            onChange={handleUserFilterChange}
            className="px-3 py-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="all">Tüm Kullanıcılar</option>
            {users.map(user => (
              <option key={user.id} value={user.id} className="bg-dark-200 text-text-primary">
                {user.username} ({user.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-dark-200 text-text-tertiary">
                <th className="px-4 py-2 text-left font-semibold">ID</th>
                <th className="px-4 py-2 text-left font-semibold">Kullanıcı</th>
                <th className="px-4 py-2 text-left font-semibold">Tarih</th>
                <th className="px-4 py-2 text-left font-semibold">İşlem Türü</th>
                <th className="px-4 py-2 text-left font-semibold">Detaylar</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-dark-200 transition-all border-b border-border-primary">
                  <td className="px-4 py-3 text-text-primary font-medium">{log.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-text-primary font-medium">{log.user?.username || "Bilinmeyen"}</div>
                    <div className="text-xs text-text-secondary">{log.user?.email || ""}</div>
                    <div className="text-xs text-text-secondary">{log.user?.company?.name || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(log.timestamp)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getActionTypeColorDark(log.action_type)}`}>{log.action_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-text-primary">
                      <pre className="text-xs bg-dark-300 p-2 rounded overflow-x-auto max-w-xs">{formatDetails(log.details)}</pre>
                    </div>
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
                <option value={10}>10 kayıt</option>
                <option value={20}>20 kayıt</option>
                <option value={50}>50 kayıt</option>
                <option value={100}>100 kayıt</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function getActionTypeColorDark(actionType) {
  if (actionType.startsWith("GET")) {
    return "bg-blue-900/20 text-blue-400 border border-blue-700";
  } else if (actionType.startsWith("POST")) {
    return "bg-green-900/20 text-green-400 border border-green-700";
  } else if (actionType.startsWith("PATCH") || actionType.startsWith("PUT")) {
    return "bg-yellow-900/20 text-yellow-400 border border-yellow-700";
  } else if (actionType.startsWith("DELETE")) {
    return "bg-red-900/20 text-red-400 border border-red-700";
  } else if (actionType.includes("LOGIN") || actionType.includes("LOGOUT")) {
    return "bg-purple-900/20 text-purple-400 border border-purple-700";
  } else {
    return "bg-dark-300 text-text-secondary border border-border-primary";
  }
} 