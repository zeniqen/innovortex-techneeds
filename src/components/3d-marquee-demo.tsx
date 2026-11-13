"use client";

import { ThreeDMarquee, type MarqueeSlide } from "@/components/ui/3d-marquee";
import { IconStarFilled, IconQuote } from "@tabler/icons-react";

export interface Review {
  name: string;
  rating: number;
  role: string;
  quote: string;
  initials: string;
}

export const reviews: Review[] = [
  {
    name: "Kanika Chauhan",
    rating: 5,
    role: "IGDTUW '25 • Web Dev Cohort",
    quote:
      "TechNeeds has been my go-to platform for staying updated on the latest tech trends. The community is incredibly supportive, and the content is top-notch. It’s a must-visit for anyone passionate about technology!",
    initials: "KC",
  },
  {
    name: "Khushi Sharma",
    rating: 5,
    role: "IGDTUW '26 • DSA in C++ Cohort",
    quote:
      "The learning experience at TechNeeds is exceptional. The senior mentors offer detailed explanations and practical advice that make complex tech topics easier to grasp. The supportive community is an added bonus.",
    initials: "KS",
  },
  {
    name: "Komal Maurya",
    rating: 5,
    role: "IGDTUW '25 • Hackathon Finalist",
    quote:
      "TechNeeds offers a wealth of information and a supportive community. The senior-led mentorship has been particularly valuable, providing me with expert advice and helping me navigate my tech career path.",
    initials: "KM",
  },
  {
    name: "Chahal Jain",
    rating: 5,
    role: "IGDTUW '26 • Full-Stack Mentee",
    quote:
      "Joining TechNeeds has been a rewarding experience. The community is welcoming, and the seniors are genuinely invested in helping you succeed. The courses are comprehensive and cater to all levels of expertise.",
    initials: "CJ",
  },
  {
    name: "Mansi Solanki",
    rating: 4,
    role: "IGDTUW '25 • Competitive Coding Track",
    quote:
      "I've been using TechNeeds for several months now, and it's been an excellent resource. The courses are well-structured, and the senior mentors are always ready to help with any questions.",
    initials: "MS",
  },
  {
    name: "Sagar",
    rating: 5,
    role: "Hackathon Participant • Core Contributor",
    quote:
      "I love how TechNeeds brings together tech enthusiasts from all backgrounds. The guidance from senior members has been instrumental in helping me understand complex topics and apply them effectively.",
    initials: "S",
  },
  {
    name: "Julie",
    rating: 4,
    role: "IGDTUW '26 • Open Source Contributor",
    quote:
      "TechNeeds stands out for its dedication to empowering individuals with tech knowledge. The senior mentors are approachable and provide valuable insights that have helped me advance in my tech career.",
    initials: "J",
  },
  {
    name: "Tanishka Manwal",
    rating: 5,
    role: "IGDTUW '25 • Software Engineering Mentee",
    quote:
      "Joining TechNeeds was one of the best decisions I made for my tech career. The seniors offer insights that you can't get from textbooks alone, and the community vibe is both supportive and motivating.",
    initials: "TM",
  },
];

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="flex size-full flex-col justify-between gap-4 overflow-hidden bg-[var(--color-emptiness)] p-6 text-left">
      {/* Rating + quote icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <IconStarFilled
              key={i}
              className={`w-3.5 h-3.5 ${
                i < review.rating ? "text-[var(--color-gold)]" : "text-[var(--color-night-white)]"
              }`}
            />
          ))}
        </div>
        <IconQuote className="w-5 h-5 shrink-0 text-[var(--color-spotted-dove)]" />
      </div>

      {/* Quote */}
      <p className="text-[13px] leading-snug text-[var(--color-caviar)] font-medium italic line-clamp-5">
        &ldquo;{review.quote}&rdquo;
      </p>

      {/* Student bio */}
      <div className="flex items-center gap-2.5 border-t border-[var(--color-night-white)] pt-3.5">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] flex items-center justify-center font-bold text-[10px] text-[var(--color-caviar)]">
          {review.initials}
        </div>
        <div className="min-w-0">
          <h3 className="text-[13px] font-bold text-[var(--color-caviar)] truncate">
            {review.name}
          </h3>
          <p className="text-[10px] text-[var(--color-iron-fixture)] truncate">{review.role}</p>
        </div>
      </div>
    </article>
  );
}

export default function ThreeDMarqueeDemo() {
  // The marquee splits the list into 4 columns, so the same set of reviews is
  // repeated to keep every column tall enough to fill the 3D band.
  const slides: MarqueeSlide[] = Array.from({ length: 32 }, (_, i) => {
    const review = reviews[i % reviews.length];
    return {
      id: `${review.name}-${i}`,
      content: <ReviewCard review={review} />,
    };
  });

  return (
    <div className="mx-auto my-10 max-w-7xl rounded-3xl bg-gray-950/5 p-2 ring-1 ring-neutral-700/10 dark:bg-neutral-800">
      <ThreeDMarquee slides={slides} />
    </div>
  );
}
