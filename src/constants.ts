export const dayNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const years = Array.from({ length: 3 }, (_, i) => 2025 + 1 - i);

export const weekdays = [
  { value: "all", label: "All Days" },
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export const seasons = [
  { value: "ALL", label: "All" },
  { value: "WINTER", label: "Winter" },
  { value: "SPRING", label: "Spring" },
  { value: "SUMMER", label: "Summer" },
  { value: "FALL", label: "Fall" },
];

export const sortOptions = [
  { value: "air-date", label: "Air Date" },
  { value: "rating", label: "Rating" },
  { value: "alphabetical", label: "Alphabetical" },
  { value: "popularity", label: "Popularity" },
  { value: "episodes", label: "Episode Count" },
];
