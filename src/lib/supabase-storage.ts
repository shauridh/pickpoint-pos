import { createClient } from '@supabase/supabase-js';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;

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

  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  return supabaseInstance;
};

const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

type UploadOptions = {
  buffer: Buffer | Uint8Array;
  filename: string;
  contentType?: string;
  folder?: string;
  bucket?: string;
};

export async function uploadImageToSupabase({
  buffer,
  filename,
  contentType = 'image/jpeg',
  folder = 'drops',
  bucket = bucketName,
}: UploadOptions) {
  const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const objectPath = folder ? `${folder.replace(/\/+$/,'')}/${filename}` : filename;

  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage.from(bucket).upload(objectPath, uint8, {
    cacheControl: '3600',
    upsert: false,
    contentType,
  });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(error.message);
  }

  if (!data?.path) {
    throw new Error('Supabase returned empty path');
  }

  const { data: publicUrlData, error: publicUrlError } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  if (publicUrlError) {
    console.error('Supabase public URL error:', publicUrlError);
    throw new Error(publicUrlError.message);
  }

  return {
    publicUrl: publicUrlData.publicUrl,
    path: data.path,
  };
}
