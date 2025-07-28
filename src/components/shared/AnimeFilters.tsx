import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/input";

import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { SlidersHorizontal } from "lucide-react";

import { dayNames, weekdays, years, seasons, sortOptions } from "@/constants";
import {
  getCurrentYear,
  getCurrentSeason,
  getCurrentDay,
} from "@/utils.ts/utils";

export function AnimeFilters({
  searchTerm,
  setSearchTerm,
  selectedYear,
  setSelectedYear,
  selectedSeason,
  setSelectedSeason,
  sortBy,
  setSortBy,
  selectedWeekday,
  setSelectedWeekday,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedSeason: string;
  setSelectedSeason: (season: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  selectedWeekday: string;
  setSelectedWeekday: (weekday: string) => void;
}) {
  const currentYear = getCurrentYear();
  return (
    <>
      <div className="flex flex-wrap gap-4 items-center w-full">
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search anime titles..."
            value={searchTerm}
            onChange={(e: { target: { value: string } }) =>
              setSearchTerm(e.target.value)
            }
            className="pl-10 text-foreground"
          />
        </div>

        <div className="flex items-center border border-border text-foreground rounded-lg p-1 bg-muted/20">
          {years.map((year) => (
            <Button
              key={year}
              variant={selectedYear === year.toString() ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedYear(year.toString())}
              className="text-sm px-3 py-1 h-8"
              disabled={year < currentYear}
            >
              {year}
            </Button>
          ))}
        </div>

        <div className="flex gap-1">
          {seasons.map((season) => (
            <Button
              key={season.value}
              variant={selectedSeason === season.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSeason(season.value)}
              className={`rounded-full px-4 text-sm`}
            >
              {season.label}
              {season.value === getCurrentSeason() && (
                <span role="img" aria-label="current season" className="ml-1">
                  🌟
                </span>
              )}
            </Button>
          ))}
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36 text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="gap-2" disabled>
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {weekdays.map((day) => (
          <Button
            key={day.value}
            variant={selectedWeekday === day.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedWeekday(day.value)}
            className="rounded-full px-4"
          >
            {day.label}
            {day.value === getCurrentDay() && (
              <span role="img" aria-label="current day" className="ml-1">
                🌟
              </span>
            )}
          </Button>
        ))}
      </div>
    </>
  );
}
