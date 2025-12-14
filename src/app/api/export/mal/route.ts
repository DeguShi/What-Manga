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

export async function GET() {
    try {
        const works = await prisma.work.findMany({
            orderBy: { userIndex: 'asc' },
        });

        // Build MAL XML format - matching exact structure from MAL export
        let xml = `<?xml version="1.0" encoding="UTF-8" ?>

<!--
 Created by What-Manga Export
 Compatible with MyAnimeList.net Import
 Version 1.1.0
-->

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
            // Round score: 0.5+ rounds up, else rounds down (standard Math.round behavior)
            const score = work.score ? Math.round(work.score) : 0;
            const volumes = work.mangaProgressUnit === 'volume' && work.mangaProgressCurrent
                ? Math.floor(work.mangaProgressCurrent)
                : 0;

            xml += `
			<manga>
				<manga_mangadb_id>0</manga_mangadb_id>
				<manga_title><![CDATA[${work.title}]]></manga_title>
				<manga_volumes>0</manga_volumes>
				<manga_chapters>0</manga_chapters>
				<my_id>0</my_id>
				<my_read_volumes>${volumes}</my_read_volumes>
				<my_read_chapters>${chapters}</my_read_chapters>
				<my_start_date>0000-00-00</my_start_date>
				<my_finish_date>0000-00-00</my_finish_date>
				<my_scanalation_group><![CDATA[]]></my_scanalation_group>
				<my_score>${score}</my_score>
				<my_storage></my_storage>
				<my_retail_volumes>0</my_retail_volumes>
				<my_status>${STATUS_MAP[work.status] || 'Reading'}</my_status>
				<my_comments><![CDATA[${work.reviewNote || ''}]]></my_comments>
				<my_times_read>0</my_times_read>
				<my_tags><![CDATA[]]></my_tags>
				<my_priority>Medium</my_priority>
				<my_reread_value></my_reread_value>
				<my_rereading>NO</my_rereading>
				<my_discuss>YES</my_discuss>
				<my_sns>default</my_sns>
				<update_on_import>1</update_on_import>
			</manga>
		`;
        }

        xml += `
	</myanimelist>
`;

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
