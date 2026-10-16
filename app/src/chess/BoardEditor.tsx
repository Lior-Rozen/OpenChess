import { useRef, useState, type RefObject } from 'react';
import { Animated, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { theme } from '@/theme';

import { Board } from './Board';
import {
  editorBoardFrom,
  editorFen,
  editorPosition,
  editorProblem,
  pieceOf,
  POOL,
  POOL_COLUMNS,
  poolPieceAt,
  squareAt,
  type EditorBoard,
  type PieceCode,
} from './editor';
import { ChessGame, type Color, type Square } from './game';
import { Piece } from './Piece';

type Props = {
  initial: EditorBoard;
  initialTurn: Color;
  orientation: Color;
  /** Board width and height in pixels. */
  size: number;
  /** Called with the FEN of a valid set-up position. */
  onPlay: (fen: string) => void;
  onCancel: () => void;
};

type Rect = { x: number; y: number; width: number; height: number };
type Drag = { code: PieceCode; from: Square | null };

const START = editorBoardFrom(new ChessGame().position());

/**
 * Set up any position: drag pieces in from the pool, drag them around the board, or drag them
 * off the board to remove them. "Play from here" checks the position first.
 */
export function BoardEditor({ initial, initialTurn, orientation, size, onPlay, onCancel }: Props) {
  const [board, setBoard] = useState<EditorBoard>(initial);
  const [turn, setTurn] = useState<Color>(initialTurn);
  const [problem, setProblem] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [ghost] = useState(() => new Animated.ValueXY());
  // Where the root, board and pool are on screen, for working out what a finger is over.
  const [rects, setRects] = useState<{ root?: Rect; board?: Rect; pool?: Rect }>({});
  const rootRef = useRef<View>(null);
  const boardRef = useRef<View>(null);
  const poolRef = useRef<View>(null);

  const squareSize = size / 8;
  const tileSize = size / POOL_COLUMNS;
  // The dragged piece floats a little above the finger, so it stays visible.
  const lift = squareSize * 0.6;

  function measure(name: 'root' | 'board' | 'pool', ref: RefObject<View | null>) {
    ref.current?.measureInWindow((x, y, width, height) => setRects((r) => ({ ...r, [name]: { x, y, width, height } })));
  }

  function change(next: EditorBoard) {
    setBoard(next);
    setProblem(null);
  }

  /** What is under a finger: a piece on the board or in the pool. */
  function pick(pageX: number, pageY: number): Drag | null {
    const { board: b, pool: p } = rects;
    if (b) {
      const square = squareAt(pageX - b.x, pageY - b.y, b.width, orientation);
      if (square) return board[square] ? { code: board[square], from: square } : null;
    }
    if (p) {
      const code = poolPieceAt(pageX - p.x, pageY - p.y, p.width);
      if (code) return { code, from: null };
    }
    return null;
  }

  function moveGhost(e: GestureResponderEvent) {
    const root = rects.root ?? { x: 0, y: 0 };
    ghost.setValue({
      x: e.nativeEvent.pageX - root.x - squareSize / 2,
      y: e.nativeEvent.pageY - root.y - squareSize / 2 - lift,
    });
  }

  function onGrant(e: GestureResponderEvent) {
    const picked = pick(e.nativeEvent.pageX, e.nativeEvent.pageY);
    if (!picked) return;
    moveGhost(e);
    setDrag(picked);
  }

  function onRelease(e: GestureResponderEvent) {
    if (!drag) return;
    const b = rects.board;
    const target = b ? squareAt(e.nativeEvent.pageX - b.x, e.nativeEvent.pageY - lift - b.y, b.width, orientation) : null;
    const next = { ...board };
    if (drag.from) delete next[drag.from];
    if (target) next[target] = drag.code;
    // Dropping a pool piece off the board changes nothing.
    if (target || drag.from) change(next);
    setDrag(null);
  }

  function play() {
    const why = editorProblem(board, turn);
    if (why) setProblem(why);
    else onPlay(editorFen(board, turn));
  }

  // While dragging a piece from the board, its square shows empty.
  const shown = { ...board };
  if (drag?.from) delete shown[drag.from];

  return (
    <View
      ref={rootRef}
      onLayout={() => measure('root', rootRef)}
      style={styles.root}
      onStartShouldSetResponderCapture={(e) => pick(e.nativeEvent.pageX, e.nativeEvent.pageY) !== null}
      onResponderGrant={onGrant}
      onResponderMove={moveGhost}
      onResponderRelease={onRelease}
      onResponderTerminationRequest={() => !drag}
      onResponderTerminate={() => setDrag(null)}
    >
      <View ref={boardRef} onLayout={() => measure('board', boardRef)}>
        <Board
          position={editorPosition(shown, turn)}
          orientation={orientation}
          selection={null}
          onSquarePress={() => {}}
          size={size}
        />
      </View>
      <Text style={styles.hint}>Drag pieces in from below. Drag one off the board to remove it.</Text>

      <View ref={poolRef} onLayout={() => measure('pool', poolRef)} style={[styles.pool, { width: size + 2 }]}>
        {POOL.map((code) => (
          <View key={code} style={{ width: tileSize, height: tileSize, padding: 3 }}>
            <View style={styles.tile}>
              <Piece {...pieceOf(code)} size={tileSize - 6} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.chips}>
        <Chip label="White to move" selected={turn === 'w'} onPress={() => setTurn('w')} />
        <Chip label="Black to move" selected={turn === 'b'} onPress={() => setTurn('b')} />
      </View>
      <View style={styles.chips}>
        <Chip label="Start position" onPress={() => change(START)} />
        <Chip label="Clear" dashed onPress={() => change({})} />
      </View>
      <View style={styles.chips}>
        <Button label="Cancel" onPress={onCancel} />
        <Button label="Play from here" primary onPress={play} />
      </View>
      {problem && <Text style={styles.problem}>{problem}</Text>}

      {drag && (
        <Animated.View
          pointerEvents="none"
          style={[styles.ghost, { width: squareSize, height: squareSize, transform: ghost.getTranslateTransform() }]}
        >
          <Piece {...pieceOf(drag.code)} size={squareSize} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 10 },
  hint: { fontSize: 13, fontFamily: theme.font, fontStyle: 'italic', color: theme.muted, textAlign: 'center' },
  pool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
  },
  tile: { flex: 1, backgroundColor: theme.pressed, borderRadius: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  problem: { fontSize: 15, fontFamily: theme.font, color: theme.bad, textAlign: 'center' },
  ghost: { position: 'absolute', left: 0, top: 0 },
});
