import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Supabase URL is not configured');
}

const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseKey) {
  throw new Error('Supabase key is not configured');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

export async function uploadImageToSupabase(buffer: Buffer, filename: string) {
  const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  const { data, error } = await supabase.storage.from(bucketName).upload(filename, uint8, {
    cacheControl: '3600',
    upsert: false,
    contentType: 'image/jpeg',
  });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(error.message);
  }

  if (!data?.path) {
    throw new Error('Supabase returned empty path');
  }

  const { data: publicUrlData, error: publicUrlError } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  if (publicUrlError) {
    console.error('Supabase public URL error:', publicUrlError);
    throw new Error(publicUrlError.message);
  }

  return publicUrlData.publicUrl;
}
