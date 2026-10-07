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
      components: {
        MarkdownContent: './src/components/docs/MarkdownContent.astro',
      },
      sidebar: [
        { label: 'Programme', items: [
          { slug: 'docs/programme/what-is-troupe' },
          { slug: 'docs/programme/status-and-roadmap' },
          { slug: 'docs/programme/principles' },
        ] },
        { label: 'Opening night', items: [
          { slug: 'docs/opening-night/install' },
          { slug: 'docs/opening-night/first-theatre' },
          { slug: 'docs/opening-night/first-performance' },
        ] },
        { label: 'The company', items: [
          { slug: 'docs/the-company/theatres' },
          { slug: 'docs/the-company/roles-and-actors' },
          { slug: 'docs/the-company/performances-and-runs' },
          { slug: 'docs/the-company/flows' },
          { slug: 'docs/the-company/gates-and-decisions' },
          { slug: 'docs/the-company/escalation' },
          { slug: 'docs/the-company/notes' },
          { slug: 'docs/the-company/lineage' },
          { slug: 'docs/the-company/guests' },
          { slug: 'docs/the-company/the-house' },
        ] },
        { label: 'Stagecraft', items: [
          { slug: 'docs/stagecraft/configure-roles' },
          { slug: 'docs/stagecraft/route-decisions' },
          { slug: 'docs/stagecraft/build-a-flow' },
          { slug: 'docs/stagecraft/bring-your-own-agent' },
          { slug: 'docs/stagecraft/hand-edit-config' },
          { slug: 'docs/stagecraft/write-a-guest' },
          { slug: 'docs/stagecraft/read-the-lineage' },
        ] },
        { label: 'Prompt book', items: [
          { slug: 'docs/prompt-book/cli' },
          { slug: 'docs/prompt-book/config-schema' },
          { slug: 'docs/prompt-book/events' },
          { slug: 'docs/prompt-book/guest-manifest' },
          { slug: 'docs/prompt-book/glossary' },
        ] },
        { label: 'Backstage', items: [
          { slug: 'docs/backstage/contributing' },
          { slug: 'docs/backstage/licensing' },
          { slug: 'docs/backstage/changelog' },
        ] },
      ],
    }),
  ],
});
