// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { ToastProvider } from '@/components/ui';

import { Sidebar } from '@/components/Sidebar';
import CohortAnalytics from '@/pages/cohortAnalytics';

// 页面路由映射
const pageComponents = {
  cohortAnalytics: CohortAnalytics
};
export default function App({
  $w
}) {
  const [currentPage, setCurrentPage] = React.useState('cohortAnalytics');
  const [pageParams, setPageParams] = React.useState({});
  const navigateTo = React.useCallback(({
    pageId,
    params = {}
  }) => {
    setCurrentPage(pageId);
    setPageParams(params);
  }, []);
  const navigateBack = React.useCallback(() => {
    // 返回上一页逻辑
  }, []);
  const enhancedW = React.useMemo(() => ({
    ...$w,
    utils: {
      ...$w?.utils,
      navigateTo,
      navigateBack
    },
    page: {
      dataset: {
        params: pageParams
      }
    }
  }), [$w, navigateTo, navigateBack, pageParams]);
  const PageComponent = pageComponents[currentPage];
  if (!PageComponent) {
    return <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">页面未找到</h2>
          <p className="text-gray-500 mt-2">请求的页面 "{currentPage}" 不存在</p>
        </div>
      </div>;
  }
  return <ToastProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar currentPage={currentPage} onNavigate={navigateTo} />
        <main className="flex-1 overflow-auto">
          <PageComponent $w={enhancedW} />
        </main>
      </div>
    </ToastProvider>;
}