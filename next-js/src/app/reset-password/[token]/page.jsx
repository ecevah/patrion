"use client"
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token;
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('http://localhost:3232/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (data.status) {
        setMessage(data.message);
        setTimeout(() => router.push('/'), 2000);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-center mb-4">
          <Image src="/images/patrion-logo.png" alt="Patrion Logo" width={180} height={60} priority />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800">Şifre Sıfırla</h2>
        <form className="space-y-4" onSubmit={handleReset}>
          <div>
            <label className="block text-gray-700">Yeni Şifre</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
          </div>
          {message && <div className="text-green-600 text-sm">{message}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            disabled={loading || !token}
          >
            {loading ? 'Şifre Güncelleniyor...' : 'Şifreyi Sıfırla'}
          </button>
        </form>
      </div>
    </div>
  );
} 