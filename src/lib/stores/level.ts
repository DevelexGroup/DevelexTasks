import { derived, get, writable } from 'svelte/store';

export const level = writable(0);

export const nextLevel = () => {
  level.update(n => n + 1);
};

export const sentenceWord = writable(0);
export const sentenceWordComplete = derived(sentenceWord, $sentenceWord => $sentenceWord >= sentences[get(sentence)].length - 1);

export const nextSentenceWord = (): boolean => {
  if (get(sentenceWordComplete)) {
    nextSentence();
    return true;
  }

  sentenceWord.update(n => n + 1);

  return false;
};

export const sentence = writable(0);
export const sentenceComplete = derived(sentence, $sentence => $sentence >= sentences.length);

export const nextSentence = () => {
  sentenceWord.set(0);
  sentence.update(n => n + 1);
};

export const zeroLevelProgress = writable(0);
export const zeroLevelComplete = derived(zeroLevelProgress, $zeroLevelProgress => $zeroLevelProgress >= words.length - 1);

export const nextZeroLevel = () => {
  zeroLevelProgress.update(n => n + 1);
};


export const words = [
  'máma',
  'dnes',
  'kolo',
  'mísa',
  'dítě',
  'léto',
  'vzduch',
  'slunce',
  'příklad'
];

export const sentences = [
  ["Máma", "mele", "maso"],
  ["Žízala", "žužle", "žízalu", "v", "louži"]
];

export const FIXATION_EYE = "fixation-eye";
export const FIXATION_WORD = "fixation-word";