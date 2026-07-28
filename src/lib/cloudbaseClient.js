import cloudbase from '@cloudbase/js-sdk';

const envId = import.meta.env.VITE_TCB_ENV_ID || 'cloud1-d9grcmy66e93364b0';
const region = import.meta.env.VITE_TCB_REGION || 'ap-shanghai';

let appInstance;
let authReady;

function getApp() {
  if (!appInstance) {
    appInstance = cloudbase.init({
      env: envId,
      region,
    });
  }
  return appInstance;
}

async function ensureAuth() {
  if (!authReady) {
    const app = getApp();
    const auth = app.auth({ persistence: 'local' });
    authReady = auth.getSession().then(async (sessionResult) => {
      if (sessionResult?.data?.session) return true;
      const loginResult = await auth.signInAnonymously();
      if (loginResult?.error) {
        throw new Error(loginResult.error.message || '后台登录失败');
      }
      return true;
    });
  }
  return authReady;
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
