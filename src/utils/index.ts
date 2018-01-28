export const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

export const withChance = (chance: number): boolean => {
  return 100 * Math.random() < chance;
};