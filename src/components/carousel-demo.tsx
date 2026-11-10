"use client";

import Carousel from "@/components/ui/carousel";

export default function CarouselDemo() {
  const slideData = [
    {
      title: "Full-Stack Web Development",
      button: "By Vidusi Agarwal",
      src: "/assets/web.jpeg",
    },
    {
      title: "Data Structures & Algorithms in C/C++",
      button: "By Shefali Kaushal",
      src: "/assets/c.png",
    },
    {
      title: "Artificial Intelligence & GenAI",
      button: "By Core TechNeeds AI Team",
      src: "/assets/about2.png",
    },
    {
      title: "Open Source & DevOps Blueprint",
      button: "By Alumni Network Mentors",
      src: "/assets/about4.png",
    },
  ];
  return (
    <div className="relative overflow-hidden w-full h-full py-20">
      <Carousel slides={slideData} />
    </div>
  );
}
