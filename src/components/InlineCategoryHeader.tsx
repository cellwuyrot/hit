"use client";

import { useInlineEdit } from "./InlineEditContext";
import InlineEditable from "./InlineEditable";

export function InlineCategoryName({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const { editing } = useInlineEdit();

  if (!editing) {
    return <h1 className="text-2xl font-bold text-text-dark mb-6">{name}</h1>;
  }

  return (
    <div className="mb-6">
      <InlineEditable
        model="category"
        id={id}
        field="name"
        value={name}
        as="h1"
        className="text-2xl font-bold text-text-dark"
      />
    </div>
  );
}

export function InlineCategorySeoText({
  id,
  seoText,
}: {
  id: string;
  seoText: string;
}) {
  const { editing } = useInlineEdit();

  if (!editing) {
    if (!seoText) return null;
    return (
      <div
        className="text-text-gray text-sm leading-relaxed mb-6 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: seoText }}
      />
    );
  }

  return (
    <div className="mb-6">
      <InlineEditable
        model="category"
        id={id}
        field="seoText"
        value={seoText || ""}
        as="div"
        className="text-text-gray text-sm leading-relaxed"
        multiline
      />
    </div>
  );
}
