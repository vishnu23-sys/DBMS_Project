import { handle } from '@/lib/api';
import { HttpError, apiUser } from '@/lib/auth';
import { runReport, toCsv } from '@/lib/reports';

// GET /api/reports/<key>          -> JSON
// GET /api/reports/<key>?csv=1    -> CSV download
export const GET = handle(async (req, ctx) => {
  await apiUser(['staff', 'admin']);
  const { key } = await ctx.params;
  const report = await runReport(key);
  if (!report) throw new HttpError(404, 'Unknown report');

  if (new URL(req.url).searchParams.has('csv')) {
    return new Response(toCsv(report.rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${key}.csv"`,
      },
    });
  }
  return Response.json(report);
});
