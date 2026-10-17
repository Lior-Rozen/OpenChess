import { compilePgn, openingToJson } from './pgn';
import { validateOpening } from './validateContent';

const headers = `[Id "test"]
[Name "Test Defense"]
[Side "black"]
[ECO "C00"]
[Description "A test."]
[Tags "solid, positional"]
`;

const pgn = `${headers}
1. e4 e6 {…e6 prepares …d5.} 2. d4 d5 3. e5 {@variation Advance}
(3. Nc3 {@variation Winawer} Bb4 {@line id=t-winawer level=1 tier=side name="Winawer" summary="Pin it."})
3... c5 {@line id=t-advance level=1 tier=main name="Advance" summary="Hit d4."}
4. c3 Nc6 (4... Qb6 {@alt}) 5. Nf3 Qb6
{@line id=t-advance-deep level=2 tier=main name="Advance: 5.Nf3" summary="Pile up on d4."}
*`;

describe('compilePgn', () => {
  const { opening, errors } = compilePgn(pgn, 'test.pgn');

  it('compiles headers, lines, notes, variations and alternatives', () => {
    expect(errors).toEqual([]);
    expect(opening).toMatchObject({
      id: 'test',
      name: 'Test Defense',
      side: 'black',
      eco: 'C00',
      description: 'A test.',
      tags: ['solid', 'positional'],
    });
    expect(opening!.lines).toEqual([
      {
        id: 't-advance',
        name: 'Advance',
        level: 1,
        tier: 'main',
        variation: 'Advance',
        moves: ['e4', 'e6', 'd4', 'd5', 'e5', 'c5'],
        notes: { '1': '…e6 prepares …d5.' },
        summary: 'Hit d4.',
      },
      {
        id: 't-advance-deep',
        name: 'Advance: 5.Nf3',
        level: 2,
        tier: 'main',
        variation: 'Advance',
        moves: ['e4', 'e6', 'd4', 'd5', 'e5', 'c5', 'c3', 'Nc6', 'Nf3', 'Qb6'],
        notes: { '1': '…e6 prepares …d5.' },
        accept: { '7': ['Qb6'] },
        summary: 'Pile up on d4.',
      },
      {
        id: 't-winawer',
        name: 'Winawer',
        level: 1,
        tier: 'side',
        variation: 'Winawer',
        moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'],
        notes: { '1': '…e6 prepares …d5.' },
        summary: 'Pin it.',
      },
    ]);
  });

  it('produces an opening that passes validation', () => {
    expect(validateOpening(opening, 'test.json')).toEqual([]);
  });

  it('reports structural problems', () => {
    const bad = `${headers}
1. e4 e6 2. d4 d5 (2... c5 3. d5) 3. e5 c5 4. c3 Nc6 (4... Qb6) (4... a6 {@alt} 5. Nf3)
{@line id=x level=1 tier=main name="X" summary="S."}
5. Nf3 {@line id=y level=1 tier=main name="Y" summary="S."}
6. Bd3 Qq9
*`;
    expect(compilePgn(bad, 'bad.pgn').errors).toEqual([
      'bad.pgn 2.d4: d5 and c5 are both book moves for you; mark one {@alt}',
      'bad.pgn 4.c3: Nc6 and Qb6 are both book moves for you; mark one {@alt}',
      'bad.pgn 4.c3: the @alt move a6 must be a one-move variation',
      "bad.pgn 5.Nf3: line y ends on the opponent's move",
      'bad.pgn 5…Bd3: illegal move',
      'bad.pgn 4…Qb6: the branch ends without a {@line …}',
      'bad.pgn 3.d5: the branch ends without a {@line …}',
    ]);
  });

  it('compiles known mistakes and checks them', () => {
    const withMistake = `${headers}
1. e4 e6 2. d4 d5 (2... f5 {@mistake It loses a pawn to exf5.}) 3. e5 c5
{@line id=m1 level=1 tier=main name="M" summary="S."} *`;
    const result = compilePgn(withMistake, 'm.pgn');
    expect(result.errors).toEqual([]);
    expect(result.opening!.lines[0].mistakes).toEqual({ '3': { f5: 'It loses a pawn to exf5.' } });
    expect(validateOpening(result.opening, 'm.json')).toEqual([]);

    const bad = `${headers}
1. e4 e6 2. d4 d5 (2... f5 {@mistake}) 3. e5 (3. Nc3 {@mistake No.}) 3... c5
{@line id=m2 level=1 tier=main name="M" summary="S."} *`;
    expect(compilePgn(bad, 'b.pgn').errors).toEqual([
      'b.pgn 2.d4: @mistake f5 needs a reason',
      'b.pgn 2…d5: @mistake Nc3 is not your move',
    ]);
  });

  it('reports a different book move in a transposed position', () => {
    const transposed = `${headers}
1. e4 e6 2. d4 (2. Nf3 d5 3. d4 Nf6 4. Nc3 Bb4 {@line id=b level=1 tier=main name="B" summary="S."})
2... d5 3. Nf3 Nf6 4. Nc3 Be7 {@line id=a level=1 tier=main name="A" summary="S."}
*`;
    expect(compilePgn(transposed, 't.pgn').errors).toEqual([
      't.pgn 4.Nc3: you play Bb4 here but Be7 at t.pgn 4.Nc3 (same position)',
    ]);
  });

  it('reports missing headers and @line fields', () => {
    const { errors: missing } = compilePgn('[Id "x"]\n1. e4 e6 {@line id=z level=1}\n*', 'm.pgn');
    expect(missing).toEqual(
      expect.arrayContaining([
        'm.pgn: header [Name] is missing',
        'm.pgn: header [Side] is missing',
        'm.pgn 1…e6: @line is missing tier=',
        'm.pgn 1…e6: @line is missing name=',
      ]),
    );
  });
});

describe('openingToJson', () => {
  it('keeps short string arrays on one line', () => {
    const json = openingToJson(compilePgn(pgn, 'test.pgn').opening!);
    expect(json).toContain('"tags": ["solid", "positional"],');
    expect(json).toContain('"moves": ["e4", "e6", "d4", "d5", "e5", "c5"],');
    expect(json).toContain('"7": ["Qb6"]');
    expect(JSON.parse(json).lines).toHaveLength(3);
  });
});
