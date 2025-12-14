/**
 * Regex patterns for parsing the manga list format
 */

/**
 * Matches entry headers: "N- Title" or "N-Title"
 * Captures: index number, title (with flexible spacing)
 */
export const ENTRY_HEADER_PATTERN = /^(\d+)-\s*(.+)$/;

/**
 * Matches manga progress lines
 * Examples:
 * - (~78º chap. do mangá).
 * - (*72 vol. do mangá + LNs).
 * - (∆55º chap. do mangá).
 * - (r.π71.1º chap. do mangá).
 * - (~317º? chap. do mangá).
 * - (*Season 1 + *Season 2 do mangá).
 * - (~13º vol. 57º chap. do mangá).
 */
export const MANGA_PROGRESS_PATTERN = /\(([~*∆]|r\.π)?(\d+(?:\.\d+)?)?º?\??\s*(?:vol\.?|chap\.?|cap\.?|Season)?.*?(?:do\s+)?mang[aá]/i;

/**
 * Matches novel progress lines
 * Examples:
 * - [*249º chap. da Novel].
 * - [~217 chap. da LN (Livro 7)].
 * - (~494º chap. da novel).
 */
export const NOVEL_PROGRESS_PATTERN = /[\[\(]([~*∆]|r\.π)?(\d+(?:\.\d+)?)?º?\s*(?:chap\.?|cap\.?|vol\.?)?.*?(?:da\s+)?(?:novel|ln|light\s*novel)/i;

/**
 * Matches score in braces: {N.N} or {N}
 */
export const SCORE_PATTERN = /\{(\d+(?:\.\d+)?)\}/;

/**
 * Matches status symbols at the start of progress text
 */
export const STATUS_SYMBOL_PATTERN = /^([~*∆]|r\.π)/;

/**
 * Matches uncertain marker (?) after a number
 */
export const UNCERTAIN_PATTERN = /(\d+(?:\.\d+)?)\s*º?\s*\?/;

/**
 * Matches numeric progress value with optional decimal
 */
export const PROGRESS_NUMBER_PATTERN = /(\d+(?:\.\d+)?)\s*º?/;

/**
 * Matches volume + chapter combo: "13º vol. 57º chap."
 */
export const VOLUME_CHAPTER_COMBO_PATTERN = /(\d+(?:\.\d+)?)\s*º?\s*vol\.?\s*(\d+(?:\.\d+)?)\s*º?\s*(?:chap|cap)/i;

/**
 * Matches season format: "Season 1", "Season 2", etc.
 */
export const SEASON_PATTERN = /Season\s*(\d+)/gi;

/**
 * Extract the unit type from progress text
 */
export function detectUnit(text: string): 'chapter' | 'volume' | 'season' | 'mixed' | 'unknown' {
    const lowerText = text.toLowerCase();

    // Check for volume + chapter combo
    if (VOLUME_CHAPTER_COMBO_PATTERN.test(text)) {
        return 'mixed';
    }

    // Check for season
    if (/season/i.test(text)) {
        return 'season';
    }

    // Check for volume first (more specific)
    if (/vol\.?/i.test(text)) {
        return 'volume';
    }

    // Check for chapter
    if (/chap\.?|cap\.?/i.test(text)) {
        return 'chapter';
    }

    return 'unknown';
}

/**
 * Matches a complete parenthetical progress block
 */
export const PARENTHETICAL_BLOCK_PATTERN = /\([^)]*(?:mang[aá]|novel|ln)[^)]*\)/gi;

/**
 * Matches a complete bracketed progress block
 */
export const BRACKETED_BLOCK_PATTERN = /\[[^\]]*(?:mang[aá]|novel|ln)[^\]]*\]/gi;

/**
 * Matches extra notes like "Livro 7", "(270 Raw)"
 */
export const EXTRA_NOTES_PATTERN = /\(Livro\s*(\d+)\)|\((\d+)\s*Raw\)/i;
