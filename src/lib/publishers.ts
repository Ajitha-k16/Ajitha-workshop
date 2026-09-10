/*
 * Publisher query helpers for the Tailspin Toys catalog.
 *
 * These helpers accept an injectable database instance so the same lookup logic
 * can be reused by Astro build-time pages and by in-memory test databases.
 */
import { asc } from 'drizzle-orm';
import type { Database } from './db';
import { publishers } from '../../db/schema';
import type { Publisher } from '../types/game';

/**
 * Retrieves every publisher in alphabetical order.
 *
 * @param db - The database connection used to query publisher records.
 * @returns A promise that resolves to the publishers sorted by `name`.
 */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    return db
        .select({ id: publishers.id, name: publishers.name })
        .from(publishers)
        .orderBy(asc(publishers.name));
}
