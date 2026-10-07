import { getEntry, type CollectionEntry } from 'astro:content';

type CopyData = CollectionEntry<'copy'>['data'];
type Section = CopyData['section'];

export async function getCopy<S extends Section>(section: S): Promise<Extract<CopyData, { section: S }>> {
  const entry = await getEntry('copy', section);
  if (!entry || entry.data.section !== section) throw new Error(`Missing copy for section: ${section}`);
  return entry.data as Extract<CopyData, { section: S }>;
}
