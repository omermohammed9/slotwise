export type Locale = 'en' | 'ar';

export type TranslationKey =
  | 'app.language'
  | 'app.language.english'
  | 'app.language.arabic'
  | 'app.theme.light'
  | 'app.theme.dark'
  | 'app.brand.operations'
  | 'app.session.operatorFallback'
  | 'app.session.notSignedIn'
  | 'app.session.signOut'
  | 'nav.ownerHome'
  | 'nav.users'
  | 'nav.audit'
  | 'nav.dashboard'
  | 'nav.bookings'
  | 'nav.timeline'
  | 'nav.customers'
  | 'nav.resources'
  | 'nav.settings'
  | 'nav.portal'
  | 'nav.publicPage'
  | 'nav.widget'
  | 'home.eyebrow'
  | 'home.title'
  | 'home.lede'
  | 'home.signIn'
  | 'home.customerPortal'
  | 'home.publicBooking'
  | 'home.bookingTitle'
  | 'home.bookingCopy'
  | 'auth.operatorAccess'
  | 'auth.signInTitle'
  | 'auth.signInLede'
  | 'auth.username'
  | 'auth.password'
  | 'auth.signingIn'
  | 'auth.resetOperatorPassword'
  | 'auth.unreachable'
  | 'auth.forbiddenEyebrow'
  | 'auth.forbiddenTitle'
  | 'auth.forbiddenLede'
  | 'auth.goToPortal'
  | 'auth.operatorInvitation'
  | 'auth.invitationTitle'
  | 'auth.invitationLede'
  | 'auth.invitationAccepted'
  | 'auth.invitationToken'
  | 'auth.newPassword'
  | 'auth.accepting'
  | 'auth.acceptInvitation'
  | 'auth.passwordReset'
  | 'auth.resetRequestTitle'
  | 'auth.resetRequestLede'
  | 'auth.resetRequested'
  | 'auth.enterResetToken'
  | 'auth.sending'
  | 'auth.sendResetToken'
  | 'auth.resetCompleteTitle'
  | 'auth.resetCompleteLede'
  | 'auth.passwordResetComplete'
  | 'auth.resetToken'
  | 'auth.saving'
  | 'auth.resetPassword'
  | 'auth.sessionExpired'
  | 'auth.sessionCheckTitle'
  | 'auth.sessionCheckInitial'
  | 'auth.sessionCheckRevalidate'
  | 'status.pending'
  | 'status.approved'
  | 'status.completed'
  | 'status.cancelled'
  | 'status.no_show'
  | 'status.rejected'
  | 'status.reschedule'
  | 'dashboard.ownerEyebrow'
  | 'dashboard.title'
  | 'dashboard.analyticsFrom'
  | 'dashboard.actions'
  | 'dashboard.refresh'
  | 'dashboard.filters'
  | 'dashboard.from'
  | 'dashboard.to'
  | 'dashboard.resource'
  | 'dashboard.resourcePlaceholder'
  | 'dashboard.loadingAnalytics'
  | 'dashboard.loadingCancellations'
  | 'dashboard.analyticsLoadError'
  | 'dashboard.noAnalytics'
  | 'dashboard.noAnalyticsDescription'
  | 'dashboard.cancellationLoadError'
  | 'dashboard.operationalMetrics'
  | 'dashboard.totalBookings'
  | 'dashboard.pendingReview'
  | 'dashboard.approvalRate'
  | 'dashboard.approvedBookings'
  | 'dashboard.completionRate'
  | 'dashboard.completedBookings'
  | 'dashboard.utilization'
  | 'dashboard.bookedMinutes'
  | 'dashboard.lifecycle'
  | 'dashboard.bookingFunnel'
  | 'dashboard.peaks'
  | 'dashboard.peakBookingTimes'
  | 'dashboard.busiestWeekday'
  | 'dashboard.busiestHour'
  | 'dashboard.notEnoughData'
  | 'dashboard.noPeakSlots'
  | 'dashboard.weekdayLoad'
  | 'dashboard.utilizationByDay'
  | 'dashboard.minutes'
  | 'dashboard.resources'
  | 'dashboard.topResourceLoad'
  | 'dashboard.bookings'
  | 'dashboard.noResourceData'
  | 'dashboard.cancellationHealth'
  | 'dashboard.cancellationInsights'
  | 'dashboard.cancellationMetrics'
  | 'dashboard.cancelled'
  | 'dashboard.cancellationRate'
  | 'dashboard.noShows'
  | 'dashboard.noShowRate'
  | 'dashboard.delivered'
  | 'dashboard.deliveryRate'
  | 'dashboard.cancellations'
  | 'dashboard.reasonPatterns'
  | 'dashboard.topReasons'
  | 'dashboard.noCancellationReasons'
  | 'dashboard.noNoShowReasons'
  | 'dashboard.sessionPosture'
  | 'dashboard.storageBaseline'
  | 'dashboard.storageCopy'
  | 'dashboard.storeDemoToken'
  | 'dashboard.tokenStatus'
  | 'dashboard.tokenStored'
  | 'dashboard.tokenNotStored'
  | 'dashboard.widgetIsolation'
  | 'dashboard.widgetIsolationDescription'
  | 'weekday.Sunday'
  | 'weekday.Monday'
  | 'weekday.Tuesday'
  | 'weekday.Wednesday'
  | 'weekday.Thursday'
  | 'weekday.Friday'
  | 'weekday.Saturday'
  | 'risk.all'
  | 'risk.low'
  | 'risk.medium'
  | 'risk.high'
  | 'risk.label'
  | 'sort.createdAt'
  | 'sort.startDate'
  | 'sort.endDate'
  | 'sort.status'
  | 'sort.updatedAt'
  | 'sort.ascending'
  | 'sort.descending'
  | 'bookings.operations'
  | 'bookings.title'
  | 'bookings.lede'
  | 'bookings.actions'
  | 'bookings.refresh'
  | 'bookings.filters'
  | 'bookings.customer'
  | 'bookings.searchByName'
  | 'bookings.status'
  | 'bookings.allStatuses'
  | 'bookings.risk'
  | 'bookings.sort'
  | 'bookings.currentWorkspace'
  | 'bookings.activeFilters'
  | 'bookings.clearAll'
  | 'bookings.activeFilterList'
  | 'bookings.removeFilter'
  | 'bookings.filterCustomer'
  | 'bookings.filterStatus'
  | 'bookings.filterRisk'
  | 'bookings.filterSort'
  | 'bookings.filterPage'
  | 'bookings.workspaceMemory'
  | 'bookings.savedViews'
  | 'bookings.browserOnly'
  | 'bookings.savedViewsCopy'
  | 'bookings.viewName'
  | 'bookings.viewNamePlaceholder'
  | 'bookings.saveCurrentView'
  | 'bookings.savedViewRequired'
  | 'bookings.savedViewUpdated'
  | 'bookings.savedViewCreated'
  | 'bookings.savedViewStorageUnavailable'
  | 'bookings.savedViewApplied'
  | 'bookings.savedViewRemoved'
  | 'bookings.savedViewList'
  | 'bookings.removeSavedView'
  | 'bookings.savedViewSingular'
  | 'bookings.noSavedViews'
  | 'bookings.records'
  | 'bookings.bookingList'
  | 'bookings.refreshing'
  | 'bookings.total'
  | 'bookings.loading'
  | 'bookings.loadError'
  | 'bookings.empty'
  | 'bookings.emptyDescription'
  | 'bookings.table'
  | 'bookings.date'
  | 'bookings.time'
  | 'bookings.detail'
  | 'bookings.viewDetails'
  | 'bookings.pagination'
  | 'bookings.previousPage'
  | 'bookings.nextPage'
  | 'bookings.pageOf'
  | 'bookings.of'
  | 'bookings.detailEyebrow'
  | 'bookings.loadingBooking'
  | 'bookings.closeDetail'
  | 'bookings.loadingDetail'
  | 'bookings.detailLoadError'
  | 'bookings.notSet'
  | 'bookings.customerContact'
  | 'bookings.schedule'
  | 'bookings.scheduleFromTo'
  | 'bookings.partySize'
  | 'bookings.resource'
  | 'bookings.business'
  | 'bookings.customerId'
  | 'bookings.notes'
  | 'bookings.conflictRisk'
  | 'bookings.riskSignals'
  | 'bookings.lifecycleActions'
  | 'bookings.noLifecycleActions'
  | 'bookings.saving'
  | 'bookings.approve'
  | 'bookings.reject'
  | 'bookings.cancel'
  | 'bookings.complete'
  | 'bookings.noShow'
  | 'bookings.confirmApprove'
  | 'bookings.confirmReject'
  | 'bookings.confirmCancel'
  | 'bookings.confirmComplete'
  | 'bookings.confirmNoShow'
  | 'bookings.confirmReschedule'
  | 'bookings.reschedule'
  | 'bookings.start'
  | 'bookings.end'
  | 'bookings.timeIn'
  | 'bookings.timeOut'
  | 'bookings.reason'
  | 'bookings.optionalAuditNote'
  | 'bookings.checking'
  | 'bookings.findSuggestions'
  | 'bookings.suggestedSlots'
  | 'bookings.rescheduleUnavailable'
  | 'bookings.statusHistory'
  | 'bookings.noStatusHistory'
  | 'bookings.activeSessionRequired'
  | 'bookings.selectionRequired'
  | 'customers.relationships'
  | 'customers.title'
  | 'customers.lede'
  | 'customers.actions'
  | 'customers.refresh'
  | 'customers.filters'
  | 'customers.name'
  | 'customers.searchByName'
  | 'customers.email'
  | 'customers.emailPlaceholder'
  | 'customers.phone'
  | 'customers.phonePlaceholder'
  | 'customers.business'
  | 'customers.allBusinesses'
  | 'customers.create'
  | 'customers.newCustomer'
  | 'customers.createForm'
  | 'customers.selectBusiness'
  | 'customers.firstName'
  | 'customers.lastName'
  | 'customers.notes'
  | 'customers.preferredNotifications'
  | 'customers.createNotifications'
  | 'customers.editNotifications'
  | 'customers.channel.email'
  | 'customers.channel.sms'
  | 'customers.created'
  | 'customers.creating'
  | 'customers.createCustomer'
  | 'customers.directory'
  | 'customers.customerList'
  | 'customers.refreshing'
  | 'customers.shown'
  | 'customers.loading'
  | 'customers.loadError'
  | 'customers.empty'
  | 'customers.emptyDescription'
  | 'customers.unnamed'
  | 'customers.bookings'
  | 'customers.profile'
  | 'customers.profileEyebrow'
  | 'customers.details'
  | 'customers.selectCustomer'
  | 'customers.selectCustomerDescription'
  | 'customers.loadingProfile'
  | 'customers.profileLoadError'
  | 'customers.contact'
  | 'customers.noPhone'
  | 'customers.notSet'
  | 'customers.notTracked'
  | 'customers.customerId'
  | 'customers.updated'
  | 'customers.editProfile'
  | 'customers.edit'
  | 'customers.updatedSuccess'
  | 'customers.saving'
  | 'customers.saveCustomer'
  | 'customers.history'
  | 'customers.bookingHistory'
  | 'customers.bookingHistoryEmpty'
  | 'customers.recentBookings'
  | 'customers.loadingBookingHistory'
  | 'customers.bookingHistoryLoadError'
  | 'customers.selectBeforeLoading'
  | 'customers.signInBeforeCreating'
  | 'customers.selectBeforeSaving'
  | 'timeline.schedule'
  | 'timeline.title'
  | 'timeline.lede'
  | 'timeline.actions'
  | 'timeline.refresh'
  | 'timeline.filters'
  | 'timeline.summary'
  | 'timeline.totalBookings'
  | 'timeline.timelineDays'
  | 'timeline.highRiskBookings'
  | 'timeline.conflictRiskMarkers'
  | 'timeline.bookedTime'
  | 'timeline.scheduledMinutes'
  | 'timeline.activeFilters'
  | 'timeline.filterSummary'
  | 'timeline.backendFeed'
  | 'timeline.bookingFlow'
  | 'timeline.loading'
  | 'timeline.loadError'
  | 'timeline.empty'
  | 'timeline.emptyDescription'
  | 'timeline.bookings'
  | 'timeline.minutesShort'
  | 'timeline.unnamedCustomer'
  | 'timeline.rescheduled';

type TranslationDictionary = Record<TranslationKey, string>;

export const supportedLocales: Array<{ code: Locale; labelKey: TranslationKey; dir: 'ltr' | 'rtl' }> = [
  { code: 'en', labelKey: 'app.language.english', dir: 'ltr' },
  { code: 'ar', labelKey: 'app.language.arabic', dir: 'rtl' },
];

export const defaultLocale: Locale = 'en';

export const translations: Record<Locale, TranslationDictionary> = {
  en: {
    'app.language': 'Language',
    'app.language.english': 'English',
    'app.language.arabic': 'Arabic',
    'app.theme.light': 'Switch to light mode',
    'app.theme.dark': 'Switch to dark mode',
    'app.brand.operations': 'Operations',
    'app.session.operatorFallback': 'Operator',
    'app.session.notSignedIn': 'Not signed in',
    'app.session.signOut': 'Sign out',
    'nav.ownerHome': 'Owner home',
    'nav.users': 'Users',
    'nav.audit': 'Audit',
    'nav.dashboard': 'Dashboard',
    'nav.bookings': 'Bookings',
    'nav.timeline': 'Timeline',
    'nav.customers': 'Customers',
    'nav.resources': 'Resources',
    'nav.settings': 'Settings',
    'nav.portal': 'Portal',
    'nav.publicPage': 'Public page',
    'nav.widget': 'Widget',
    'home.eyebrow': 'Slotwise',
    'home.title': 'Slotwise booking operations',
    'home.lede':
      'A production entry point for operators and customers, with owner setup kept to the CLI and customer access kept through portal magic links.',
    'home.signIn': 'Sign in',
    'home.customerPortal': 'Customer portal',
    'home.publicBooking': 'Public booking',
    'home.bookingTitle': 'Book through a business link',
    'home.bookingCopy': 'Use a known business slug when one has been shared with you.',
    'auth.operatorAccess': 'Operator access',
    'auth.signInTitle': 'Sign in to Slotwise',
    'auth.signInLede':
      'Use your owner, admin, or staff credentials. Slotwise keeps your signed-in session in a secure browser cookie.',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.signingIn': 'Signing in',
    'auth.resetOperatorPassword': 'Reset operator password',
    'auth.unreachable': 'Unable to reach Slotwise.',
    'auth.forbiddenEyebrow': 'Access denied',
    'auth.forbiddenTitle': 'This portal is not available for your role.',
    'auth.forbiddenLede': 'Use the portal assigned to your operator account.',
    'auth.goToPortal': 'Go to my portal',
    'auth.operatorInvitation': 'Operator invitation',
    'auth.invitationTitle': 'Set your Slotwise password',
    'auth.invitationLede': 'Accept your owner-issued invitation and then sign in with your operator username.',
    'auth.invitationAccepted': 'Invitation accepted. You can now sign in.',
    'auth.invitationToken': 'Invitation token',
    'auth.newPassword': 'New password',
    'auth.accepting': 'Accepting',
    'auth.acceptInvitation': 'Accept invitation',
    'auth.passwordReset': 'Password reset',
    'auth.resetRequestTitle': 'Reset operator access',
    'auth.resetRequestLede': 'Enter your operator username. If the account is active, Slotwise will send a reset token.',
    'auth.resetRequested': 'If that operator account is active, a reset message is on the way.',
    'auth.enterResetToken': 'Enter reset token',
    'auth.sending': 'Sending',
    'auth.sendResetToken': 'Send reset token',
    'auth.resetCompleteTitle': 'Create a new password',
    'auth.resetCompleteLede': 'Use the reset token from your operator password reset message.',
    'auth.passwordResetComplete': 'Password reset complete. You can now sign in.',
    'auth.resetToken': 'Reset token',
    'auth.saving': 'Saving',
    'auth.resetPassword': 'Reset password',
    'auth.sessionExpired': 'Your operator session expired. Sign in again to keep working.',
    'auth.sessionCheckTitle': 'Checking your current session',
    'auth.sessionCheckInitial': 'Slotwise is checking for an active browser session before loading the admin workspace.',
    'auth.sessionCheckRevalidate': 'Slotwise is revalidating this browser session before loading the admin workspace.',
    'status.pending': 'Pending',
    'status.approved': 'Approved',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    'status.no_show': 'No-show',
    'status.rejected': 'Rejected',
    'status.reschedule': 'Reschedule',
    'dashboard.ownerEyebrow': 'Owner dashboard',
    'dashboard.title': 'Today at a glance',
    'dashboard.analyticsFrom': 'Dashboard analytics from',
    'dashboard.actions': 'Dashboard actions',
    'dashboard.refresh': 'Refresh dashboard',
    'dashboard.filters': 'Dashboard filters',
    'dashboard.from': 'From',
    'dashboard.to': 'To',
    'dashboard.resource': 'Resource',
    'dashboard.resourcePlaceholder': 'Resource ID',
    'dashboard.loadingAnalytics': 'Loading dashboard analytics',
    'dashboard.loadingCancellations': 'Loading cancellation insights',
    'dashboard.analyticsLoadError': 'Dashboard analytics could not load',
    'dashboard.noAnalytics': 'No dashboard analytics',
    'dashboard.noAnalyticsDescription': 'Adjust the current filters or try a broader reporting range.',
    'dashboard.cancellationLoadError': 'Cancellation insights could not load',
    'dashboard.operationalMetrics': 'Operational metrics',
    'dashboard.totalBookings': 'Total bookings',
    'dashboard.pendingReview': 'pending review',
    'dashboard.approvalRate': 'Approval rate',
    'dashboard.approvedBookings': 'approved bookings',
    'dashboard.completionRate': 'Completion rate',
    'dashboard.completedBookings': 'completed bookings',
    'dashboard.utilization': 'Utilization',
    'dashboard.bookedMinutes': 'booked minutes',
    'dashboard.lifecycle': 'Lifecycle',
    'dashboard.bookingFunnel': 'Booking funnel',
    'dashboard.peaks': 'Peaks',
    'dashboard.peakBookingTimes': 'Peak booking times',
    'dashboard.busiestWeekday': 'Busiest weekday',
    'dashboard.busiestHour': 'Busiest hour',
    'dashboard.notEnoughData': 'Not enough data',
    'dashboard.noPeakSlots': 'No peak time slots in this range.',
    'dashboard.weekdayLoad': 'Weekday load',
    'dashboard.utilizationByDay': 'Utilization by day',
    'dashboard.minutes': 'minutes',
    'dashboard.resources': 'Resources',
    'dashboard.topResourceLoad': 'Top resource load',
    'dashboard.bookings': 'bookings',
    'dashboard.noResourceData': 'No resource utilization data in this range.',
    'dashboard.cancellationHealth': 'Cancellation health',
    'dashboard.cancellationInsights': 'Cancellation and no-show insights',
    'dashboard.cancellationMetrics': 'Cancellation metrics',
    'dashboard.cancelled': 'Cancelled',
    'dashboard.cancellationRate': 'cancellation rate',
    'dashboard.noShows': 'No-shows',
    'dashboard.noShowRate': 'no-show rate',
    'dashboard.delivered': 'Delivered',
    'dashboard.deliveryRate': 'delivery rate',
    'dashboard.cancellations': 'cancellations',
    'dashboard.reasonPatterns': 'Reason patterns',
    'dashboard.topReasons': 'Top reasons',
    'dashboard.noCancellationReasons': 'No cancellation reasons in this range.',
    'dashboard.noNoShowReasons': 'No no-show reasons in this range.',
    'dashboard.sessionPosture': 'Session posture',
    'dashboard.storageBaseline': 'Approved storage baseline',
    'dashboard.storageCopy':
      'Session tokens are held in memory for the first frontend slice. Refreshing the page requires sign-in again, and persistent login remains a later backend cookie-session review.',
    'dashboard.storeDemoToken': 'Store demo memory token',
    'dashboard.tokenStatus': 'Token status',
    'dashboard.tokenStored': 'Stored in memory',
    'dashboard.tokenNotStored': 'Not stored',
    'dashboard.widgetIsolation': 'Public widget isolation',
    'dashboard.widgetIsolationDescription':
      'Third-party embeds will use iframe isolation first, keeping host page styles away from booking flows.',
    'weekday.Sunday': 'Sunday',
    'weekday.Monday': 'Monday',
    'weekday.Tuesday': 'Tuesday',
    'weekday.Wednesday': 'Wednesday',
    'weekday.Thursday': 'Thursday',
    'weekday.Friday': 'Friday',
    'weekday.Saturday': 'Saturday',
    'risk.all': 'All risk',
    'risk.low': 'Low',
    'risk.medium': 'Medium',
    'risk.high': 'High',
    'risk.label': 'risk',
    'sort.createdAt': 'Created',
    'sort.startDate': 'Start date',
    'sort.endDate': 'End date',
    'sort.status': 'Status',
    'sort.updatedAt': 'Updated',
    'sort.ascending': 'Ascending',
    'sort.descending': 'Descending',
    'bookings.operations': 'Booking operations',
    'bookings.title': 'Bookings',
    'bookings.lede': 'Search, filter, sort, and page through backend booking records.',
    'bookings.actions': 'Booking list actions',
    'bookings.refresh': 'Refresh bookings',
    'bookings.filters': 'Booking filters',
    'bookings.customer': 'Customer',
    'bookings.searchByName': 'Search by name',
    'bookings.status': 'Status',
    'bookings.allStatuses': 'All statuses',
    'bookings.risk': 'Risk',
    'bookings.sort': 'Sort',
    'bookings.currentWorkspace': 'Current workspace',
    'bookings.activeFilters': 'Active filters',
    'bookings.clearAll': 'Clear all',
    'bookings.activeFilterList': 'Active booking filters',
    'bookings.removeFilter': 'Remove',
    'bookings.filterCustomer': 'Customer',
    'bookings.filterStatus': 'Status',
    'bookings.filterRisk': 'Risk',
    'bookings.filterSort': 'Sort',
    'bookings.filterPage': 'Page',
    'bookings.workspaceMemory': 'Workspace memory',
    'bookings.savedViews': 'Saved views',
    'bookings.browserOnly': 'Browser only',
    'bookings.savedViewsCopy': 'Save the current bookings filters, sorting, and page so you can reapply them quickly on this device.',
    'bookings.viewName': 'View name',
    'bookings.viewNamePlaceholder': 'Ex: High-risk approvals',
    'bookings.saveCurrentView': 'Save current view',
    'bookings.savedViewRequired': 'Enter a name before saving this view.',
    'bookings.savedViewUpdated': 'Saved view updated.',
    'bookings.savedViewCreated': 'Saved view created.',
    'bookings.savedViewStorageUnavailable': 'Saved view changed here, but browser storage was unavailable.',
    'bookings.savedViewApplied': 'applied.',
    'bookings.savedViewRemoved': 'Saved view removed.',
    'bookings.savedViewList': 'Saved booking views',
    'bookings.removeSavedView': 'Remove',
    'bookings.savedViewSingular': 'saved view',
    'bookings.noSavedViews': 'No saved views yet.',
    'bookings.records': 'Records',
    'bookings.bookingList': 'Booking list',
    'bookings.refreshing': 'Refreshing',
    'bookings.total': 'total',
    'bookings.loading': 'Loading bookings',
    'bookings.loadError': 'Bookings could not load',
    'bookings.empty': 'No bookings found',
    'bookings.emptyDescription': 'Adjust the current filters or try a broader search.',
    'bookings.table': 'Bookings',
    'bookings.date': 'Date',
    'bookings.time': 'Time',
    'bookings.detail': 'Detail',
    'bookings.viewDetails': 'View details',
    'bookings.pagination': 'Booking pagination',
    'bookings.previousPage': 'Previous page',
    'bookings.nextPage': 'Next page',
    'bookings.pageOf': 'Page',
    'bookings.of': 'of',
    'bookings.detailEyebrow': 'Booking detail',
    'bookings.loadingBooking': 'Loading booking',
    'bookings.closeDetail': 'Close booking detail',
    'bookings.loadingDetail': 'Loading booking detail',
    'bookings.detailLoadError': 'Booking detail could not load',
    'bookings.notSet': 'Not set',
    'bookings.customerContact': 'Customer contact',
    'bookings.schedule': 'Schedule',
    'bookings.scheduleFromTo': 'from',
    'bookings.partySize': 'Party size',
    'bookings.resource': 'Resource',
    'bookings.business': 'Business',
    'bookings.customerId': 'Customer ID',
    'bookings.notes': 'Notes',
    'bookings.conflictRisk': 'Conflict risk',
    'bookings.riskSignals': 'Risk signals',
    'bookings.lifecycleActions': 'Lifecycle actions',
    'bookings.noLifecycleActions': 'No lifecycle actions are available for this status and role.',
    'bookings.saving': 'Saving',
    'bookings.approve': 'Approve',
    'bookings.reject': 'Reject',
    'bookings.cancel': 'Cancel',
    'bookings.complete': 'Complete',
    'bookings.noShow': 'No-show',
    'bookings.confirmApprove': 'Approve this booking?',
    'bookings.confirmReject': 'Reject this booking?',
    'bookings.confirmCancel': 'Cancel this booking?',
    'bookings.confirmComplete': 'Complete this booking?',
    'bookings.confirmNoShow': 'Mark this booking as no-show?',
    'bookings.confirmReschedule': 'Reschedule this booking?',
    'bookings.reschedule': 'Reschedule',
    'bookings.start': 'Start',
    'bookings.end': 'End',
    'bookings.timeIn': 'Time in',
    'bookings.timeOut': 'Time out',
    'bookings.reason': 'Reason',
    'bookings.optionalAuditNote': 'Optional audit note',
    'bookings.checking': 'Checking',
    'bookings.findSuggestions': 'Find suggestions',
    'bookings.suggestedSlots': 'Suggested booking slots',
    'bookings.rescheduleUnavailable': 'Reschedule is available for pending or approved bookings handled by operator roles.',
    'bookings.statusHistory': 'Status history',
    'bookings.noStatusHistory': 'No status history recorded.',
    'bookings.activeSessionRequired': 'An active operator session is required.',
    'bookings.selectionRequired': 'Booking selection is required.',
    'customers.relationships': 'Relationships',
    'customers.title': 'Customers',
    'customers.lede': 'Search customer records, create new profiles, and edit customer details with recent booking history.',
    'customers.actions': 'Customer actions',
    'customers.refresh': 'Refresh customers',
    'customers.filters': 'Customer filters',
    'customers.name': 'Name',
    'customers.searchByName': 'Search by name',
    'customers.email': 'Email',
    'customers.emailPlaceholder': 'customer@example.com',
    'customers.phone': 'Phone',
    'customers.phonePlaceholder': '+15550001111',
    'customers.business': 'Business',
    'customers.allBusinesses': 'All businesses',
    'customers.create': 'Create',
    'customers.newCustomer': 'New customer',
    'customers.createForm': 'Create customer form',
    'customers.selectBusiness': 'Select a business',
    'customers.firstName': 'First name',
    'customers.lastName': 'Last name',
    'customers.notes': 'Notes',
    'customers.preferredNotifications': 'Preferred notifications',
    'customers.createNotifications': 'Create customer preferred notifications',
    'customers.editNotifications': 'Edit customer preferred notifications',
    'customers.channel.email': 'Email',
    'customers.channel.sms': 'SMS',
    'customers.created': 'Customer created.',
    'customers.creating': 'Creating',
    'customers.createCustomer': 'Create customer',
    'customers.directory': 'Directory',
    'customers.customerList': 'Customer list',
    'customers.refreshing': 'Refreshing',
    'customers.shown': 'shown',
    'customers.loading': 'Loading customers',
    'customers.loadError': 'Customers could not load',
    'customers.empty': 'No customers found',
    'customers.emptyDescription': 'Adjust the current filters or create a customer for the selected business.',
    'customers.unnamed': 'Unnamed customer',
    'customers.bookings': 'bookings',
    'customers.profile': 'Customer profile',
    'customers.profileEyebrow': 'Profile',
    'customers.details': 'Customer details',
    'customers.selectCustomer': 'Select a customer',
    'customers.selectCustomerDescription': 'Choose a customer from the directory to load profile details.',
    'customers.loadingProfile': 'Loading customer profile',
    'customers.profileLoadError': 'Customer profile could not load',
    'customers.contact': 'Contact',
    'customers.noPhone': 'No phone recorded',
    'customers.notSet': 'Not set',
    'customers.notTracked': 'Not tracked',
    'customers.customerId': 'Customer ID',
    'customers.updated': 'Updated',
    'customers.editProfile': 'Edit customer profile',
    'customers.edit': 'Edit',
    'customers.updatedSuccess': 'Customer updated.',
    'customers.saving': 'Saving',
    'customers.saveCustomer': 'Save customer',
    'customers.history': 'History',
    'customers.bookingHistory': 'Customer booking history',
    'customers.bookingHistoryEmpty': 'No booking history matched the existing customer fields.',
    'customers.recentBookings': 'Recent bookings',
    'customers.loadingBookingHistory': 'Loading booking history',
    'customers.bookingHistoryLoadError': 'Booking history could not load',
    'customers.selectBeforeLoading': 'Select a customer before loading details.',
    'customers.signInBeforeCreating': 'Sign in before creating customers.',
    'customers.selectBeforeSaving': 'Select a customer before saving.',
    'timeline.schedule': 'Schedule',
    'timeline.title': 'Timeline',
    'timeline.lede': 'Scan day-grouped booking flow, resource load, and conflict-risk markers.',
    'timeline.actions': 'Timeline actions',
    'timeline.refresh': 'Refresh timeline',
    'timeline.filters': 'Timeline filters',
    'timeline.summary': 'Timeline summary',
    'timeline.totalBookings': 'Total bookings',
    'timeline.timelineDays': 'timeline days',
    'timeline.highRiskBookings': 'High-risk bookings',
    'timeline.conflictRiskMarkers': 'Conflict-risk markers',
    'timeline.bookedTime': 'Booked time',
    'timeline.scheduledMinutes': 'scheduled minutes',
    'timeline.activeFilters': 'Active filters',
    'timeline.filterSummary': 'Status, date, and resource',
    'timeline.backendFeed': 'Backend feed',
    'timeline.bookingFlow': 'Booking flow',
    'timeline.loading': 'Loading timeline',
    'timeline.loadError': 'Timeline could not load',
    'timeline.empty': 'No timeline entries',
    'timeline.emptyDescription': 'Adjust the date, status, or resource filters to broaden the schedule feed.',
    'timeline.bookings': 'bookings',
    'timeline.minutesShort': 'min',
    'timeline.unnamedCustomer': 'Unnamed customer',
    'timeline.rescheduled': 'Rescheduled',
  },
  ar: {
    'app.language': 'اللغة',
    'app.language.english': 'الإنجليزية',
    'app.language.arabic': 'العربية',
    'app.theme.light': 'التبديل إلى الوضع الفاتح',
    'app.theme.dark': 'التبديل إلى الوضع الداكن',
    'app.brand.operations': 'العمليات',
    'app.session.operatorFallback': 'مشغل',
    'app.session.notSignedIn': 'لم يتم تسجيل الدخول',
    'app.session.signOut': 'تسجيل الخروج',
    'nav.ownerHome': 'الرئيسية للمالك',
    'nav.users': 'المستخدمون',
    'nav.audit': 'التدقيق',
    'nav.dashboard': 'لوحة التحكم',
    'nav.bookings': 'الحجوزات',
    'nav.timeline': 'الجدول الزمني',
    'nav.customers': 'العملاء',
    'nav.resources': 'الموارد',
    'nav.settings': 'الإعدادات',
    'nav.portal': 'البوابة',
    'nav.publicPage': 'الصفحة العامة',
    'nav.widget': 'الودجت',
    'home.eyebrow': 'Slotwise',
    'home.title': 'عمليات الحجز في Slotwise',
    'home.lede':
      'نقطة دخول إنتاجية للمشغلين والعملاء، مع إبقاء إعداد المالك عبر سطر الأوامر ووصول العملاء عبر روابط البوابة.',
    'home.signIn': 'تسجيل الدخول',
    'home.customerPortal': 'بوابة العملاء',
    'home.publicBooking': 'الحجز العام',
    'home.bookingTitle': 'احجز عبر رابط النشاط التجاري',
    'home.bookingCopy': 'استخدم رمز النشاط التجاري المعروف عندما تتم مشاركته معك.',
    'auth.operatorAccess': 'وصول المشغل',
    'auth.signInTitle': 'تسجيل الدخول إلى Slotwise',
    'auth.signInLede':
      'استخدم بيانات اعتماد المالك أو المسؤول أو الموظف. يحتفظ Slotwise بجلستك المسجلة في ملف تعريف ارتباط آمن في المتصفح.',
    'auth.username': 'اسم المستخدم',
    'auth.password': 'كلمة المرور',
    'auth.signingIn': 'جار تسجيل الدخول',
    'auth.resetOperatorPassword': 'إعادة تعيين كلمة مرور المشغل',
    'auth.unreachable': 'تعذر الوصول إلى Slotwise.',
    'auth.forbiddenEyebrow': 'تم رفض الوصول',
    'auth.forbiddenTitle': 'هذه البوابة غير متاحة لدورك.',
    'auth.forbiddenLede': 'استخدم البوابة المخصصة لحساب المشغل الخاص بك.',
    'auth.goToPortal': 'الانتقال إلى بوابتي',
    'auth.operatorInvitation': 'دعوة مشغل',
    'auth.invitationTitle': 'عيّن كلمة مرور Slotwise',
    'auth.invitationLede': 'اقبل الدعوة الصادرة من المالك ثم سجّل الدخول باسم مستخدم المشغل.',
    'auth.invitationAccepted': 'تم قبول الدعوة. يمكنك الآن تسجيل الدخول.',
    'auth.invitationToken': 'رمز الدعوة',
    'auth.newPassword': 'كلمة المرور الجديدة',
    'auth.accepting': 'جار القبول',
    'auth.acceptInvitation': 'قبول الدعوة',
    'auth.passwordReset': 'إعادة تعيين كلمة المرور',
    'auth.resetRequestTitle': 'إعادة تعيين وصول المشغل',
    'auth.resetRequestLede': 'أدخل اسم مستخدم المشغل. إذا كان الحساب نشطا، سيرسل Slotwise رمز إعادة التعيين.',
    'auth.resetRequested': 'إذا كان حساب المشغل نشطا، فستصلك رسالة إعادة التعيين.',
    'auth.enterResetToken': 'إدخال رمز إعادة التعيين',
    'auth.sending': 'جار الإرسال',
    'auth.sendResetToken': 'إرسال رمز إعادة التعيين',
    'auth.resetCompleteTitle': 'إنشاء كلمة مرور جديدة',
    'auth.resetCompleteLede': 'استخدم رمز إعادة التعيين من رسالة إعادة تعيين كلمة مرور المشغل.',
    'auth.passwordResetComplete': 'اكتملت إعادة تعيين كلمة المرور. يمكنك الآن تسجيل الدخول.',
    'auth.resetToken': 'رمز إعادة التعيين',
    'auth.saving': 'جار الحفظ',
    'auth.resetPassword': 'إعادة تعيين كلمة المرور',
    'auth.sessionExpired': 'انتهت جلسة المشغل. سجّل الدخول مرة أخرى لمتابعة العمل.',
    'auth.sessionCheckTitle': 'جار التحقق من جلستك الحالية',
    'auth.sessionCheckInitial': 'يتحقق Slotwise من وجود جلسة متصفح نشطة قبل تحميل مساحة عمل الإدارة.',
    'auth.sessionCheckRevalidate': 'يعيد Slotwise التحقق من جلسة هذا المتصفح قبل تحميل مساحة عمل الإدارة.',
    'status.pending': 'قيد الانتظار',
    'status.approved': 'مقبول',
    'status.completed': 'مكتمل',
    'status.cancelled': 'ملغى',
    'status.no_show': 'لم يحضر',
    'status.rejected': 'مرفوض',
    'status.reschedule': 'إعادة جدولة',
    'dashboard.ownerEyebrow': 'لوحة تحكم المالك',
    'dashboard.title': 'نظرة سريعة على اليوم',
    'dashboard.analyticsFrom': 'تحليلات لوحة التحكم من',
    'dashboard.actions': 'إجراءات لوحة التحكم',
    'dashboard.refresh': 'تحديث لوحة التحكم',
    'dashboard.filters': 'مرشحات لوحة التحكم',
    'dashboard.from': 'من',
    'dashboard.to': 'إلى',
    'dashboard.resource': 'المورد',
    'dashboard.resourcePlaceholder': 'معرف المورد',
    'dashboard.loadingAnalytics': 'جار تحميل تحليلات لوحة التحكم',
    'dashboard.loadingCancellations': 'جار تحميل رؤى الإلغاء وعدم الحضور',
    'dashboard.analyticsLoadError': 'تعذر تحميل تحليلات لوحة التحكم',
    'dashboard.noAnalytics': 'لا توجد تحليلات للوحة التحكم',
    'dashboard.noAnalyticsDescription': 'عدّل المرشحات الحالية أو جرّب نطاق تقارير أوسع.',
    'dashboard.cancellationLoadError': 'تعذر تحميل رؤى الإلغاء',
    'dashboard.operationalMetrics': 'المقاييس التشغيلية',
    'dashboard.totalBookings': 'إجمالي الحجوزات',
    'dashboard.pendingReview': 'بانتظار المراجعة',
    'dashboard.approvalRate': 'معدل القبول',
    'dashboard.approvedBookings': 'حجوزات مقبولة',
    'dashboard.completionRate': 'معدل الإكمال',
    'dashboard.completedBookings': 'حجوزات مكتملة',
    'dashboard.utilization': 'الاستخدام',
    'dashboard.bookedMinutes': 'دقائق محجوزة',
    'dashboard.lifecycle': 'دورة الحياة',
    'dashboard.bookingFunnel': 'قمع الحجز',
    'dashboard.peaks': 'الذروة',
    'dashboard.peakBookingTimes': 'أوقات ذروة الحجز',
    'dashboard.busiestWeekday': 'أكثر أيام الأسبوع ازدحاما',
    'dashboard.busiestHour': 'أكثر ساعة ازدحاما',
    'dashboard.notEnoughData': 'لا توجد بيانات كافية',
    'dashboard.noPeakSlots': 'لا توجد أوقات ذروة في هذا النطاق.',
    'dashboard.weekdayLoad': 'حمل أيام الأسبوع',
    'dashboard.utilizationByDay': 'الاستخدام حسب اليوم',
    'dashboard.minutes': 'دقيقة',
    'dashboard.resources': 'الموارد',
    'dashboard.topResourceLoad': 'أعلى حمل للموارد',
    'dashboard.bookings': 'حجوزات',
    'dashboard.noResourceData': 'لا توجد بيانات استخدام للموارد في هذا النطاق.',
    'dashboard.cancellationHealth': 'صحة الإلغاءات',
    'dashboard.cancellationInsights': 'رؤى الإلغاء وعدم الحضور',
    'dashboard.cancellationMetrics': 'مقاييس الإلغاء',
    'dashboard.cancelled': 'ملغاة',
    'dashboard.cancellationRate': 'معدل الإلغاء',
    'dashboard.noShows': 'عدم الحضور',
    'dashboard.noShowRate': 'معدل عدم الحضور',
    'dashboard.delivered': 'منجزة',
    'dashboard.deliveryRate': 'معدل الإنجاز',
    'dashboard.cancellations': 'إلغاءات',
    'dashboard.reasonPatterns': 'أنماط الأسباب',
    'dashboard.topReasons': 'أهم الأسباب',
    'dashboard.noCancellationReasons': 'لا توجد أسباب إلغاء في هذا النطاق.',
    'dashboard.noNoShowReasons': 'لا توجد أسباب عدم حضور في هذا النطاق.',
    'dashboard.sessionPosture': 'وضع الجلسة',
    'dashboard.storageBaseline': 'أساس التخزين المعتمد',
    'dashboard.storageCopy':
      'يتم الاحتفاظ برموز الجلسة في الذاكرة في أول شريحة للواجهة. يتطلب تحديث الصفحة تسجيل الدخول مرة أخرى، ويبقى تسجيل الدخول المستمر مراجعة لاحقة لجلسات ملفات تعريف الارتباط في الخلفية.',
    'dashboard.storeDemoToken': 'تخزين رمز تجريبي في الذاكرة',
    'dashboard.tokenStatus': 'حالة الرمز',
    'dashboard.tokenStored': 'مخزن في الذاكرة',
    'dashboard.tokenNotStored': 'غير مخزن',
    'dashboard.widgetIsolation': 'عزل الودجت العام',
    'dashboard.widgetIsolationDescription':
      'ستستخدم التضمينات الخارجية عزل iframe أولا، مما يحافظ على أنماط الصفحة المضيفة بعيدة عن تدفقات الحجز.',
    'weekday.Sunday': 'الأحد',
    'weekday.Monday': 'الاثنين',
    'weekday.Tuesday': 'الثلاثاء',
    'weekday.Wednesday': 'الأربعاء',
    'weekday.Thursday': 'الخميس',
    'weekday.Friday': 'الجمعة',
    'weekday.Saturday': 'السبت',
    'risk.all': 'كل مستويات المخاطر',
    'risk.low': 'منخفض',
    'risk.medium': 'متوسط',
    'risk.high': 'مرتفع',
    'risk.label': 'مخاطر',
    'sort.createdAt': 'تاريخ الإنشاء',
    'sort.startDate': 'تاريخ البدء',
    'sort.endDate': 'تاريخ الانتهاء',
    'sort.status': 'الحالة',
    'sort.updatedAt': 'آخر تحديث',
    'sort.ascending': 'تصاعدي',
    'sort.descending': 'تنازلي',
    'bookings.operations': 'عمليات الحجز',
    'bookings.title': 'الحجوزات',
    'bookings.lede': 'ابحث وصفّ ورتّب وتنقل بين سجلات الحجز القادمة من الخلفية.',
    'bookings.actions': 'إجراءات قائمة الحجوزات',
    'bookings.refresh': 'تحديث الحجوزات',
    'bookings.filters': 'مرشحات الحجز',
    'bookings.customer': 'العميل',
    'bookings.searchByName': 'البحث بالاسم',
    'bookings.status': 'الحالة',
    'bookings.allStatuses': 'كل الحالات',
    'bookings.risk': 'المخاطر',
    'bookings.sort': 'الترتيب',
    'bookings.currentWorkspace': 'مساحة العمل الحالية',
    'bookings.activeFilters': 'المرشحات النشطة',
    'bookings.clearAll': 'مسح الكل',
    'bookings.activeFilterList': 'مرشحات الحجز النشطة',
    'bookings.removeFilter': 'إزالة',
    'bookings.filterCustomer': 'العميل',
    'bookings.filterStatus': 'الحالة',
    'bookings.filterRisk': 'المخاطر',
    'bookings.filterSort': 'الترتيب',
    'bookings.filterPage': 'الصفحة',
    'bookings.workspaceMemory': 'ذاكرة مساحة العمل',
    'bookings.savedViews': 'العروض المحفوظة',
    'bookings.browserOnly': 'في المتصفح فقط',
    'bookings.savedViewsCopy': 'احفظ مرشحات الحجز والترتيب والصفحة الحالية لإعادة تطبيقها بسرعة على هذا الجهاز.',
    'bookings.viewName': 'اسم العرض',
    'bookings.viewNamePlaceholder': 'مثال: موافقات عالية المخاطر',
    'bookings.saveCurrentView': 'حفظ العرض الحالي',
    'bookings.savedViewRequired': 'أدخل اسما قبل حفظ هذا العرض.',
    'bookings.savedViewUpdated': 'تم تحديث العرض المحفوظ.',
    'bookings.savedViewCreated': 'تم إنشاء العرض المحفوظ.',
    'bookings.savedViewStorageUnavailable': 'تغير العرض هنا، لكن تخزين المتصفح غير متاح.',
    'bookings.savedViewApplied': 'تم تطبيقه.',
    'bookings.savedViewRemoved': 'تمت إزالة العرض المحفوظ.',
    'bookings.savedViewList': 'عروض الحجز المحفوظة',
    'bookings.removeSavedView': 'إزالة',
    'bookings.savedViewSingular': 'العرض المحفوظ',
    'bookings.noSavedViews': 'لا توجد عروض محفوظة بعد.',
    'bookings.records': 'السجلات',
    'bookings.bookingList': 'قائمة الحجوزات',
    'bookings.refreshing': 'جار التحديث',
    'bookings.total': 'الإجمالي',
    'bookings.loading': 'جار تحميل الحجوزات',
    'bookings.loadError': 'تعذر تحميل الحجوزات',
    'bookings.empty': 'لم يتم العثور على حجوزات',
    'bookings.emptyDescription': 'عدّل المرشحات الحالية أو جرّب بحثا أوسع.',
    'bookings.table': 'الحجوزات',
    'bookings.date': 'التاريخ',
    'bookings.time': 'الوقت',
    'bookings.detail': 'التفاصيل',
    'bookings.viewDetails': 'عرض التفاصيل',
    'bookings.pagination': 'ترقيم صفحات الحجز',
    'bookings.previousPage': 'الصفحة السابقة',
    'bookings.nextPage': 'الصفحة التالية',
    'bookings.pageOf': 'صفحة',
    'bookings.of': 'من',
    'bookings.detailEyebrow': 'تفاصيل الحجز',
    'bookings.loadingBooking': 'جار تحميل الحجز',
    'bookings.closeDetail': 'إغلاق تفاصيل الحجز',
    'bookings.loadingDetail': 'جار تحميل تفاصيل الحجز',
    'bookings.detailLoadError': 'تعذر تحميل تفاصيل الحجز',
    'bookings.notSet': 'غير محدد',
    'bookings.customerContact': 'معلومات اتصال العميل',
    'bookings.schedule': 'الجدول',
    'bookings.scheduleFromTo': 'من',
    'bookings.partySize': 'حجم المجموعة',
    'bookings.resource': 'المورد',
    'bookings.business': 'النشاط التجاري',
    'bookings.customerId': 'معرف العميل',
    'bookings.notes': 'الملاحظات',
    'bookings.conflictRisk': 'مخاطر التعارض',
    'bookings.riskSignals': 'إشارات المخاطر',
    'bookings.lifecycleActions': 'إجراءات دورة الحياة',
    'bookings.noLifecycleActions': 'لا توجد إجراءات دورة حياة متاحة لهذه الحالة وهذا الدور.',
    'bookings.saving': 'جار الحفظ',
    'bookings.approve': 'قبول',
    'bookings.reject': 'رفض',
    'bookings.cancel': 'إلغاء',
    'bookings.complete': 'إكمال',
    'bookings.noShow': 'لم يحضر',
    'bookings.confirmApprove': 'هل تريد قبول هذا الحجز؟',
    'bookings.confirmReject': 'هل تريد رفض هذا الحجز؟',
    'bookings.confirmCancel': 'هل تريد إلغاء هذا الحجز؟',
    'bookings.confirmComplete': 'هل تريد إكمال هذا الحجز؟',
    'bookings.confirmNoShow': 'هل تريد تحديد هذا الحجز كعدم حضور؟',
    'bookings.confirmReschedule': 'هل تريد إعادة جدولة هذا الحجز؟',
    'bookings.reschedule': 'إعادة جدولة',
    'bookings.start': 'البداية',
    'bookings.end': 'النهاية',
    'bookings.timeIn': 'وقت الدخول',
    'bookings.timeOut': 'وقت الخروج',
    'bookings.reason': 'السبب',
    'bookings.optionalAuditNote': 'ملاحظة تدقيق اختيارية',
    'bookings.checking': 'جار الفحص',
    'bookings.findSuggestions': 'البحث عن اقتراحات',
    'bookings.suggestedSlots': 'أوقات الحجز المقترحة',
    'bookings.rescheduleUnavailable': 'إعادة الجدولة متاحة للحجوزات المعلقة أو المقبولة التي تعالجها أدوار المشغلين.',
    'bookings.statusHistory': 'سجل الحالة',
    'bookings.noStatusHistory': 'لا يوجد سجل حالة مسجل.',
    'bookings.activeSessionRequired': 'يلزم وجود جلسة مشغل نشطة.',
    'bookings.selectionRequired': 'يلزم اختيار حجز.',
    'customers.relationships': 'العلاقات',
    'customers.title': 'العملاء',
    'customers.lede': 'ابحث في سجلات العملاء وأنشئ ملفات تعريف جديدة وعدّل تفاصيل العملاء مع سجل الحجوزات الأخير.',
    'customers.actions': 'إجراءات العملاء',
    'customers.refresh': 'تحديث العملاء',
    'customers.filters': 'مرشحات العملاء',
    'customers.name': 'الاسم',
    'customers.searchByName': 'البحث بالاسم',
    'customers.email': 'البريد الإلكتروني',
    'customers.emailPlaceholder': 'customer@example.com',
    'customers.phone': 'الهاتف',
    'customers.phonePlaceholder': '+15550001111',
    'customers.business': 'النشاط التجاري',
    'customers.allBusinesses': 'كل الأنشطة التجارية',
    'customers.create': 'إنشاء',
    'customers.newCustomer': 'عميل جديد',
    'customers.createForm': 'نموذج إنشاء عميل',
    'customers.selectBusiness': 'اختر نشاطا تجاريا',
    'customers.firstName': 'الاسم الأول',
    'customers.lastName': 'اسم العائلة',
    'customers.notes': 'الملاحظات',
    'customers.preferredNotifications': 'الإشعارات المفضلة',
    'customers.createNotifications': 'الإشعارات المفضلة لإنشاء عميل',
    'customers.editNotifications': 'الإشعارات المفضلة لتعديل عميل',
    'customers.channel.email': 'البريد الإلكتروني',
    'customers.channel.sms': 'رسائل SMS',
    'customers.created': 'تم إنشاء العميل.',
    'customers.creating': 'جار الإنشاء',
    'customers.createCustomer': 'إنشاء عميل',
    'customers.directory': 'الدليل',
    'customers.customerList': 'قائمة العملاء',
    'customers.refreshing': 'جار التحديث',
    'customers.shown': 'معروضة',
    'customers.loading': 'جار تحميل العملاء',
    'customers.loadError': 'تعذر تحميل العملاء',
    'customers.empty': 'لم يتم العثور على عملاء',
    'customers.emptyDescription': 'عدّل المرشحات الحالية أو أنشئ عميلا للنشاط التجاري المحدد.',
    'customers.unnamed': 'عميل غير مسمى',
    'customers.bookings': 'حجوزات',
    'customers.profile': 'ملف العميل',
    'customers.profileEyebrow': 'الملف',
    'customers.details': 'تفاصيل العميل',
    'customers.selectCustomer': 'اختر عميلا',
    'customers.selectCustomerDescription': 'اختر عميلا من الدليل لتحميل تفاصيل الملف.',
    'customers.loadingProfile': 'جار تحميل ملف العميل',
    'customers.profileLoadError': 'تعذر تحميل ملف العميل',
    'customers.contact': 'معلومات الاتصال',
    'customers.noPhone': 'لا يوجد هاتف مسجل',
    'customers.notSet': 'غير محدد',
    'customers.notTracked': 'غير متتبع',
    'customers.customerId': 'معرف العميل',
    'customers.updated': 'آخر تحديث',
    'customers.editProfile': 'تعديل ملف العميل',
    'customers.edit': 'تعديل',
    'customers.updatedSuccess': 'تم تحديث العميل.',
    'customers.saving': 'جار الحفظ',
    'customers.saveCustomer': 'حفظ العميل',
    'customers.history': 'السجل',
    'customers.bookingHistory': 'سجل حجوزات العميل',
    'customers.bookingHistoryEmpty': 'لا يوجد سجل حجوزات يطابق حقول العميل الحالية.',
    'customers.recentBookings': 'الحجوزات الأخيرة',
    'customers.loadingBookingHistory': 'جار تحميل سجل الحجوزات',
    'customers.bookingHistoryLoadError': 'تعذر تحميل سجل الحجوزات',
    'customers.selectBeforeLoading': 'اختر عميلا قبل تحميل التفاصيل.',
    'customers.signInBeforeCreating': 'سجّل الدخول قبل إنشاء العملاء.',
    'customers.selectBeforeSaving': 'اختر عميلا قبل الحفظ.',
    'timeline.schedule': 'الجدول',
    'timeline.title': 'الخط الزمني',
    'timeline.lede': 'راجع تدفق الحجوزات المجمّع حسب اليوم وحمل الموارد ومؤشرات مخاطر التعارض.',
    'timeline.actions': 'إجراءات الخط الزمني',
    'timeline.refresh': 'تحديث الخط الزمني',
    'timeline.filters': 'مرشحات الخط الزمني',
    'timeline.summary': 'ملخص الخط الزمني',
    'timeline.totalBookings': 'إجمالي الحجوزات',
    'timeline.timelineDays': 'أيام في الخط الزمني',
    'timeline.highRiskBookings': 'حجوزات عالية المخاطر',
    'timeline.conflictRiskMarkers': 'مؤشرات مخاطر التعارض',
    'timeline.bookedTime': 'الوقت المحجوز',
    'timeline.scheduledMinutes': 'دقائق مجدولة',
    'timeline.activeFilters': 'المرشحات النشطة',
    'timeline.filterSummary': 'الحالة والتاريخ والمورد',
    'timeline.backendFeed': 'تدفق الخلفية',
    'timeline.bookingFlow': 'تدفق الحجز',
    'timeline.loading': 'جار تحميل الخط الزمني',
    'timeline.loadError': 'تعذر تحميل الخط الزمني',
    'timeline.empty': 'لا توجد إدخالات في الخط الزمني',
    'timeline.emptyDescription': 'عدّل مرشحات التاريخ أو الحالة أو المورد لتوسيع تدفق الجدول.',
    'timeline.bookings': 'حجوزات',
    'timeline.minutesShort': 'دقيقة',
    'timeline.unnamedCustomer': 'عميل غير مسمى',
    'timeline.rescheduled': 'تمت إعادة الجدولة',
  },
};
