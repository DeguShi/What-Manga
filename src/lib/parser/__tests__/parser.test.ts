/**
 * Parser Unit Tests
 */
import { describe, it, expect } from 'vitest';
import { parseFile, exportToCsv } from '../index';
import type { Status } from '../types';

describe('parseFile', () => {
    describe('basic parsing', () => {
        it('parses a simple entry with title and index', () => {
            const input = `1- Naruto 
(*72 vol. do mangá + LNs).
{10}`;
            const result = parseFile(input);
            expect(result.entries).toHaveLength(1);
            expect(result.entries[0].userIndex).toBe(1);
            expect(result.entries[0].title).toBe('Naruto');
        });

        it('parses entry with in-progress status (~)', () => {
            const input = `2- Akame Ga Kill 
(~78º chap. do mangá).
{8.7}`;
            const result = parseFile(input);
            expect(result.entries[0].status).toBe('IN_PROGRESS');
            expect(result.entries[0].mangaProgress?.current).toBe(78);
            expect(result.entries[0].mangaProgress?.unit).toBe('chapter');
        });

        it('parses entry with completed status (*)', () => {
            const input = `1- Naruto 
(*72 vol. do mangá + LNs).
{10}`;
            const result = parseFile(input);
            expect(result.entries[0].status).toBe('COMPLETED');
            expect(result.entries[0].mangaProgress?.current).toBe(72);
            expect(result.entries[0].mangaProgress?.unit).toBe('volume');
        });

        it('parses entry with incomplete status (∆)', () => {
            const input = `14- Devils Line 
(∆55º chap. do mangá).
{6.2}`;
            const result = parseFile(input);
            expect(result.entries[0].status).toBe('INCOMPLETE');
            expect(result.entries[0].mangaProgress?.current).toBe(55);
        });

        it('parses entry with dropped/hiatus status (r.π)', () => {
            const input = `41- Unbalance x 3 
(r.π71.1º chap. do mangá).
{6.7}`;
            const result = parseFile(input);
            expect(result.entries[0].status).toBe('DROPPED_HIATUS');
            expect(result.entries[0].mangaProgress?.current).toBe(71.1);
        });
    });

    describe('decimal progress', () => {
        it('parses decimal chapter numbers', () => {
            const input = `17- Isekai Maou 
(~65.1º chap. do mangá).
{8.3}`;
            const result = parseFile(input);
            expect(result.entries[0].mangaProgress?.current).toBe(65.1);
        });

        it('parses r.π with decimal', () => {
            const input = `41- Test Manga 
(r.π71.1º chap. do mangá).
{6.0}`;
            const result = parseFile(input);
            expect(result.entries[0].mangaProgress?.current).toBe(71.1);
            expect(result.entries[0].status).toBe('DROPPED_HIATUS');
        });
    });

    describe('uncertain status', () => {
        it('parses uncertain progress with ?', () => {
            const input = `4- Nanatsu no Taizai 
(~317º? chap. do mangá).
{8.0}`;
            const result = parseFile(input);
            expect(result.entries[0].status).toBe('UNCERTAIN');
            expect(result.entries[0].mangaProgress?.current).toBe(317);
            expect(result.entries[0].mangaProgress?.isUncertain).toBe(true);
        });
    });

    describe('novel tracking', () => {
        it('parses novel progress in brackets', () => {
            const input = `18- Tensei Shitara Slime Datta Ken 
(~78º chap. do mangá); 
(*249º chap. da Novel).
{9.3}`;
            const result = parseFile(input);
            expect(result.entries[0].novelProgress).not.toBeNull();
            expect(result.entries[0].novelProgress?.current).toBe(249);
        });

        it('parses novel progress with extra info (Livro N)', () => {
            const input = `148- The Beginning After The End 
(~61º chap. do mangá).
(~217 chap. da LN (Livro 7)). 
{8.7}`;
            const result = parseFile(input);
            expect(result.entries[0].novelProgress?.current).toBe(217);
        });
    });

    describe('score parsing', () => {
        it('parses integer scores', () => {
            const input = `1- Naruto 
(*72 vol. do mangá).
{10}`;
            const result = parseFile(input);
            expect(result.entries[0].score).toBe(10);
        });

        it('parses decimal scores', () => {
            const input = `2- Test 
(~50º chap. do mangá).
{8.7}`;
            const result = parseFile(input);
            expect(result.entries[0].score).toBe(8.7);
        });

        it('parses very low scores', () => {
            const input = `916- Test Low 
(~17º chap. do manga)
{0.5}`;
            const result = parseFile(input);
            expect(result.entries[0].score).toBe(0.5);
        });
    });

    describe('multiple entries', () => {
        it('parses multiple entries correctly', () => {
            const input = `1- Naruto 
(*72 vol. do mangá).
{10}


2- One Piece 
(~922º chap. do mangá).
{9.0}


3- Attack on Titan 
(~126º chap. do mangá).
{9.9}`;
            const result = parseFile(input);
            expect(result.entries).toHaveLength(3);
            expect(result.entries[0].title).toBe('Naruto');
            expect(result.entries[1].title).toBe('One Piece');
            expect(result.entries[2].title).toBe('Attack on Titan');
        });
    });

    describe('volume + chapter combo', () => {
        it('parses volume and chapter together', () => {
            const input = `19- Kenja no Mago 
(~13º vol. 57º chap. do mangá).
{8.0}`;
            const result = parseFile(input);
            expect(result.entries[0].mangaProgress?.unit).toBe('mixed');
            // Should capture the chapter number (more granular)
            expect(result.entries[0].mangaProgress?.current).toBe(57);
        });
    });

    describe('season format', () => {
        it('parses season-based progress', () => {
            const input = `8- Rosario + Vampire 
(*Season 1 + *Season 2 do mangá).
{9.1}`;
            const result = parseFile(input);
            expect(result.entries[0].mangaProgress?.unit).toBe('season');
            expect(result.entries[0].mangaProgress?.current).toBe(2);
            expect(result.entries[0].status).toBe('COMPLETED');
        });
    });

    describe('edge cases', () => {
        it('handles missing progress info gracefully', () => {
            const input = `919-`;
            const result = parseFile(input);
            // Should skip empty entries
            expect(result.entries).toHaveLength(0);
        });

        it('preserves raw block text', () => {
            const input = `1- Naruto 
(*72 vol. do mangá + LNs).
{10}`;
            const result = parseFile(input);
            expect(result.entries[0].rawBlock).toContain('Naruto');
            expect(result.entries[0].rawBlock).toContain('72 vol.');
        });

        it('handles typos in "manga" (both mangá and manga)', () => {
            const input = `410- Sewayaki Kitsune no Senko-san 
(~46º chap. do manga).
{7.7}`;
            const result = parseFile(input);
            expect(result.entries[0].mangaProgress).not.toBeNull();
            expect(result.entries[0].mangaProgress?.current).toBe(46);
        });
    });
});

describe('exportToCsv', () => {
    it('exports entries to CSV format', () => {
        const input = `1- Naruto 
(*72 vol. do mangá).
{10}`;
        const result = parseFile(input);
        const csv = exportToCsv(result.entries);

        expect(csv).toContain('Index,Title,Status');
        expect(csv).toContain('1,"Naruto",COMPLETED');
    });

    it('handles titles with quotes', () => {
        const input = `1- Test "Quoted" Title 
(~50º chap. do mangá).
{7.0}`;
        const result = parseFile(input);
        const csv = exportToCsv(result.entries);

        // Quotes should be escaped
        expect(csv).toContain('Test ""Quoted"" Title');
    });
});
