import { base44 } from './base44Client';


export const googleAuthStart = base44.functions.googleAuthStart;

export const googleAuthCallback = base44.functions.googleAuthCallback;

export const googleDisconnect = base44.functions.googleDisconnect;

export const googleListCalendars = base44.functions.googleListCalendars;

export const googleSyncNow = base44.functions.googleSyncNow;

export const generateMonthlyReport = base44.functions.generateMonthlyReport;

export const exportReportCsv = base44.functions.exportReportCsv;

export const exportReportXlsx = base44.functions.exportReportXlsx;

export const exportReportPdf = base44.functions.exportReportPdf;

export const exportExpenseReport = base44.functions.exportExpenseReport;

export const generateNotifications = base44.functions.generateNotifications;

export const createBackup = base44.functions.createBackup;

export const generateAdvancedStats = base44.functions.generateAdvancedStats;

export const googleImportEvents = base44.functions.googleImportEvents;

export const getMyEvents = base44.functions.getMyEvents;

export const getMyClients = base44.functions.getMyClients;

export const createMyEvent = base44.functions.createMyEvent;

export const createMyClient = base44.functions.createMyClient;

export const getMyExpenses = base44.functions.getMyExpenses;

export const generateRecurringEvents = base44.functions.generateRecurringEvents;

export const sendPushNotification = base44.functions.sendPushNotification;

export const scheduleNotifications = base44.functions.scheduleNotifications;

export const seedMyDemoData = base44.functions.seedMyDemoData;

export const ping = base44.functions.ping;

export const restoreFromBackup = base44.functions.restoreFromBackup;

export const exportUserSnapshot = base44.functions.exportUserSnapshot;

export const extractExpenseData = base44.functions.extractExpenseData;

export const createMyDailyWork = base44.functions.createMyDailyWork;

export const createMyExpense = base44.functions.createMyExpense;

export const ownerIdRepairForCurrentUser = base44.functions.ownerIdRepairForCurrentUser;

export const emergencySnapshotAllMyData = base44.functions.emergencySnapshotAllMyData;

export const deduplicateMyData = base44.functions.deduplicateMyData;

export const diagnoseAndFixUserData = base44.functions.diagnoseAndFixUserData;

export const generateComprehensiveReport = base44.functions.generateComprehensiveReport;

export const getDashboardData = base44.functions.getDashboardData;

export { applyAuto12Hours } from '@/lib/applyAuto12Hours';

export { checkCompletedEventsForAutoHours } from '@/lib/checkCompletedEventsForAutoHours';

export const saveEventDefaults = base44.functions.saveEventDefaults;

export const getEventDefaults = base44.functions.getEventDefaults;

export const getOrCreateMentorConfig = base44.functions.getOrCreateMentorConfig;

export const manageMentorSources = base44.functions.manageMentorSources;

export const getMentorConfig = base44.functions.getMentorConfig;

export const updateMentorSources = base44.functions.updateMentorSources;

export const getFinancialInsights = base44.functions.getFinancialInsights;

export const analyzeClientPerformance = base44.functions.analyzeClientPerformance;

