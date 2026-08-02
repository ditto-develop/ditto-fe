"use client";

import { useState } from "react";
import {
  createGroupRatings,
  createRematchRequest,
} from "@/features/rating/api/ratingApi";
import type { GroupMemberProfile, GroupMemberRating, OneOnOneRatingForm } from "@/features/rating";

function createInitialRating(targetUserId: string): GroupMemberRating {
  return {
    targetUserId,
    metStatus: null,
    stars: 0,
    comment: "",
    wantRematch: false,
  };
}

export function useGroupRating(roomId: string, members: GroupMemberProfile[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratings, setRatings] = useState<GroupMemberRating[]>(() =>
    members.map((member) => createInitialRating(member.userId)),
  );
  const [submitting, setSubmitting] = useState(false);
  const currentRating = ratings[currentIndex];
  const isLast = currentIndex === ratings.length - 1;
  const canContinue = Boolean(
    currentRating?.metStatus && currentRating.stars > 0 && !submitting,
  );

  const setCurrentForm = (form: OneOnOneRatingForm) => {
    setRatings((previous) =>
      previous.map((rating, index) =>
        index === currentIndex ? { ...rating, ...form } : rating,
      ),
    );
  };

  const setWantRematch = (wantRematch: boolean) => {
    setRatings((previous) =>
      previous.map((rating, index) =>
        index === currentIndex ? { ...rating, wantRematch } : rating,
      ),
    );
  };

  const submit = async () => {
    const completedRatings = ratings.filter(
      (rating): rating is GroupMemberRating & { metStatus: NonNullable<GroupMemberRating["metStatus"]> } =>
        rating.metStatus !== null && rating.stars > 0,
    );
    if (completedRatings.length !== ratings.length || !canContinue) return null;

    setSubmitting(true);
    try {
      const result = await createGroupRatings(roomId, completedRatings);
      await Promise.all(
        completedRatings
          .filter((rating) => rating.wantRematch)
          .map((rating) => createRematchRequest(rating.targetUserId)),
      );
      return result;
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (!canContinue || isLast) return;
    setCurrentIndex((index) => index + 1);
  };

  return {
    currentIndex,
    currentRating,
    ratings,
    isLast,
    canContinue,
    submitting,
    setCurrentForm,
    setWantRematch,
    next,
    submit,
  };
}
