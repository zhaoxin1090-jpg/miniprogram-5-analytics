import { callFunction } from './cloudbaseClient.js';

export function fetchCohortSummary(campId, filters = {}) {
  return callFunction('analyticsCohortSummary', { ...filters, camp_id: campId });
}

export function fetchCamps() {
  return callFunction('analyticsCamps', {});
}

export function fetchCohortUsers(campId, page = 0, pageSize = 20, sort = 'asc', enrollmentType = '') {
  return callFunction('analyticsCohortUsers', {
    camp_id: campId,
    page,
    page_size: pageSize,
    sort,
    enrollment_type: enrollmentType,
  });
}

export function exportCohortUsers(campId, sort, enrollmentType = '') {
  return callFunction('analyticsCohortUsers', { action: 'export_roster', camp_id: campId, sort, enrollment_type: enrollmentType });
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

export function fetchTaskAnalysis(campId, filters = {}) {
  return callFunction('analyticsTaskAnalysis', { ...filters, camp_id: campId });
}

export function taskSubmissions(campId, filters, request = {}) {
  return callFunction('analyticsTaskSubmissions', { ...filters, ...request, camp_id: campId });
}

export function archiveOperation(request) {
  return callFunction('analyticsArchives', request);
}

export function exportJobs(request) {
  return callFunction('analyticsExportJobs', request);
}
