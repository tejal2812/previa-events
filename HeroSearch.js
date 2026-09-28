"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch } from "./Icons";

export default function HeroSearch() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const query = search.trim();
    router.push(query ? `/vendors?search=${encodeURIComponent(query)}` : "/vendors");
  };

  return (
    <form onSubmit={handleSearch} className="hero-search-widget">
      <label className="hero-search-field">
        <span aria-hidden="true"><IconSearch size={19} /></span>
        <span className="sr-only">Search events, venues and experiences</span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events, venues & experiences…"
        />
      </label>
      <button type="submit" className="hero-search-submit">
        Search
      </button>
    </form>
  );
}
