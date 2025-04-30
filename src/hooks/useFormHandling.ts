
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormProps, FieldValues, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { useErrorHandler } from "@/utils/errorHandler";

interface UseFormHandlingProps<T extends FieldValues> {
  schema: z.ZodTypeAny;
  defaultValues?: UseFormProps<T>['defaultValues'];
  onSubmit: SubmitHandler<T>;
  errorContext?: string;
  showToast?: boolean;
}

export function useFormHandling<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  errorContext = "Erreur lors de la soumission du formulaire",
  showToast = true
}: UseFormHandlingProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleError } = useErrorHandler();
  
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  
  const handleSubmit = async (data: T) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      handleError(error, errorContext, showToast);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    form,
    isSubmitting,
    onSubmit: form.handleSubmit(handleSubmit),
  };
}
