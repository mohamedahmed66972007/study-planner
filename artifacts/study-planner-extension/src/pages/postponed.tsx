import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trash2, CalendarX2 } from "lucide-react";
import { useStudyPostponed, useStudyDeletePostponed } from "@/hooks/use-study";

export default function Postponed() {
  const { data: postponed, isLoading } = useStudyPostponed();
  const deleteMutation = useStudyDeletePostponed();

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">المؤجلة</h1>
        <p className="text-muted-foreground text-sm">
          الدروس التي لم يتم إنجازها في وقتها
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : postponed?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center opacity-70">
          <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
            <CalendarX2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">لا توجد دروس مؤجلة</h3>
          <p className="text-sm text-muted-foreground">أنت تسير حسب الخطة، ممتاز!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {postponed?.map(lesson => (
              <motion.div
                key={lesson.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50, scale: 0.9 }}
                className="glass-panel p-4 rounded-2xl flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-destructive" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary/80 text-muted-foreground">
                      {lesson.subjectName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      تاريخ: {lesson.originalDate}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">{lesson.lessonName}</h4>
                </div>

                <button
                  onClick={() => handleDelete(lesson.id)}
                  disabled={deleteMutation.isPending}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/20 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
