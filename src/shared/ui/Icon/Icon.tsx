"use client";

import React from "react";
import styled from "styled-components";

export const ICON_PATHS = {
  "action.edit": "/icons/action/edit.svg",
  "action.lock": "/icons/action/lock.svg",
  "action.message": "/icons/action/message.svg",
  "action.moreVertical": "/icons/action/more-vertical.svg",
  "action.notePen": "/icons/action/note-pen.svg",
  "action.plus": "/icons/action/plus.svg",
  "action.send": "/icons/action/send.svg",
  "content.people": "/icons/content/people.svg",
  "content.peopleGreen": "/icons/content/people-green.svg",
  "content.peopleRed": "/icons/content/people-red.svg",
  "navigation.alarm": "/icons/navigation/alarm.svg",
  "navigation.arrowLeft": "/icons/navigation/arrow-left.svg",
  "navigation.chevronRight": "/icons/navigation/chevron-right.svg",
  "navigation.close": "/icons/navigation/close.svg",
  "navigation.textfieldArrow": "/icons/navigation/textfield-arrow.svg",
  "status.check": "/icons/status/check.svg",
  "status.circleCheckFill": "/icons/status/circle-check-fill.svg",
  "status.clockYellow": "/icons/status/clock-yellow.svg",
  "status.error": "/icons/status/error.svg",
  "status.profileCheck": "/icons/status/profile-check.svg",
  "status.sendFill": "/icons/status/send-fill.svg",
  "status.success": "/icons/status/success.svg",
  "status.textfieldError": "/icons/status/textfield-error.svg",
  "status.textfieldSuccess": "/icons/status/textfield-success.svg",
  "status.time": "/icons/status/time.svg",
  "status.warning": "/icons/status/warning.svg",
  "tab.home": "/icons/home-on.svg",
  "tab.profile": "/icons/profile-off.svg",
  "tab.result": "/icons/result-off.svg",
  "tab.talk": "/icons/talk-off.svg",
} as const;

export type IconName = keyof typeof ICON_PATHS;

export type IconProps = Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> & {
  name: IconName;
  size?: number;
  label?: string;
};

/**
 * Icon — Figma icon set
 * Monochrome SVG assets are rendered as masks, so their color follows currentColor.
 */
export function Icon({ name, size = 24, label, ...props }: IconProps) {
  return (
    <IconRoot
      {...props}
      $src={ICON_PATHS[name]}
      $size={size}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}

const IconRoot = styled.span<{ $src: string; $size: number }>`
  display: inline-block;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  flex: 0 0 auto;
  background-color: currentColor;
  -webkit-mask: url(${({ $src }) => $src}) no-repeat center / contain;
  mask: url(${({ $src }) => $src}) no-repeat center / contain;
`;
