import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// MAL Status mapping
const STATUS_MAP: Record<string, string> = {
    IN_PROGRESS: 'Reading',
    COMPLETED: 'Completed',
    INCOMPLETE: 'On-Hold',
    UNCERTAIN: 'On-Hold',
    DROPPED_HIATUS: 'Dropped',
};

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export async function GET() {
    try {
        const works = await prisma.work.findMany({
            orderBy: { userIndex: 'asc' },
        });

        // Build MAL XML format
        const now = new Date().toISOString().split('T')[0];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<myanimelist>
  <myinfo>
    <user_id>0</user_id>
    <user_name>WhatMangaExport</user_name>
    <user_export_type>2</user_export_type>
    <user_total_manga>${works.length}</user_total_manga>
    <user_total_reading>${works.filter(w => w.status === 'IN_PROGRESS').length}</user_total_reading>
    <user_total_completed>${works.filter(w => w.status === 'COMPLETED').length}</user_total_completed>
    <user_total_onhold>${works.filter(w => w.status === 'INCOMPLETE' || w.status === 'UNCERTAIN').length}</user_total_onhold>
    <user_total_dropped>${works.filter(w => w.status === 'DROPPED_HIATUS').length}</user_total_dropped>
    <user_total_plantoread>0</user_total_plantoread>
  </myinfo>
`;

        for (const work of works) {
            const chapters = work.mangaProgressCurrent ? Math.floor(work.mangaProgressCurrent) : 0;
            const score = work.score ? Math.round(work.score) : 0;

            xml += `
  <manga>
    <manga_mangadb_id>0</manga_mangadb_id>
    <manga_title><![CDATA[${work.title}]]></manga_title>
    <manga_volumes>0</manga_volumes>
    <manga_chapters>0</manga_chapters>
    <my_id>0</my_id>
    <my_read_volumes>0</my_read_volumes>
    <my_read_chapters>${chapters}</my_read_chapters>
    <my_start_date>0000-00-00</my_start_date>
    <my_finish_date>${work.status === 'COMPLETED' ? now : '0000-00-00'}</my_finish_date>
    <my_score>${score}</my_score>
    <my_status>${STATUS_MAP[work.status] || 'Reading'}</my_status>
    <my_reread>0</my_reread>
    <my_reread_value></my_reread_value>
    <my_tags><![CDATA[${work.reviewNote || ''}]]></my_tags>
    <my_comments><![CDATA[${work.rawImportedText ? 'Imported from What-Manga\n' + work.mangaProgressRaw : ''}]]></my_comments>
    <update_on_import>1</update_on_import>
  </manga>`;
        }

        xml += `
</myanimelist>`;

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Content-Disposition': `attachment; filename="manga-list-mal-${new Date().toISOString().split('T')[0]}.xml"`,
            },
        });
    } catch (error) {
        console.error('Error exporting MAL XML:', error);
        return NextResponse.json(
            { error: 'Failed to export MAL XML' },
            { status: 500 }
        );
    }
}
