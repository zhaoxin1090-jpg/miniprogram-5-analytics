import cloudbase from '@cloudbase/js-sdk';

const envId = import.meta.env.VITE_TCB_ENV_ID || 'cloud1-d9grcmy66e93364b0';
const region = import.meta.env.VITE_TCB_REGION || 'ap-shanghai';

let appInstance;

function getApp() {
  if (!appInstance) {
    appInstance = cloudbase.init({
      env: envId,
      region,
    });
  }
  return appInstance;
}

function getAuth() {
  return getApp().auth({ persistence: 'local' });
}

function isAnonymousSession(session) {
  const user = session?.user || {};
  return Boolean(user.is_anonymous || user.isAnonymous || user.user_metadata?.is_anonymous);
}

export async function getCurrentSession() {
  const auth = getAuth();
  const { data, error } = await auth.getSession();
  if (error) throw new Error(error.message || '登录状态读取失败');
  const session = data?.session || null;
  if (!session || isAnonymousSession(session)) return null;
  return session;
}

export async function signInWithPassword(username, password) {
  const auth = getAuth();
  const { data, error } = await auth.signInWithPassword({ username, password });
  if (error) throw new Error(error.message || '账号或密码错误');
  if (!data?.session) throw new Error('登录失败，请稍后重试');
  return data.session;
}

export async function signOut() {
  const auth = getAuth();
  const { error } = await auth.signOut();
  if (error) throw new Error(error.message || '退出登录失败');
}

async function ensureAuth() {
  const session = await getCurrentSession();
  if (!session) throw new Error('请先登录数据后台');
  return true;
}

export async function callFunction(name, data) {
  await ensureAuth();
  const app = getApp();
  const result = await app.callFunction({ name, data });
  const payload = result?.result;
  if (!payload) throw new Error('云函数返回为空');
  if (payload.success === false) {
    throw new Error(payload.message || payload.code || '数据加载失败');
  }
  return payload;
}
