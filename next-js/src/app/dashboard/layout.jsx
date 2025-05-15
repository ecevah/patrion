"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function DashboardLayout({ children }) {
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("user"); // Default to lowest permission
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Web görünümünde sidebar varsayılan olarak kapalı, hover ile açılacak
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      } else {
        // Mobil görünümde kapalı başlasın, tuşla açılacak
        setSidebarOpen(false);
      }
    }
    
    const token = localStorage.getItem("token");
    const usernameFromStorage = localStorage.getItem("username") || "";
    const roleFromStorage = localStorage.getItem("role") || "user";
    
    if (!token) {
      router.push("/");
      return;
    }
    
    setUsername(usernameFromStorage);
    setUserRole(roleFromStorage);
    
    // Rol bazlı erişim kontrolü
    if (userRole === "User") {
      // Kullanıcı ana sayfa ve cihaz detay sayfasında değilse ana sayfaya yönlendir
      if (!pathname.startsWith("/dashboard/device/") && pathname !== "/dashboard") {
        router.push("/dashboard");
      }
    } else if (userRole === "Company Admin") {
      // Şirket yöneticisi şirketler sayfasına erişemez
      if (pathname.startsWith("/dashboard/companies")) {
        router.push("/dashboard");
      }
    }
  }, [router, pathname, userRole]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Rol bazlı filtreli navigasyon öğeleri
  const getNavItems = () => {
    const allNavItems = [
      { 
        name: "Ana Sayfa", 
        path: "/dashboard", 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        roles: ["System Admin", "Company Admin", "User"] 
      },
      { 
        name: "Cihazlar", 
        path: "/dashboard/devices", 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        ),
        roles: ["System Admin", "Company Admin"] 
      },
      { 
        name: "Kullanıcılar", 
        path: "/dashboard/users", 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ), 
        roles: ["System Admin", "Company Admin"] 
      },
      { 
        name: "Şirketler", 
        path: "/dashboard/companies", 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ), 
        roles: ["System Admin"] 
      },
      { 
        name: "Roller", 
        path: "/dashboard/roles", 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        ), 
        roles: ["System Admin", "Company Admin"] 
      },
      { 
        name: "Erişim Kayıtları", 
        path: "/dashboard/logs", 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ), 
        roles: ["System Admin", "Company Admin"] 
      },
      {
        name: "Cihaz Erişimlerim",
        path: "/dashboard/user-device-access",
        icon: (
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-primary h-5 w-5">
            <path d="M12 4v16m8-8H4"/>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          </svg>
        ),
        roles: ["System Admin", "Company Admin"]
      },
    ];

    // Kullanıcı rolüne göre filtrele
    return allNavItems.filter(item => item.roles.includes(userRole));
  };

  const navItems = getNavItems();

  return (
    <div className="flex min-h-screen bg-dark-200">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Sidebar - hover ile açılır kapanır */}
      <div 
        className={`fixed md:relative bg-dark-100 border-r border-border-primary shadow-dark-md transition-all duration-300 h-screen z-30 flex flex-col
          ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'} 
          md:hover:w-64 md:group`}
        onMouseEnter={() => window.innerWidth >= 768 && setSidebarOpen(true)}
        onMouseLeave={() => window.innerWidth >= 768 && setSidebarOpen(false)}
      >
        {/* Logo area */}
        <div className="flex flex-col items-center py-6 px-4 border-b border-border-primary relative">
          <Link href="/dashboard" className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center bg-dark-300 rounded-lg mb-2">
              <Image src="/images/patrion-logo.png" alt="Patrion Logo" width={36} height={36} priority className="filter brightness-150" />
            </div>
            
            <div className={`text-center transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}>
           
              <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-accent-primary to-transparent mt-1"></div>
            </div>
          </Link>
          
          {/* Mobilde görünecek kapatma butonu */}
          <button 
            onClick={toggleSidebar}
            className="md:hidden absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-dark-50 hover:bg-dark-300 p-1.5 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Navigasyon - hover ve grup stilleriyle */}
        <div className="flex-grow overflow-y-auto py-6">
          <div className="flex flex-col items-center space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`flex w-5/6 transition-all duration-200
                    ${isSidebarOpen ? 'justify-start px-5' : 'justify-center px-0 md:group-hover:justify-start md:group-hover:px-5'} 
                    py-3 rounded-lg ${
                    isActive 
                      ? 'bg-dark-300 text-accent-primary' 
                      : 'text-text-secondary hover:bg-dark-300 hover:text-text-primary'
                  }`}>
                  
                  <div className="flex items-center">
                    <div className={isActive ? 'text-accent-primary' : 'text-text-secondary'}>
                      {item.icon}
                    </div>
                    <span className={`ml-3 text-sm font-medium transition-opacity duration-200 
                      ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100 hidden md:group-hover:inline'}`}>
                      {item.name}
                    </span>
                  </div>
                  
                  {isActive && !isSidebarOpen && !window?.innerWidth < 768 && (
                    <div className="absolute left-0 w-1 h-5 bg-accent-primary rounded-r-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* User profile in sidebar - altta sabit */}
        <div className="p-4 border-t border-border-primary mt-auto">
          <div className="flex flex-col items-center space-y-3">
            <div className={`flex flex-col items-center transition-opacity duration-200 
              ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden md:group-hover:flex md:group-hover:opacity-100'}`}>
              <div className="text-sm font-medium text-text-primary truncate">{username}</div>
              <div className="text-xs text-text-tertiary">
                {userRole === "System Admin" ? "Sistem Yöneticisi" : userRole === "Company Admin" ? "Şirket Yöneticisi" : "Kullanıcı"}
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 w-full text-sm text-accent-primary hover:text-accent-secondary flex items-center justify-center py-2 px-4 border border-border-primary rounded-lg hover:bg-dark-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Çıkış Yap
              </button>
            </div>
            {/* Kapalı durumda sadece çıkış ikonu */}
            <button
              onClick={handleLogout}
              className={`text-accent-primary hover:text-accent-secondary transition-opacity duration-200
                ${isSidebarOpen ? 'hidden' : 'md:block md:group-hover:hidden'}`}
              title="Çıkış Yap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300`}>
        {/* Mobil için basitleştirilmiş header */}
        <header className="bg-dark-100 border-b border-border-primary sticky top-0 z-10 md:hidden">
          <div className="px-4">
            <div className="flex justify-between items-center h-16">
              <button 
                onClick={toggleSidebar}
                className="text-text-secondary hover:text-text-primary p-2 rounded-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-dark-300 rounded-lg flex items-center justify-center">
                  <Image src="/images/patrion-logo.png" alt="Patrion" width={20} height={20} className="filter brightness-150" />
                </div>
                <span className="font-medium text-accent-primary">Patrion</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-gradient-to-r from-accent-primary to-accent-primary/80 text-white text-xs font-medium rounded-lg"
              >
                Çıkış
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>

      </div>
    </div>
  );
} 