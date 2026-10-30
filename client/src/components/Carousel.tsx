import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

const SLIDES = [
  { title: "Tech that keeps up with you", text: "Phones, laptops and audio from the brands you love.", info: "Free 2-year warranty on every electronics purchase.", image: "https://picsum.photos/seed/hero-tech/1600/600", to: "/category/electronics" },
  { title: "New season, new wardrobe", text: "Fresh fashion for men and women — up to 25% off.", info: "Free returns within 30 days, no questions asked.", image: "https://picsum.photos/seed/hero-fashion/1600/600", to: "/category/fashion" },
  { title: "Make your house a home", text: "Kitchenware, furniture and decor at amazing prices.", info: "Same-week delivery on most furniture items.", image: "https://picsum.photos/seed/hero-home/1600/600", to: "/category/home" },
];

export function Carousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = (delta: number) => setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => go(1), 6000);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section
      className="relative h-72 overflow-hidden rounded-2xl bg-slate-900 sm:h-96"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((s, i) => (
        <div key={s.title} className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={i !== index}>
          <img src={s.image} alt="" className="size-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-transparent" />
          {i === index && (
            <div className="absolute inset-y-0 start-0 flex max-w-xl flex-col justify-center gap-4 px-8 text-white sm:px-14">
              <h2 className="animate-slide-in text-3xl font-bold sm:text-5xl">{s.title}</h2>
              <p className="animate-slide-in text-lg text-slate-200 [animation-delay:150ms]">{s.text}</p>
              <Link to={s.to} className="animate-slide-in w-fit rounded-lg bg-brand-600 px-5 py-2.5 font-semibold hover:bg-brand-700 [animation-delay:300ms]">
                Shop now
              </Link>
            </div>
          )}
          <div className="reveal-trigger absolute end-4 top-4">
            <button className="relative z-10 grid size-9 cursor-pointer place-items-center rounded-full bg-white/20 text-white backdrop-blur" aria-label="More info">
              <Info className="size-5" />
            </button>
            <div className="reveal-panel absolute -end-1 -top-1 w-64 rounded-xl bg-white p-4 pe-12 text-sm text-slate-700 shadow-xl">{s.info}</div>
          </div>
        </div>
      ))}
      <button onClick={() => go(-1)} className="absolute start-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/20 p-2 text-white hover:bg-white/40" aria-label="Previous slide">
        <ChevronLeft />
      </button>
      <button onClick={() => go(1)} className="absolute end-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/20 p-2 text-white hover:bg-white/40" aria-label="Next slide">
        <ChevronRight />
      </button>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((s, i) => (
          <button key={s.title} onClick={() => setIndex(i)} className={`h-2 cursor-pointer rounded-full transition-all ${i === index ? "w-8 bg-white" : "w-2 bg-white/50"}`} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
    </section>
  );
}
