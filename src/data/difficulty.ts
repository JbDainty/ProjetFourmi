export const mechanicIntroductions = [11, 21, 36, 51, 71, 91, 111, 131] as const;
/** Rest pages retain the learned palette and a real deduction floor. */
export function difficultyProfile(page: number) {
  const lesson = mechanicIntroductions.includes(page as never);
  const relief = !lesson && [0, 1, 4].includes(page % 8);
  if (page <= 10) return { lesson, relief: false, colors: 2, maxColors: 3, minimum: 3, mixed: 1 };
  if (lesson && page <= 36)
    return { lesson, relief, colors: 2, maxColors: 2, minimum: 4, mixed: 1 };
  if (page <= 50)
    return {
      lesson,
      relief,
      colors: page < 26 ? 2 : 3,
      maxColors: 3,
      minimum: relief ? 4 : 5,
      mixed: 2,
    };
  if (page <= 150)
    return { lesson, relief, colors: 3, maxColors: 3, minimum: lesson || relief ? 6 : 7, mixed: 2 };
  if (page <= 350)
    return {
      lesson,
      relief,
      colors: relief ? 3 : 4,
      maxColors: 4,
      minimum: relief ? 7 : 9,
      mixed: relief ? 2 : 3,
    };
  if (page <= 650)
    return {
      lesson,
      relief,
      colors: relief ? 4 : 5,
      maxColors: relief ? 4 : 6,
      minimum: relief ? 9 : 11,
      mixed: relief ? 3 : 4,
    };
  return {
    lesson,
    relief,
    colors: relief ? 4 : 5,
    maxColors: relief ? 4 : 6,
    minimum: relief ? 10 : page < 850 ? 12 : 13,
    mixed: relief ? 3 : 4,
  };
}
