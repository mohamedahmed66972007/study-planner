import { useEffect, useCallback } from "react";

export interface SubjectTheme {
  primary: string;
  accent: string;
  background: string;
  ring: string;
}

export const DEFAULT_THEME: SubjectTheme = {
  primary: "270 85% 65%",
  accent: "320 85% 60%",
  background: "260 40% 6%",
  ring: "270 85% 65%",
};

export const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  "عربي": {
    primary: "0 80% 58%",
    accent: "15 90% 52%",
    background: "0 45% 6%",
    ring: "0 80% 58%",
  },
  "إنجليزي": {
    primary: "42 95% 52%",
    accent: "30 90% 48%",
    background: "42 40% 6%",
    ring: "42 95% 52%",
  },
  "رياضيات": {
    primary: "210 90% 62%",
    accent: "230 85% 65%",
    background: "210 45% 6%",
    ring: "210 90% 62%",
  },
  "كيمياء": {
    primary: "160 75% 48%",
    accent: "140 80% 42%",
    background: "160 40% 6%",
    ring: "160 75% 48%",
  },
  "فيزياء": {
    primary: "195 90% 52%",
    accent: "210 85% 56%",
    background: "195 40% 6%",
    ring: "195 90% 52%",
  },
  "أحياء": {
    primary: "130 70% 48%",
    accent: "150 75% 42%",
    background: "130 40% 6%",
    ring: "130 70% 48%",
  },
  "دستور": {
    primary: "25 90% 58%",
    accent: "12 85% 52%",
    background: "25 40% 6%",
    ring: "25 90% 58%",
  },
  "إسلامية": {
    primary: "270 85% 65%",
    accent: "320 85% 60%",
    background: "260 40% 6%",
    ring: "270 85% 65%",
  },
};

export function getSubjectTheme(name: string): SubjectTheme {
  return SUBJECT_THEMES[name] ?? DEFAULT_THEME;
}

function applyTheme(theme: SubjectTheme) {
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--background", theme.background);
  root.style.setProperty("--ring", theme.ring);
  root.style.setProperty("--card", theme.background.replace("6%", "12%"));
  root.style.setProperty("--popover", theme.background.replace("6%", "12%"));
}

function resetTheme() {
  const root = document.documentElement;
  root.style.removeProperty("--primary");
  root.style.removeProperty("--accent");
  root.style.removeProperty("--background");
  root.style.removeProperty("--ring");
  root.style.removeProperty("--card");
  root.style.removeProperty("--popover");
}

export function useSubjectTheme(subjectName: string | null | undefined) {
  useEffect(() => {
    if (subjectName) {
      const theme = getSubjectTheme(subjectName);
      applyTheme(theme);
    } else {
      resetTheme();
    }
    return () => {
      resetTheme();
    };
  }, [subjectName]);
}

export function useApplyTheme() {
  const apply = useCallback((name: string | null) => {
    if (name) {
      applyTheme(getSubjectTheme(name));
    } else {
      resetTheme();
    }
  }, []);
  return apply;
}
