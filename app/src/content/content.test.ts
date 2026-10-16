import { bundledContent, contentIndex, loadLine, loadOpening } from './loader';
import { validateContent, validateOpening } from './validateContent';

describe('bundled content', () => {
  it('passes validation', () => {
    expect(validateContent(contentIndex, bundledContent)).toEqual([]);
  });

  it('bundles every opening listed in the index', () => {
    for (const entry of contentIndex.openings) {
      expect(loadOpening(entry.id)?.id).toBe(entry.id);
    }
  });

  it('has the French, with lines on more than one level', () => {
    const french = loadOpening('french');
    expect(french?.side).toBe('black');
    expect(french?.lines.length).toBeGreaterThanOrEqual(3);
    expect(new Set(french?.lines.map((l) => l.level)).size).toBeGreaterThan(1);
  });

  it('loads a line by id and returns null for unknown ids', () => {
    expect(loadLine('french', 'french-advance-main')?.line.name).toBe('Advance Variation');
    expect(loadLine('french', 'nope')).toBeNull();
    expect(loadOpening('nope')).toBeNull();
  });
});

describe('validateOpening', () => {
  const validLine = { id: 'l1', name: 'Line', level: 1, tier: 'main', moves: ['e4', 'e6'] };
  const opening = (lines: unknown[], side = 'black') => ({
    id: 'test',
    name: 'Test',
    side,
    eco: 'C00',
    description: 'Test opening',
    lines,
  });

  it('accepts a valid opening', () => {
    expect(validateOpening(opening([validLine]), 'test.json')).toEqual([]);
  });

  it('reports an illegal move with its position', () => {
    const errors = validateOpening(opening([{ ...validLine, moves: ['e4', 'e6', 'e5', 'Ke6'] }]), 'test.json');
    expect(errors).toEqual(['test.json "l1": move 4 (ply 3) "Ke6" is illegal or not valid SAN']);
  });

  it('reports duplicate line ids', () => {
    const errors = validateOpening(opening([validLine, validLine]), 'test.json');
    expect(errors).toContain('test.json "l1": duplicate line id');
  });

  it('reports gaps in levels', () => {
    const errors = validateOpening(opening([validLine, { ...validLine, id: 'l3', level: 3 }]), 'test.json');
    expect(errors).toContain('test.json: levels must be contiguous, level 2 is missing');
  });

  it('reports a level with only sidelines', () => {
    const errors = validateOpening(opening([validLine, { ...validLine, id: 'l2', level: 2, tier: 'side' }]), 'test.json');
    expect(errors).toContain('test.json: level 2 needs at least one main line (main lines unlock the next level)');
  });

  it('reports a line with no moves for the opening side', () => {
    const errors = validateOpening(opening([{ ...validLine, moves: ['e4'] }]), 'test.json');
    expect(errors).toContain('test.json "l1": has no moves for black');
  });

  it('reports bad fields and note keys', () => {
    const errors = validateOpening(
      opening([{ ...validLine, tier: 'deep', level: 0, notes: { '7': 'too far', x: 'not a ply' } }]),
      'test.json',
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        'test.json "l1": tier must be "main" or "side"',
        'test.json "l1": level must be a positive integer',
        'test.json "l1": note key "7" is not a ply index of this line',
        'test.json "l1": note key "x" is not a ply index of this line',
      ]),
    );
  });
});

describe('validateContent', () => {
  it('reports a missing opening file and a bad content version', () => {
    const index = { contentVersion: 0, openings: [{ id: 'x', name: 'X', side: 'white', file: 'openings/x.json' }] };
    expect(validateContent(index, {})).toEqual([
      'index.json: contentVersion must be a positive integer',
      'index.json openings[0]: file "openings/x.json" not found',
    ]);
  });
});
