import { useEffect, useCallback, createRef } from "react";
import { useFrame, useThree } from "react-three-fiber";
import { usePointToPointConstraint, useSphere } from "use-cannon";
import { cursor } from "./store";

export function useDragConstraint(body) {
  const [, , api] = usePointToPointConstraint(cursor, body, {
    pivotA: [0, 10, 0],
    pivotB: [0, 10, 0],
  });
  const onPointerUp = useCallback(() => api.disable(), [api]);
  const onPointerDown = useCallback(
    (e) => {
      e.stopPropagation();
      e.target.setPointerCapture(e.pointerId);
      api.enable();
    },
    [api]
  );
  useEffect(() => void api.disable(), [api]);

  return { onPointerUp, onPointerDown };
}

// A physical sphere tied to mouse coordinates without visual representation
export function Mouse() {
  const { viewport } = useThree();
  const [, api] = useSphere(() => ({ type: "Static", args: [0.5] }), cursor);
  return useFrame((state) =>
    api.position.set(
      (state.mouse.x * viewport.width) / 2,
      (state.mouse.y * viewport.height) / 2,
      0
    )
  );
}
