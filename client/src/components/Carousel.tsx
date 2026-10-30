import { ArrowRight, ChevronLeft, ChevronRight, Info, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&h=900&fit=crop&auto=format&q=75`;

const SLIDES = [
  {
    eyebrow: "Electronics",
    title: "Fewer gadgets, better ones.",
    text: "A short, opinionated range of phones, laptops and audio, chosen because we'd recommend them to a friend.",
    info: "Every electronics order includes a two-year warranty. If something fails, we replace it.",
    image: u("1505740420928-5e560c06d30e"),
    to: "/category/electronics",
    cta: "Browse electronics",
  },
  {
    eyebrow: "Autumn clothing",
    title: "Layers for the colder months.",
    text: "Wool coats, cashmere and denim made to be worn for years, not just a season.",
    info: "Wrong size? Exchanges are free within 30 days, and we send the return label.",
    image: u("1539533018447-63fcce2678e3"),
    to: "/category/fashion",
    cta: "Shop clothing",
  },
  {
    eyebrow: "Home & kitchen",
    title: "Things you'll use every day.",
    text: "Cast iron, linen and solid oak. Plain materials, made properly, at prices that make sense.",
    info: "Most furniture ships within the week. Every piece is flat-packed with clear instructions.",
    image: u("1578500494198-246f612d3b3d"),
    to: "/category/home",
    cta: "Shop home",
  },
];

export function Carousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const go = (delta: number) => setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (paused || hovered) return;
    const id = setInterval(() => go(1), 7000);
    return () => clearInterval(id);
  }, [paused, hovered, index]);

  const s = SLIDES[index]!;
  return (
    <section
      className="grid overflow-hidden rounded-xl border border-line bg-card md:grid-cols-[1fr_1.15fr]"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div key={index} className="flex flex-col justify-between gap-8 p-8 sm:p-12" role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${SLIDES.length}`}>
        <div className="space-y-5">
          <p className="animate-slide-in text-xs font-medium tracking-[0.18em] text-brand-600 uppercase dark:text-brand-400">{s.eyebrow}</p>
          <h2 className="animate-slide-in font-display text-4xl leading-[1.05] [animation-delay:80ms] sm:text-[3.4rem]">{s.title}</h2>
          <p className="animate-slide-in max-w-sm text-lg leading-relaxed text-ink-2 [animation-delay:160ms]">{s.text}</p>
          <Link to={s.to} className="animate-slide-in group inline-flex items-center gap-2 border-b border-ink pb-0.5 font-medium [animation-delay:240ms]">
            {s.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm text-ink-3">
          <span className="font-display text-ink tabular-nums">{String(index + 1).padStart(2, "0")}</span>
          <div className="flex gap-1.5">
            {SLIDES.map((x, i) => (
              <button key={x.title} onClick={() => setIndex(i)} className="flex h-5 w-10 cursor-pointer items-center" aria-label={`Go to slide ${i + 1}`} aria-current={i === index}>
                <span className="relative block h-0.5 w-full overflow-hidden rounded-full bg-line">
                  {i < index && <span className="absolute inset-0 bg-ink/40" />}
                  {i === index && <span className={`absolute inset-0 bg-ink ${paused || hovered ? "" : "origin-left animate-[grow_7s_linear_forwards] rtl:origin-right"}`} />}
                </span>
              </button>
            ))}
          </div>
          <span className="tabular-nums">{String(SLIDES.length).padStart(2, "0")}</span>
          <span className="ms-auto flex gap-1">
            <button onClick={() => setPaused(!paused)} className="cursor-pointer rounded-md p-1.5 hover:bg-soft hover:text-ink" aria-label={paused ? "Play slideshow" : "Pause slideshow"}>
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </button>
            <button onClick={() => go(-1)} className="cursor-pointer rounded-md p-1.5 hover:bg-soft hover:text-ink" aria-label="Previous slide"><ChevronLeft className="size-4" /></button>
            <button onClick={() => go(1)} className="cursor-pointer rounded-md p-1.5 hover:bg-soft hover:text-ink" aria-label="Next slide"><ChevronRight className="size-4" /></button>
          </span>
        </div>
      </div>
      <div className="relative min-h-72 bg-soft">
        {SLIDES.map((x, i) => (
          <img key={x.image} src={x.image} alt="" aria-hidden={i !== index} fetchPriority={i === 0 ? "high" : "low"}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"}`} />
        ))}
        <div className="reveal-trigger absolute end-4 top-4">
          <button className="relative z-10 grid size-9 cursor-pointer place-items-center rounded-full bg-card/90 text-ink" aria-label="More info">
            <Info className="size-4" />
          </button>
          <div className="reveal-panel absolute -end-1 -top-1 w-64 rounded-lg bg-card p-4 pe-12 text-sm leading-relaxed text-ink-2 shadow-lg">{s.info}</div>
        </div>
      </div>
    </section>
  );
}
