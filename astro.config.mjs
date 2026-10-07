import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://troupe.run',
  trailingSlash: 'always',
  redirects: { '/docs': '/docs/programme/what-is-troupe/' },
  integrations: [
    starlight({
      title: 'troupe docs',
      editLink: { baseUrl: 'https://github.com/troupe-run/troupe-run.github.io/edit/main/' },
      lastUpdated: true,
      sidebar: [
        { label: 'Programme', items: [{ slug: 'docs/programme/what-is-troupe' }] },
      ],
    }),
  ],
});
