import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { handle } from '@/lib/api';
import { HttpError, apiUser, isStaff } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { ensureEmbedding, refreshMatchesAndNotify } from '@/lib/matching';
import { logActivity } from '@/lib/mongo';
import { itemSchema } from '@/lib/validators';

const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

async function saveImage(file) {
  if (!file || typeof file === 'string' || file.size === 0) return null;
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new HttpError(400, 'Photo must be a JPG, PNG or WebP image');
  if (file.size > MAX_IMAGE_BYTES) throw new HttpError(400, 'Photo must be smaller than 3 MB');
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(process.cwd(), 'public', 'uploads', name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

// Report a lost or found item. Students' reports wait for moderation;
// reports filed by staff go live immediately.
export const POST = handle(async (req) => {
  const session = await apiUser();
  const form = await req.formData();
  const data = itemSchema.parse(Object.fromEntries([...form.entries()].filter(([k]) => k !== 'image')));
  const imageUrl = await saveImage(form.get('image'));
  const status = isStaff(session) ? 'open' : 'pending';

  const itemId = await withTransaction(session.userId, async (db) => {
    const { rows: [item] } = await db.query(
      `INSERT INTO items (reporter_id, category_id, location_id, storage_location_id, report_type,
                          title, description, color, brand, event_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING item_id`,
      [session.userId, data.categoryId, data.locationId, data.storageLocationId, data.reportType,
       data.title, data.description, data.color, data.brand, data.eventDate, status],
    );
    if (data.question) {
      await db.query(
        'INSERT INTO verification_questions (item_id, question, expected_answer) VALUES ($1, $2, $3)',
        [item.item_id, data.question, data.answer],
      );
    }
    if (imageUrl) {
      await db.query('INSERT INTO item_images (item_id, image_url) VALUES ($1, $2)', [item.item_id, imageUrl]);
    }
    return item.item_id;
  });

  await ensureEmbedding(itemId);
  if (status === 'open') await refreshMatchesAndNotify(itemId);
  await logActivity(session, 'report_item', { itemId, type: data.reportType });

  return Response.json({ itemId, status });
});
