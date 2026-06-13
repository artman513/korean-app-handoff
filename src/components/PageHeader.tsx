import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  title: string;
  /** 韓国語の小見出し（任意） */
  subtitle?: string;
  /** 指定すると戻るリンク（←）を表示する */
  backTo?: string;
  /** ヘッダー右端に表示する要素（習得数など） */
  right?: ReactNode;
}

export default function PageHeader({ title, subtitle, backTo, right }: Props) {
  return (
    <header className="relative z-[2] flex items-center gap-3 px-4 pt-5 pb-3">
      {backTo && (
        <Link
          to={backTo}
          aria-label="戻る"
          className="font-ko text-2xl leading-none text-pink-200/90"
        >
          ‹
        </Link>
      )}
      <div className="flex-1">
        <h1 className="h-title">
          {title}
          {subtitle && <small>{subtitle}</small>}
        </h1>
      </div>
      {right && (
        <span className="font-ko text-sm text-pink-100/90">{right}</span>
      )}
    </header>
  );
}
