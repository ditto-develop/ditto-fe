"use client";

import { useMemo, useState } from "react";
import { createOneOnOneRating } from "@/features/rating/api/ratingApi";
import type { OneOnOneRatingForm } from "@/features/rating";

const INITIAL_FORM: OneOnOneRatingForm = {
  metStatus: null,
  stars: 0,
  comment: "",
};

export function useOneOnOneRating(roomId: string) {
  const [form, setForm] = useState<OneOnOneRatingForm>(INITIAL_FORM);
  const [reportUser, setReportUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = useMemo(
    () => form.metStatus !== null && form.stars > 0 && !submitting,
    [form.metStatus, form.stars, submitting],
  );

  const submit = async () => {
    if (!canSubmit || form.metStatus === null) return null;
    setSubmitting(true);
    try {
      return await createOneOnOneRating(roomId, {
        ...form,
        metStatus: form.metStatus,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    setForm,
    reportUser,
    setReportUser,
    submitting,
    canSubmit,
    submit,
  };
}
