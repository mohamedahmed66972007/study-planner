import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Check, MoreVertical, Trash2, BookOpen, Timer } from "lucide-react";
import {
  useStudySubjects,
  useStudyStartSubject,
  useStudyCompleteSubject,
  useStudyToggleLesson,
  useStudyDeleteSubject
} from "@/hooks/use-study";
import { useTimer, useLessonTimer, type LessonTimerState } from "@/hooks/use-timer";
import { formatTimeMMSS, cn } from "@/lib/utils";
import type { Subject, Lesson } from "@workspace/api-client-react";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Parse "HH:MM" to total minutes since midnight */
function timeStrToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** How many minutes until HH:MM today (negative = already passed) */
function minutesUntil(timeStr: string): number {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return timeStrToMinutes(timeStr) - nowMins;
}

/** Format minutes as "س:دد" or "د" */
function fmtCountdown(mins: number): string {
  if (mins <= 0) return "الآن";
  if (mins < 60) return `${mins} د`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}س ${m}د` : `${h} ساعة`;
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const { data: subjects, isLoading } = useStudySubjects();

  const pendingOrActive = subjects?.filter(s => s.status !== 'completed') || [];
  const sortedSubjects = [...pendingOrActive].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    return 0;
  });

  return (
    <div className="p-5">
      <header className="mb-7 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-1">مرحباً بك!</h1>
          <p className="text-muted-foreground text-sm font-medium">
            {format(new Date(), 'EEEE، d MMMM', { locale: ar })}
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-3xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : sortedSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
          <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">لا توجد مهام حالياً</h3>
          <p className="text-sm text-muted-foreground">أضف مادة جديدة لتبدأ المذاكرة</p>
        </div>
      ) : (
        <div className="space-y-5">
          <AnimatePresence mode="popLayout">
            {sortedSubjects.map(subject => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── card ──────────────────────────────────────────────────────────────────────

function SubjectCard({ subject }: { subject: Subject }) {
  const [showOptions, setShowOptions] = useState(false);
  const [minsUntilStart, setMinsUntilStart] = useState<number | null>(null);
  const startMutation = useStudyStartSubject();
  const completeMutation = useStudyCompleteSubject();
  const deleteMutation = useStudyDeleteSubject();
  const autoStartedRef = useRef(false);
  const autoCompleteRef = useRef(false);

  const isActive = subject.status === 'active';
  const isPending = subject.status === 'pending';
  const lessons = subject.lessons || [];
  const totalDuration = subject.durationMinutes || 60;
  const hasDistributed = lessons.some(l => l.allocatedMinutes && l.allocatedMinutes > 0);
  const isFixedTime = subject.timeMode === 'fixed';
  const isToday = subject.date === format(new Date(), 'yyyy-MM-dd');

  // ── FIX 1: Auto-start fixed-time subjects when their start time arrives ──
  useEffect(() => {
    if (!isPending || !isFixedTime || !subject.startTime || !isToday) return;

    const check = () => {
      const mins = minutesUntil(subject.startTime!);
      setMinsUntilStart(mins);

      // Start when we've reached or passed the start time
      if (mins <= 0 && !autoStartedRef.current && !startMutation.isPending) {
        autoStartedRef.current = true;
        startMutation.mutate({ id: subject.id });
      }
    };

    check(); // run immediately
    const interval = setInterval(check, 15_000); // re-check every 15 s
    return () => clearInterval(interval);
  }, [isPending, isFixedTime, subject.startTime, isToday, subject.id]);

  // ── FIX 2: Auto-complete when every lesson is checked ──
  useEffect(() => {
    if (!isActive || lessons.length === 0 || autoCompleteRef.current) return;
    const allDone = lessons.every(l => l.completed);
    if (allDone && !completeMutation.isPending) {
      autoCompleteRef.current = true;
      completeMutation.mutate({ id: subject.id });
    }
  }, [isActive, lessons, subject.id]);

  // Also run both timer hooks (unconditional — React rules of hooks)
  const simpleTimer = useTimer(subject.id, totalDuration, isActive);
  const lessonTimer = useLessonTimer(subject.id, lessons, totalDuration, isActive);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "glass-panel rounded-3xl p-5 relative overflow-hidden transition-all duration-500",
        isActive ? "ring-2 ring-primary/50 shadow-primary/20 shadow-xl" : "hover:border-white/10"
      )}
    >
      {isActive && (
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-secondary/80 text-[10px] font-bold tracking-wider text-muted-foreground shrink-0">
              {isToday ? 'اليوم' : subject.date}
            </span>
            {isFixedTime && subject.startTime && subject.endTime && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/80 text-[10px] font-bold text-muted-foreground shrink-0">
                <Clock className="w-3 h-3" />
                {subject.startTime} - {subject.endTime}
              </span>
            )}
            {!isFixedTime && subject.durationMinutes && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/80 text-[10px] font-bold text-muted-foreground shrink-0">
                <Clock className="w-3 h-3" />
                {subject.durationMinutes >= 60
                  ? `${Math.floor(subject.durationMinutes / 60)}س ${subject.durationMinutes % 60 > 0 ? `${subject.durationMinutes % 60}د` : ''}`
                  : `${subject.durationMinutes} د`}
              </span>
            )}
          </div>
          <h3 className="text-xl font-extrabold truncate">{subject.name}</h3>
        </div>

        <div className="relative shrink-0 mr-2">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 text-muted-foreground hover:text-white transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showOptions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute left-0 top-full mt-1 bg-popover border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden min-w-[120px]"
              >
                <button
                  onClick={() => {
                    if (confirm("هل أنت متأكد من حذف هذه المادة؟")) {
                      deleteMutation.mutate({ id: subject.id });
                    }
                    setShowOptions(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-white/5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف المادة
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {subject.description && (
        <p className="text-sm text-muted-foreground mb-3 relative z-10">{subject.description}</p>
      )}

      {!isActive && lessons.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 relative z-10">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{lessons.length} {lessons.length === 1 ? 'درس' : 'دروس'}</span>
        </div>
      )}

      {/* ── Pending state UI ── */}
      <div className="mt-3 relative z-10">
        <AnimatePresence mode="wait">
          {!isActive ? (
            <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Fixed-time: show countdown until start OR loading */}
              {isFixedTime && isToday ? (
                <div className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1.5">
                  {startMutation.isPending ? (
                    <p className="text-sm font-bold text-primary">جاري البدء تلقائياً...</p>
                  ) : minsUntilStart !== null && minsUntilStart > 0 ? (
                    <>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Timer className="w-4 h-4" />
                        <span className="text-xs font-medium">يبدأ تلقائياً خلال</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">{fmtCountdown(minsUntilStart)}</p>
                      <p className="text-[10px] text-muted-foreground">عند الساعة {subject.startTime}</p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-primary animate-pulse">جاري البدء...</p>
                  )}
                </div>
              ) : isFixedTime && !isToday ? (
                /* Fixed-time but future date — show info only */
                <div className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">يبدأ {subject.date} الساعة {subject.startTime}</span>
                </div>
              ) : (
                /* Duration mode — show manual start button */
                <button
                  onClick={() => startMutation.mutate({ id: subject.id })}
                  disabled={startMutation.isPending}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary/80 to-accent/80 hover:from-primary hover:to-accent border-0 font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  {startMutation.isPending ? "جاري البدء..." : "ابدأ المذاكرة"}
                </button>
              )}
            </motion.div>
          ) : (
            /* ── Active state UI ── */
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <ActiveTimerDisplay
                subject={subject}
                simpleTimer={simpleTimer}
                lessonTimer={lessonTimer}
                hasDistributed={hasDistributed}
              />

              <div className="space-y-2 bg-black/20 rounded-2xl p-3 border border-white/5">
                <h4 className="text-xs font-bold text-muted-foreground px-2 mb-2">الدروس</h4>
                {lessons.map((lesson, idx) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    lessonIndex={idx}
                    isCurrentLesson={hasDistributed && lessonTimer.currentLessonIndex === idx && !lesson.completed}
                    currentLessonSecondsLeft={lessonTimer.currentLessonSecondsLeft}
                    hasDistributed={hasDistributed}
                  />
                ))}
                {lessons.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">لم يتم إضافة دروس</p>
                )}
              </div>

              <button
                onClick={() => completeMutation.mutate({ id: subject.id })}
                disabled={completeMutation.isPending}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="w-5 h-5" />
                {completeMutation.isPending ? "جاري الإنهاء..." : "إنهاء المادة"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── timer display ─────────────────────────────────────────────────────────────

function ActiveTimerDisplay({
  subject,
  simpleTimer,
  lessonTimer,
  hasDistributed
}: {
  subject: Subject;
  simpleTimer: { secondsLeft: number; progress: number };
  lessonTimer: LessonTimerState;
  hasDistributed: boolean;
}) {
  const lessons = subject.lessons || [];

  if (hasDistributed && lessons.length > 0) {
    const currentLesson = lessons[lessonTimer.currentLessonIndex];
    const isLastLesson = lessonTimer.currentLessonIndex >= lessons.length - 1;
    const allDone = lessonTimer.currentLessonSecondsLeft === 0 && isLastLesson;

    return (
      <div className="rounded-2xl bg-black/40 border border-white/5 overflow-hidden">
        <div className="px-4 pt-3 pb-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
          <span className="text-xs text-muted-foreground font-medium">
            الدرس الحالي ({lessonTimer.currentLessonIndex + 1}/{lessons.length})
          </span>
        </div>
        <div className="px-4 pb-2">
          <p className="text-sm font-bold text-white truncate">
            {allDone ? "✓ انتهت جميع الدروس" : currentLesson?.name}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-4 relative">
          <AnimatePresence mode="wait">
            {allDone ? (
              <motion.div key="alldone" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <p className="text-3xl font-bold text-primary">🎉 أحسنت!</p>
                <p className="text-xs text-muted-foreground mt-1">انتهت جميع الدروس</p>
              </motion.div>
            ) : lessonTimer.lessonFinished ? (
              <motion.div key="finished" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <p className="text-2xl font-bold text-primary">انتهى ✓</p>
                <p className="text-xs text-muted-foreground mt-1">جاري الانتقال للدرس التالي...</p>
              </motion.div>
            ) : (
              <motion.div
                key={`lesson-${lessonTimer.currentLessonIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <div className="text-4xl font-mono tracking-widest font-light text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  {formatTimeMMSS(lessonTimer.currentLessonSecondsLeft)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
                  المتبقي للدرس
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-1 bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            animate={{
              width: lessonTimer.currentLessonTotalSeconds > 0
                ? `${((lessonTimer.currentLessonTotalSeconds - lessonTimer.currentLessonSecondsLeft) / lessonTimer.currentLessonTotalSeconds) * 100}%`
                : '0%'
            }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>الإجمالي: {formatTimeMMSS(lessonTimer.overallSecondsLeft)}</span>
          <span>{Math.round(lessonTimer.overallProgress)}%</span>
        </div>

        <div className="h-0.5 bg-white/5">
          <motion.div
            className="h-full bg-white/15"
            animate={{ width: `${lessonTimer.overallProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-4 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden">
      <div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-linear"
        style={{ width: `${simpleTimer.progress}%` }}
      />
      <div className="text-4xl font-mono tracking-widest font-light text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
        {formatTimeMMSS(simpleTimer.secondsLeft)}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
        الوقت المتبقي
      </div>
    </div>
  );
}

// ── lesson row ────────────────────────────────────────────────────────────────

function LessonRow({
  lesson,
  lessonIndex,
  isCurrentLesson,
  currentLessonSecondsLeft,
  hasDistributed
}: {
  lesson: Lesson;
  lessonIndex: number;
  isCurrentLesson: boolean;
  currentLessonSecondsLeft: number;
  hasDistributed: boolean;
}) {
  const toggleMutation = useStudyToggleLesson();

  return (
    <motion.button
      layout
      onClick={() => toggleMutation.mutate({ id: lesson.id })}
      disabled={toggleMutation.isPending}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-start relative overflow-hidden",
        lesson.completed
          ? "bg-white/5 opacity-60"
          : isCurrentLesson
            ? "bg-primary/10 border border-primary/30"
            : "hover:bg-white/5",
        toggleMutation.isPending && "opacity-50 cursor-not-allowed"
      )}
    >
      {isCurrentLesson && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 w-0.5 bg-primary"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}

      <div className={cn(
        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
        lesson.completed ? "bg-primary border-primary" : isCurrentLesson ? "border-primary" : "border-muted-foreground"
      )}>
        {lesson.completed && <Check className="w-3.5 h-3.5 text-white" />}
      </div>

      <span className={cn(
        "flex-1 text-sm font-medium transition-all text-right",
        lesson.completed && "line-through text-muted-foreground",
        isCurrentLesson && "text-white font-bold"
      )}>
        {lesson.name}
      </span>

      {hasDistributed && lesson.allocatedMinutes ? (
        isCurrentLesson && !lesson.completed ? (
          <span className="text-xs font-mono text-primary shrink-0 bg-primary/10 px-2 py-1 rounded-md">
            {formatTimeMMSS(currentLessonSecondsLeft)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground shrink-0 bg-black/30 px-2 py-1 rounded-md">
            {lesson.allocatedMinutes} د
          </span>
        )
      ) : null}
    </motion.button>
  );
}
