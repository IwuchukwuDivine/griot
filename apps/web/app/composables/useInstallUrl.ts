/** The "Add to Slack" href, derived from the deployed API base. */
export function useInstallUrl(): string {
  const { baseUrl } = useRuntimeConfig().public;
  return baseUrl ? `${baseUrl}/slack/install` : "#";
}
