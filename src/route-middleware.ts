import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { siteSection } from './lib/site-section';

// Blog pages: no left-hand sidebar, no empty "On this page" column (the index and tag pages have no headings),
// and the tab title and og:site_name say "troupe blog" rather than the Starlight-wide "troupe docs".
// Runs after starlight-blog's own middleware (await next()), which builds the blog sidebar.
export const onRequest = defineRouteMiddleware(async (context, next) => {
  await next();
  const route = context.locals.starlightRoute;
  if (siteSection(route.id) !== 'blog') return;
  route.hasSidebar = false;
  // Starlight always lists the page top ("Overview"); with nothing else, the column would sit empty.
  if (route.toc && route.toc.items.length <= 1) route.toc = undefined;
  for (const entry of route.head) {
    if (entry.tag === 'title' && entry.content) entry.content = entry.content.replace(/troupe docs$/, 'troupe blog');
    if (entry.tag === 'meta' && entry.attrs?.property === 'og:site_name') entry.attrs.content = 'troupe blog';
  }
});
