"use client";
import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

export default function DeviceDetailPage({ params }) {
  // Unwrap params with React.use()
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const router = useRouter();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveData, setLiveData] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const wsRef = useRef(null);

  // Cihaz bilgilerini getir
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    fetch(`http://localhost:3232/device/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) setDevice(data.data);
        else setError(data.message || "Cihaz detayı alınamadı");
      })
      .catch(() => setError("Sunucu hatası"))
      .finally(() => setLoading(false));
  }, [id, router]);

  // WebSocket bağlantısı ve veri işleme
  useEffect(() => {
    if (!device) return;
    
    const token = localStorage.getItem("token");
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
            
            // Topic eşleştirme: 10:20:30/data -> 10:20:30
            const topicKey = data.topic.split('/')[0];
            
            // MAC veya mqtt_topic'in başlangıcı ile eşleşiyorsa göster
            if (device.mac === topicKey || device.mqtt_topic.startsWith(topicKey)) {
              setLiveData({
                timestamp: payloadObj.timestamp,
                temperature: Number(payloadObj.temperature),
                humidity: Number(payloadObj.humidity),
                topic: data.topic
              });
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
  }, [device]);

  // Geçmiş verileri getir
  useEffect(() => {
    if (!device) return;
    
    fetchHistoryData();
  }, [device, timeRange, currentPage, itemsPerPage]);

  const fetchHistoryData = () => {
    if (!device) return;
    
    const token = localStorage.getItem("token");
    setHistoryLoading(true);
    
    fetch(`http://localhost:3032/device/check-mac/${device.mac}?range=${timeRange}&page=${currentPage}&limit=${itemsPerPage}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          // Verileri düzenle - timestamp, temperature, humidity
          const processedData = processHistoryData(data.data);
          setHistory(processedData);
          
          // Pagination bilgilerini güncelle
          if (data.pagination) {
            setTotalPages(data.pagination.total_page);
            setTotalItems(data.pagination.total_item);
          }
        }
      })
      .catch(err => {
        console.error("History fetch error:", err);
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  };
  
  // Geçmiş verileri düzenler ve gruplar
  const processHistoryData = (data) => {
    const groupedByTime = {};
    
    data.forEach(item => {
      const time = item._time;
      
      if (!groupedByTime[time]) {
        groupedByTime[time] = {
          time: time,
          timestamp: null,
          temperature: null,
          humidity: null
        };
      }
      
      if (item._field === 'temperature') {
        groupedByTime[time].temperature = item._value;
      } else if (item._field === 'humidity') {
        groupedByTime[time].humidity = item._value;
      } else if (item._field === 'timestamp') {
        groupedByTime[time].timestamp = item._value;
      }
    });
    
    return Object.values(groupedByTime);
  };

  // Sayfa değiştirme fonksiyonları
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

  if (loading) return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  if (error) return <div className="text-red-600 text-center p-10">{error}</div>;
  if (!device) return null;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Üst başlık ve geri */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="rounded-full bg-dark-200 p-2 hover:bg-dark-300 transition-colors">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <h2 className="text-2xl font-bold text-text-primary">Cihaz Detayı</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">ID:</span>
          <span className="font-mono text-xs text-text-secondary">{device.id}</span>
        </div>
      </div>

      {/* Cihaz kartı */}
      <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-md p-6 mb-8 flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center md:items-start gap-4 min-w-[120px]">
          <div className="rounded-full bg-dark-200 p-4 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div className="h-0.5 w-20 bg-gradient-to-r from-transparent via-accent-primary to-transparent"></div>
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">{device.name}</h1>
            <p className="text-text-tertiary text-sm">{device.company?.name || 'Şirket yok'}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <div className="text-xs text-text-tertiary">MAC: <span className="font-mono text-text-secondary">{device.mac}</span></div>
              <div className="text-xs text-text-tertiary">Topic: <span className="font-mono text-accent-tertiary">{device.mqtt_topic}</span></div>
              <div className="text-xs text-text-tertiary">Oluşturulma: <span className="text-text-secondary">{new Date(device.create_at).toLocaleString()}</span></div>
            </div>
            {liveData && (
              <div className="flex flex-1 gap-3 items-center justify-end">
                <div className="flex flex-col items-center bg-dark-200 rounded-xl px-6 py-4 min-w-[100px]">
                  <span className="text-xs text-text-tertiary mb-1">Sıcaklık</span>
                  <span className="text-2xl font-bold text-accent-primary">{liveData.temperature}°C</span>
                </div>
                <div className="flex flex-col items-center bg-dark-200 rounded-xl px-6 py-4 min-w-[100px]">
                  <span className="text-xs text-text-tertiary mb-1">Nem</span>
                  <span className="text-2xl font-bold text-accent-tertiary">{liveData.humidity}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Geçmiş veriler */}
      <div className="bg-dark-100 border border-border-primary rounded-2xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
          <h2 className="text-lg font-bold text-text-primary">Geçmiş Veriler</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '1 Saat', value: '1h' },
              { label: '6 Saat', value: '6h' },
              { label: '1 Gün', value: '1d' },
              { label: '1 Hafta', value: '1w' },
              { label: 'Tüm Zamanlar', value: 'all' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setTimeRange(opt.value)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition font-medium ${timeRange === opt.value ? 'bg-accent-primary text-white border-accent-primary' : 'bg-dark-200 text-text-secondary border-border-primary hover:bg-dark-300'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {/* Grafik */}
        {history.length > 0 && (
          <div className="w-full h-64 mb-8 bg-dark-200 rounded-xl flex items-center justify-center p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.map(item => ({
                ...item,
                timeLabel: new Date(item.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
              }))} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#232336" strokeDasharray="3 3" />
                <XAxis dataKey="timeLabel" stroke="#A9A9B2" fontSize={12} tick={{ fill: '#A9A9B2' }} />
                <YAxis yAxisId="left" stroke="#ff5169" fontSize={12} tick={{ fill: '#ff5169' }} width={40} domain={['auto', 'auto']} />
                <YAxis yAxisId="right" orientation="right" stroke="#10B981" fontSize={12} tick={{ fill: '#10B981' }} width={40} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#232336', border: '1px solid #363646', color: '#E9E9EC', fontSize: 13 }} labelStyle={{ color: '#EC4899' }} />
                <Legend wrapperStyle={{ color: '#E9E9EC', fontSize: 13 }} />
                <Line yAxisId="left" type="monotone" dataKey="temperature" name="Sıcaklık (°C)" stroke="#ff5169" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="humidity" name="Nem (%)" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {historyLoading ? (
          <div className="text-center py-8 text-text-tertiary">Veriler yükleniyor...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary">Bu zaman aralığında veri bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-dark-200 text-text-tertiary">
                  <th className="px-4 py-2 text-left font-semibold">Tarih/Saat</th>
                  <th className="px-4 py-2 text-left font-semibold">Sıcaklık (°C)</th>
                  <th className="px-4 py-2 text-left font-semibold">Nem (%)</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-dark-100" : "bg-dark-200"}>
                    <td className="px-4 py-2 whitespace-nowrap text-text-secondary">{new Date(item.time).toLocaleString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap font-medium text-accent-primary">{item.temperature}</td>
                    <td className="px-4 py-2 whitespace-nowrap font-medium text-accent-tertiary">{item.humidity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    </div>
  );
}