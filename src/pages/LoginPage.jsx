import React from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { signInWithPassword } from '../lib/cloudbaseClient.js';

export function LoginPage({ onLogin }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const account = username.trim();
    if (!account || !password) {
      setError('请输入账号和密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const session = await signInWithPassword(account, password);
      onLogin(session);
    } catch (err) {
      setError(err.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-intro">
        <div className="brand-mark login-mark">觉</div>
        <p className="login-kicker">觉行Lab 数据后台</p>
        <h1 className="login-title">训练营完成率分析系统</h1>
        <p className="login-copy">
          仅供运营管理员查看营期完成情况、学员任务进度和学习行为明细。
        </p>
        <div className="login-security">
          <ShieldCheck size={18} />
          <span>账号密码登录后才可访问分析云函数</span>
        </div>
      </section>

      <form className="login-panel" onSubmit={handleSubmit}>
        <div className="login-panel-header">
          <LockKeyhole size={22} />
          <div>
            <h2>管理员登录</h2>
            <p>使用 CloudBase 账号密码身份登录</p>
          </div>
        </div>

        <label className="form-field">
          <span>账号</span>
          <input
            type="text"
            value={username}
            autoComplete="username"
            placeholder="请输入管理员账号"
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        <label className="form-field">
          <span>密码</span>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            placeholder="请输入密码"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error ? <div className="form-error">{error}</div> : null}

        <button className="primary-button login-button" type="submit" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </main>
  );
}
