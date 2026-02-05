import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length <= 1) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className="mb-6"
      itemScope 
      itemType="https://schema.org/BreadcrumbList"
    >
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li 
              key={item.url} 
              className="flex items-center"
              itemScope
              itemType="https://schema.org/ListItem"
              itemProp="itemListElement"
            >
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-1 text-gray-400" aria-hidden="true" />
              )}
              
              {isLast ? (
                <span 
                  className="text-gray-700 font-medium"
                  itemProp="name"
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.url}
                  className="hover:text-red-600 transition-colors flex items-center"
                  itemProp="item"
                >
                  {isFirst && <Home className="w-4 h-4 mr-1" aria-hidden="true" />}
                  <span itemProp="name">{item.name}</span>
                </Link>
              )}
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
