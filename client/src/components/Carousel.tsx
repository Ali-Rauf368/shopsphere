import { ArrowRight, ChevronLeft, ChevronRight, Info, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=1800&h=800&fit=crop&auto=format&q=80`;

const SLIDES = [
  { eyebrow: "New season tech", title: "Tech that keeps up with you", text: "Phones, laptops and audio from the brands you love, with a free 2-year warranty.", info: "Free 2-year warranty on every electronics purchase, plus 30-day returns.", image: u("1496181133206-80ce9b88a853"), to: "/category/electronics", cta: "Shop electronics" },
  { eyebrow: "Up to 25% off", title: "New season, new wardrobe", text: "Fresh fashion for men and women. Free returns, no questions asked.", info: "Free size exchanges within 30 days, and we cover the return shipping.", image: u("1539533018447-63fcce2678e3"), to: "/category/fashion", cta: "Shop fashion" },
  { eyebrow: "Make it home", title: "Spaces you'll love coming back to", text: "Kitchenware, furniture and decor, beautifully made and fairly priced.", info: "Most furniture ships the same week, with free assembly guides.", image: u("1578500494198-246f612d3b3d"), to: "/category/home", cta: "Shop home" },
];

export function Carousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const go = (delta: number) => setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (paused || hovered) return;
    const id = setInterval(() => go(1), 6000);
    return () => clearInterval(id);
  }, [paused, hovered, index]);

  return (
    <section
      className="relative h-[26rem] overflow-hidden rounded-3xl bg-slate-900 sm:h-[30rem]"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {SLIDES.map((s, i) => (
        <div key={s.title} className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={i !== index} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}`}>
          <img src={s.image} alt="" className={`size-full object-cover transition-transform duration-[7000ms] ease-out ${i === index ? "scale-105" : "scale-100"}`} fetchPriority={i === 0 ? "high" : "low"} />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-transparent" />
          {i === index && (
            <div className="absolute inset-y-0 start-0 flex max-w-2xl flex-col justify-center gap-4 px-8 text-white sm:px-16">
              <p className="animate-slide-in w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wider uppercase backdrop-blur">{s.eyebrow}</p>
              <h2 className="animate-slide-in text-4xl leading-[1.05] font-extrabold tracking-tight [animation-delay:100ms] sm:text-6xl">{s.title}</h2>
              <p className="animate-slide-in max-w-md text-lg text-slate-200 [animation-delay:200ms]">{s.text}</p>
              <Link to={s.to} className="animate-slide-in group mt-2 flex w-fit items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 shadow-xl transition hover:bg-brand-50 [animation-delay:300ms]">
                {s.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
          <div className="reveal-trigger absolute end-4 top-4">
            <button className="relative z-10 grid size-10 cursor-pointer place-items-center rounded-full bg-white/20 text-white backdrop-blur" aria-label="More info">
              <Info className="size-5" />
            </button>
            <div className="reveal-panel absolute -end-1 -top-1 w-72 rounded-2xl bg-white p-4 pe-12 text-sm text-slate-700 shadow-xl">{s.info}</div>
          </div>
        </div>
      ))}
      <button onClick={() => go(-1)} className="absolute start-4 top-1/2 hidden -translate-y-1/2 cursor-pointer rounded-full bg-white/15 p-2.5 text-white backdrop-blur hover:bg-white/30 sm:block" aria-label="Previous slide"><ChevronLeft /></button>
      <button onClick={() => go(1)} className="absolute end-4 top-1/2 hidden -translate-y-1/2 cursor-pointer rounded-full bg-white/15 p-2.5 text-white backdrop-blur hover:bg-white/30 sm:block" aria-label="Next slide"><ChevronRight /></button>
      <div className="absolute bottom-5 start-8 flex items-center gap-2 sm:start-16">
        {SLIDES.map((s, i) => (
          <button key={s.title} onClick={() => setIndex(i)} className="relative h-1.5 w-10 cursor-pointer overflow-hidden rounded-full bg-white/30" aria-label={`Go to slide ${i + 1}`} aria-current={i === index}>
            {i === index && <span key={index} className={`absolute inset-y-0 start-0 rounded-full bg-white ${paused || hovered ? "w-full" : "animate-[grow_6s_linear_forwards]"}`} />}
          </button>
        ))}
        <button onClick={() => setPaused(!paused)} className="ms-2 cursor-pointer rounded-full p-1 text-white/80 hover:text-white" aria-label={paused ? "Play slideshow" : "Pause slideshow"}>
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
      </div>
    </section>
  );
}
