"use client";

import { useInlineEdit } from "./InlineEditContext";
import InlineEditable from "./InlineEditable";

interface Props {
  id: string;
  name: string;
  price: number;
  description: string;
  brand: string;
}

export function InlineProductName({ id, name }: { id: string; name: string }) {
  const { editing } = useInlineEdit();

  if (!editing) {
    return (
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-dark mb-3 sm:mb-4">
        {name}
      </h1>
    );
  }

  return (
    <div className="mb-3 sm:mb-4">
      <InlineEditable
        model="product"
        id={id}
        field="name"
        value={name}
        as="h1"
        className="text-xl sm:text-2xl md:text-3xl font-bold text-text-dark"
      />
    </div>
  );
}

export function InlineProductPrice({
  id,
  price,
  oldPrice,
}: {
  id: string;
  price: number;
  oldPrice?: number | null;
}) {
  const { editing } = useInlineEdit();

  if (!editing) {
    return (
      <div className="mb-4 sm:mb-6">
        <div className="flex items-baseline gap-2 sm:gap-3">
          <span className="text-2xl sm:text-3xl font-bold text-primary">
            {price.toLocaleString("ru-RU")} ₽
          </span>
          {oldPrice && (
            <span className="text-sm sm:text-lg text-text-light line-through">
              {oldPrice.toLocaleString("ru-RU")} ₽
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-baseline gap-2 sm:gap-3">
        <InlineEditable
          model="product"
          id={id}
          field="price"
          value={String(price)}
          as="span"
          className="text-2xl sm:text-3xl font-bold text-primary"
        />
        <span className="text-sm text-text-gray">₽</span>
      </div>
    </div>
  );
}

export function InlineProductDescription({
  id,
  description,
}: {
  id: string;
  description: string;
}) {
  const { editing } = useInlineEdit();

  if (!editing) {
    if (!description) return null;
    return (
      <div className="border-t border-border pt-6">
        <h2 className="text-lg font-bold text-text-dark mb-3">Описание</h2>
        <div className="text-text-gray leading-relaxed whitespace-pre-line">
          {description}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-6">
      <h2 className="text-lg font-bold text-text-dark mb-3">Описание</h2>
      <InlineEditable
        model="product"
        id={id}
        field="description"
        value={description}
        as="div"
        className="text-text-gray leading-relaxed"
        multiline
      />
    </div>
  );
}
