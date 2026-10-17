// Everything the Mastermind says. Quiet, terse, a little paranoid. Edit freely.

export const GREETING = 'Hello, friend.';

export const LINES = {
  startWatch: ["Just watch. I'll show you how it goes.", 'Watch closely. Every move has a reason.'],
  startPractice: ["Let's see what you remember.", "I'll play. You answer."],
  startTest: ['No help this time. Just you and me.', "No arrows. No second chances. Let's go."],
  startExam: ['Every branch, no help. How deep does it go?', "I'll pick the branches. You won't know which."],
  mistake: [
    'No. Look again.',
    "That's not it. You're seeing what you want to see.",
    'Wrong move. Slow down.',
    'Not that. Think.',
    "That's not in the book.",
  ],
  hint: ['Here. Follow the arrow.', "I'll show you. Just this once.", 'This one. Remember it.'],
  alternative: ["That works too. But we're playing this line.", 'Not wrong. Just not the book. Follow the arrow.'],
  watchDone: ["That's the line. Your turn next.", 'Now you know how it goes. Prove it.'],
  clean: ['Clean. Nobody saw a thing.', "Flawless. I'm almost impressed.", "No mistakes. You're learning."],
  unclean: ['Done. But not clean. Run it again.', 'You got there. The mistakes matter, though.'],
  failed: ["That's two. We're done here.", 'Too many mistakes. Again, from the top.'],
  mastered: ['You know this one now.', "That line is yours. Don't forget it."],
  levelUnlocked: ['A new level just opened. Go deeper.'],
  examPassed: ['Every branch, clean. Respect.'],
} as const;

export type LineKind = keyof typeof LINES;

export function say(kind: LineKind, random: () => number = Math.random): string {
  const options = LINES[kind];
  return options[Math.min(Math.floor(random() * options.length), options.length - 1)];
}

