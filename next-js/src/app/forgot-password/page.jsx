"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('http://localhost:3232/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.status) {
        setMessage(data.message);
      } else {
        setError(data.message || 'Bir hata oluştu.');
      }
    } catch (err) {
      setError('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-dark-100 border border-border-primary rounded-2xl shadow-md flex flex-col">
        <div className="flex flex-col items-center mb-2">
          <div className="rounded-full bg-dark-200 p-3 mb-2">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="6"/><path d="M8 8h8v8H8z"/></svg>
          </div>
          <div className="h-0.5 w-20 bg-gradient-to-r from-transparent via-accent-primary to-transparent mb-2"></div>
        </div>
        <h2 className="text-2xl font-bold text-center text-text-primary">Şifremi Unuttum</h2>
        <p className="text-text-secondary text-center text-sm mb-2">
          Şifrenizi sıfırlamak için kayıtlı e-posta adresinizi girin.
        </p>
        <form className="space-y-5" onSubmit={handleForgot}>
          <div className="space-y-2">
            <label className="block text-text-primary text-sm font-medium">E-posta</label>
            <div className="relative">
              <input
                type="email"
                className="pl-4 w-full py-2.5 bg-dark-200 border border-border-primary rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-base"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@sirket.com"
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
          {message && (
            <div className="text-accent-tertiary text-sm bg-dark-200 p-3 rounded-lg border border-accent-tertiary border-opacity-30">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {message}
              </div>
            </div>
          )}
          {error && (
            <div className="text-accent-primary text-sm bg-dark-200 p-3 rounded-lg border border-accent-primary border-opacity-30">
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
            className="btn-primary w-full py-2.5 font-medium"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Gönderiliyor...
              </div>
            ) : 'Şifre Sıfırlama Maili Gönder'}
          </button>
        </form>
        <div className="text-center mt-4">
          <Link href="/" className="link-accent text-sm inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Giriş Ekranına Dön
          </Link>
        </div>
      </div>
    </div>
  );
} 