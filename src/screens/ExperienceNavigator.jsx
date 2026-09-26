import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Button, Card, Header, Notice, Page, Pill, Row, SunMark } from "../ui/GoldenUI.jsx";
import { completeReview, derivePathProgress, deriveReviewState, deriveStrand } from "../features/progression.js";
import AccountScreen from "../components/AccountScreen.jsx";

const lazyNamed = (load, name) => lazy(() => load().then((module) => ({ default: module[name] })));
const curriculum = () => import("./CurriculumScreens.jsx");
const progressScreens = () => import("./ProgressScreens.jsx");
const accounts = () => import("./AccountJourneyScreens.jsx");
const table = () => import("./TableScreens.jsx");
const together = () => import("./TogetherScreens.jsx");
const commerce = () => import("./CommerceScreens.jsx");
const gifts = () => import("./GiftJourneyScreens.jsx");
const guide = () => import("./GuideScreens.jsx");
const device = () => import("./DeviceScreens.jsx");
const links = () => import("./LinkLandingScreens.jsx");
const names = (load, componentNames) => Object.fromEntries(componentNames.map((name) => [name, lazyNamed(load, name)]));
const Curriculum = names(curriculum, ["MountainMapScreen", "CampDetailScreen", "LessonPreviewScreen", "LessonComingScreen", "PlacementResultScreen", "StrandLibraryScreen", "WordDetailScreen", "ReviewHubScreen", "ReviewResultScreen", "FestivalArrivalScreen", "FestivalDetailScreen", "LineageChoiceScreen", "MilestoneNoteScreen", "AmbassadorPositionScreen"]);
const ProgressScreens = names(progressScreens, ["PathOverviewScreen", "CampArrivalScreen", "CampCompletionScreen", "StrandProgressScreen", "ReviewProgressScreen", "ReviewResultProgressScreen"]);
const Accounts = names(accounts, ["AccountSignUpScreen", "AccountSignInScreen", "AccountEmailCheckScreen", "AccountPasswordResetScreen", "AccountGuestConversionScreen", "AccountProgressTransferScreen", "AccountConflictResolutionScreen", "AccountRecoverySetupScreen", "AccountRestoreScreen", "AccountSignedInOverviewScreen", "AccountDeviceListScreen", "AccountSignOutScreen", "AccountDeletionScreen", "AccountPrivacyDataControlsScreen", "AccountFamilyMinorEligibilityScreen"]);
const Table = names(table, ["TableIntroScreen", "TableCreateScreen", "TableInviteMethodScreen", "TableInviteLinkScreen", "TableInvitationLandingScreen", "TableInviteResponseScreen", "TableHomeScreen", "TableMemberScreen", "TablePendingInvitesScreen", "TableManageScreen", "TableVoiceRecordScreen", "TableVoiceReviewScreen", "TableVoicePlayerScreen", "TableSunConfirmScreen", "TableActivityScreen", "TableStreakScreen", "TableLeaveScreen", "TableTransferScreen", "TableDeleteScreen"]);
const Together = names(together, ["LocationExplainerScreen", "ChooseMetroScreen", "CommunityDetailScreen", "DoorCommunityScreen", "LiveReadDetailScreen", "LiveReadReminderScreen", "LiveReadLobbyScreen", "LiveReadPlayerScreen", "LiveReadQAScreen", "LiveReadReplayScreen", "NightsListScreen", "EventDetailScreen", "HostDetailScreen", "EventRSVPHandoffScreen", "EventRSVPConfirmationScreen", "ManageRSVPScreen", "DirectionsScreen", "ReportEventScreen", "VoiceProfileScreen", "KeeperProfileScreen"]);
const Commerce = names(commerce, ["PlusDetailScreen", "TablePlanDetailScreen", "PlanComparisonScreen", "CheckoutHandoffScreen", "CheckoutSuccessScreen", "CheckoutCancelledScreen", "CheckoutFailureScreen", "SubscriptionOverviewScreen", "ChangePlanScreen", "PaymentMethodHandoffScreen", "CancelSubscriptionScreen", "CancellationConfirmationScreen", "PromiseEligibilityScreen", "RefundRequestScreen", "RefundStatusScreen"]);
const Gifts = names(gifts, ["GiftDetailsScreen", "GiftDeliveryScreen", "GiftRecipientMethodScreen", "GiftOrderReviewScreen", "GiftCheckoutHandoffScreen", "GiftPurchaseConfirmationScreen", "GiftDeliveryStatusScreen", "GiftClaimLandingScreen", "GiftClaimSignInHandoffScreen", "GiftAttachScreen", "GiftClaimedConfirmationScreen", "GiftInvalidStateScreen", "GiftExpiredStateScreen", "GiftAlreadyClaimedScreen", "GiftSenderOpenedNotificationScreen"]);
const Guide = names(guide, ["GuideConsentScreen", "GuideSourcesScreen", "GuideReaderScreen", "GuideHistoryScreen", "GuideClearHistoryScreen", "GuideHumanHelpScreen"]);
const Device = names(device, ["SunsetReminderScreen", "SunsetLocationScreen", "NotificationPermissionScreen", "ReminderPreviewScreen", "ReminderArrivalScreen", "WidgetInstallScreen", "WidgetInstallSuccessScreen", "OfflineLessonScreen", "DownloadsManagerScreen", "StorageCleanupScreen", "OfflineStateScreen", "AudioSettingsScreen"]);
const Links = names(links, ["InstallOpenScreen", "WebsiteSignInHandoffScreen", "GiftClaimScreen", "LiveReadScreen", "EventScreen", "PlanReturnScreen", "LegalDocumentHandoffScreen"]);

export const EXPERIENCE_HOME_ID = "house-map";

const GROUPS = [
  {
    id: "path",
    title: "Your path",
    detail: "The mountain, lessons, strand, festivals, and milestones",
    screens: [
      ["mountain-map", "The mountain", Curriculum.MountainMapScreen],
      ["camp-detail", "Camp detail", Curriculum.CampDetailScreen],
      ["lesson-preview", "Lesson preview", Curriculum.LessonPreviewScreen],
      ["lesson-coming", "Coming lesson", Curriculum.LessonComingScreen],
      ["placement-result", "Placement result", Curriculum.PlacementResultScreen],
      ["strand-library", "Your strand", Curriculum.StrandLibraryScreen],
      ["word-detail", "Word detail", Curriculum.WordDetailScreen],
      ["review-hub", "Review", Curriculum.ReviewHubScreen],
      ["review-result", "Review result", Curriculum.ReviewResultScreen],
      ["festival-arrival", "Festival arrival", Curriculum.FestivalArrivalScreen],
      ["festival-detail", "Festival detail", Curriculum.FestivalDetailScreen],
      ["lineage-choice", "Choose a lineage", Curriculum.LineageChoiceScreen],
      ["milestone-note", "Milestone note", Curriculum.MilestoneNoteScreen],
      ["ambassador-position", "Voice position", Curriculum.AmbassadorPositionScreen],
    ],
  },
  {
    id: "account",
    title: "Account",
    detail: "Identity, transfer, recovery, privacy, and family eligibility",
    screens: [
      ["account-sign-up", "Create account", Accounts.AccountSignUpScreen],
      ["account-sign-in", "Sign in", Accounts.AccountSignInScreen],
      ["account-email-check", "Check your email", Accounts.AccountEmailCheckScreen],
      ["account-password-reset", "Reset password", Accounts.AccountPasswordResetScreen],
      ["account-guest-conversion", "Keep guest progress", Accounts.AccountGuestConversionScreen],
      ["account-progress-transfer", "Transfer progress", Accounts.AccountProgressTransferScreen],
      ["account-conflict-resolution", "Resolve progress", Accounts.AccountConflictResolutionScreen],
      ["account-recovery-setup", "Set up recovery", Accounts.AccountRecoverySetupScreen],
      ["account-restore", "Restore account", Accounts.AccountRestoreScreen],
      ["account-signed-in-overview", "Account overview", Accounts.AccountSignedInOverviewScreen],
      ["account-device-list", "Your devices", Accounts.AccountDeviceListScreen],
      ["account-sign-out", "Sign out", Accounts.AccountSignOutScreen],
      ["account-deletion", "Delete account", Accounts.AccountDeletionScreen],
      ["account-privacy-data-controls", "Privacy and data", Accounts.AccountPrivacyDataControlsScreen],
      ["account-family-minor-eligibility", "Family eligibility", Accounts.AccountFamilyMinorEligibilityScreen],
    ],
  },
  {
    id: "table",
    title: "The Table",
    detail: "Invite people, show up together, send Suns, and share voice notes",
    screens: [
      ["table-intro", "Meet the Table", Table.TableIntroScreen],
      ["table-create", "Create a Table", Table.TableCreateScreen],
      ["table-invite-method", "Invite someone", Table.TableInviteMethodScreen],
      ["table-invite-link", "Share invitation", Table.TableInviteLinkScreen],
      ["table-invitation-landing", "Invitation landing", Table.TableInvitationLandingScreen],
      ["table-invite-response", "Answer invitation", Table.TableInviteResponseScreen],
      ["table-home", "Table home", Table.TableHomeScreen],
      ["table-member", "Member detail", Table.TableMemberScreen],
      ["table-pending-invites", "Pending invitations", Table.TablePendingInvitesScreen],
      ["table-manage", "Manage Table", Table.TableManageScreen],
      ["table-voice-record", "Record a note", Table.TableVoiceRecordScreen],
      ["table-voice-review", "Review voice note", Table.TableVoiceReviewScreen],
      ["table-voice-player", "Play voice note", Table.TableVoicePlayerScreen],
      ["table-sun-confirm", "Send a Sun", Table.TableSunConfirmScreen],
      ["table-activity", "Table activity", Table.TableActivityScreen],
      ["table-streak", "Shared streak", Table.TableStreakScreen],
      ["table-leave", "Leave Table", Table.TableLeaveScreen],
      ["table-transfer", "Transfer ownership", Table.TableTransferScreen],
      ["table-delete", "Delete Table", Table.TableDeleteScreen],
    ],
  },
  {
    id: "together",
    title: "Together",
    detail: "Community, live reads, Golden Hour Nights, Voices, and Keepers",
    screens: [
      ["together.location", "Use your location", Together.LocationExplainerScreen],
      ["together.choose-metro", "Choose a city", Together.ChooseMetroScreen],
      ["together.community-detail", "Community now", Together.CommunityDetailScreen],
      ["together.door-community", "Your Door", Together.DoorCommunityScreen],
      ["together.live-read-detail", "Live read detail", Together.LiveReadDetailScreen],
      ["together.live-read-reminder", "Live read reminder", Together.LiveReadReminderScreen],
      ["together.live-read-lobby", "Live read lobby", Together.LiveReadLobbyScreen],
      ["together.live-read-player", "Live read player", Together.LiveReadPlayerScreen],
      ["together.live-read-qa", "Questions", Together.LiveReadQAScreen],
      ["together.live-read-replay", "Live read replay", Together.LiveReadReplayScreen],
      ["together.nights", "Golden Hour Nights", Together.NightsListScreen],
      ["together.event-detail", "Night detail", Together.EventDetailScreen],
      ["together.host-detail", "Host detail", Together.HostDetailScreen],
      ["together.rsvp-handoff", "RSVP handoff", Together.EventRSVPHandoffScreen],
      ["together.rsvp-confirmation", "RSVP confirmation", Together.EventRSVPConfirmationScreen],
      ["together.manage-rsvp", "Manage RSVP", Together.ManageRSVPScreen],
      ["together.directions", "Directions", Together.DirectionsScreen],
      ["together.report-event", "Report a night", Together.ReportEventScreen],
      ["together.voice-profile", "Voice profile", Together.VoiceProfileScreen],
      ["together.keeper-profile", "Keeper profile", Together.KeeperProfileScreen],
    ],
  },
  {
    id: "plans",
    title: "Plans",
    detail: "Plan details, checkout returns, subscription controls, and the promise",
    screens: [
      ["plus-detail", "Golden Plus", Commerce.PlusDetailScreen],
      ["table-plan-detail", "Table plan", Commerce.TablePlanDetailScreen],
      ["plan-comparison", "Compare plans", Commerce.PlanComparisonScreen],
      ["checkout-handoff", "Checkout handoff", Commerce.CheckoutHandoffScreen],
      ["checkout-success", "Checkout return", Commerce.CheckoutSuccessScreen],
      ["checkout-cancelled", "Checkout cancelled", Commerce.CheckoutCancelledScreen],
      ["checkout-failure", "Checkout problem", Commerce.CheckoutFailureScreen],
      ["subscription-overview", "Subscription", Commerce.SubscriptionOverviewScreen],
      ["change-plan", "Change plan", Commerce.ChangePlanScreen],
      ["payment-method-handoff", "Payment method", Commerce.PaymentMethodHandoffScreen],
      ["cancel-subscription", "Cancel plan", Commerce.CancelSubscriptionScreen],
      ["cancellation-confirmation", "Cancellation", Commerce.CancellationConfirmationScreen],
      ["promise-eligibility", "100-day promise", Commerce.PromiseEligibilityScreen],
      ["refund-request", "Request refund", Commerce.RefundRequestScreen],
      ["refund-status", "Refund status", Commerce.RefundStatusScreen],
    ],
  },
  {
    id: "gift",
    title: "Gift Golden",
    detail: "Choose, deliver, purchase, claim, and track a gifted Door",
    screens: [
      ["gift-details", "Gift details", Gifts.GiftDetailsScreen],
      ["gift-delivery", "Delivery time", Gifts.GiftDeliveryScreen],
      ["gift-recipient-method", "Recipient", Gifts.GiftRecipientMethodScreen],
      ["gift-order-review", "Review gift", Gifts.GiftOrderReviewScreen],
      ["gift-checkout-handoff", "Gift checkout", Gifts.GiftCheckoutHandoffScreen],
      ["gift-purchase-confirmation", "Gift purchase", Gifts.GiftPurchaseConfirmationScreen],
      ["gift-delivery-status", "Delivery status", Gifts.GiftDeliveryStatusScreen],
      ["gift-claim-landing", "Claim a gift", Gifts.GiftClaimLandingScreen],
      ["gift-claim-sign-in-handoff", "Claim account", Gifts.GiftClaimSignInHandoffScreen],
      ["gift-attach-to-account", "Attach gift", Gifts.GiftAttachScreen],
      ["gift-claimed-confirmation", "Gift claimed", Gifts.GiftClaimedConfirmationScreen],
      ["gift-invalid", "Invalid gift", Gifts.GiftInvalidStateScreen],
      ["gift-expired", "Expired gift", Gifts.GiftExpiredStateScreen],
      ["gift-already-claimed", "Already claimed", Gifts.GiftAlreadyClaimedScreen],
      ["gift-sender-opened-notification", "Gift opened", Gifts.GiftSenderOpenedNotificationScreen],
    ],
  },
  {
    id: "guide",
    title: "The Guide",
    detail: "Consent, sources, history, and the path back to a person",
    screens: [
      ["guide-consent", "Guide privacy", Guide.GuideConsentScreen],
      ["guide-sources", "Answer sources", Guide.GuideSourcesScreen],
      ["guide-reader", "Read a source", Guide.GuideReaderScreen],
      ["guide-history", "Guide history", Guide.GuideHistoryScreen],
      ["guide-clear-history", "Clear history", Guide.GuideClearHistoryScreen],
      ["guide-human-help", "Talk to a person", Guide.GuideHumanHelpScreen],
    ],
  },
  {
    id: "device",
    title: "Your device",
    detail: "Sunset, notifications, widget, audio, downloads, and offline states",
    screens: [
      ["sunset-reminder", "Sunset reminder", Device.SunsetReminderScreen],
      ["sunset-location", "Sunset location", Device.SunsetLocationScreen],
      ["notification-permission", "Notifications", Device.NotificationPermissionScreen],
      ["reminder-preview", "Reminder preview", Device.ReminderPreviewScreen],
      ["reminder-arrival", "Reminder arrival", Device.ReminderArrivalScreen],
      ["widget-install", "Add the widget", Device.WidgetInstallScreen],
      ["widget-installed", "Widget installed", Device.WidgetInstallSuccessScreen],
      ["offline-lesson", "Offline lesson", Device.OfflineLessonScreen],
      ["downloads", "Downloads", Device.DownloadsManagerScreen],
      ["storage-cleanup", "Storage", Device.StorageCleanupScreen],
      ["offline-state", "No connection", Device.OfflineStateScreen],
      ["audio-settings", "Audio and read-along", Device.AudioSettingsScreen],
    ],
  },
  {
    id: "links",
    title: "Links into Golden",
    detail: "Website, install, claim, event, live-read, plan, and legal arrivals",
    screens: [
      ["link-install-open", "Install or open", Links.InstallOpenScreen],
      ["link-website-sign-in", "Website sign-in", Links.WebsiteSignInHandoffScreen],
      ["link-gift-claim", "Gift link", Links.GiftClaimScreen],
      ["link-live-read", "Live-read link", Links.LiveReadScreen],
      ["link-event", "Event link", Links.EventScreen],
      ["link-plan-return", "Checkout return", Links.PlanReturnScreen],
      ["link-legal-document", "Legal document", Links.LegalDocumentHandoffScreen],
    ],
  },
];

export const EXPERIENCE_SCREEN_IDS = Object.freeze(GROUPS.flatMap((group) => group.screens.map(([id]) => id)));
const SCREEN_MAP = new Map(GROUPS.flatMap((group) => group.screens.map((screen, index) => [screen[0], { group, screen, index }])));

// The whole-house preview is a graph of product journeys, rather than a slide deck.
// Each screen keeps its own UI and truth state; this map only decides where an
// action returns or continues inside the existing screen inventory.
const SCREEN_ROUTES = Object.freeze({
  "mountain-map": { back: EXPERIENCE_HOME_ID, onCamp: "camp-detail", onRanges: "strand-library" },
  "camp-detail": { back: "mountain-map", onLesson: "lesson-preview" },
  "lesson-preview": { back: "camp-detail", onGuide: "guide-consent" },
  "lesson-coming": { back: "camp-detail", onGuide: "guide-consent" },
  "placement-result": { back: "mountain-map", onStart: "camp-detail" },
  "strand-library": { back: "mountain-map", onWord: "word-detail", onReview: "review-hub" },
  "word-detail": { back: "strand-library", onLesson: "lesson-preview", onReview: "review-hub" },
  "review-hub": { back: "strand-library", onStart: "review-result", onWord: "word-detail" },
  "review-result": { back: "review-hub", onAgain: "mountain-map" },
  "festival-arrival": { back: "mountain-map", onOpen: "festival-detail" },
  "festival-detail": { back: "festival-arrival" },
  "lineage-choice": { back: "mountain-map", onChoose: "mountain-map" },
  "milestone-note": { back: "mountain-map", onContinue: "mountain-map" },
  "ambassador-position": { back: "mountain-map", onOpenStrand: "strand-library" },

  "account-sign-up": { back: EXPERIENCE_HOME_ID, onAction: "account-email-check" },
  "account-sign-in": { back: EXPERIENCE_HOME_ID, onAction: "account-signed-in-overview" },
  "account-email-check": { back: "account-sign-up" },
  "account-password-reset": { back: "account-sign-in", onAction: "account-email-check" },
  "account-guest-conversion": { back: EXPERIENCE_HOME_ID, onAction: "mountain-map" },
  "account-progress-transfer": { back: "account-signed-in-overview", onAction: "account-conflict-resolution" },
  "account-conflict-resolution": { back: "account-progress-transfer", onAction: "account-signed-in-overview" },
  "account-recovery-setup": { back: "account-privacy-data-controls", onAction: "account-signed-in-overview" },
  "account-restore": { back: "account-recovery-setup", onAction: "account-conflict-resolution" },
  "account-signed-in-overview": { back: EXPERIENCE_HOME_ID },
  "account-device-list": { back: "account-signed-in-overview", onAction: "account-signed-in-overview" },
  "account-sign-out": { back: "account-signed-in-overview", onAction: EXPERIENCE_HOME_ID },
  "account-deletion": { back: "account-privacy-data-controls", onAction: EXPERIENCE_HOME_ID },
  "account-privacy-data-controls": { back: "account-signed-in-overview", onAction: "account-deletion" },
  "account-family-minor-eligibility": { back: "account-privacy-data-controls", onAction: "account-privacy-data-controls" },

  "table-intro": { back: EXPERIENCE_HOME_ID, onStart: "table-create", onLearnMore: "table-plan-detail" },
  "table-create": { back: "table-intro", onCreate: "table-invite-method" },
  "table-invite-method": { back: "table-home", onChooseLink: "table-invite-link", onChooseContacts: "table-invite-link", onChooseCopy: "table-invite-link" },
  "table-invite-link": { back: "table-invite-method", onShare: "table-pending-invites", onCopy: "table-pending-invites" },
  "table-invitation-landing": { back: EXPERIENCE_HOME_ID, onContinue: "table-invite-response", onDecline: EXPERIENCE_HOME_ID },
  "table-invite-response": { back: "table-invitation-landing", onAccept: "table-home", onDecline: EXPERIENCE_HOME_ID },
  "table-home": { back: EXPERIENCE_HOME_ID, onInvite: "table-invite-method", onMember: "table-member", onPending: "table-pending-invites", onManage: "table-manage", onActivity: "table-activity", onStreak: "table-streak", onVoiceNote: "table-voice-record", onShowedUp: "table-sun-confirm" },
  "table-member": { back: "table-home", onMessage: "table-voice-record", onRemove: "table-manage", onResend: "table-pending-invites" },
  "table-pending-invites": { back: "table-home", onMember: "table-member", onInvite: "table-invite-method" },
  "table-manage": { back: "table-home", onRename: "table-create", onInvite: "table-invite-method", onPending: "table-pending-invites", onTransfer: "table-transfer", onLeave: "table-leave", onDelete: "table-delete" },
  "table-voice-record": { back: "table-home", onStart: "table-voice-review", onStop: "table-voice-review" },
  "table-voice-review": { back: "table-voice-record", onPlay: "table-voice-player", onSend: "table-home", onDelete: "table-home" },
  "table-voice-player": { back: "table-home", onPlay: "table-voice-review", onDelete: "table-home" },
  "table-sun-confirm": { back: "table-home", onConfirm: "table-home" },
  "table-activity": { back: "table-home", onMember: "table-member" },
  "table-streak": { back: "table-home", onShare: "table-home" },
  "table-leave": { back: "table-manage", onLeave: "table-intro" },
  "table-transfer": { back: "table-manage", onTransfer: "table-manage" },
  "table-delete": { back: "table-manage", onDelete: "table-intro" },

  "together.location": { back: EXPERIENCE_HOME_ID, onChooseMetro: "together.choose-metro", onSkip: "together.community-detail" },
  "together.choose-metro": { back: "together.location", onSelectMetro: "together.community-detail" },
  "together.community-detail": { back: "together.choose-metro", onOpenDoor: "together.door-community" },
  "together.door-community": { back: "together.community-detail", onLiveRead: "together.live-read-detail" },
  "together.live-read-detail": { back: "together.door-community", onReminder: "together.live-read-reminder" },
  "together.live-read-reminder": { back: "together.live-read-detail", onSave: "together.live-read-detail" },
  "together.live-read-lobby": { back: "together.live-read-detail", onJoin: "together.live-read-player", onQA: "together.live-read-qa" },
  "together.live-read-player": { back: "together.live-read-lobby", onQuestions: "together.live-read-qa", onReplay: "together.live-read-replay" },
  "together.live-read-qa": { back: "together.live-read-player", onSubmitQuestion: "together.live-read-qa" },
  "together.live-read-replay": { back: "together.live-read-player", onPlay: "together.live-read-player", onQA: "together.live-read-qa" },
  "together.nights": { back: EXPERIENCE_HOME_ID, onSelectEvent: "together.event-detail" },
  "together.event-detail": { back: "together.nights", onRSVP: "together.rsvp-handoff", onHost: "together.host-detail", onDirections: "together.directions", onReport: "together.report-event" },
  "together.host-detail": { back: "together.event-detail" },
  "together.rsvp-handoff": { back: "together.event-detail", onContinue: "together.rsvp-confirmation" },
  "together.rsvp-confirmation": { back: "together.event-detail", onManage: "together.manage-rsvp" },
  "together.manage-rsvp": { back: "together.rsvp-confirmation", onClear: "together.event-detail" },
  "together.directions": { back: "together.event-detail", onOpenDirections: "together.directions" },
  "together.report-event": { back: "together.event-detail", onSubmitReport: "together.report-event" },
  "together.voice-profile": { back: EXPERIENCE_HOME_ID },
  "together.keeper-profile": { back: EXPERIENCE_HOME_ID },

  "guide-consent": { back: EXPERIENCE_HOME_ID, onContinue: "guide-sources", onDecline: "lesson-preview", onUseLessonText: "lesson-preview" },
  "guide-sources": { back: "guide-consent", onOpenSource: "guide-reader", onOpenReader: "guide-reader" },
  "guide-reader": { back: "guide-sources", onOpenSources: "guide-sources" },
  "guide-history": { back: EXPERIENCE_HOME_ID, onOpenConversation: "guide-reader", onClearHistory: "guide-clear-history" },
  "guide-clear-history": { back: "guide-history", onCancel: "guide-history", onConfirm: "guide-history" },
  "guide-human-help": { back: "guide-sources", onReachedOut: "guide-sources", onReturnToGuide: "guide-sources" },

  "sunset-reminder": { back: EXPERIENCE_HOME_ID, onContinue: "sunset-location" },
  "sunset-location": { back: "sunset-reminder", onContinue: "notification-permission" },
  "notification-permission": { back: "sunset-location", onContinue: "reminder-preview" },
  "reminder-preview": { back: "notification-permission", onContinue: "reminder-arrival" },
  "reminder-arrival": { back: "reminder-preview", onContinue: "mountain-map" },
  "widget-install": { back: EXPERIENCE_HOME_ID, onContinue: "widget-installed" },
  "widget-installed": { back: "widget-install", onContinue: EXPERIENCE_HOME_ID },
  "offline-lesson": { back: EXPERIENCE_HOME_ID, onOpenDownloads: "downloads" },
  downloads: { back: "offline-lesson", onOpenCleanup: "storage-cleanup" },
  "storage-cleanup": { back: "downloads", onDone: "downloads" },
  "offline-state": { back: EXPERIENCE_HOME_ID, onRetry: "offline-lesson", onContinue: "mountain-map" },
  "audio-settings": { back: EXPERIENCE_HOME_ID },

  "plus-detail": { back: "plan-comparison", onCompare: "plan-comparison", onCheckout: "checkout-handoff" },
  "table-plan-detail": { back: "plan-comparison", onCompare: "plan-comparison", onCheckout: "checkout-handoff" },
  "plan-comparison": { back: EXPERIENCE_HOME_ID },
  "checkout-handoff": { back: "plan-comparison", onCheckoutReady: "checkout-success", onCancelled: "plan-comparison", onFailure: "checkout-failure" },
  "checkout-success": { back: "plan-comparison", onManage: "subscription-overview" },
  "checkout-cancelled": { back: "plan-comparison", onRetry: "plan-comparison" },
  "checkout-failure": { back: "plan-comparison", onRetry: "checkout-handoff" },
  "subscription-overview": { back: EXPERIENCE_HOME_ID, onChangePlan: "change-plan", onPaymentMethod: "payment-method-handoff", onCancel: "cancel-subscription", onPromise: "promise-eligibility", onRefund: "refund-request" },
  "change-plan": { back: "subscription-overview", onCheckout: "checkout-handoff" },
  "payment-method-handoff": { back: "subscription-overview" },
  "cancel-subscription": { back: "subscription-overview", onConfirm: "cancellation-confirmation" },
  "cancellation-confirmation": { back: "cancel-subscription", onDone: "subscription-overview" },
  "promise-eligibility": { back: "subscription-overview", onRefund: "refund-request" },
  "refund-request": { back: "subscription-overview", onStatus: "refund-status" },
  "refund-status": { back: "refund-request" },

  "gift-details": { back: EXPERIENCE_HOME_ID, onContinue: "gift-delivery" },
  "gift-delivery": { back: "gift-details", onContinue: "gift-recipient-method" },
  "gift-recipient-method": { back: "gift-delivery", onContinue: "gift-order-review" },
  "gift-order-review": { back: "gift-recipient-method", onContinue: "gift-checkout-handoff" },
  "gift-checkout-handoff": { back: "gift-order-review", onRetry: "gift-order-review", onOpenCheckout: "gift-purchase-confirmation" },
  "gift-purchase-confirmation": { back: "gift-checkout-handoff", onViewDelivery: "gift-delivery-status" },
  "gift-delivery-status": { back: "gift-purchase-confirmation", onCheckAgain: "gift-purchase-confirmation" },
  "gift-claim-landing": { back: EXPERIENCE_HOME_ID, onContinue: "gift-claim-sign-in-handoff" },
  "gift-claim-sign-in-handoff": { back: "gift-claim-landing", onContinueLocally: "gift-attach-to-account", onSignIn: "account-sign-in" },
  "gift-attach-to-account": { back: "gift-claim-sign-in-handoff", onAttach: "gift-claimed-confirmation" },
  "gift-claimed-confirmation": { back: "gift-attach-to-account", onStart: "mountain-map" },
  "gift-invalid": { back: EXPERIENCE_HOME_ID, onContinue: EXPERIENCE_HOME_ID },
  "gift-expired": { back: EXPERIENCE_HOME_ID, onContinue: EXPERIENCE_HOME_ID },
  "gift-already-claimed": { back: EXPERIENCE_HOME_ID, onContinue: EXPERIENCE_HOME_ID },
  "gift-sender-opened-notification": { back: "gift-delivery-status", onRefresh: "gift-purchase-confirmation" },

  "link-install-open": { back: EXPERIENCE_HOME_ID, onContinue: "mountain-map", onInstall: "widget-install" },
  "link-website-sign-in": { back: EXPERIENCE_HOME_ID, onContinue: "account-sign-in" },
  "link-gift-claim": { back: EXPERIENCE_HOME_ID, onContinue: "gift-claim-landing", onClaim: "gift-claim-landing" },
  "link-live-read": { back: EXPERIENCE_HOME_ID, onContinue: "together.live-read-detail" },
  "link-event": { back: EXPERIENCE_HOME_ID, onContinue: "together.event-detail", onAction: "together.event-detail" },
  "link-plan-return": { back: EXPERIENCE_HOME_ID, onContinue: "subscription-overview" },
  "link-legal-document": { back: EXPERIENCE_HOME_ID, onContinue: "account-privacy-data-controls", onOpenDocument: "account-privacy-data-controls" },
});

function Hub({ onClose, onOpen }) {
  return <Page scroll>
    <Header eyebrow="the whole house" title="Every room has a door now." subtitle={`${EXPERIENCE_SCREEN_IDS.length} customer screen states, built from the supplied Golden system.`} onBack={onClose} />
    <div style={{ display: "grid", gap: 12, padding: "0 18px 28px" }}>
      <Notice tone="warning">Private beta preview. Provider-backed actions stay unavailable until their live services and approvals are verified.</Notice>
      {GROUPS.map((group) => <Card key={group.id}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
          <div><div style={{ fontFamily: "Manrope, Inter, sans-serif", fontSize: 20, fontWeight: 800 }}>{group.title}</div><div style={{ color: "#6B6B6B", fontSize: 12, lineHeight: 1.45, marginTop: 4 }}>{group.detail}</div></div>
          <Pill active>{group.screens.length}</Pill>
        </div>
        <div style={{ marginTop: 8 }}>
          {group.screens.map(([id, label]) => <Row key={id} title={label} trailing="›" onClick={() => onOpen(id)} />)}
        </div>
      </Card>)}
    </div>
  </Page>;
}

export function ExperienceNavigator({ screenId, onNavigate, onClose, onBeginLesson, onProgressChange, commerceReturn = null, door = "HINDUISM", lesson = 1, day = 1, progressState, tableState = null, catalogMode = false }) {
  const incomingProgress = JSON.stringify(progressState || {});
  const [liveProgressState, setLiveProgressState] = useState(() => progressState || {});
  const [selectedCamp, setSelectedCamp] = useState(1);
  const [selectedProgressWord, setSelectedProgressWord] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);
  const navigationHistory = useRef([]);
  // Opening the house map directly is the catalog entry. Deep links and
  // customer journeys remain customer-facing and leave the navigator when a
  // route returns to the house map.
  const catalogJourney = useRef(catalogMode || screenId === EXPERIENCE_HOME_ID);
  useEffect(() => setLiveProgressState(progressState || {}), [incomingProgress]);
  const today = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  })();
  const pathProgress = derivePathProgress(liveProgressState, door);
  const selectedCampProgress = pathProgress.camps.find((camp) => camp.camp === selectedCamp) || pathProgress.camps[0] || null;
  const selectedNextCamp = selectedCampProgress ? pathProgress.camps.find((camp) => camp.camp === selectedCampProgress.camp + 1) || null : null;
  const strand = deriveStrand(liveProgressState, door);
  const review = deriveReviewState(liveProgressState, today);

  if (!screenId || screenId === EXPERIENCE_HOME_ID || !SCREEN_MAP.has(screenId)) {
    return <Hub onClose={onClose} onOpen={onNavigate} />;
  }
  const entry = SCREEN_MAP.get(screenId);
  const [id, , listedComponent] = entry.screen;
  let Component = listedComponent;
  if (id === "mountain-map") Component = ProgressScreens.PathOverviewScreen;
  if (id === "strand-library") Component = ProgressScreens.StrandProgressScreen;
  if (id === "review-hub") Component = ProgressScreens.ReviewProgressScreen;
  if (id === "review-result") Component = ProgressScreens.ReviewResultProgressScreen;
  if (id === "camp-detail") {
    Component = selectedCampProgress?.complete
      ? ProgressScreens.CampCompletionScreen
      : selectedCampProgress?.arrived
        ? ProgressScreens.CampArrivalScreen
        : Curriculum.CampDetailScreen;
  }
  const prior = entry.index > 0 ? entry.group.screens[entry.index - 1][0] : EXPERIENCE_HOME_ID;
  const next = entry.index < entry.group.screens.length - 1 ? entry.group.screens[entry.index + 1][0] : EXPERIENCE_HOME_ID;
  const route = SCREEN_ROUTES[id] || {};
  const leaveOrNavigate = (destination) => {
    if (destination === EXPERIENCE_HOME_ID && !catalogJourney.current && onClose) {
      navigationHistory.current = [];
      onClose();
      return;
    }
    onNavigate(destination);
  };
  const navigateTo = (destination) => {
    if (!destination) return;
    if (destination !== id) navigationHistory.current.push(id);
    leaveOrNavigate(destination);
  };
  const goBack = () => {
    const visited = navigationHistory.current.pop();
    leaveOrNavigate(visited || route.back || prior);
  };
  if (!catalogJourney.current && ["account-sign-in", "account-sign-up", "account-password-reset"].includes(id)) {
    const origin = navigationHistory.current.at(-1) || null;
    return <AccountScreen
      initialMode={id === "account-sign-up" ? "sign-up" : id === "account-password-reset" ? "recovery" : "sign-in"}
      onClose={goBack}
      onAuthenticated={origin === "gift-claim-sign-in-handoff" ? () => navigateTo("gift-attach-to-account") : undefined}
    />;
  }
  const goNext = () => navigateTo(next);
  const routeHandlers = Object.fromEntries(Object.entries(route)
    .filter(([name]) => name !== "back")
    .map(([name, destination]) => [name, () => navigateTo(destination)]));
  const openPlan = (planId) => navigateTo(planId === "table" ? "table-plan-detail" : "plus-detail");
  const openLesson = (targetLesson = lesson) => {
    if (onBeginLesson) onBeginLesson(targetLesson);
    else if (onClose) onClose();
    else navigateTo("strand-library");
  };
  const completionHistory = Array.isArray(liveProgressState?.completionHistory) ? liveProgressState.completionHistory : [];
  const words = completionHistory
    .filter((item) => item?.door === door && typeof item.word === "string" && item.word.trim())
    .map((item) => ({ word: item.word, carry: item.carry || "", lesson: item.lesson, date: item.date }));
  const currentWord = words.find((item) => item.lesson === lesson) || words.at(-1) || null;
  const members = Array.isArray(tableState?.members) ? tableState.members : [];
  const selectedMember = members.find((member) => member.role !== "owner") || members[0] || null;
  const openCamp = (campNumber) => {
    if (Number.isInteger(campNumber)) setSelectedCamp(campNumber);
    navigateTo("camp-detail");
  };
  const startReview = (answers) => {
    const completed = completeReview(liveProgressState, { date: today, answers });
    setLiveProgressState(completed.state);
    setReviewResult(completed.result);
    onProgressChange?.(completed.state);
    navigateTo("review-result");
  };
  const continueCamp = (campNumber) => {
    if (!Number.isInteger(campNumber)) {
      navigateTo("mountain-map");
      return;
    }
    setSelectedCamp(campNumber);
    navigateTo("camp-detail");
  };
  const startPathStop = (targetLesson) => {
    const stop = pathProgress.stops.find((item) => item.lesson === targetLesson);
    if (targetLesson === pathProgress.currentLesson && stop?.canPreview) openLesson(targetLesson);
  };
  const common = {
    door, lesson, day,
    camp: id === "camp-detail" && (selectedCampProgress?.arrived || selectedCampProgress?.complete)
      ? selectedCampProgress
      : selectedCampProgress?.camp || selectedCamp,
    currentLesson: lesson,
    completedLessons: completionHistory.filter((item) => item?.door === door).map((item) => item.lesson),
    words, item: selectedProgressWord || currentWord, festival: null,
    milestone: day >= 100 ? 100 : day >= 21 ? 21 : 7,
    ambassador: { name: "Proposed voice", connected: false, day: 1 },
    table: tableState, members, member: selectedMember,
    today, streak: Number(liveProgressState?.showedUp) || 0,
    progress: pathProgress,
    strand,
    review,
    result: reviewResult,
    campProgress: selectedCampProgress,
    nextCamp: selectedNextCamp,
    doorLabel: pathProgress.label,
    onProgressChange,
    gift: null, localProfileReady: false,
    sessionId: commerceReturn?.sessionId || null,
    draft: { recipient: "", relationship: "a friend", giftSku: "first_100_days" },
    onBack: goBack, onContinue: goNext, onNavigate: navigateTo,
    onStart: goNext, onBegin: openLesson, onOpen: goNext, onAction: goNext,
    onLesson: goNext, onGuide: () => navigateTo("guide-consent"), onWord: () => navigateTo("word-detail"), onReview: () => navigateTo("review-hub"),
    onOpenPlan: openPlan, onCompare: () => navigateTo("plan-comparison"), onCheckout: goNext, onCheckoutReady: goNext, onRetry: goNext, onCancelled: goNext, onFailure: goNext, onManage: goNext, onChangePlan: goNext, onPaymentMethod: goNext, onPromise: goNext, onRefund: goNext, onStatus: goNext, onDone: goNext,
    onDraftChange: () => {}, onViewDelivery: goNext, onCheckAgain: goNext, onSignIn: goNext, onContinueLocally: goNext, onAttach: goNext, onRefresh: goNext,
    onCreate: goNext, onLearnMore: goNext, onChooseLink: goNext, onChooseContacts: goNext, onChooseCopy: goNext, onShare: goNext, onCopy: goNext, onAccept: goNext, onDecline: goNext, onInvite: goNext, onMember: goNext, onPending: goNext, onActivity: goNext, onStreak: goNext, onVoiceNote: goNext, onShowedUp: goNext, onMessage: goNext, onRemove: goNext, onResend: goNext, onRename: goNext, onTransfer: goNext, onLeave: goNext, onDelete: goNext, onStartRecording: goNext, onStop: goNext, onPlay: goNext, onSend: goNext, onConfirm: goNext,
    onChooseMetro: goNext, onSkip: goNext, onSelectMetro: goNext, onOpenDoor: goNext, onLiveRead: goNext, onReminder: goNext, onSave: goNext, onJoin: goNext, onQA: goNext, onQuestions: goNext, onReplay: goNext, onSubmitQuestion: goNext, onSelectEvent: goNext, onRSVP: goNext, onHost: goNext, onDirections: goNext, onReport: goNext, onClear: goNext, onOpenDirections: goNext, onSubmitReport: goNext,
    onOpenSource: goNext, onOpenReader: goNext, onOpenSources: goNext, onOpenConversation: goNext, onClearHistory: goNext, onHumanHelp: goNext, onReachedOut: goNext, onReturnToGuide: goNext, onUseLessonText: goNext,
    onOpenDownloads: goNext, onOpenCleanup: goNext, onVoiceChange: () => {}, onReadAlongChange: () => {},
    onInstall: goNext, onClaim: goNext, onOpenDocument: goNext,
    onCamp: goNext, onRanges: goNext, onAgain: goNext, onChoose: goNext, onOpenStrand: goNext, onCancel: goBack, onOpenCheckout: goNext,
    ...routeHandlers,
    ...(id === "mountain-map" ? { progress: pathProgress, onCamp: openCamp, onStrand: () => navigateTo("strand-library"), onReview: () => navigateTo("review-hub") } : {}),
    ...(id === "camp-detail" ? {
      currentLesson: pathProgress.currentLesson || lesson,
      completedLessons: completionHistory.filter((item) => item?.door === door).map((item) => item.lesson),
      campProgress: selectedCampProgress,
      nextCamp: selectedNextCamp,
      onStart: selectedCampProgress?.complete ? continueCamp : startPathStop,
      onContinue: continueCamp,
      onLesson: startPathStop,
      onStrand: () => navigateTo("strand-library"),
    } : {}),
    ...(id === "strand-library" ? { strand, onWord: (item) => { setSelectedProgressWord(item); navigateTo("word-detail"); }, onReview: () => navigateTo("review-hub") } : {}),
    ...(id === "review-hub" ? { review, onComplete: startReview, onWord: (item) => { setSelectedProgressWord(item); navigateTo("word-detail"); } } : {}),
    ...(id === "review-result" ? { result: reviewResult, onAgain: () => navigateTo("mountain-map") } : {}),
    ...(id === "plan-comparison" ? { onOpenPlan: openPlan } : {}),
    ...(id === "lesson-preview" ? { onBegin: openLesson } : {}),
  };
  const needsNavigatorBack = id === "widget-installed";
  return <div style={{ height: "100%", position: "relative" }}>
    {needsNavigatorBack && <button type="button" aria-label="Go back" onClick={goBack} style={{ position: "absolute", top: 6, left: 18, zIndex: 20, minHeight: 44, display: "inline-flex", alignItems: "center", gap: 5, border: 0, background: "transparent", color: "#0A0A0A", padding: 0, fontFamily: "Inter, system-ui, sans-serif", fontSize: 10, lineHeight: 1.2, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", cursor: "pointer" }}><span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>‹</span>back</button>}
    <div style={{ height: "100%", boxSizing: "border-box", paddingTop: needsNavigatorBack ? 44 : 0 }}>
      <Suspense fallback={<Page><Header eyebrow="the whole house" title="Opening the next room…" onBack={goBack} /><div style={{ padding: "0 18px" }}><Card dark><SunMark size={54} /><div style={{ marginTop: 10 }}>Just a moment.</div></Card></div></Page>}><Component {...common} /></Suspense>
    </div>
    {catalogJourney.current && <Button kind="light" fullWidth={false} onClick={() => leaveOrNavigate(EXPERIENCE_HOME_ID)} aria-label="Back to all screens" style={{ position: "absolute", right: 12, bottom: 12, zIndex: 20, width: 46, height: 46, minHeight: 46, padding: 0, border: "1px solid #E3E3DE", boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}><SunMark size={24} title={`Back to all screens from ${id}`} /></Button>}
  </div>;
}
