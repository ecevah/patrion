"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState({
    can_add_company: false,
    can_add_user: false,
    can_assign_device: false,
    can_view_data: true, 
    can_view_log: false,
    can_manage_iot: false
  });

  const handlePermissionChange = (permission) => {
    setPermissions({
      ...permissions,
      [permission]: !permissions[permission]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!roleName.trim()) {
      setError("Rol adı boş olamaz");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccessMessage("");
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
    try {
      const response = await fetch("http://localhost:3232/role", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          role: roleName,
          ...permissions
        }),
      });
      
      const data = await response.json();
      
      if (data.status) {
        setSuccessMessage("Rol başarıyla oluşturuldu");
        
        setRoleName("");
        setPermissions({
          can_add_company: false,
          can_add_user: false,
          can_assign_device: false,
          can_view_data: true,
          can_view_log: false,
          can_manage_iot: false
        });
        
        
        setTimeout(() => {
          router.push("/dashboard/roles");
        }, 2000);
      } else {
        setError(data.message || "Rol oluşturulurken bir hata oluştu");
      }
    } catch (err) {
      setError("Sunucu hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Yeni Rol Oluştur</h2>
        <Link href="/dashboard/roles">
          <button className="btn-secondary flex items-center gap-2 px-5 py-2 rounded-lg shadow-md">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
            Roller Listesi
          </button>
        </Link>
      </div>

      <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-md p-6">
        {successMessage && (
          <div className="mb-6 p-4 bg-accent-tertiary/10 text-accent-tertiary border border-accent-tertiary rounded-lg text-sm">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-accent-primary/10 text-accent-primary border border-accent-primary rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="roleName" className="block text-sm font-medium text-text-secondary mb-1">
                Rol Adı*
              </label>
              <input
                id="roleName"
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full p-2 bg-dark-200 border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary"
                required
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-text-secondary mb-3">Yetkiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'can_add_company', label: 'Şirket Ekleyebilir' },
                  { key: 'can_add_user', label: 'Kullanıcı Ekleyebilir' },
                  { key: 'can_assign_device', label: 'Cihaz Atayabilir' },
                  { key: 'can_view_data', label: 'Verileri Görüntüleyebilir' },
                  { key: 'can_view_log', label: 'Logları Görüntüleyebilir' },
                  { key: 'can_manage_iot', label: 'IoT Cihazları Yönetebilir' },
                ].map((perm) => (
                  <div key={perm.key} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={perm.key}
                      checked={permissions[perm.key]}
                      onChange={() => handlePermissionChange(perm.key)}
                      className="h-5 w-5 text-accent-primary bg-dark-200 border-border-primary rounded focus:ring-accent-primary focus:ring-2"
                    />
                    <label htmlFor={perm.key} className="text-text-secondary select-none">
                      {perm.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Link href="/dashboard/roles">
              <button type="button" className="px-4 py-2 rounded-lg border border-border-primary bg-dark-200 text-text-primary hover:bg-dark-300 transition">İptal</button>
            </Link>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg border border-accent-primary bg-accent-primary text-white hover:bg-accent-primary/90 transition">
              {loading ? "Oluşturuluyor..." : "Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 