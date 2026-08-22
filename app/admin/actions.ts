'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail } from '@/lib/admin';

export async function updateCompetitorLimit(formData: FormData) {
  // Server Actions can be invoked directly, not just via the form they're
  // attached to, so re-check the caller is the admin every time — the
  // middleware/page-level checks alone aren't enough here.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    throw new Error('Unauthorized');
  }

  const userId = formData.get('userId');
  const limitRaw = formData.get('limit');

  if (typeof userId !== 'string' || !userId) {
    throw new Error('Missing userId');
  }

  const limit = Number(limitRaw);
  if (!Number.isFinite(limit) || limit < 0) {
    throw new Error('Invalid limit');
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ competitor_limit: Math.floor(limit) })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin');
}
