import { base44 } from './base44Client';
import { uploadUserFile } from '@/lib/uploadFile';

export const Core = base44.integrations.Core;

export const InvokeLLM = base44.integrations.Core.InvokeLLM;

export const SendEmail = base44.integrations.Core.SendEmail;

/** Upload via Supabase Storage (substitui Base44). */
export async function UploadFile({ file, folder } = {}) {
  return uploadUserFile(file, { folder });
}

export const GenerateImage = base44.integrations.Core.GenerateImage;

export const ExtractDataFromUploadedFile = base44.integrations.Core.ExtractDataFromUploadedFile;

export const CreateFileSignedUrl = base44.integrations.Core.CreateFileSignedUrl;

export const UploadPrivateFile = base44.integrations.Core.UploadPrivateFile;
