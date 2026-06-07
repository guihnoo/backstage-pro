import { uploadUserFile } from '@/lib/uploadFile';

/** Upload via Supabase Storage — contrato compatível com o legado Base44. */
export async function UploadFile({ file, folder } = {}) {
  return uploadUserFile(file, { folder });
}

// Stubs para features LLM/OAuth não implementadas nesta versão
const notAvailable = (name) => async () => {
  throw new Error(`${name} não está disponível nesta versão.`);
};

export const InvokeLLM = notAvailable('InvokeLLM');
export const SendEmail = notAvailable('SendEmail');
export const GenerateImage = notAvailable('GenerateImage');
export const ExtractDataFromUploadedFile = notAvailable('ExtractDataFromUploadedFile');
export const CreateFileSignedUrl = notAvailable('CreateFileSignedUrl');
export const UploadPrivateFile = notAvailable('UploadPrivateFile');

export const Core = {
  InvokeLLM: notAvailable('InvokeLLM'),
  SendEmail: notAvailable('SendEmail'),
  GenerateImage: notAvailable('GenerateImage'),
};
