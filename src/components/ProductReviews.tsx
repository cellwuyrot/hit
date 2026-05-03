"use client";

import { useState } from "react";

interface Review {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  userName: string;
}

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
  avgRating: number;
}

function Stars({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <svg
            className={`w-5 h-5 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId, reviews, avgRating }: ProductReviewsProps) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [localReviews, setLocalReviews] = useState(reviews);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setMessage("");
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        setMessage("Войдите в аккаунт, чтобы оставить отзыв");
        setSubmitting(false);
        return;
      }
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, rating, text: text.trim() }),
      });
      if (res.ok) {
        const review = await res.json();
        setLocalReviews([review, ...localReviews]);
        setText("");
        setRating(5);
        setShowForm(false);
        setMessage("");
      } else {
        const err = await res.json();
        setMessage(err.error || "Ошибка при отправке отзыва");
      }
    } catch {
      setMessage("Ошибка сети");
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-text-dark">Отзывы</h2>
          {localReviews.length > 0 && (
            <div className="flex items-center gap-2">
              <Stars rating={Math.round(avgRating)} />
              <span className="text-sm text-text-gray">
                {avgRating.toFixed(1)} ({localReviews.length})
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
        >
          Написать отзыв
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-bg-white rounded-xl border border-border p-5 mb-6">
          <div className="mb-4">
            <label className="text-sm text-text-gray mb-2 block">Оценка</label>
            <Stars rating={rating} interactive onChange={setRating} />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ваш отзыв..."
            required
            rows={4}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary mb-3 resize-none"
          />
          {message && <p className="text-sm text-danger mb-3">{message}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Отправка..." : "Отправить"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-bg-light text-text-gray rounded-lg text-sm"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {localReviews.length === 0 ? (
        <div className="bg-bg-white rounded-xl border border-border p-8 text-center">
          <p className="text-text-gray">Отзывов пока нет. Будьте первым!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {localReviews.map((review) => (
            <div key={review.id} className="bg-bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm">
                    {review.userName[0].toUpperCase()}
                  </div>
                  <span className="font-medium text-text-dark text-sm">{review.userName}</span>
                </div>
                <span className="text-xs text-text-light">
                  {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </div>
              <Stars rating={review.rating} />
              {review.text && <p className="mt-2 text-sm text-text-gray leading-relaxed">{review.text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
