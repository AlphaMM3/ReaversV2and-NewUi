// Later approvals are recorded in docs/ATTENDANCE-LOCAL-POLICY.md, not inferred.
export const workflowApprovals = {
  latestActionableCatchup: true,
  actualStartAndExactClocks: true,
  remainingLeaveTimeAndRepeatReset: true,
  newAbsenceEpisodeAndContactCompletion: true,
  managementPrivacyAndTerminalActions: false,
  overlappingAndRetroactiveLeave: false,
  guardianUrgentPreference: false,
} as const;
