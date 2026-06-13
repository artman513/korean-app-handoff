import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Pattern, Verb } from '../types/data';
import { buildSession, randomStamp } from '../lib/puzzle';
import { recordPatternResult } from '../lib/progress';
import { RATE_NORMAL, speakKorean, useKoreanVoice } from '../lib/speech';

interface Props {
  pattern: Pattern;
  onFinish: () => void;
}

type QuestionPhase = 'answering' | 'correct' | 'wrong';

// F-04 パズル：文型1つ × 5問のセッション（簡易モード：動詞ドロップで即判定）
export default function PuzzleSession({ pattern, onFinish }: Props) {
  const { supported, voice } = useKoreanVoice();
  const session = useMemo(() => buildSession(pattern.id), [pattern.id]);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<QuestionPhase>('answering');
  const [placed, setPlaced] = useState<Verb | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [stamp, setStamp] = useState('');
  const [finished, setFinished] = useState(false);

  const sensors = useSensors(
    // 8px 未満の移動はドラッグ扱いにせず、タップ配置（onClick）を許可する
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const question = session[index];

  const place = (verb: Verb) => {
    if (phase !== 'answering') return;
    setPlaced(verb);
    const correct = verb.forms[question.patternId] === question.answer;
    if (correct) {
      setPhase('correct');
      setCorrectCount((c) => c + 1);
      setCombo((c) => c + 1);
      setStamp(randomStamp());
      if (supported) speakKorean(question.answer, RATE_NORMAL, voice);
    } else {
      setPhase('wrong');
      setCombo(0);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over?.id !== 'slot') return;
    const verb = question.options.find((v) => v.id === event.active.id);
    if (verb) place(verb);
  };

  const next = async () => {
    if (index + 1 >= session.length) {
      await recordPatternResult(pattern.id, correctCount, session.length);
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setPhase('answering');
    setPlaced(null);
    setStamp('');
  };

  if (finished) {
    const passed = correctCount / session.length >= 0.8;
    return (
      <div className="space-y-4 px-4 pb-4 text-center">
        <p className="text-5xl">{passed ? '🎉' : '💪'}</p>
        <h2 className="font-ko text-xl text-white">セッション完了！</h2>
        <div className="glass py-6">
          <p className="gauge-num text-5xl leading-none">
            {correctCount}
            <span className="font-ko text-lg text-pink-100/80">
              {' '}
              / {session.length}
            </span>
          </p>
          <p className="mt-3 font-cute text-sm" style={{ color: 'var(--inkcard)' }}>
            {passed
              ? '正答率80%以上！マスターに近づいた♡'
              : 'おしい！もう一度挑戦してみよ'}
          </p>
        </div>
        <button
          type="button"
          onClick={onFinish}
          className="btn-hot mt-2 w-full py-3"
        >
          文型一覧に戻る
        </button>
      </div>
    );
  }

  const [before, after] = pattern.template.split('{verb}');

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="relative space-y-4 px-4 pb-4">
        {/* 正解スタンプ */}
        {phase === 'correct' && (
          <span className="stamp absolute right-6 top-0 z-[6] text-3xl">
            {stamp}
          </span>
        )}

        {/* 進捗・コンボ */}
        <div className="flex items-center justify-between font-cute text-xs text-pink-100/90">
          <span>
            {index + 1} / {session.length} 問
          </span>
          {combo >= 3 && (
            <span
              className="rounded-full px-3 py-1 font-ko text-xs text-white"
              style={{
                background: 'linear-gradient(180deg,#FF7ABF,var(--hot))',
                boxShadow: '0 0 14px rgba(255,26,140,.6)',
              }}
            >
              🔥 {combo} COMBO!
            </span>
          )}
        </div>

        {/* 文型カード */}
        <div className="glass px-4 py-4 text-center">
          <p className="font-ko text-xl">{pattern.label}</p>
          <p className="mt-1 font-pop text-xs" style={{ color: 'var(--inksub)' }}>
            {pattern.meaning}
          </p>
        </div>

        {/* 出題：日本語の意味（動詞＋文型） */}
        <p className="text-center font-cute text-sm text-pink-100/95">
          「{question.target.meaning}」を「{pattern.meaning}」の形にすると？
        </p>

        {/* スロット行 */}
        <div
          className={`flex flex-wrap items-center justify-center gap-1 font-ko text-lg text-white ${
            phase === 'wrong' ? 'animate-bounce' : ''
          }`}
        >
          {before && <span>{before}</span>}
          <Slot placed={placed} phase={phase} />
          {after && <span>{after}</span>}
        </div>

        {/* 結果表示 */}
        {phase === 'correct' && (
          <div className="glass p-3 text-center">
            <p className="font-ko text-lg" style={{ color: '#059669' }}>
              {question.answer}
            </p>
          </div>
        )}
        {phase === 'wrong' && (
          <div className="glass p-3 text-center">
            <p className="font-display text-xl" style={{ color: '#D97706' }}>
              다시!
            </p>
          </div>
        )}

        {/* 動詞カード */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {question.options.map((verb) => (
            <VerbChip
              key={verb.id}
              verb={verb}
              disabled={phase !== 'answering'}
              onTap={() => place(verb)}
            />
          ))}
        </div>

        {phase !== 'answering' && (
          <button type="button" onClick={next} className="btn-hot w-full py-3">
            {index + 1 >= session.length ? '結果を見る' : '次へ →'}
          </button>
        )}
      </div>
    </DndContext>
  );
}

function Slot({
  placed,
  phase,
}: {
  placed: Verb | null;
  phase: QuestionPhase;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'slot' });
  const color =
    phase === 'correct'
      ? '#34d399'
      : phase === 'wrong'
        ? '#fbbf24'
        : isOver
          ? '#fff'
          : 'var(--hot2)';
  return (
    <span
      ref={setNodeRef}
      className="mx-1 inline-flex min-w-[68px] justify-center rounded-xl border-2 border-dashed px-3 py-1.5 font-ko"
      style={{
        color,
        borderColor: color,
        background: isOver ? 'rgba(255,26,140,.15)' : 'rgba(255,26,140,.06)',
      }}
    >
      {placed ? placed.dict : '？'}
    </span>
  );
}

function VerbChip({
  verb,
  disabled,
  onTap,
}: {
  verb: Verb;
  disabled: boolean;
  onTap: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: verb.id, disabled });
  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: 50,
      }
    : undefined;
  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      disabled={disabled}
      onClick={onTap}
      aria-label={`${verb.dict}（${verb.meaning}）を置く`}
      className={`glass flex touch-none flex-col items-center px-4 py-2 disabled:opacity-40 ${
        isDragging ? 'opacity-50' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      <span className="font-ko text-base">{verb.dict}</span>
      <span className="font-pop text-xs" style={{ color: 'var(--inksub)' }}>
        {verb.meaning}
      </span>
    </button>
  );
}
