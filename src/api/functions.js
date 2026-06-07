// Implementações Supabase reais
export { applyAuto12Hours } from '@/lib/applyAuto12Hours';
export { checkCompletedEventsForAutoHours } from '@/lib/checkCompletedEventsForAutoHours';
export { exportReportCsv, exportReportPdf } from '@/lib/exportReport';
export { createBackup, exportUserSnapshot } from '@/lib/userDataBackup';

// Stubs para features não implementadas (Google Calendar, AI, etc.)
const notAvailable = (name) => async (_args) => ({
  data: { success: false, error: `${name}: funcionalidade não disponível nesta versão.` },
});

export const googleAuthStart = notAvailable('googleAuthStart');
export const googleAuthCallback = notAvailable('googleAuthCallback');
export const googleDisconnect = notAvailable('googleDisconnect');
export const googleListCalendars = notAvailable('googleListCalendars');
export const googleSyncNow = notAvailable('googleSyncNow');
export const googleImportEvents = notAvailable('googleImportEvents');
export const generateMonthlyReport = notAvailable('generateMonthlyReport');
export const exportReportXlsx = notAvailable('exportReportXlsx');
export const exportExpenseReport = notAvailable('exportExpenseReport');
export const generateNotifications = notAvailable('generateNotifications');
export const generateAdvancedStats = notAvailable('generateAdvancedStats');
export const getMyEvents = notAvailable('getMyEvents');
export const getMyClients = notAvailable('getMyClients');
export const createMyEvent = notAvailable('createMyEvent');
export const createMyClient = notAvailable('createMyClient');
export const getMyExpenses = notAvailable('getMyExpenses');
export const generateRecurringEvents = notAvailable('generateRecurringEvents');
export const sendPushNotification = notAvailable('sendPushNotification');
export const scheduleNotifications = notAvailable('scheduleNotifications');
export const seedMyDemoData = notAvailable('seedMyDemoData');
export const ping = notAvailable('ping');
export const restoreFromBackup = notAvailable('restoreFromBackup');
export const extractExpenseData = notAvailable('extractExpenseData');
export const createMyDailyWork = notAvailable('createMyDailyWork');
export const createMyExpense = notAvailable('createMyExpense');
export const ownerIdRepairForCurrentUser = notAvailable('ownerIdRepairForCurrentUser');
export const emergencySnapshotAllMyData = notAvailable('emergencySnapshotAllMyData');
export const deduplicateMyData = notAvailable('deduplicateMyData');
export const diagnoseAndFixUserData = notAvailable('diagnoseAndFixUserData');
export const generateComprehensiveReport = notAvailable('generateComprehensiveReport');
export const getDashboardData = notAvailable('getDashboardData');
export const saveEventDefaults = notAvailable('saveEventDefaults');
export const getEventDefaults = notAvailable('getEventDefaults');
export const getOrCreateMentorConfig = notAvailable('getOrCreateMentorConfig');
export const manageMentorSources = notAvailable('manageMentorSources');
export const getMentorConfig = notAvailable('getMentorConfig');
export const updateMentorSources = notAvailable('updateMentorSources');
export const getFinancialInsights = notAvailable('getFinancialInsights');
export const analyzeClientPerformance = notAvailable('analyzeClientPerformance');
