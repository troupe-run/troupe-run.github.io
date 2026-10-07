export const TOPIC_ICONS = ['repo', 'role', 'research', 'record', 'edit', 'plug', 'branch'] as const;
export type TopicIconName = (typeof TOPIC_ICONS)[number];
