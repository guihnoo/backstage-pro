import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCompanyLogoUrl } from '@/lib/companyEnrichment';

export default function CompanyAvatar({
  name,
  logoUrl,
  company,
  size = 'sm',
  className,
}) {
  const resolved = logoUrl || getCompanyLogoUrl(company);
  const [imgOk, setImgOk] = useState(!!resolved);
  const label = name || company?.trading_name || company?.name || '?';
  const initial = label.charAt(0).toUpperCase();
  const sz = size === 'md' ? 'w-10 h-10 text-base' : 'w-7 h-7 text-xs';

  if (imgOk && resolved) {
    return (
      <span
        className={cn(
          `${sz} rounded-lg border border-slate-600 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden`,
          className,
        )}
      >
        <img
          src={resolved}
          alt=""
          className="w-full h-full object-contain p-0.5"
          onError={() => setImgOk(false)}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        `${sz} rounded-lg border border-slate-600 bg-slate-800 flex items-center justify-center flex-shrink-0`,
        className,
      )}
    >
      {size === 'md' ? (
        <span className="text-slate-300 font-bold">{initial}</span>
      ) : (
        <Building2 className="w-3.5 h-3.5 text-slate-500" />
      )}
    </span>
  );
}
