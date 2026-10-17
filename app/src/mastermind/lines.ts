// Everything the Mastermind says. Quiet, terse, a little paranoid. Edit freely.

export const GREETING = 'Hello, friend.';

export const LINES = {
  startWatch: ['Just watch.', 'Every move has a reason.'],
  startPractice: ["Let's see what you remember.", "I'll play. You answer."],
  startTest: ['No help this time.', 'No arrows. No second chances.'],
  startExam: ['Every branch. No help.', 'I pick the branches.'],
  mistake: [
    'No. Look again.',
    "You're seeing what you want to see.",
    'Wrong move. Slow down.',
    'Not that. Think.',
    "That's not in the book.",
  ],
  hint: ['Here. Follow the arrow.', 'Just this once.', 'This one. Remember it.'],
  alternative: ['That works. Not this line.', 'Not wrong. Not the book.'],
  watchDone: ["That's the line. Your turn.", 'Now prove it.'],
  clean: ['Clean. Nobody saw a thing.', "Flawless. I'm almost impressed.", "No mistakes. You're learning."],
  unclean: ['Done. Not clean.', 'You got there. The mistakes count.'],
  failed: ["That's two. We're done here.", 'Again. From the top.'],
  mastered: ['You know this one now.', "That line is yours. Don't forget it."],
  levelUnlocked: ['New level. Go deeper.'],
  examPassed: ['Every branch, clean. Respect.'],
} as const;

export type LineKind = keyof typeof LINES;

export function say(kind: LineKind, random: () => number = Math.random): string {
  const options = LINES[kind];
  return options[Math.min(Math.floor(random() * options.length), options.length - 1)];
}

