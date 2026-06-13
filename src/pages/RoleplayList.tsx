import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { ROLEPLAY_LEVEL_LABEL, roleplaySituations } from '../data/roleplay';

// F-09 シチュエーション選択
export default function RoleplayList() {
  return (
    <div>
      <PageHeader title="롤플레이" subtitle="推しと現場で会話しよ♡" backTo="/" />
      <ul className="space-y-2.5 px-4 pb-4">
        {roleplaySituations.map((s) => (
          <li key={s.id}>
            <Link
              to={`/roleplay/${s.id}`}
              aria-label={`${s.titleJa}を始める`}
              className="glass flex items-center gap-3 px-3.5 py-3.5 transition-transform active:scale-[0.98]"
            >
              <span aria-hidden="true" className="text-2xl">
                {s.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-ko text-base">
                  {s.title}
                  <span
                    className="ml-2 font-pop text-xs"
                    style={{ color: 'var(--inksub)' }}
                  >
                    {s.titleJa}
                  </span>
                </span>
                <span
                  className="block truncate font-pop text-xs"
                  style={{ color: 'var(--inksub)' }}
                >
                  {s.description}
                </span>
              </span>
              <span
                className={`pill ${
                  s.level === 'intermediate' ? 'pill-lv2' : 'pill-lv1'
                }`}
              >
                {ROLEPLAY_LEVEL_LABEL[s.level]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
