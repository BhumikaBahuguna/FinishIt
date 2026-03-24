# Notification UI Update Plan

Currently, the user experiences repetitive popups for important notifications (like deadlines). The goal is to replace this behavior with a more subtle "blinking red light" on the notification navigation button. 

## Proposed Changes

### [MODIFY] [frontend/src/features/notifications/providers/NotificationProvider.jsx](file:///home/satyamsiuu/Documents/Coding/FinishIt/frontend/src/features/notifications/providers/NotificationProvider.jsx)
- Disable `emitBrowserNotification` in `publishNewNotifications` for important notifications. This will stop the annoying popups.

### [MODIFY] [frontend/src/styles/base/globals.css](file:///home/satyamsiuu/Documents/Coding/FinishIt/frontend/src/styles/base/globals.css)
- Add a new `.blinking-dot` CSS class with a simple keyframe animation for a pulsing red dot.
- Add new styles for the [NotificationCenter](file:///home/satyamsiuu/Documents/Coding/FinishIt/frontend/src/features/notifications/components/NotificationCenter.jsx#11-115) dropdown (`.notification-dropdown-container`, `.notification-bell`, `.notification-dropdown`).

### [MODIFY] [frontend/src/shared/components/navigation/AppSidebar.jsx](file:///home/satyamsiuu/Documents/Coding/FinishIt/frontend/src/shared/components/navigation/AppSidebar.jsx)
- Make the component call `useNotifications()` hook.
- Identify if there are unread important notifications (e.g., `notifications.some(n => !n.isRead && (n.severity === 'critical' || n.severity === 'warning'))`).
- Display the blinking red dot next to the "Notifications" text inside the `NavLink` when there are unread important notifications.

### [MODIFY] [frontend/src/features/notifications/components/NotificationCenter.jsx](file:///home/satyamsiuu/Documents/Coding/FinishIt/frontend/src/features/notifications/components/NotificationCenter.jsx)
- Convert the static inline list into a layout topbar widget (a Bell Icon/button). 
- Clicking the bell will toggle a dropdown menu.
- The dropdown will dynamically filter `notifications.filter(n => !n.isRead)`. This ensures read notifications immediately vanish from this menu.

### [MODIFY] [frontend/src/features/notifications/services/notificationEngine.js](file:///home/satyamsiuu/Documents/Coding/FinishIt/frontend/src/features/notifications/services/notificationEngine.js)
- Change the `horizonHours` default parameter in [buildUpcomingDeadlineNotifications](file:///home/satyamsiuu/Documents/Coding/FinishIt/frontend/src/features/notifications/services/notificationEngine.js#65-101) from `24` to `4`.
- This ensures users are only reminded of approaching deadlines 4 hours before they are due, reducing notification spam.

## Phase 3 Proposed Changes: Eisenhower Matrix Styling

### [MODIFY] [frontend/src/styles/base/globals.css](file:///home/satyamsiuu/Documents/Coding/FinishIt/frontend/src/styles/base/globals.css)
- Add dynamic background and border color classes for the four matrix quadrants matching the user's color requirements (Red, Yellow, Blue, Green in pastel/soft variants for readability).
- `.matrix-quadrant-urgent_important` -> Soft Red
- `.matrix-quadrant-important_not_urgent` -> Soft Yellow
- `.matrix-quadrant-urgent_not_important` -> Soft Blue 
- `.matrix-quadrant-not_urgent_not_important` -> Soft Green

### [MODIFY] [frontend/src/features/tasks/pages/TaskManagementPage.jsx](file:///home/satyamsiuu/Documents/Coding/FinishIt/frontend/src/features/tasks/pages/TaskManagementPage.jsx)
- Dynamically attach the proper `matrix-quadrant-{theme}` CSS class to the rendering `<article>` tag.

### [MODIFY] [frontend/src/features/dashboard/components/PrioritizedTaskSections.jsx](file:///home/satyamsiuu/Documents/Coding/FinishIt/frontend/src/features/dashboard/components/PrioritizedTaskSections.jsx)
- Dynamically attach the proper `matrix-quadrant-{theme}` CSS class to the rendering `<article>` tag.

## Verification Plan
1. Local testing: Add a mock important notification and observe the sidebar without getting browser popups.
2. Verify that the blinking dot clears when notifications are marked read. 
3. Verify the bell dropdown opens correctly and items disappear when marked as read.
4. Verify the Eisenhower matrix backgrounds show the correct Red, Yellow, Blue, and Green colors in both the Dashboard and the Task Management pages!
