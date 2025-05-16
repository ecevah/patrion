"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function EditUserPage({ params }) {
  
  const unwrappedParams = use(params);
  const userId = unwrappedParams.id;
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [userRole, setUserRole] = useState("user");
  
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const roleFromStorage = localStorage.getItem("role") || "user";
    
    if (!token) {
      router.push("/");
      return;
    }
    
    setUserRole(roleFromStorage);
    
    
    fetchUserDetails(token);
    
    
    fetchCompanies(token);
    fetchRoles(token);
  }, [router, userId]);

  const fetchUserDetails = (token) => {
    setLoading(true);
    
    fetch(`http://localhost:3232/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          const userData = data.data;
          setUser(userData);
          setUsername(userData.username);
          setEmail(userData.email);
          setCompanyId(userData.company?.id || "");
          setRoleId(userData.role?.id || "");
          setIsVisible(userData.is_visible);
        } else {
          setError(data.message || "Kullanıcı bilgileri alınamadı");
        }
      })
      .catch(() => setError("Sunucu hatası"))
      .finally(() => setLoading(false));
  };

  const fetchCompanies = (token) => {
    fetch("http://localhost:3232/company", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setCompanies(data.data || []);
          
          
          if (userRole !== "System Admin" && data.data.length > 0) {
            
            const userCompany = localStorage.getItem("companyId");
            if (userCompany) {
              setCompanyId(userCompany);
            }
          }
        }
      })
      .catch((err) => console.error("Şirket listesi alınamadı:", err));
  };

  const fetchRoles = (token) => {
    fetch("http://localhost:3232/role", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setRoles(data.data || []);
        }
      })
      .catch((err) => console.error("Rol listesi alınamadı:", err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3232/user/${userId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          username,
          email,
          companyId: Number(companyId),
          roleId: Number(roleId),
          is_visible: isVisible
        }),
      });
      
      const data = await response.json();
      
      if (data.status) {
        setSuccessMessage("Kullanıcı başarıyla güncellendi");
        setUser(data.data);
      } else {
        setError(data.message || "Kullanıcı güncellenirken bir hata oluştu");
      }
    } catch (err) {
      setError("Sunucu hatası");
    } finally {
      setSaving(false);
    }
  };

  
  const renderCompanyField = () => {
    return (
      <div>
        
        {userRole === "System Admin" ? (
          <>
          <label className="block text-sm font-medium text-gray-700 mb-1">
          Şirket
        </label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        ) : null }
      </div>
    );
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  if (error && !user) return <div className="text-red-600 text-center p-10">{error}</div>;
  if (!user) return <div className="text-center p-10">Kullanıcı bulunamadı</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Kullanıcı Düzenle</h2>
        <div className="flex space-x-3">
          <Link href={`/dashboard/users/${userId}`}>
            <button className="btn-secondary flex items-center gap-2 px-5 py-2 rounded-lg shadow-md">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
              Kullanıcı Detayı
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

      <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-md p-6">
        <div className="mb-4">
          <p className="text-text-tertiary text-sm">ID: {userId}</p>
        </div>
        {successMessage && (
          <div className="mb-4 p-4 bg-accent-tertiary/10 text-accent-tertiary border border-accent-tertiary rounded-lg text-sm">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-accent-primary/10 text-accent-primary border border-accent-primary rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary"
                required
              />
            </div>
            {renderCompanyField()}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Rol
              </label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary"
                required
              >
                <option value="">Rol Seçin</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id} className="bg-dark-200 text-text-primary">
                    {role.role}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg border border-accent-primary bg-accent-primary text-white hover:bg-accent-primary/90 transition"
            >
              {saving ? "Kaydediliyor..." : "Güncelle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 