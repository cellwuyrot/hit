"use client";

import { useInlineEdit } from "./InlineEditContext";
import InlineEditable from "./InlineEditable";

interface InlinePageTitleProps {
  id: string;
  title: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export function InlinePageTitle({
  id,
  title,
  className = "text-lg sm:text-xl font-bold text-text-dark mb-3 sm:mb-4",
  as: Tag = "h2",
}: InlinePageTitleProps) {
  const { editing } = useInlineEdit();

  if (!editing) {
    return <Tag className={className}>{title}</Tag>;
  }

  return (
    <InlineEditable
      model="sitepage"
      id={id}
      field="title"
      value={title}
      as={Tag}
      className={className}
    />
  );
}

interface InlinePageContentProps {
  id: string;
  content: string;
  className?: string;
}

export function InlinePageContent({
  id,
  content,
  className = "text-text-gray leading-relaxed",
}: InlinePageContentProps) {
  const { editing } = useInlineEdit();

  if (!editing) {
    return (
      <div
        className={`${className} space-y-4 prose prose-sm max-w-none`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <InlineEditable
      model="sitepage"
      id={id}
      field="content"
      value={content}
      as="div"
      className={className}
      multiline
    />
  );
}
