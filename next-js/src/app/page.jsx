'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3232/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.status) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('username', data.data.username);
        localStorage.setItem('email', data.data.email);
        localStorage.setItem('role', data.data.role);
        router.push('/dashboard');
      } else {
        setError(data.message || 'Giriş başarısız');
      }
    } catch (err) {
      setError('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card-primary border border-border-primary rounded-2xl shadow-dark-xl backdrop-blur-md">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Image src="/images/patrion-logo.png" alt="Patrion Logo" width={180} height={60} priority className="filter brightness-150" />
            <div className="absolute -bottom-2 w-full flex justify-center">
              <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-accent-primary to-transparent"></div>
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-text-primary tracking-tight">Kurumsal Giriş</h2>
        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="block text-text-primary text-sm font-medium">E-posta</label>
            <div className="relative">
              <input
                type="email"
                className="pr-12 pl-4 w-full py-2.5 bg-dark-50 border border-border-primary rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-base"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@sirket.com"
                autoComplete="username"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-text-tertiary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-text-primary text-sm font-medium">Şifre</label>
            <div className="relative">
              <input
                type="password"
                className="pr-12 pl-4 w-full py-2.5 bg-dark-50 border border-border-primary rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-base"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-text-tertiary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          {error && (
            <div className="text-accent-primary text-sm bg-dark-300 p-3 rounded-lg border border-accent-primary border-opacity-30">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}
          <button
            type="submit"
            className="btn-primary w-full py-2.5 font-medium text-base shadow-lg"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Giriş Yapılıyor...
              </div>
            ) : 'Giriş Yap'}
          </button>
        </form>
        <div className="flex flex-col md:flex-row md:justify-between items-center gap-2 mt-2">
          <a
            href="/forgot-password"
            className="link-accent text-sm inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            Şifremi Unuttum
          </a>
          <span className="text-xs text-text-tertiary mt-2 md:mt-0">© 2024 Patrion IoT Platform</span>
        </div>
      </div>
    </div>
  );
} 