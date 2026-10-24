import { ZodError } from 'zod';
import { HttpError } from './auth';
import { dbErrorMessage } from './db';

// Wraps a route handler so every error becomes a clean JSON response.
export function handle(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
      if (err instanceof ZodError) return Response.json({ error: err.issues[0].message }, { status: 400 });
      const dbMessage = err.code && dbErrorMessage(err);
      if (dbMessage) return Response.json({ error: dbMessage }, { status: 400 });
      console.error(err);
      return Response.json({ error: 'Something went wrong on the server. Try again.' }, { status: 500 });
    }
  };
}

export const idParam = async (ctx) => {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Not found');
  return id;
};
