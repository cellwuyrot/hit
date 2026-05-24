"use client";

import { useInlineEdit } from "./InlineEditContext";
import InlineEditable from "./InlineEditable";

export function InlineNewsTitle({ id, title }: { id: string; title: string }) {
  const { editing } = useInlineEdit();

  if (!editing) {
    return <h1 className="text-3xl font-bold text-text-dark mb-2">{title}</h1>;
  }

  return (
    <div className="mb-2">
      <InlineEditable
        model="news"
        id={id}
        field="title"
        value={title}
        as="h1"
        className="text-3xl font-bold text-text-dark"
      />
    </div>
  );
}

export function InlineNewsContent({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  const { editing } = useInlineEdit();

  if (!editing) {
    if (content.includes("<")) {
      return (
        <div
          className="prose prose-sm max-w-none text-text-dark
            [&_a]:text-primary [&_a]:underline [&_a:hover]:text-primary-dark
            [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
            [&_p]:mb-3 [&_li]:mb-1 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6
            [&_strong]:font-bold [&_em]:italic"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    return (
      <div className="text-text-dark leading-relaxed whitespace-pre-line">
        {content}
      </div>
    );
  }

  return (
    <InlineEditable
      model="news"
      id={id}
      field="content"
      value={content}
      as="div"
      className="text-text-dark leading-relaxed"
      multiline
    />
  );
}
