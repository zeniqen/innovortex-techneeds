"use client";

import Carousel from "@/components/ui/carousel";

/**
 * One photograph per cohort, in one consistent style: women developers at
 * work. They are Unsplash photos (free to use under the Unsplash License,
 * no attribution required), loaded from Unsplash's image CDN at the size
 * the slide needs rather than kept in the repository.
 */
const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1200&h=1200&fit=crop&q=75&auto=format`;

export default function CarouselDemo() {
  const slideData = [
    {
      title: "Full-Stack Web Development",
      button: "By Vidusi Agarwal",
      src: unsplash("1580894912989-0bc892f4efd0"),
    },
    {
      title: "Data Structures & Algorithms in C/C++",
      button: "By Shefali Kaushal",
      src: unsplash("1531493731235-b5c309dca387"),
    },
    {
      title: "Artificial Intelligence & GenAI",
      button: "By Core TechNeeds AI Team",
      src: unsplash("1573165265437-f5e267bb3db6"),
    },
    {
      title: "Open Source & DevOps Blueprint",
      button: "By Alumni Network Mentors",
      src: unsplash("1531498001693-66235ecacf14"),
    },
  ];
  return (
    <div className="relative overflow-hidden w-full h-full py-20">
      <Carousel slides={slideData} />
    </div>
  );
}
