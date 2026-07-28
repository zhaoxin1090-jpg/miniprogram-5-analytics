import { callFunction } from './cloudbaseClient.js';

export function fetchCohortSummary(campId) {
  return callFunction('analyticsCohortSummary', { camp_id: campId });
}

export function fetchCamps() {
  return callFunction('analyticsCamps', {});
}

export function fetchCohortUsers(campId, page = 0, pageSize = 20) {
  return callFunction('analyticsCohortUsers', {
    camp_id: campId,
    page,
    page_size: pageSize,
  });
}

export function fetchCohortUserTasks(campId, enrollmentId) {
  return callFunction('analyticsCohortUserTasks', {
    camp_id: campId,
    enrollment_id: enrollmentId,
  });
}

export function fetchUserEvents(campId, enrollmentId, days = 30) {
  return callFunction('analyticsUserEvents', {
    camp_id: campId,
    enrollment_id: enrollmentId,
    days,
  });
}

export function fetchTaskAnalysis(campId, taskType = 'all', days = 30) {
  const request = {
    camp_id: campId,
    days,
  };
  if (taskType !== 'all') request.task_type = taskType;
  return callFunction('analyticsTaskAnalysis', request);
}

export function fetchTaskSubmissions(campId, taskId, taskType, page = 0, pageSize = 20) {
  return callFunction('analyticsTaskSubmissions', {
    camp_id: campId,
    task_id: taskId,
    task_type: taskType,
    page,
    page_size: pageSize,
  });
}
