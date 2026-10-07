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
      customCss: [
        '@fontsource-variable/bricolage-grotesque',
        '@fontsource-variable/dm-sans',
        '@fontsource/dm-mono/400.css',
        '@fontsource/dm-mono/500.css',
        './src/styles/tokens.css',
        './src/styles/starlight.css',
      ],
      sidebar: [
        { label: 'Programme', items: [{ slug: 'docs/programme/what-is-troupe' }] },
      ],
    }),
  ],
});
