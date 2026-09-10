/*
 * Typed, injectable data-access helpers for querying games and their related
 * category and publisher records from the SQLite database.
 */
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Game } from '../types/game';

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

/** Optional category and publisher filters for game queries. */
export interface GameFilters {
    categoryIds?: number[];
    publisherIds?: number[];
}

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

/**
 * Retrieves games matching the selected category and publisher filters.
 *
 * Multiple values within a filter are combined with OR semantics, while
 * category and publisher filters are combined with AND semantics.
 *
 * @param db - The database connection used to query games.
 * @param filters - Optional category and publisher IDs to match.
 * @returns A promise that resolves to matching games ordered by title.
 */
export async function getFilteredGames(db: Database, filters: GameFilters = {}): Promise<Game[]> {
    const conditions = [];

    if (filters.categoryIds && filters.categoryIds.length > 0) {
        conditions.push(inArray(games.categoryId, filters.categoryIds));
    }

    if (filters.publisherIds && filters.publisherIds.length > 0) {
        conditions.push(inArray(games.publisherId, filters.publisherIds));
    }

    const query = baseGamesQuery(db);
    const rows = conditions.length > 0
        ? await query.where(and(...conditions)).orderBy(asc(games.title))
        : await query.orderBy(asc(games.title));

    return rows.map(mapGame);
}

/** Retrieves all games ordered by title. */
export async function getAllGames(db: Database): Promise<Game[]> {
    return getFilteredGames(db);
}

/**
 * Retrieves all game IDs ordered by their game titles.
 *
 * @param db - The database connection used to query games.
 * @returns A promise that resolves to game IDs ordered by title.
 */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/**
 * Retrieves a single game by ID.
 *
 * @param db - The database connection used to query the game.
 * @param id - The game ID to retrieve.
 * @returns A promise that resolves to the matching game or `null` when absent.
 */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const row = await baseGamesQuery(db).where(eq(games.id, id)).get();
    return row ? mapGame(row) : null;
}
