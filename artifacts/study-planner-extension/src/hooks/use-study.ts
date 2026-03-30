import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSubjects,
  useCreateSubject,
  useDeleteSubject,
  useStartSubject,
  useCompleteSubject,
  useToggleLesson,
  useGetPostponedLessons,
  useDeletePostponedLesson,
  getGetSubjectsQueryKey,
  getGetPostponedLessonsQueryKey
} from "@workspace/api-client-react";

// Wrappers to add automatic cache invalidation
export function useStudySubjects() {
  return useGetSubjects();
}

export function useStudyCreateSubject() {
  const queryClient = useQueryClient();
  return useCreateSubject({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSubjectsQueryKey() })
    }
  });
}

export function useStudyDeleteSubject() {
  const queryClient = useQueryClient();
  return useDeleteSubject({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSubjectsQueryKey() })
    }
  });
}

export function useStudyStartSubject() {
  const queryClient = useQueryClient();
  return useStartSubject({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSubjectsQueryKey() })
    }
  });
}

export function useStudyCompleteSubject() {
  const queryClient = useQueryClient();
  return useCompleteSubject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSubjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPostponedLessonsQueryKey() });
      }
    }
  });
}

export function useStudyToggleLesson() {
  const queryClient = useQueryClient();
  return useToggleLesson({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSubjectsQueryKey() })
    }
  });
}

export function useStudyPostponed() {
  return useGetPostponedLessons();
}

export function useStudyDeletePostponed() {
  const queryClient = useQueryClient();
  return useDeletePostponedLesson({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPostponedLessonsQueryKey() })
    }
  });
}
