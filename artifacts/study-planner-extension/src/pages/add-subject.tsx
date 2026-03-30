import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addDays } from "date-fns";
import { ar } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Check
} from "lucide-react";
import { useStudyCreateSubject } from "@/hooks/use-study";
import { calculateTotalMinutes, cn } from "@/lib/utils";
import { useSubjectTheme, SUBJECT_THEMES } from "@/hooks/use-subject-theme";

const SUBJECTS = [
  { name: "عربي", emoji: "📖" },
  { name: "إنجليزي", emoji: "🌍" },
  { name: "رياضيات", emoji: "🔢" },
  { name: "كيمياء", emoji: "⚗️" },
  { name: "فيزياء", emoji: "⚛️" },
  { name: "أحياء", emoji: "🧬" },
  { name: "دستور", emoji: "📜" },
  { name: "إسلامية", emoji: "🕌" },
] as const;

const formSchema = z.object({
  name: z.string().min(1, "اختر المادة"),
  date: z.string().min(1, "حدد التاريخ"),
  description: z.string().optional(),
  timeMode: z.enum(["fixed", "duration"]),
  startHour: z.number().min(0).max(23).optional(),
  startMinute: z.number().min(0).max(59).optional(),
  startAmPm: z.enum(["am", "pm"]).optional(),
  endHour: z.number().min(0).max(23).optional(),
  endMinute: z.number().min(0).max(59).optional(),
  endAmPm: z.enum(["am", "pm"]).optional(),
  durationHours: z.number().min(0).optional(),
  durationMinutes: z.number().min(0).max(59).optional(),
  distributeTime: z.boolean().default(false),
  lessons: z.array(z.object({
    name: z.string().min(1, "اسم الدرس مطلوب"),
    allocatedMinutes: z.number().min(1).nullable().optional()
  }))
});

type FormValues = z.infer<typeof formSchema>;

// ─── Custom Number Picker (fixed) ────────────────────────────────────────────
function NumberPicker({
  value,
  onChange,
  min = 0,
  max = 59,
  label,
  pad = true
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  pad?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  const increase = useCallback(() => {
    onChange(value >= max ? min : value + 1);
  }, [value, max, min, onChange]);

  const decrease = useCallback(() => {
    onChange(value <= min ? max : value - 1);
  }, [value, min, max, onChange]);

  const startRepeat = (fn: () => void) => {
    timeoutRef.current = setTimeout(() => {
      repeatRef.current = setInterval(fn, 80);
    }, 400);
  };

  const stopRepeat = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (repeatRef.current) clearInterval(repeatRef.current);
  };

  const handleDisplayClick = () => {
    setInputVal(pad ? String(value).padStart(2, "0") : String(value));
    setEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const commitInput = () => {
    const parsed = parseInt(inputVal, 10);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed));
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Escape") {
      commitInput();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      increase();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      decrease();
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* Up = increase */}
      <button
        type="button"
        onClick={increase}
        onPointerDown={() => startRepeat(increase)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        className="w-10 h-8 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-white/5 active:scale-90"
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      <div
        className="relative w-16 h-12 flex items-center justify-center bg-black/40 rounded-xl border border-white/10 overflow-hidden cursor-text"
        onClick={handleDisplayClick}
      >
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={commitInput}
            onKeyDown={handleKeyDown}
            className="w-full h-full text-center text-2xl font-bold font-mono text-white bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.span
              key={value}
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="text-2xl font-bold font-mono text-white absolute"
            >
              {pad ? String(value).padStart(2, "0") : value}
            </motion.span>
          </AnimatePresence>
        )}
      </div>

      {/* Down = decrease */}
      <button
        type="button"
        onClick={decrease}
        onPointerDown={() => startRepeat(decrease)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        className="w-10 h-8 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-white/5 active:scale-90"
      >
        <ChevronDown className="w-5 h-5" />
      </button>

      <span className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</span>
    </div>
  );
}

// ─── AM/PM Picker for 12-hour display ────────────────────────────────────────
function AmPmToggle({
  value,
  onChange,
}: {
  value: "am" | "pm";
  onChange: (v: "am" | "pm") => void;
}) {
  return (
    <div className="flex flex-col gap-1 pb-6">
      {(["am", "pm"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "px-2 py-1 rounded-lg text-xs font-bold transition-all",
            value === v
              ? "bg-primary text-white"
              : "bg-white/5 text-muted-foreground hover:bg-white/10"
          )}
        >
          {v === "am" ? "ص" : "م"}
        </button>
      ))}
    </div>
  );
}

// Convert 12h display value + ampm to 24h
function to24h(hour12: number, ampm: "am" | "pm"): number {
  if (ampm === "am") {
    return hour12 === 12 ? 0 : hour12;
  } else {
    return hour12 === 12 ? 12 : hour12 + 12;
  }
}

// Convert 24h to 12h display + ampm
function to12h(hour24: number): { hour12: number; ampm: "am" | "pm" } {
  if (hour24 === 0) return { hour12: 12, ampm: "am" };
  if (hour24 < 12) return { hour12: hour24, ampm: "am" };
  if (hour24 === 12) return { hour12: 12, ampm: "pm" };
  return { hour12: hour24 - 12, ampm: "pm" };
}

// ─── Time Picker Block (12-hour) ──────────────────────────────────────────────
function TimePicker12({
  hour24,
  minute,
  onHourChange,
  onMinuteChange,
  label,
}: {
  hour24: number;
  minute: number;
  onHourChange: (h24: number) => void;
  onMinuteChange: (m: number) => void;
  label: string;
}) {
  const { hour12, ampm } = to12h(hour24);

  return (
    <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
      <p className="text-xs text-muted-foreground font-bold mb-4 text-center">{label}</p>
      <div className="flex items-center justify-center gap-2">
        <NumberPicker
          value={hour12}
          onChange={(v) => onHourChange(to24h(v, ampm))}
          min={1}
          max={12}
          label="ساعة"
        />
        <div className="flex flex-col gap-1 pb-6">
          <div className="w-2 h-2 rounded-full bg-primary/60" />
          <div className="w-2 h-2 rounded-full bg-primary/60" />
        </div>
        <NumberPicker
          value={minute}
          onChange={onMinuteChange}
          min={0}
          max={59}
          label="دقيقة"
        />
        <AmPmToggle
          value={ampm}
          onChange={(newAmpm) => onHourChange(to24h(hour12, newAmpm))}
        />
      </div>
    </div>
  );
}

// ─── Date Picker Chip Row ────────────────────────────────────────────────────
function DatePickerRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [showCustom, setShowCustom] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const dayAfter = format(addDays(new Date(), 2), "yyyy-MM-dd");

  const quickDates = [
    { label: "اليوم", value: today },
    { label: "غداً", value: tomorrow },
    { label: format(addDays(new Date(), 2), "EEE", { locale: ar }), value: dayAfter },
  ];

  const isQuick = quickDates.some((d) => d.value === value);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {quickDates.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => { onChange(d.value); setShowCustom(false); }}
            className={cn(
              "py-3 rounded-2xl border text-sm font-bold transition-all",
              value === d.value && !showCustom
                ? "bg-primary/20 border-primary text-primary shadow-primary/20 shadow-md"
                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
            )}
          >
            {d.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className={cn(
            "py-3 rounded-2xl border text-sm font-bold transition-all flex items-center justify-center gap-1",
            (!isQuick || showCustom)
              ? "bg-primary/20 border-primary text-primary"
              : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
          )}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs">تاريخ</span>
        </button>
      </div>

      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-4">
              {value && (
                <div className="text-center">
                  <span className="text-sm font-bold text-primary">
                    {format(new Date(value + "T00:00:00"), "EEEE، d MMMM yyyy", { locale: ar })}
                  </span>
                </div>
              )}
              <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                min={today}
                className="w-full bg-transparent text-white text-sm outline-none [color-scheme:dark] border border-white/10 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {value && !isQuick && !showCustom && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-xl">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {format(new Date(value + "T00:00:00"), "EEEE، d MMMM yyyy", { locale: ar })}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Form ───────────────────────────────────────────────────────────────
export default function AddSubject() {
  const [, setLocation] = useLocation();
  const createMutation = useStudyCreateSubject();
  const [totalAvailableMinutes, setTotalAvailableMinutes] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      timeMode: "duration",
      startHour: 8,
      startMinute: 0,
      endHour: 9,
      endMinute: 0,
      durationHours: 1,
      durationMinutes: 0,
      distributeTime: false,
      lessons: [{ name: "", allocatedMinutes: null }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lessons" });

  const watchTimeMode = form.watch("timeMode");
  const watchDistribute = form.watch("distributeTime");
  const watchLessons = form.watch("lessons");
  const watchStartH = form.watch("startHour") ?? 8;
  const watchStartM = form.watch("startMinute") ?? 0;
  const watchEndH = form.watch("endHour") ?? 9;
  const watchEndM = form.watch("endMinute") ?? 0;
  const watchDurationH = form.watch("durationHours") ?? 0;
  const watchDurationM = form.watch("durationMinutes") ?? 0;
  const watchName = form.watch("name");
  const watchDate = form.watch("date");

  // Apply color theme based on selected subject
  useSubjectTheme(watchName || null);

  useEffect(() => {
    let total = 0;
    if (watchTimeMode === "fixed") {
      const startTotal = watchStartH * 60 + watchStartM;
      const endTotal = watchEndH * 60 + watchEndM;
      total = endTotal > startTotal ? endTotal - startTotal : 0;
    } else {
      total = watchDurationH * 60 + watchDurationM;
    }
    setTotalAvailableMinutes(total);
  }, [watchTimeMode, watchStartH, watchStartM, watchEndH, watchEndM, watchDurationH, watchDurationM]);

  const handleToggleDistribute = (e: React.MouseEvent) => {
    e.preventDefault();
    if (totalAvailableMinutes <= 0) {
      alert("يجب تحديد الوقت الكلي أولاً قبل تخصيص الوقت للدروس");
      return;
    }
    form.setValue("distributeTime", !watchDistribute);
  };

  const usedMinutes = watchLessons.reduce((sum, l) => sum + (l.allocatedMinutes || 0), 0);
  const remainingMinutes = totalAvailableMinutes - usedMinutes;

  const pad2 = (n: number) => String(n).padStart(2, "0");

  const onSubmit = (data: FormValues) => {
    if (data.distributeTime && remainingMinutes < 0) {
      alert("الوقت الموزع يتجاوز الوقت الكلي المتاح!");
      return;
    }

    const startTime =
      data.timeMode === "fixed"
        ? `${pad2(data.startHour ?? 0)}:${pad2(data.startMinute ?? 0)}`
        : null;
    const endTime =
      data.timeMode === "fixed"
        ? `${pad2(data.endHour ?? 0)}:${pad2(data.endMinute ?? 0)}`
        : null;
    const durationMins =
      data.timeMode === "duration"
        ? (data.durationHours ?? 0) * 60 + (data.durationMinutes ?? 0)
        : totalAvailableMinutes;

    const payload = {
      name: data.name,
      date: data.date,
      timeMode: data.timeMode,
      description: data.description || null,
      distributeTime: data.distributeTime,
      startTime,
      endTime,
      durationMinutes: durationMins,
      lessons: data.lessons.map((l) => ({
        name: l.name,
        allocatedMinutes: data.distributeTime ? (l.allocatedMinutes ?? null) : null,
      })),
    };

    createMutation.mutate(
      { data: payload as any },
      { onSuccess: () => setLocation("/") }
    );
  };

  return (
    <div className="flex flex-col h-full bg-background absolute inset-0 z-50 overflow-y-auto no-scrollbar pb-10">
      {/* Header */}
      <header className="sticky top-0 z-20 glass-panel border-b border-white/10 px-4 py-4 flex items-center gap-4">
        <button
          onClick={() => setLocation("/")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">إضافة مادة</h1>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 flex flex-col gap-7">

        {/* ─── Subject Selection ─── */}
        <section className="space-y-3">
          <label className="block text-sm font-bold text-muted-foreground">اختر المادة</label>
          <div className="grid grid-cols-4 gap-2">
            {SUBJECTS.map((s) => {
              const isSelected = watchName === s.name;
              return (
                <motion.button
                  key={s.name}
                  type="button"
                  onClick={() => form.setValue("name", s.name, { shouldValidate: true })}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl border transition-all",
                    isSelected
                      ? "bg-primary/20 border-primary shadow-lg shadow-primary/20"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  )}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="subject-indicator"
                      className="absolute inset-0 rounded-2xl bg-primary/10 border-2 border-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="text-xl relative z-10">{s.emoji}</span>
                  <span
                    className={cn(
                      "text-[11px] font-bold relative z-10 transition-colors",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {s.name}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 left-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center z-10">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
          {form.formState.errors.name && (
            <p className="text-destructive text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {form.formState.errors.name.message}
            </p>
          )}
        </section>

        {/* ─── Date Picker ─── */}
        <section className="space-y-3">
          <label className="block text-sm font-bold text-muted-foreground">التاريخ</label>
          <DatePickerRow
            value={watchDate}
            onChange={(v) => form.setValue("date", v, { shouldValidate: true })}
          />
        </section>

        {/* ─── Time Settings ─── */}
        <section className="bg-black/30 border border-white/5 rounded-3xl p-5 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-bold">نظام الوقت</h3>
          </div>

          {/* Mode toggle */}
          <div className="flex p-1 bg-black/40 rounded-xl">
            {(["fixed", "duration"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => form.setValue("timeMode", mode)}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                  watchTimeMode === mode
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {mode === "fixed" ? "وقت ثابت" : "مدة زمنية"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {watchTimeMode === "fixed" ? (
              <motion.div
                key="fixed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <TimePicker12
                  hour24={watchStartH}
                  minute={watchStartM}
                  onHourChange={(h) => form.setValue("startHour", h)}
                  onMinuteChange={(m) => form.setValue("startMinute", m)}
                  label="من"
                />
                <TimePicker12
                  hour24={watchEndH}
                  minute={watchEndM}
                  onHourChange={(h) => form.setValue("endHour", h)}
                  onMinuteChange={(m) => form.setValue("endMinute", m)}
                  label="إلى"
                />

                {totalAvailableMinutes > 0 && (
                  <div className="text-center py-2 px-4 bg-primary/10 border border-primary/20 rounded-xl">
                    <span className="text-sm font-bold text-primary">
                      الإجمالي:{" "}
                      {totalAvailableMinutes >= 60
                        ? `${Math.floor(totalAvailableMinutes / 60)}س ${totalAvailableMinutes % 60 > 0 ? `${totalAvailableMinutes % 60}د` : ""}`
                        : `${totalAvailableMinutes} دقيقة`}
                    </span>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="duration"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-black/30 rounded-2xl p-4 border border-white/5"
              >
                <p className="text-xs text-muted-foreground font-bold mb-4 text-center">المدة الزمنية</p>
                <div className="flex items-center justify-center gap-4">
                  <NumberPicker
                    value={watchDurationH}
                    onChange={(v) => form.setValue("durationHours", v)}
                    min={0}
                    max={12}
                    label="ساعة"
                    pad={false}
                  />
                  <div className="flex flex-col gap-1 pb-6">
                    <div className="w-2 h-2 rounded-full bg-primary/60" />
                    <div className="w-2 h-2 rounded-full bg-primary/60" />
                  </div>
                  <NumberPicker
                    value={watchDurationM}
                    onChange={(v) => form.setValue("durationMinutes", v)}
                    min={0}
                    max={59}
                    label="دقيقة"
                  />
                </div>
                {totalAvailableMinutes > 0 && (
                  <p className="text-center text-xs text-primary mt-4 font-bold">
                    {totalAvailableMinutes >= 60
                      ? `${Math.floor(totalAvailableMinutes / 60)} ساعة ${totalAvailableMinutes % 60 > 0 ? `و ${totalAvailableMinutes % 60} دقيقة` : ""}`
                      : `${totalAvailableMinutes} دقيقة`}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Distribute Time toggle */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div>
              <span className="font-bold text-sm">تخصيص الوقت للدروس</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {totalAvailableMinutes > 0
                  ? `توزيع ${totalAvailableMinutes} دقيقة على الدروس`
                  : "حدد الوقت أولاً"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleDistribute}
              className={cn(
                "w-12 h-6 rounded-full transition-all duration-300 relative shrink-0",
                watchDistribute ? "bg-primary shadow-primary/30 shadow-md" : "bg-white/20",
                totalAvailableMinutes <= 0 && "opacity-50 cursor-not-allowed"
              )}
            >
              <motion.div
                animate={{ x: watchDistribute ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-4 h-4 rounded-full bg-white absolute top-1 left-1"
              />
            </button>
          </div>
        </section>

        {/* ─── Lessons ─── */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="block text-sm font-bold text-muted-foreground">الدروس</label>
            {watchDistribute && totalAvailableMinutes > 0 && (
              <div
                className={cn(
                  "text-xs font-bold px-3 py-1 rounded-lg transition-colors",
                  remainingMinutes < 0
                    ? "bg-destructive/20 text-destructive border border-destructive/30"
                    : remainingMinutes === 0
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-white/5 text-muted-foreground"
                )}
              >
                متبقي: {remainingMinutes} د
              </div>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 flex items-center gap-2 bg-black/30 border border-white/10 rounded-2xl px-4 py-3">
                    <span className="text-muted-foreground text-sm w-5 shrink-0">{index + 1}.</span>
                    <input
                      {...form.register(`lessons.${index}.name`)}
                      placeholder="اسم الدرس..."
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-muted-foreground/50 outline-none"
                    />
                    {watchDistribute && (
                      <input
                        type="number"
                        {...form.register(`lessons.${index}.allocatedMinutes`, { valueAsNumber: true })}
                        placeholder="د"
                        min={1}
                        className="w-12 bg-black/40 border border-white/10 rounded-lg text-center text-xs text-primary font-bold py-1 outline-none focus:ring-1 focus:ring-primary/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    )}
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => append({ name: "", allocatedMinutes: null })}
            className="w-full py-3 rounded-2xl border border-dashed border-white/20 text-muted-foreground hover:text-white hover:border-white/40 transition-all text-sm font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة درس
          </button>
        </section>

        {/* ─── Submit ─── */}
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-accent font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/30 disabled:opacity-50"
        >
          {createMutation.isPending ? "جاري الحفظ..." : "إضافة المادة"}
        </button>
      </form>
    </div>
  );
}
