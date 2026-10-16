import { LINES, say, type LineKind } from './lines';

describe('Mastermind lines', () => {
  it('has something to say for every moment', () => {
    for (const options of Object.values(LINES)) expect(options.length).toBeGreaterThan(0);
  });

  it('picks one of the lines for a moment', () => {
    for (const kind of Object.keys(LINES) as LineKind[]) {
      for (const r of [0, 0.5, 0.999]) expect(LINES[kind]).toContain(say(kind, () => r));
    }
  });

});
