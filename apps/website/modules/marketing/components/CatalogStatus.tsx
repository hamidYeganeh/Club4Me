export function CatalogStatus({
  pending,
  error,
  empty,
  retry,
}: {
  pending: boolean;
  error: boolean;
  empty: boolean;
  retry: () => void;
}) {
  if (pending)
    return (
      <p role="status" className="p-6 text-muted">
        در حال دریافت اطلاعات…
      </p>
    );
  if (error)
    return (
      <div role="alert" className="p-6">
        <p>دریافت اطلاعات ممکن نشد.</p>
        <button type="button" onClick={retry} className="mt-3 underline">
          تلاش دوباره
        </button>
      </div>
    );
  if (empty)
    return <p className="p-6 text-muted">هنوز موردی منتشر نشده است.</p>;
  return null;
}
