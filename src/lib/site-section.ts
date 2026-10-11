/** Which part of the site a Starlight route belongs to: the blog (`blog/…`) or the docs (everything else). */
export function siteSection(routeId: string): 'docs' | 'blog' {
  return routeId === 'blog' || routeId.startsWith('blog/') ? 'blog' : 'docs';
}
