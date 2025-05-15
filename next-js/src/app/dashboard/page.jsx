"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function DashboardPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deviceLiveData, setDeviceLiveData] = useState({});
  const [viewMode, setViewMode] = useState("grid"); // "grid" veya "list" görünüm modu
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name"); // "name", "company", "lastUpdate"
  const wsRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    fetch("http://localhost:3232/device/authorized-devices", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) setDevices(data.data);
        else setError(data.message || "Cihazlar alınamadı");
      })
      .catch(() => setError("Sunucu hatası"))
      .finally(() => setLoading(false));

    // WebSocket otomatik bağlan
    let ws;
    if (typeof window !== 'undefined') {
      ws = new window.WebSocket("ws://localhost:8080");
      wsRef.current = ws;
      ws.onopen = () => {
        ws.send(JSON.stringify({ token }));
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.topic && data.payload) {
            let payloadObj = {};
            try { 
              payloadObj = JSON.parse(data.payload); 
            } catch (e) {
              console.log("Payload parse error:", e);
            }
            
            // Topic işleme - gelen topici cihazlarla eşleştir
            const topicKey = data.topic.split('/')[0]; // Örn: "10:20:30/data" -> "10:20:30"
            
            if (payloadObj.temperature && payloadObj.humidity) {
              setDeviceLiveData(prev => ({
                ...prev,
                [topicKey]: {
                  timestamp: payloadObj.timestamp,
                  temperature: Number(payloadObj.temperature),
                  humidity: Number(payloadObj.humidity),
                  topic: data.topic
                }
              }));
            }
          }
        } catch (e) {
          console.log("WS message error:", e);
        }
      };
    }
    return () => {
      if (ws) ws.close();
    };
  }, [router]);

  // Cihaz filtre ve sıralama fonksiyonu
  const getFilteredDevices = () => {
    let filtered = [...devices];
    
    // Arama filtresi
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        device => 
          device.name.toLowerCase().includes(query) || 
          (device.company?.name && device.company.name.toLowerCase().includes(query)) ||
          device.mac.toLowerCase().includes(query) ||
          device.mqtt_topic.toLowerCase().includes(query)
      );
    }
    
    // Sıralama
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "company") {
        return (a.company?.name || "").localeCompare(b.company?.name || "");
      } else if (sortBy === "lastUpdate") {
        // Son güncelleme zamanına göre sırala (varsa)
        const aTopicBase = a.mac || a.mqtt_topic.split('/')[0];
        const bTopicBase = b.mac || b.mqtt_topic.split('/')[0];
        const aTimestamp = deviceLiveData[aTopicBase]?.timestamp || 0;
        const bTimestamp = deviceLiveData[bTopicBase]?.timestamp || 0;
        return bTimestamp - aTimestamp; // Yeniden eskiye
      }
      return 0;
    });
    
    return filtered;
  };

  const filteredDevices = getFilteredDevices();

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[80vh]">
      <div className="animate-spin h-12 w-12 border-4 border-accent-primary border-t-transparent rounded-full mb-4"></div>
      <p className="text-text-primary animate-pulse">Cihazlar yükleniyor...</p>
    </div>
  );
  
  if (error) return (
    <div className="text-accent-primary bg-dark-300 border border-accent-primary border-opacity-30 rounded-lg p-6 text-center m-6">
      <svg className="h-12 w-12 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {error}
    </div>
  );

  // Durum istatistiklerini hesapla
  const stats = {
    total: devices.length,
    online: Object.keys(deviceLiveData).length,
    offline: devices.length - Object.keys(deviceLiveData).length
  };

  return (
    <div>
      {/* Durum ve istatistik kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-dark-500 to-dark-300 rounded-xl p-5 shadow-dark-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-text-secondary text-sm font-medium">Toplam Cihaz</h3>
              <p className="text-3xl font-bold text-text-primary mt-1">{stats.total}</p>
            </div>
            <div className="bg-dark-50/30 rounded-lg p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <div className="bg-dark-50/20 px-3 py-1 rounded-full text-text-secondary text-xs">
              {new Date().toLocaleDateString('tr-TR')}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-dark-500 to-dark-300 rounded-xl p-5 shadow-dark-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-text-secondary text-sm font-medium">Aktif Cihazlar</h3>
              <p className="text-3xl font-bold text-accent-tertiary mt-1">{stats.online}</p>
            </div>
            <div className="bg-dark-50/30 rounded-lg p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-dark-300 rounded-full h-2.5">
              <div className="bg-accent-tertiary h-2.5 rounded-full" style={{ width: `${(stats.online/stats.total)*100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-dark-500 to-dark-300 rounded-xl p-5 shadow-dark-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-text-secondary text-sm font-medium">Çevrimdışı Cihazlar</h3>
              <p className="text-3xl font-bold text-accent-primary mt-1">{stats.offline}</p>
            </div>
            <div className="bg-dark-50/30 rounded-lg p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-dark-300 rounded-full h-2.5">
              <div className="bg-accent-primary h-2.5 rounded-full" style={{ width: `${(stats.offline/stats.total)*100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Kontrol ve filtre alanı */}
      <div className="bg-dark-100 rounded-xl p-4 mb-6 shadow-dark-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="w-full md:w-1/3">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-text-tertiary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cihaz ara..."
                className="pl-10 w-full py-2 bg-dark-50 border border-border-primary rounded-lg text-text-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-dark-50 border border-border-primary rounded-lg text-text-primary py-2 pl-3 pr-10 appearance-none cursor-pointer"
              >
                <option value="name">İsim</option>
                <option value="company">Şirket</option>
                <option value="lastUpdate">Son Güncelleme</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="h-4 w-4 text-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-dark-50 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-accent-primary text-white" : "text-text-secondary hover:text-text-primary"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-accent-primary text-white" : "text-text-secondary hover:text-text-primary"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cihaz listesi */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredDevices.map((device) => {
            const topicBase = device.mac || device.mqtt_topic.split('/')[0];
            const live = deviceLiveData[topicBase];
            const isOnline = !!live;
            return (
              <div
                key={device.id}
                onClick={() => router.push(`/dashboard/device/${device.id}`)}
                className="group cursor-pointer rounded-2xl bg-dark-100 border border-border-primary hover:border-accent-primary/60 shadow-sm hover:shadow-lg transition-all duration-200 p-6 flex flex-col gap-4 min-h-[220px] relative"
              >
                {/* Durum noktası */}
                <span className={`absolute top-5 right-5 w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-accent-tertiary' : 'bg-accent-primary'}`}></span>
                {/* İkon */}
                <div className="flex items-center gap-3 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <div>
                    <div className="text-lg font-semibold text-text-primary leading-tight truncate max-w-[140px]">{device.name}</div>
                    <div className="text-xs text-text-tertiary truncate max-w-[140px]">{device.company?.name || 'Şirket yok'}</div>
                  </div>
                </div>
                {/* MAC ve Topic */}
                <div className="flex flex-col gap-1 mb-2">
                  <div className="text-xs text-text-tertiary">MAC: <span className="font-mono text-text-secondary">{device.mac}</span></div>
                  <div className="text-xs text-text-tertiary">Topic: <span className="font-mono text-accent-tertiary">{device.mqtt_topic}</span></div>
                </div>
                {/* Sensör verileri */}
                <div className="flex gap-3 mt-auto">
                  <div className="flex-1 flex flex-col items-center bg-dark-200 rounded-xl py-3">
                    <span className="text-xs text-text-tertiary mb-1">Sıcaklık</span>
                    <span className="text-xl font-bold tracking-tight flex items-center gap-1">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/></svg>
                      {live ? <span className="text-accent-primary">{live.temperature}°C</span> : <span className="text-text-tertiary">—</span>}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-center bg-dark-200 rounded-xl py-3">
                    <span className="text-xs text-text-tertiary mb-1">Nem</span>
                    <span className="text-xl font-bold tracking-tight flex items-center gap-1">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="7" ry="7"/></svg>
                      {live ? <span className="text-accent-tertiary">{live.humidity}%</span> : <span className="text-text-tertiary">—</span>}
                    </span>
                  </div>
                </div>
                {/* Son güncelleme */}
                {live && (
                  <div className="text-[11px] text-text-tertiary text-right mt-2">{new Date(live.timestamp * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredDevices.map((device) => {
            const topicBase = device.mac || device.mqtt_topic.split('/')[0];
            const live = deviceLiveData[topicBase];
            const isOnline = !!live;
            return (
              <div
                key={device.id}
                onClick={() => router.push(`/dashboard/device/${device.id}`)}
                className="group cursor-pointer rounded-xl bg-dark-100 border border-border-primary hover:border-accent-primary/60 shadow-sm hover:shadow-lg transition-all duration-200 px-5 py-4 flex items-center gap-4"
              >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-accent-tertiary' : 'bg-accent-primary'}`}></span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text-primary truncate">{device.name}</div>
                  <div className="text-xs text-text-tertiary truncate">{device.company?.name || 'Şirket yok'}</div>
                </div>
                <div className="flex flex-col items-end gap-1 min-w-[80px]">
                  <span className="text-xs text-text-tertiary">Sıcaklık</span>
                  <span className="font-semibold text-accent-primary">{live ? `${live.temperature}°C` : '—'}</span>
                </div>
                <div className="flex flex-col items-end gap-1 min-w-[60px]">
                  <span className="text-xs text-text-tertiary">Nem</span>
                  <span className="font-semibold text-accent-tertiary">{live ? `${live.humidity}%` : '—'}</span>
                </div>
                <div className="flex flex-col items-end gap-1 min-w-[60px]">
                  <span className="text-xs text-text-tertiary">Durum</span>
                  <span className={`font-semibold ${isOnline ? 'text-accent-tertiary' : 'text-accent-primary'}`}>{isOnline ? 'Aktif' : 'Pasif'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* No results - şık ve informatif */}
      {filteredDevices.length === 0 && (
        <div className="bg-gradient-to-br from-dark-300 to-dark-200 p-10 rounded-xl text-center border border-border-primary">
          <div className="bg-dark-100 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-3">Sonuç Bulunamadı</h3>
          <p className="text-text-secondary max-w-md mx-auto">
            Arama kriterlerinize uygun cihaz bulunamadı. Lütfen filtreleri değiştirin veya yeni bir arama yapın.
          </p>
          <button 
            onClick={() => {setSearchQuery(''); setSortBy('name');}}
            className="mt-5 bg-dark-100 hover:bg-dark-50 text-accent-primary border border-border-primary rounded-lg px-4 py-2 text-sm transition-colors duration-200"
          >
            Filtreleri Temizle
          </button>
        </div>
      )}
    </div>
  );
} 