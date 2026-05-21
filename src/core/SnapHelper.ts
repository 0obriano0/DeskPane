// ============================================================
// WebOS-Core — Snap Helper
// 純計算模組：計算視窗拖曳時的吸附位置與 guide 線位置
// ============================================================

export interface SnapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapGuide {
  /** 'v' = 垂直線（固定 x），'h' = 水平線（固定 y） */
  axis: 'v' | 'h';
  /** 線在容器座標系的位置（px） */
  pos: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

/**
 * 計算單軸的吸附結果。
 * 同時檢查「近邊」(pos) 和「遠邊」(pos+size) 是否接近任一 target。
 * 回傳最近一次命中的吸附後座標與 guide 位置。
 */
function snapAxis(
  pos: number,
  size: number,
  targets: number[],
  threshold: number,
): { snapped: number; guidePos: number | null } {
  let bestDist = threshold;
  let snapped = pos;
  let guidePos: number | null = null;

  for (const t of targets) {
    // 近邊 (left / top)
    const dNear = Math.abs(pos - t);
    if (dNear < bestDist) {
      bestDist = dNear;
      snapped = t;
      guidePos = t;
    }
    // 遠邊 (right / bottom)
    const dFar = Math.abs(pos + size - t);
    if (dFar < bestDist) {
      bestDist = dFar;
      snapped = t - size;
      guidePos = t;
    }
  }

  return { snapped, guidePos };
}

/**
 * 計算拖曳視窗的吸附位置。
 *
 * @param drag          拖曳中視窗的建議位置與大小
 * @param containerSize 容器的寬高（isolated 用容器；否則用 viewport）
 * @param others        其他非最小化 / 非最大化視窗的位置與大小
 * @param threshold     吸附感應距離（px）
 */
export function snapPosition(
  drag: SnapRect,
  containerSize: { width: number; height: number },
  others: SnapRect[],
  threshold: number,
): SnapResult {
  // X 軸吸附目標：容器左邊、右邊，以及所有其他視窗的左右邊
  const xTargets = [0, containerSize.width];
  // Y 軸吸附目標：容器頂邊、底邊，以及所有其他視窗的上下邊
  const yTargets = [0, containerSize.height];

  for (const o of others) {
    xTargets.push(o.x, o.x + o.width);
    yTargets.push(o.y, o.y + o.height);
  }

  const { snapped: snapX, guidePos: guideX } = snapAxis(drag.x, drag.width, xTargets, threshold);
  const { snapped: snapY, guidePos: guideY } = snapAxis(drag.y, drag.height, yTargets, threshold);

  const guides: SnapGuide[] = [];
  if (guideX !== null) guides.push({ axis: 'v', pos: guideX });
  if (guideY !== null) guides.push({ axis: 'h', pos: guideY });

  return { x: snapX, y: snapY, guides };
}
