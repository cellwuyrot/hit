"use client";

import { useSiteSettings } from "./SiteSettingsContext";
import { useInlineEdit } from "./InlineEditContext";
import InlineEditable from "./InlineEditable";

interface InlineSettingProps {
  settingKey: string;
  fallback: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div";
  className?: string;
  multiline?: boolean;
}

export default function InlineSetting({
  settingKey,
  fallback,
  as: Tag = "span",
  className = "",
  multiline = false,
}: InlineSettingProps) {
  const { get, getId } = useSiteSettings();
  const { editing } = useInlineEdit();
  const value = get(settingKey, fallback);
  const id = getId(settingKey);

  if (!editing || !id) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <InlineEditable
      model="sitepage"
      id={id}
      field="content"
      value={value}
      as={Tag}
      className={className}
      multiline={multiline}
    />
  );
}
