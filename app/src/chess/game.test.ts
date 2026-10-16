import { ChessGame, type Square } from './game';

const sorted = (squares: Square[]) => [...squares].sort();

function play(game: ChessGame, ...moves: [Square, Square][]) {
  for (const [from, to] of moves) {
    if (game.move(from, to) === null) throw new Error(`illegal move ${from}-${to}`);
  }
}

describe('ChessGame', () => {
  it('starts from the initial position', () => {
    const position = new ChessGame().position();

    expect(position.turn).toBe('w');
    expect(position.status).toBe('playing');
    expect(position.lastMove).toBeNull();
    expect(position.board[7][4]).toEqual({ square: 'e1', type: 'k', color: 'w' });
    expect(position.board[0][3]).toEqual({ square: 'd8', type: 'q', color: 'b' });
    expect(position.board[4][4]).toBeNull();
  });

  it('lists legal targets only for the side to move', () => {
    const game = new ChessGame();

    expect(sorted(game.legalTargets('e2'))).toEqual(['e3', 'e4']);
    expect(sorted(game.legalTargets('g1'))).toEqual(['f3', 'h3']);
    expect(game.legalTargets('e7')).toEqual([]);
    expect(game.legalTargets('e4')).toEqual([]);
  });

  it('plays a legal move and reports it', () => {
    const game = new ChessGame();

    expect(game.move('e2', 'e4')).toBe('e4');
    const position = game.position();
    expect(position.turn).toBe('b');
    expect(position.lastMove).toEqual({ from: 'e2', to: 'e4' });
    expect(game.pieceAt('e4')).toEqual({ square: 'e4', type: 'p', color: 'w' });
    expect(game.pieceAt('e2')).toBeNull();
  });

  it('rejects an illegal move without changing the position', () => {
    const game = new ChessGame();
    const before = game.position().fen;

    expect(game.move('e2', 'e5')).toBeNull();
    expect(game.move('e7', 'e5')).toBeNull(); // not Black's turn
    expect(game.position().fen).toBe(before);
  });

  it('castles', () => {
    const game = new ChessGame('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');

    expect(game.legalTargets('e1')).toEqual(expect.arrayContaining(['g1', 'c1']));
    expect(game.move('e1', 'g1')).toBe('O-O');
    expect(game.pieceAt('f1')).toEqual({ square: 'f1', type: 'r', color: 'w' });
    expect(game.pieceAt('h1')).toBeNull();
  });

  it('captures en passant', () => {
    const game = new ChessGame();
    play(game, ['e2', 'e4'], ['a7', 'a6'], ['e4', 'e5'], ['d7', 'd5']);

    expect(game.legalTargets('e5')).toContain('d6');
    expect(game.move('e5', 'd6')).toBe('exd6');
    expect(game.pieceAt('d5')).toBeNull();
  });

  it('promotes to a queen automatically', () => {
    const game = new ChessGame('8/P7/8/8/8/8/k7/4K3 w - - 0 1');

    expect(game.legalTargets('a7')).toEqual(['a8']);
    expect(game.move('a7', 'a8')).toBe('a8=Q+');
    expect(game.pieceAt('a8')).toEqual({ square: 'a8', type: 'q', color: 'w' });
  });

  it('reports check and the checked king', () => {
    const game = new ChessGame();
    play(game, ['e2', 'e4'], ['f7', 'f6'], ['d1', 'h5']);

    const position = game.position();
    expect(position.status).toBe('check');
    expect(position.checkedKing).toBe('e8');
  });

  it('reports checkmate', () => {
    const game = new ChessGame();
    play(game, ['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']);

    const position = game.position();
    expect(position.status).toBe('checkmate');
    expect(position.checkedKing).toBe('e1');
    expect(game.legalTargets('e1')).toEqual([]);
  });

  it('reports stalemate', () => {
    const position = new ChessGame('k7/8/1Q6/8/8/8/8/7K b - - 0 1').position();

    expect(position.status).toBe('stalemate');
    expect(position.checkedKing).toBeNull();
  });

  it('resets to the initial position', () => {
    const game = new ChessGame();
    play(game, ['e2', 'e4']);
    game.reset();

    expect(game.position()).toEqual(new ChessGame().position());
  });
});
