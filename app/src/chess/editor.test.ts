import {
  editorBoardFrom,
  editorFen,
  editorPosition,
  editorProblem,
  poolPieceAt,
  squareAt,
  type EditorBoard,
} from './editor';
import { ChessGame } from './game';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('board editor', () => {
  it('round-trips the starting position, castling included', () => {
    const board = editorBoardFrom(new ChessGame().position());
    expect(Object.keys(board)).toHaveLength(32);
    expect(editorFen(board, 'w')).toBe(START_FEN);
    expect(editorProblem(board, 'w')).toBeNull();
  });

  it('only allows castling where the king and rook are home', () => {
    const board: EditorBoard = { e1: 'wK', a1: 'wR', e8: 'bK', h8: 'bR', d8: 'bR' };
    expect(editorFen(board, 'b')).toBe('3rk2r/8/8/8/8/8/8/R3K3 b Qk - 0 1');
    expect(editorFen({ e2: 'wK', h1: 'wR', e8: 'bK' }, 'w')).toBe('4k3/8/8/8/8/8/4K3/7R w - - 0 1');
  });

  it('needs exactly one king each', () => {
    expect(editorProblem({ e1: 'wK' }, 'w')).toBe('Each side needs exactly one king.');
    expect(editorProblem({ e1: 'wK', d1: 'wK', e8: 'bK' }, 'w')).toBe('Each side needs exactly one king.');
  });

  it('keeps pawns off the first and last rank', () => {
    expect(editorProblem({ e1: 'wK', e8: 'bK', a8: 'wP' }, 'w')).toBe("Pawns can't stand on the first or last rank.");
    expect(editorProblem({ e1: 'wK', e8: 'bK', a1: 'bP' }, 'w')).toBe("Pawns can't stand on the first or last rank.");
  });

  it('rejects a position where the side not to move is in check', () => {
    const board: EditorBoard = { e1: 'wK', e8: 'bK', e4: 'wR' };
    expect(editorProblem(board, 'w')).toBe("Black is in check but it's not their move.");
    expect(editorProblem(board, 'b')).toBeNull();
  });

  it('plays on from a set-up position, with take-back stopping there', () => {
    const board: EditorBoard = { e1: 'wK', e8: 'bK', a7: 'wP' };
    const game = new ChessGame();
    game.load(editorFen(board, 'w'));
    expect(game.move('a7', 'a8')).toBe('a8=Q+');
    expect(game.undo()).toBe(true);
    expect(game.undo()).toBe(false);
    expect(editorBoardFrom(game.position())).toEqual(board);
  });

  it('draws the set-up board as a position', () => {
    const position = editorPosition({ a8: 'bR', h1: 'wK' }, 'b');
    expect(position.board[0][0]).toEqual({ square: 'a8', type: 'r', color: 'b' });
    expect(position.board[7][7]).toEqual({ square: 'h1', type: 'k', color: 'w' });
    expect(position.turn).toBe('b');
  });

  it('finds the square under a point, for either orientation', () => {
    expect(squareAt(5, 5, 320, 'w')).toBe('a8');
    expect(squareAt(315, 315, 320, 'w')).toBe('h1');
    expect(squareAt(5, 5, 320, 'b')).toBe('h1');
    expect(squareAt(-1, 5, 320, 'w')).toBeNull();
    expect(squareAt(5, 321, 320, 'w')).toBeNull();
  });

  it('finds the pool piece under a point', () => {
    expect(poolPieceAt(5, 5, 300)).toBe('wK');
    expect(poolPieceAt(295, 5, 300)).toBe('wP');
    expect(poolPieceAt(5, 55, 300)).toBe('bK');
    expect(poolPieceAt(5, 105, 300)).toBeNull();
    expect(poolPieceAt(-1, 5, 300)).toBeNull();
  });
});
