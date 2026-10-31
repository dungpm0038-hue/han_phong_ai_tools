export default function Loading() {
  return (
    <main
      id="main"
      className="container section"
      role="status"
      aria-label="Đang tải"
    >
      <div className="skeleton h-10 w-2/5 mb-7" />
      <div className="skeleton h-44 w-full mb-7" />
      <div className="grid grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-40" />
        ))}
      </div>
      <span className="sr-only">Đang tải nội dung…</span>
    </main>
  );
}
