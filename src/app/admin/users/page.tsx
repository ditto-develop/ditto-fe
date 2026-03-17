'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../adminApi';

interface Role {
  code: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  nickname: string;
  phoneNumber: string;
  gender: string;
  age: number;
  joinedAt: string;
  leftAt?: string;
  role: Role;
}

interface ApiResponse {
  success: boolean;
  data: User[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchUsers = () => {
    adminFetch<ApiResponse>('/users')
      .then((res) => setUsers(res.data))
      .catch((e: Error) => setError(e.message));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string, nickname: string) => {
    if (!confirm(`"${nickname}" 사용자를 삭제하시겠습니까?`)) return;
    setDeleting(id);
    try {
      await adminFetch(`/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  const roleColor: Record<string, string> = {
    SUPER_ADMIN: '#7c6bff',
    ADMIN: '#3b82f6',
    USER: '#10b981',
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700 }}>사용자 관리</h1>
      <p style={{ color: '#666', margin: '0 0 24px' }}>
        전체 사용자: <strong>{users.length}</strong>명
      </p>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
              {['닉네임', '이름', '전화번호', '성별', '나이', '역할', '가입일', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                style={{
                  borderBottom: '1px solid #f3f4f6',
                  opacity: user.leftAt ? 0.5 : 1,
                }}
              >
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                  {user.nickname}
                  {user.leftAt && <span style={{ marginLeft: 6, fontSize: 11, color: '#9ca3af' }}>(탈퇴)</span>}
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{user.name}</td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{user.phoneNumber}</td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{user.gender}</td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{user.age}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: `${roleColor[user.role.code] ?? '#6b7280'}20`,
                      color: roleColor[user.role.code] ?? '#6b7280',
                    }}
                  >
                    {user.role.code}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                  {new Date(user.joinedAt).toLocaleDateString('ko-KR')}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    onClick={() => handleDelete(user.id, user.nickname)}
                    disabled={deleting === user.id}
                    style={{
                      padding: '4px 12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    {deleting === user.id ? '삭제 중...' : '삭제'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !error && (
              <tr>
                <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
                  사용자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
