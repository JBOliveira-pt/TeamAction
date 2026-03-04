import { clsx } from 'clsx';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href: string;
  active?: boolean;
}

export default function Breadcrumbs({
  breadcrumbs,
}: {
  breadcrumbs: Breadcrumb[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 block">
      <ol className="flex items-center gap-2 text-sm">
        {/* Home icon */}
        <li>
          <Link 
            href="/dashboard" 
            className="text-gray-500 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>
        
        <ChevronRight className="w-4 h-4 text-gray-600" />
        
        {breadcrumbs.map((breadcrumb, index) => (
          <li
            key={breadcrumb.href}
            aria-current={breadcrumb.active}
            className="flex items-center gap-2"
          >
            <Link 
              href={breadcrumb.href}
              className={clsx(
                "transition-colors",
                breadcrumb.active 
                  ? 'text-white font-medium' 
                  : 'text-gray-500 hover:text-white',
              )}
            >
              {breadcrumb.label}
            </Link>
            {index < breadcrumbs.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}