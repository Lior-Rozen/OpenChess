import { ChessGame } from './game';
import { handleTap } from './tapToMove';

describe('handleTap', () => {
  const game = new ChessGame();

  it('selects your own piece and lists its targets', () => {
    const result = handleTap(game, null, 'e2');

    expect(result.selection?.from).toBe('e2');
    expect([...(result.selection?.targets ?? [])].sort()).toEqual(['e3', 'e4']);
    expect(result.move).toBeUndefined();
  });

  it('moves when a target of the selected piece is tapped', () => {
    const result = handleTap(game, { from: 'e2', targets: ['e3', 'e4'] }, 'e4');

    expect(result).toEqual({ selection: null, move: { from: 'e2', to: 'e4' } });
  });

  it('deselects when the selected piece is tapped again', () => {
    expect(handleTap(game, { from: 'e2', targets: ['e3', 'e4'] }, 'e2')).toEqual({ selection: null });
  });

  it('switches the selection to another of your pieces', () => {
    const result = handleTap(game, { from: 'e2', targets: ['e3', 'e4'] }, 'g1');

    expect(result.selection?.from).toBe('g1');
  });

  it("ignores the opponent's pieces and empty squares", () => {
    expect(handleTap(game, null, 'e7')).toEqual({ selection: null });
    expect(handleTap(game, { from: 'e2', targets: ['e3', 'e4'] }, 'e5')).toEqual({ selection: null });
  });
});
