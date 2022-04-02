import random from 'random-number-csprng';

const CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';

export async function generateId(length = 10) {
  const promises = [];
  for (let i = 0; i < length; i++) {
    promises.push(random(0, CHARACTERS.length - 1));
  }
  const arrRandomNumbers = await Promise.all(promises);
  return arrRandomNumbers.map((num) => CHARACTERS[num]).join('');
}
