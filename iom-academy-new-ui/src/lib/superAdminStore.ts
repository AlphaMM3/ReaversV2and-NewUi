/**
 * Super Admin Store & Configuration Hub (Refactored Clean Architecture Barrel)
 * 
 * Re-exports modular domain sub-stores to guarantee 100% backward compatibility
 * across all existing imports in the application.
 */

// 1. Core Storage & Sync Engine
export * from './stores/useLocalStore'

// 2. Role-Based Access Control (RBAC) & Navigation Visibility
export * from './stores/rbacStore'

// 3. Finance, Expenses, Fee Plans & Guardian Ledgers
export * from './stores/financeStore'

// 4. Academic Governance, Milestones, Classes, Staff & Notices
export * from './stores/academicStore'

// 5. User Directory, Presence & Account Statuses
export * from './stores/userProfilesStore'

// 6. Media Utilities (Legacy compatibility)
export { compressImageToDataUrl, readFileAsAttachment } from '@/lib/mediaUtils'
