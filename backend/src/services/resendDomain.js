export function selectVerifiedSenderDomain(domains = []) {
  return [...domains]
    .filter((domain) => domain.status === 'verified' && domain.capabilities?.sending === 'enabled')
    .sort((a, b) => a.name.localeCompare(b.name))[0]?.name || '';
}
