import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useStudio3D } from '../../context/Studio3DContext';
import { AVAILABLE_MODULE_TYPES, CABINET_DOOR_FINISHES } from '../../utils/pricingEngine';
import { Maximize2, Box } from 'lucide-react';

const isSinkModule = (typeId) => typeId === 'sink_unit_90' || typeId.includes('sink');

// Single source of truth for the sink footprint: the basin, the countertop
// cutout and the faucet position are all derived from this.
const getSinkLayout = (modWidth, modDepth) => {
  const sinkW = Math.min(modWidth * 0.8, modWidth - 0.1);
  const sinkD = Math.min(modDepth * 0.68, modDepth - 0.14);
  const rimW = 0.03;
  const cutW = sinkW - rimW * 2;
  const cutD = sinkD - rimW * 2;
  const dividerT = 0.022;
  const dividerX = -cutW * 0.09;

  return {
    sinkW,
    sinkD,
    rimW,
    cutW,
    cutD,
    dividerT,
    dividerX,
    // Nudged forward so a deck is left at the back for the faucet
    centerZ: modDepth * 0.05,
    bowlDepth: 0.17,
    wallT: 0.012,
    leftBowlCenterX: (-cutW / 2 + dividerX - dividerT / 2) / 2,
    rightBowlCenterX: (dividerX + dividerT / 2 + cutW / 2) / 2
  };
};

// Rounded-rectangle countertop slab, optionally pierced by a sink cutout.
// The returned geometry hangs below y=0, so the mesh is placed at the top surface.
const createSlabGeometry = (width, depth, thickness, cutout) => {
  const traceRoundedRect = (path, cx, cz, w, d, r) => {
    const hw = w / 2;
    const hd = d / 2;
    const rr = Math.min(r, hw, hd);
    path.moveTo(cx - hw + rr, cz - hd);
    path.lineTo(cx + hw - rr, cz - hd);
    path.quadraticCurveTo(cx + hw, cz - hd, cx + hw, cz - hd + rr);
    path.lineTo(cx + hw, cz + hd - rr);
    path.quadraticCurveTo(cx + hw, cz + hd, cx + hw - rr, cz + hd);
    path.lineTo(cx - hw + rr, cz + hd);
    path.quadraticCurveTo(cx - hw, cz + hd, cx - hw, cz + hd - rr);
    path.lineTo(cx - hw, cz - hd + rr);
    path.quadraticCurveTo(cx - hw, cz - hd, cx - hw + rr, cz - hd);
  };

  const shape = new THREE.Shape();
  traceRoundedRect(shape, 0, 0, width, depth, 0.014);

  if (cutout) {
    const hole = new THREE.Path();
    traceRoundedRect(hole, 0, cutout.z, cutout.w, cutout.d, 0.025);
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 8 });
  // Lay the profile flat: shape +Y becomes world +Z, extrusion runs downward from y=0
  geo.rotateX(Math.PI / 2);
  return geo;
};

// Built-in appliance face (oven or microwave) centred on the module front.
// Returns a group whose origin is the middle of the appliance opening.
const buildAppliancePanel = (width, height, kind) => {
  const g = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x8F99A6, metalness: 0.92, roughness: 0.26 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x15181D, metalness: 0.55, roughness: 0.42 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0A0D11,
    metalness: 0.4,
    roughness: 0.07,
    clearcoat: 1,
    clearcoatRoughness: 0.05
  });
  const displayMat = new THREE.MeshStandardMaterial({
    color: 0x1B3A2E,
    emissive: 0x2BE08A,
    emissiveIntensity: 0.55,
    roughness: 0.3
  });

  const w = width * 0.94;
  const isMicrowave = kind === 'microwave';

  // Stainless body sitting proud of the carcass front
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, height, 0.032), steelMat);
  g.add(body);

  if (isMicrowave) {
    // Control column on the right, glazed door filling the rest
    const panelW = w * 0.26;
    const panelX = w / 2 - panelW / 2;

    const panel = new THREE.Mesh(new THREE.BoxGeometry(panelW, height * 0.88, 0.012), darkMat);
    panel.position.set(panelX, 0, 0.022);
    g.add(panel);

    const display = new THREE.Mesh(new THREE.BoxGeometry(panelW * 0.7, height * 0.14, 0.006), displayMat);
    display.position.set(panelX, height * 0.28, 0.03);
    g.add(display);

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const btn = new THREE.Mesh(new THREE.BoxGeometry(panelW * 0.26, height * 0.07, 0.005), steelMat);
        btn.position.set(panelX + (col - 0.5) * panelW * 0.38, height * (0.05 - row * 0.14), 0.03);
        g.add(btn);
      }
    }

    const winW = w - panelW - w * 0.1;
    const win = new THREE.Mesh(new THREE.BoxGeometry(winW, height * 0.76, 0.01), glassMat);
    win.position.set(-w / 2 + w * 0.05 + winW / 2, 0, 0.023);
    g.add(win);

    // Slim vertical pull on the door edge
    const pull = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, height * 0.7, 16), steelMat);
    pull.position.set(panelX - panelW / 2 - 0.022, 0, 0.05);
    g.add(pull);
  } else {
    // Oven: control strip across the top, glazed door below, full-width bar handle
    const stripH = height * 0.18;
    const stripY = height / 2 - stripH / 2;

    const strip = new THREE.Mesh(new THREE.BoxGeometry(w, stripH, 0.014), darkMat);
    strip.position.set(0, stripY, 0.023);
    g.add(strip);

    const display = new THREE.Mesh(new THREE.BoxGeometry(w * 0.3, stripH * 0.42, 0.006), displayMat);
    display.position.set(0, stripY, 0.032);
    g.add(display);

    [-1, 1].forEach((side) => {
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(stripH * 0.26, stripH * 0.26, 0.016, 20), steelMat);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(side * w * 0.34, stripY, 0.034);
      g.add(knob);
    });

    const doorH = height - stripH;
    const doorY = -stripH / 2;

    const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, doorH * 0.72, 0.01), glassMat);
    win.position.set(0, doorY - doorH * 0.04, 0.023);
    g.add(win);

    const barY = doorY + doorH * 0.42;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, w * 0.9, 20), steelMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, barY, 0.058);
    g.add(bar);

    [-1, 1].forEach((side) => {
      const standoff = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.042), steelMat);
      standoff.position.set(side * w * 0.4, barY, 0.037);
      g.add(standoff);
    });
  }

  g.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return g;
};

export const StudioCanvas = () => {
  const mountRef = useRef(null);
  const {
    roomDimensions,
    selectedFloorMaterial,
    selectedDoorFinish,
    selectedCountertop,
    autoCountertopEnabled,
    placedModules,
    selectedModuleId,
    setSelectedModuleId,
    updateModuleWorldPosition,
    removeModule,
    setContextMenu,
    lightingMode,
    registerRenderCapture
  } = useStudio3D();

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const roomGroupRef = useRef(null);
  const modulesGroupRef = useRef(null);
  const countertopGroupRef = useRef(null);
  const rendererRef = useRef(null);

  const isDraggingRoomRef = useRef(false);
  const isDraggingModuleRef = useRef(false);
  const activeDraggedModuleIdRef = useRef(null);
  const dragOffsetRef = useRef(new THREE.Vector3());
  const previousTouchRef = useRef({ x: 0, y: 0 });

  const placedModulesRef = useRef(placedModules);
  const roomDimensionsRef = useRef(roomDimensions);
  const selectedModuleIdRef = useRef(selectedModuleId);

  useEffect(() => {
    placedModulesRef.current = placedModules;
  }, [placedModules]);

  useEffect(() => {
    roomDimensionsRef.current = roomDimensions;
  }, [roomDimensions]);

  useEffect(() => {
    selectedModuleIdRef.current = selectedModuleId;
  }, [selectedModuleId]);

  // HIGH-RESOLUTION SNAPSHOT FOR THE RENDER MODAL
  useEffect(() => {
    if (!registerRenderCapture) return undefined;

    registerRenderCapture((scale = 2) => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (!renderer || !scene || !camera) return null;

      const size = renderer.getSize(new THREE.Vector2());
      if (size.x < 1 || size.y < 1) return null;

      const originalRatio = renderer.getPixelRatio();

      // Temporarily upscale the drawing buffer, capture, then restore
      const hiRatio = Math.min(originalRatio * scale, 4);
      renderer.setPixelRatio(hiRatio);
      renderer.setSize(size.x, size.y, false);
      renderer.render(scene, camera);

      const dataUrl = renderer.domElement.toDataURL('image/png');

      renderer.setPixelRatio(originalRatio);
      renderer.setSize(size.x, size.y, false);
      renderer.render(scene, camera);

      if (!dataUrl || !dataUrl.startsWith('data:image/png')) return null;

      return {
        dataUrl,
        width: Math.round(size.x * hiRatio),
        height: Math.round(size.y * hiRatio)
      };
    });

    return () => registerRenderCapture(null);
  }, [registerRenderCapture]);

  // Selected Module Details for Top HUD Overlay
  const selectedModObj = placedModules.find((m) => m.id === selectedModuleId);
  const selectedModDef = selectedModObj
    ? AVAILABLE_MODULE_TYPES.find((d) => d.id === selectedModObj.typeId)
    : null;

  const selWidthCm = selectedModObj
    ? Math.round((selectedModObj.customWidth || selectedModDef?.width || 0.6) * 100)
    : 0;
  const selHeightCm = selectedModObj
    ? Math.round((selectedModObj.customHeight || selectedModDef?.height || 0.85) * 100)
    : 0;
  const selDepthCm = selectedModObj
    ? Math.round((selectedModObj.customDepth || selectedModDef?.depth || 0.6) * 100)
    : 0;

  // Global Delete / Backspace Key Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.isContentEditable)
      ) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedModuleIdRef.current) {
        e.preventDefault();
        removeModule(selectedModuleIdRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [removeModule]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Three.js Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(lightingMode === 'day' ? 0xF0F4F8 : 0x121820);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 7.5, 9.5);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(
      lightingMode === 'day' ? 0xffffff : 0x404060,
      lightingMode === 'day' ? 0.9 : 0.4
    );
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(
      lightingMode === 'day' ? 0xfffaed : 0x8090ff,
      lightingMode === 'day' ? 1.4 : 0.8
    );
    mainLight.position.set(8, 12, 8);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    // Parent Groups
    const roomGroup = new THREE.Group();
    roomGroupRef.current = roomGroup;
    scene.add(roomGroup);

    const modulesGroup = new THREE.Group();
    modulesGroupRef.current = modulesGroup;
    roomGroup.add(modulesGroup);

    const countertopGroup = new THREE.Group();
    countertopGroupRef.current = countertopGroup;
    roomGroup.add(countertopGroup);

    // Raycaster & Ground Plane
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const planeIntersectionPoint = new THREE.Vector3();

    const getMouseVector = (clientX, clientY) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      return mouse;
    };

    const getRaycastIntersects = (clientX, clientY) => {
      if (!container || !cameraRef.current || !modulesGroupRef.current) return [];
      getMouseVector(clientX, clientY);
      raycaster.setFromCamera(mouse, cameraRef.current);
      return raycaster.intersectObjects(modulesGroupRef.current.children, true);
    };

    const getGroundPlaneIntersection = (clientX, clientY) => {
      if (!cameraRef.current) return null;
      getMouseVector(clientX, clientY);
      raycaster.setFromCamera(mouse, cameraRef.current);
      if (raycaster.ray.intersectPlane(groundPlane, planeIntersectionPoint)) {
        return planeIntersectionPoint;
      }
      return null;
    };

    // Right-Click Context Menu
    const onContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const intersects = getRaycastIntersects(e.clientX, e.clientY);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj && !obj.userData?.moduleId && obj.parent) {
          obj = obj.parent;
        }
        if (obj && obj.userData?.moduleId) {
          const modId = obj.userData.moduleId;
          setSelectedModuleId(modId);
          setContextMenu({ x: e.clientX, y: e.clientY, moduleId: modId });
          return;
        }
      }
      setContextMenu(null);
    };

    // Pointer Down
    const handleStart = (clientX, clientY, button) => {
      if (button === 2) return;

      const intersects = getRaycastIntersects(clientX, clientY);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj && !obj.userData?.moduleId && obj.parent) {
          obj = obj.parent;
        }
        if (obj && obj.userData?.moduleId) {
          const modId = obj.userData.moduleId;
          const targetModuleData = placedModulesRef.current.find((m) => m.id === modId);

          if (targetModuleData) {
            isDraggingModuleRef.current = true;
            activeDraggedModuleIdRef.current = modId;
            setSelectedModuleId(modId);

            const hitGround = getGroundPlaneIntersection(clientX, clientY);
            if (hitGround) {
              dragOffsetRef.current.set(
                targetModuleData.position[0] - hitGround.x,
                0,
                targetModuleData.position[2] - hitGround.z
              );
            }
            previousTouchRef.current = { x: clientX, y: clientY };
            return;
          }
        }
      }

      isDraggingRoomRef.current = true;
      previousTouchRef.current = { x: clientX, y: clientY };
    };

    // Pointer Move
    const handleMove = (clientX, clientY) => {
      if (isDraggingModuleRef.current && activeDraggedModuleIdRef.current) {
        const hitGround = getGroundPlaneIntersection(clientX, clientY);
        if (hitGround) {
          let rawX = hitGround.x + dragOffsetRef.current.x;
          let rawZ = hitGround.z + dragOffsetRef.current.z;

          const targetMod = placedModulesRef.current.find((m) => m.id === activeDraggedModuleIdRef.current);
          const modDef = targetMod
            ? AVAILABLE_MODULE_TYPES.find((d) => d.id === targetMod.typeId)
            : null;

          const isWallCabinet = modDef?.category === 'ust';

          const baseW = targetMod ? (targetMod.customWidth || modDef?.width || 0.6) : 0.6;
          const baseD = targetMod ? (targetMod.customDepth || modDef?.depth || 0.6) : 0.6;

          const isRotated90 = (targetMod?.rotationY || 0) % Math.PI !== 0;
          const effWidth = isRotated90 ? baseD : baseW;
          const effDepth = isRotated90 ? baseW : baseD;

          const roomW = roomDimensionsRef.current.width;
          const roomL = roomDimensionsRef.current.length;

          const halfRoomW = roomW / 2;
          const halfRoomL = roomL / 2;

          const halfModW = effWidth / 2;
          const halfModD = effDepth / 2;

          const SNAP_DIST = isWallCabinet ? 0.45 : 0.35;

          // Wall Snapping
          const backWallZ = -halfRoomL + halfModD;
          if (Math.abs(rawZ - backWallZ) < SNAP_DIST) rawZ = backWallZ;

          const frontWallZ = halfRoomL - halfModD;
          if (Math.abs(rawZ - frontWallZ) < SNAP_DIST) rawZ = frontWallZ;

          const leftWallX = -halfRoomW + halfModW;
          if (Math.abs(rawX - leftWallX) < SNAP_DIST) rawX = leftWallX;

          const rightWallX = halfRoomW - halfModW;
          if (Math.abs(rawX - rightWallX) < SNAP_DIST) rawX = rightWallX;

          // Cabinet-to-Cabinet Snapping
          const targetBottom = targetMod?.position[1] || 0;
          const targetTop = targetBottom + (targetMod?.customHeight || modDef?.height || 0.85);

          placedModulesRef.current.forEach((other) => {
            if (other.id === activeDraggedModuleIdRef.current) return;

            const otherDef = AVAILABLE_MODULE_TYPES.find((d) => d.id === other.typeId);
            const otherW = other.customWidth || otherDef?.width || 0.6;
            const otherD = other.customDepth || otherDef?.depth || 0.6;
            const isOtherRotated = (other.rotationY || 0) % Math.PI !== 0;
            const otherEffW = isOtherRotated ? otherD : otherW;
            const otherEffD = isOtherRotated ? otherW : otherD;

            const otherHalfW = otherEffW / 2;
            const otherHalfD = otherEffD / 2;

            // Two modules can only butt against each other if they actually share
            // vertical space. This lets a wall unit snap to another wall unit AND
            // to a full-height tall unit, while still ignoring the base run below it.
            const otherBottom = other.position[1] || 0;
            const otherTop = otherBottom + (other.customHeight || otherDef?.height || 0.85);
            const verticalOverlap = Math.min(targetTop, otherTop) - Math.max(targetBottom, otherBottom);
            const sharesVerticalSpace = verticalOverlap > 0.05;

            if (sharesVerticalSpace) {
              const distX = Math.abs(rawX - other.position[0]);
              const distZ = Math.abs(rawZ - other.position[2]);
              const minDistX = halfModW + otherHalfW;
              const minDistZ = halfModD + otherHalfD;

              // Side-by-side snap: land exactly edge-to-edge, zero gap
              let snappedX = false;
              if (Math.abs(distX - minDistX) < SNAP_DIST && distZ < minDistZ * 0.95) {
                rawX = rawX > other.position[0] ? other.position[0] + minDistX : other.position[0] - minDistX;
                snappedX = true;
              }

              // Front/back snap only if the side snap did not already resolve the
              // collision, otherwise a unit that just went flush gets shoved off the wall
              if (!snappedX && Math.abs(distZ - minDistZ) < SNAP_DIST && distX < minDistX * 0.95) {
                rawZ = rawZ > other.position[2] ? other.position[2] + minDistZ : other.position[2] - minDistZ;
              }

              const updatedDistX = Math.abs(rawX - other.position[0]);
              const updatedDistZ = Math.abs(rawZ - other.position[2]);

              if (updatedDistX < minDistX && updatedDistZ < minDistZ) {
                const overlapX = minDistX - updatedDistX;
                const overlapZ = minDistZ - updatedDistZ;

                if (overlapX < overlapZ) {
                  rawX = rawX > other.position[0] ? other.position[0] + minDistX : other.position[0] - minDistX;
                } else {
                  rawZ = rawZ > other.position[2] ? other.position[2] + minDistZ : other.position[2] - minDistZ;
                }
              }
            }
          });

          rawX = Math.max(-halfRoomW + halfModW, Math.min(halfRoomW - halfModW, rawX));
          rawZ = Math.max(-halfRoomL + halfModD, Math.min(halfRoomL - halfModD, rawZ));

          updateModuleWorldPosition(activeDraggedModuleIdRef.current, rawX, rawZ);
        }
        return;
      }

      if (isDraggingRoomRef.current && roomGroupRef.current) {
        const deltaX = clientX - previousTouchRef.current.x;
        const deltaY = clientY - previousTouchRef.current.y;

        roomGroupRef.current.rotation.y += deltaX * 0.008;
        roomGroupRef.current.rotation.x += deltaY * 0.004;
        roomGroupRef.current.rotation.x = Math.max(-0.4, Math.min(0.8, roomGroupRef.current.rotation.x));
        previousTouchRef.current = { x: clientX, y: clientY };
      }
    };

    const handleEnd = () => {
      isDraggingRoomRef.current = false;
      isDraggingModuleRef.current = false;
      activeDraggedModuleIdRef.current = null;
    };

    const dom = container;
    const onMouseDown = (e) => handleStart(e.clientX, e.clientY, e.button);
    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();

    const onTouchStart = (e) => {
      if (e.touches.length === 1) handleStart(e.touches[0].clientX, e.touches[0].clientY, 0);
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 1) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleEnd();

    dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.addEventListener('touchend', onTouchEnd);

    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      // The container can still be laid out at zero on first paint; resizing to
      // that leaves a canvas the snapshot cannot read back from.
      if (w < 1 || h < 1) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    // Watch the container itself, not just the window: panel/sidebar layout
    // changes resize the canvas without ever firing a window resize event.
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('contextmenu', onContextMenu);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Update Dynamic Room Geometry & Floor
  useEffect(() => {
    if (!roomGroupRef.current) return;

    const childrenToRemove = [];
    roomGroupRef.current.children.forEach((child) => {
      if (child !== modulesGroupRef.current && child !== countertopGroupRef.current) {
        childrenToRemove.push(child);
      }
    });
    childrenToRemove.forEach((child) => roomGroupRef.current.remove(child));

    const w = roomDimensions.width;
    const l = roomDimensions.length;
    const h = roomDimensions.height;

    // Floor Mesh
    const floorGeo = new THREE.PlaneGeometry(w, l);
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(selectedFloorMaterial.color),
      roughness: 0.3,
      metalness: 0.1
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    roomGroupRef.current.add(floorMesh);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(Math.max(w, l), Math.round(Math.max(w, l) * 2), 0x121212, 0xCBD5E0);
    gridHelper.position.y = 0.01;
    roomGroupRef.current.add(gridHelper);

    // Back & Left Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xF8F9FA, roughness: 0.8 });
    const backWallGeo = new THREE.PlaneGeometry(w, h);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, h / 2, -l / 2);
    backWall.receiveShadow = true;
    roomGroupRef.current.add(backWall);

    const leftWallGeo = new THREE.PlaneGeometry(l, h);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-w / 2, h / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    roomGroupRef.current.add(leftWall);
  }, [roomDimensions, selectedFloorMaterial]);

  // Render 3D Cabinets & REALISTIC SINK BASIN + FAUCET
  useEffect(() => {
    if (!modulesGroupRef.current) return;

    while (modulesGroupRef.current.children.length > 0) {
      modulesGroupRef.current.remove(modulesGroupRef.current.children[0]);
    }

    const globalDoorColor = new THREE.Color(selectedDoorFinish.color);
    const countertopColor = new THREE.Color(selectedCountertop.color);

    placedModules.forEach((item) => {
      const modDef = AVAILABLE_MODULE_TYPES.find((m) => m.id === item.typeId) || AVAILABLE_MODULE_TYPES[0];
      const isSelected = item.id === selectedModuleId;
      const modWidth = item.customWidth || modDef.width;
      const modHeight = item.customHeight || modDef.height;
      const modDepth = item.customDepth || modDef.depth;
      const isGlass = item.hasGlassDoor;
      const isOpenCorner = modDef.isOpenCorner;
      const isSinkUnit = isSinkModule(item.typeId);
      const applianceType = modDef.appliance || null;
      const doorStyle = item.doorStyle || (isGlass ? 'grid_glass' : 'shaker_raised');
      const handlePos = item.handlePosition || 'right';

      const customFinish = item.customDoorFinishId
        ? CABINET_DOOR_FINISHES.find((d) => d.id === item.customDoorFinishId)
        : null;
      const activeDoorColor = customFinish ? new THREE.Color(customFinish.color) : globalDoorColor;

      const modGroup = new THREE.Group();
      modGroup.userData = { moduleId: item.id };
      modGroup.position.set(item.position[0], item.position[1], item.position[2]);
      modGroup.rotation.y = item.rotationY;

      if (isOpenCorner) {
        const bodyMat = new THREE.MeshStandardMaterial({ color: activeDoorColor, roughness: 0.5 });
        const backWallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });

        const backGeo = new THREE.BoxGeometry(modWidth, modHeight, 0.02);
        const backMesh = new THREE.Mesh(backGeo, backWallMat);
        backMesh.position.set(0, modHeight / 2, -modDepth / 2 + 0.01);
        modGroup.add(backMesh);

        const sideGeo = new THREE.BoxGeometry(0.02, modHeight, modDepth);
        const sideLeftMesh = new THREE.Mesh(sideGeo, bodyMat);
        sideLeftMesh.position.set(-modWidth / 2 + 0.01, modHeight / 2, 0);
        modGroup.add(sideLeftMesh);

        const sideRightMesh = new THREE.Mesh(sideGeo, bodyMat);
        sideRightMesh.position.set(modWidth / 2 - 0.01, modHeight / 2, 0);
        modGroup.add(sideRightMesh);

        const shelfMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.3 });
        const shelf1 = new THREE.Mesh(new THREE.BoxGeometry(modWidth * 0.95, 0.02, modDepth * 0.95), shelfMat);
        shelf1.position.set(0, modHeight * 0.35, 0);
        modGroup.add(shelf1);

        const shelf2 = new THREE.Mesh(new THREE.BoxGeometry(modWidth * 0.95, 0.02, modDepth * 0.95), shelfMat);
        shelf2.position.set(0, modHeight * 0.7, 0);
        modGroup.add(shelf2);
      } else {
        // CABINET CARCASS BODY
        const bodyMat = new THREE.MeshStandardMaterial({ color: activeDoorColor, roughness: 0.4 });

        if (isSinkUnit) {
          // Sink units are built from panels instead of a solid block, so the
          // basin can actually sink into the cabinet through the counter cutout.
          const panelT = 0.018;
          const carcassPanels = [
            { geo: [panelT, modHeight, modDepth], pos: [-modWidth / 2 + panelT / 2, modHeight / 2, 0] },
            { geo: [panelT, modHeight, modDepth], pos: [modWidth / 2 - panelT / 2, modHeight / 2, 0] },
            { geo: [modWidth, modHeight, panelT], pos: [0, modHeight / 2, -modDepth / 2 + panelT / 2] },
            { geo: [modWidth, modHeight, panelT], pos: [0, modHeight / 2, modDepth / 2 - panelT / 2] },
            { geo: [modWidth, panelT, modDepth], pos: [0, panelT / 2, 0] }
          ];

          carcassPanels.forEach(({ geo, pos }) => {
            const panelMesh = new THREE.Mesh(new THREE.BoxGeometry(...geo), bodyMat);
            panelMesh.position.set(...pos);
            panelMesh.castShadow = true;
            panelMesh.receiveShadow = true;
            panelMesh.userData = { moduleId: item.id };
            modGroup.add(panelMesh);
          });
        } else {
          const bodyGeo = new THREE.BoxGeometry(modWidth, modHeight, modDepth);
          const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
          bodyMesh.position.y = modHeight / 2;
          bodyMesh.castShadow = true;
          bodyMesh.receiveShadow = true;
          bodyMesh.userData = { moduleId: item.id };
          modGroup.add(bodyMesh);
        }

        // 3D DOOR MODELING
        const doorZ = modDepth / 2 + 0.015;
        const doorMat = new THREE.MeshStandardMaterial({ color: activeDoorColor, roughness: 0.3 });
        // Glass-door frames and mullions follow the selected finish; only the
        // glazing itself keeps its own material.
        const frameDarkMat = new THREE.MeshStandardMaterial({ color: activeDoorColor, metalness: 0.25, roughness: 0.35 });

        if (applianceType) {
          // Appliance fronts replace the door panel entirely
          const applianceSlots = applianceType === 'oven_microwave'
            ? [
              { kind: 'oven', y0: 0.262, h: 0.286 },
              { kind: 'microwave', y0: 0.556, h: 0.182 }
            ]
            : [{ kind: 'oven', y0: 0.2, h: 0.77 }];

          applianceSlots.forEach(({ kind, y0, h }) => {
            const slotH = modHeight * h;
            const panel = buildAppliancePanel(modWidth, slotH, kind);
            panel.position.set(0, modHeight * y0 + slotH / 2, doorZ);
            modGroup.add(panel);
          });

          // Plain filler doors above/below the appliance stack
          const fillers = applianceType === 'oven_microwave'
            ? [{ y0: 0.01, y1: 0.252 }, { y0: 0.748, y1: 0.99 }]
            : [{ y0: 0.01, y1: 0.19 }];

          fillers.forEach(({ y0, y1 }) => {
            const fillerH = modHeight * (y1 - y0);
            const inset = Math.min(modWidth, fillerH) * 0.1;
            const fillerMesh = new THREE.Mesh(
              new THREE.BoxGeometry(modWidth - inset * 2, fillerH - inset * 0.6, 0.025),
              doorMat
            );
            fillerMesh.position.set(0, modHeight * (y0 + y1) / 2, doorZ + 0.01);
            modGroup.add(fillerMesh);

            const fillerHandleMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.85, roughness: 0.15 });
            const fillerHandle = new THREE.Mesh(new THREE.BoxGeometry(modWidth * 0.4, 0.018, 0.03), fillerHandleMat);
            fillerHandle.position.set(0, modHeight * y1 - fillerH * 0.22, doorZ + 0.028);
            modGroup.add(fillerHandle);
          });
        } else if (doorStyle === 'shaker_raised') {
          const borderThickness = Math.min(modWidth, modHeight) * 0.12;
          const innerW = modWidth - borderThickness * 2;
          const innerH = modHeight - borderThickness * 2;

          const centerGeo = new THREE.BoxGeometry(innerW, innerH, 0.025);
          const centerMesh = new THREE.Mesh(centerGeo, doorMat);
          centerMesh.position.set(0, modHeight / 2, doorZ + 0.01);
          modGroup.add(centerMesh);
        } else if (doorStyle === 'arched_glass') {
          const frameGeo = new THREE.BoxGeometry(modWidth, modHeight, 0.03);
          const frameMesh = new THREE.Mesh(frameGeo, frameDarkMat);
          frameMesh.position.set(0, modHeight / 2, doorZ);
          modGroup.add(frameMesh);

          const glassGeo = new THREE.PlaneGeometry(modWidth * 0.82, modHeight * 0.82);
          const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x88ccee,
            transparent: true,
            opacity: 0.35,
            roughness: 0.1,
            transmission: 0.9
          });
          const glassMesh = new THREE.Mesh(glassGeo, glassMat);
          glassMesh.position.set(0, modHeight / 2, doorZ + 0.02);
          modGroup.add(glassMesh);

          const mullionMat = new THREE.MeshStandardMaterial({ color: activeDoorColor, roughness: 0.5 });
          const vertMullion = new THREE.Mesh(new THREE.BoxGeometry(0.015, modHeight * 0.8, 0.02), mullionMat);
          vertMullion.position.set(0, modHeight / 2, doorZ + 0.022);
          modGroup.add(vertMullion);

          const horiz1 = new THREE.Mesh(new THREE.BoxGeometry(modWidth * 0.8, 0.015, 0.02), mullionMat);
          horiz1.position.set(0, modHeight * 0.38, doorZ + 0.022);
          modGroup.add(horiz1);

          const horiz2 = new THREE.Mesh(new THREE.BoxGeometry(modWidth * 0.8, 0.015, 0.02), mullionMat);
          horiz2.position.set(0, modHeight * 0.65, doorZ + 0.022);
          modGroup.add(horiz2);
        } else if (doorStyle === 'grid_glass') {
          const frameGeo = new THREE.BoxGeometry(modWidth, modHeight, 0.03);
          const frameMesh = new THREE.Mesh(frameGeo, frameDarkMat);
          frameMesh.position.set(0, modHeight / 2, doorZ);
          modGroup.add(frameMesh);

          const glassGeo = new THREE.PlaneGeometry(modWidth * 0.82, modHeight * 0.82);
          const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x88ccee,
            transparent: true,
            opacity: 0.35,
            roughness: 0.1,
            transmission: 0.9
          });
          const glassMesh = new THREE.Mesh(glassGeo, glassMat);
          glassMesh.position.set(0, modHeight / 2, doorZ + 0.02);
          modGroup.add(glassMesh);

          const mullionMat = new THREE.MeshStandardMaterial({ color: activeDoorColor, roughness: 0.4 });
          const vertMullion = new THREE.Mesh(new THREE.BoxGeometry(0.015, modHeight * 0.82, 0.02), mullionMat);
          vertMullion.position.set(0, modHeight / 2, doorZ + 0.022);
          modGroup.add(vertMullion);

          const horiz1 = new THREE.Mesh(new THREE.BoxGeometry(modWidth * 0.82, 0.015, 0.02), mullionMat);
          horiz1.position.set(0, modHeight * 0.38, doorZ + 0.022);
          modGroup.add(horiz1);

          const horiz2 = new THREE.Mesh(new THREE.BoxGeometry(modWidth * 0.82, 0.015, 0.02), mullionMat);
          horiz2.position.set(0, modHeight * 0.66, doorZ + 0.022);
          modGroup.add(horiz2);
        } else if (doorStyle === 'arched_solid') {
          // One arch-topped raised panel, extruded as a single profile so it always
          // stays inside the door face instead of poking out above the cabinet.
          const borderThickness = Math.min(modWidth, modHeight) * 0.12;
          const panelW = modWidth - borderThickness * 2;
          const panelH = modHeight - borderThickness * 2;
          const halfW = panelW / 2;
          const halfH = panelH / 2;
          const archH = Math.min(halfW, panelH * 0.42);
          const archBaseY = halfH - archH;

          const panelShape = new THREE.Shape();
          panelShape.moveTo(-halfW, -halfH);
          panelShape.lineTo(halfW, -halfH);
          panelShape.lineTo(halfW, archBaseY);
          panelShape.absellipse(0, archBaseY, halfW, archH, 0, Math.PI, false, 0);
          panelShape.lineTo(-halfW, -halfH);

          const panelGeo = new THREE.ExtrudeGeometry(panelShape, {
            depth: 0.02,
            bevelEnabled: true,
            bevelThickness: 0.004,
            bevelSize: 0.005,
            bevelSegments: 2,
            curveSegments: 32
          });
          const panelMesh = new THREE.Mesh(panelGeo, doorMat);
          panelMesh.position.set(0, modHeight / 2, doorZ);
          modGroup.add(panelMesh);
        }

        // HANDLE PLACEMENT (appliance fronts carry their own bar handles)
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.85, roughness: 0.15 });
        const handleGeo = new THREE.BoxGeometry(0.025, 0.14, 0.035);
        const handleY = modHeight * 0.55;

        if (applianceType) {
          // no cabinet handle
        } else if (handlePos === 'right') {
          const handleRight = new THREE.Mesh(handleGeo, handleMat);
          handleRight.position.set(modWidth * 0.38, handleY, doorZ + 0.025);
          modGroup.add(handleRight);
        } else if (handlePos === 'left') {
          const handleLeft = new THREE.Mesh(handleGeo, handleMat);
          handleLeft.position.set(-modWidth * 0.38, handleY, doorZ + 0.025);
          modGroup.add(handleLeft);
        } else if (handlePos === 'center') {
          const handleLeft = new THREE.Mesh(handleGeo, handleMat);
          handleLeft.position.set(-modWidth * 0.25, handleY, doorZ + 0.025);
          modGroup.add(handleLeft);

          const handleRight = new THREE.Mesh(handleGeo, handleMat);
          handleRight.position.set(modWidth * 0.25, handleY, doorZ + 0.025);
          modGroup.add(handleRight);
        }
      }

      // 4. REALISTIC SINK BASIN + HIGH GOOSE-NECK FAUCET (REFERANS GÖRSEL 2 İLE %100 BİREBİR)
      if (isSinkUnit) {
        const sinkGroup = new THREE.Group();
        const layout = getSinkLayout(modWidth, modDepth);
        const { sinkW, sinkD, cutW, cutD, wallT, dividerT, dividerX, bowlDepth, centerZ } = layout;

        // Deck level = the top surface of the countertop slab
        const deckY = modHeight + 0.06;
        const bowlFloorY = deckY - bowlDepth;

        const basinMat = new THREE.MeshStandardMaterial({ color: 0x23272E, metalness: 0.35, roughness: 0.52 });
        const basinInnerMat = new THREE.MeshStandardMaterial({ color: 0x1B1F25, metalness: 0.3, roughness: 0.6 });
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xC9A227, metalness: 0.95, roughness: 0.18 });

        // Rim deck framing the cutout, hiding the raw countertop edge
        const rimMesh = new THREE.Mesh(
          createSlabGeometry(sinkW, sinkD, 0.007, { w: cutW, d: cutD, z: 0 }),
          basinMat
        );
        rimMesh.position.set(0, deckY + 0.007, centerZ);
        sinkGroup.add(rimMesh);

        // BASIN CAVITY (EVYE ÇUKURU) - four walls dropping to a floor, sat just
        // outside the cutout so the counter hides their outer faces
        const wallY = deckY - bowlDepth / 2;
        const basinWalls = [
          { geo: [cutW + wallT * 2, bowlDepth, wallT], pos: [0, wallY, centerZ - cutD / 2 - wallT / 2] },
          { geo: [cutW + wallT * 2, bowlDepth, wallT], pos: [0, wallY, centerZ + cutD / 2 + wallT / 2] },
          { geo: [wallT, bowlDepth, cutD], pos: [-cutW / 2 - wallT / 2, wallY, centerZ] },
          { geo: [wallT, bowlDepth, cutD], pos: [cutW / 2 + wallT / 2, wallY, centerZ] },
          { geo: [cutW + wallT * 2, wallT, cutD + wallT * 2], pos: [0, bowlFloorY - wallT / 2, centerZ] }
        ];

        basinWalls.forEach(({ geo, pos }) => {
          const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(...geo), basinInnerMat);
          wallMesh.position.set(...pos);
          wallMesh.receiveShadow = true;
          sinkGroup.add(wallMesh);
        });

        // Dual Basin Divider, sitting slightly below the rim
        const dividerH = bowlDepth - 0.018;
        const dividerMesh = new THREE.Mesh(new THREE.BoxGeometry(dividerT, dividerH, cutD), basinInnerMat);
        dividerMesh.position.set(dividerX, deckY - 0.018 - dividerH / 2, centerZ);
        sinkGroup.add(dividerMesh);

        // One brass strainer per bowl
        [layout.leftBowlCenterX, layout.rightBowlCenterX].forEach((drainX) => {
          const drainMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.006, 28), brassMat);
          drainMesh.position.set(drainX, bowlFloorY + 0.003, centerZ);
          sinkGroup.add(drainMesh);

          const drainHoleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.008, 20), basinInnerMat);
          drainHoleMesh.position.set(drainX, bowlFloorY + 0.005, centerZ);
          sinkGroup.add(drainHoleMesh);
        });

        // HIGH ARCHED GOOSE-NECK MATTE BLACK FAUCET (KUĞU BOYUNLU SİYAH BATARYA)
        const faucetGroup = new THREE.Group();
        // Mounted on the deck behind the cutout, centred over the larger bowl
        faucetGroup.position.set(layout.rightBowlCenterX, deckY, centerZ - cutD / 2 - 0.055);

        // Soft-touch matte black body with a light clearcoat sheen
        const faucetBodyMat = new THREE.MeshPhysicalMaterial({
          color: 0x14161A,
          metalness: 0.6,
          roughness: 0.32,
          clearcoat: 0.65,
          clearcoatRoughness: 0.22
        });
        const faucetTrimMat = new THREE.MeshStandardMaterial({ color: 0xC9A227, metalness: 0.95, roughness: 0.16 });

        // Spout has to clear the deck and land inside the bowl, so the reach follows the cutout
        const spoutReach = THREE.MathUtils.clamp(cutD * 0.55 + 0.055, 0.15, 0.23);
        const columnTop = 0.145;
        const neckApex = 0.325;

        // Escutcheon Base Plate + Brass Trim Ring
        const baseGeo = new THREE.CylinderGeometry(0.038, 0.043, 0.014, 32);
        const baseMesh = new THREE.Mesh(baseGeo, faucetBodyMat);
        baseMesh.position.y = 0.007;
        faucetGroup.add(baseMesh);

        const baseRingGeo = new THREE.TorusGeometry(0.0375, 0.0035, 12, 32);
        const baseRingMesh = new THREE.Mesh(baseRingGeo, faucetTrimMat);
        baseRingMesh.rotation.x = Math.PI / 2;
        baseRingMesh.position.y = 0.014;
        faucetGroup.add(baseRingMesh);

        // Tapered Vertical Column
        const columnGeo = new THREE.CylinderGeometry(0.021, 0.027, columnTop, 32);
        const columnMesh = new THREE.Mesh(columnGeo, faucetBodyMat);
        columnMesh.position.y = columnTop / 2;
        faucetGroup.add(columnMesh);

        // Goose-Neck: one continuous swept tube from the column into the spout tip
        const neckCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, columnTop - 0.03, 0),
          new THREE.Vector3(0, 0.225, 0.002),
          new THREE.Vector3(0, neckApex - 0.028, 0.022),
          new THREE.Vector3(0, neckApex, 0.075),
          new THREE.Vector3(0, neckApex, spoutReach * 0.68),
          new THREE.Vector3(0, neckApex - 0.03, spoutReach),
          new THREE.Vector3(0, neckApex - 0.075, spoutReach)
        ], false, 'centripetal');

        const neckGeo = new THREE.TubeGeometry(neckCurve, 80, 0.0145, 20, false);
        const neckMesh = new THREE.Mesh(neckGeo, faucetBodyMat);
        faucetGroup.add(neckMesh);

        // Aerator Tip + Brass Collar at the spout outlet
        const aeratorCollarGeo = new THREE.TorusGeometry(0.0155, 0.0035, 12, 24);
        const aeratorCollarMesh = new THREE.Mesh(aeratorCollarGeo, faucetTrimMat);
        aeratorCollarMesh.rotation.x = Math.PI / 2;
        aeratorCollarMesh.position.set(0, neckApex - 0.078, spoutReach);
        faucetGroup.add(aeratorCollarMesh);

        const aeratorGeo = new THREE.CylinderGeometry(0.0165, 0.019, 0.024, 24);
        const aeratorMesh = new THREE.Mesh(aeratorGeo, faucetBodyMat);
        aeratorMesh.position.set(0, neckApex - 0.09, spoutReach);
        faucetGroup.add(aeratorMesh);

        // Single-Lever Mixer Handle, hinged off the column shoulder
        const leverGroup = new THREE.Group();
        leverGroup.position.set(0.019, columnTop - 0.022, 0);
        leverGroup.rotation.z = 0.38;

        const leverHubMesh = new THREE.Mesh(new THREE.SphereGeometry(0.0155, 20, 16), faucetBodyMat);
        leverGroup.add(leverHubMesh);

        const leverArmGeo = new THREE.CylinderGeometry(0.0075, 0.0095, 0.072, 20);
        const leverArmMesh = new THREE.Mesh(leverArmGeo, faucetBodyMat);
        leverArmMesh.rotation.z = Math.PI / 2;
        leverArmMesh.position.x = 0.04;
        leverGroup.add(leverArmMesh);

        const leverCapMesh = new THREE.Mesh(new THREE.SphereGeometry(0.0078, 16, 12), faucetTrimMat);
        leverCapMesh.position.x = 0.076;
        leverGroup.add(leverCapMesh);

        faucetGroup.add(leverGroup);

        faucetGroup.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        modGroup.add(sinkGroup);
        modGroup.add(faucetGroup);
      }

      // Individual Countertop for Base/Island if Auto Countertop disabled
      if (!autoCountertopEnabled && (modDef.category === 'alt' || modDef.category === 'ada')) {
        let counterCutout = null;
        if (isSinkUnit) {
          const layout = getSinkLayout(modWidth, modDepth);
          counterCutout = { w: layout.cutW, d: layout.cutD, z: layout.centerZ };
        }

        const counterGeo = createSlabGeometry(modWidth + 0.04, modDepth + 0.04, 0.06, counterCutout);
        const counterMat = new THREE.MeshStandardMaterial({ color: countertopColor, roughness: 0.2 });
        const counterMesh = new THREE.Mesh(counterGeo, counterMat);
        counterMesh.position.y = modHeight + 0.06;
        modGroup.add(counterMesh);
      }

      if (isSelected) {
        const boxHelperGeo = new THREE.BoxGeometry(modWidth + 0.08, modHeight + 0.08, modDepth + 0.08);
        const boxHelperMat = new THREE.MeshBasicMaterial({ color: 0xFAD02C, wireframe: true });
        const boxHelper = new THREE.Mesh(boxHelperGeo, boxHelperMat);
        boxHelper.position.y = modHeight / 2;
        modGroup.add(boxHelper);
      }

      modulesGroupRef.current.add(modGroup);
    });
  }, [placedModules, selectedModuleId, selectedDoorFinish, selectedCountertop, autoCountertopEnabled]);

  // AUTOMATIC COUNTERTOP GENERATOR SYSTEM
  useEffect(() => {
    if (!countertopGroupRef.current) return;

    while (countertopGroupRef.current.children.length > 0) {
      countertopGroupRef.current.remove(countertopGroupRef.current.children[0]);
    }

    if (!autoCountertopEnabled) return;

    const baseModules = placedModules.filter((m) => {
      const def = AVAILABLE_MODULE_TYPES.find((d) => d.id === m.typeId);
      return def && (def.category === 'alt' || def.category === 'ada');
    });

    if (baseModules.length === 0) return;

    const countertopColor = new THREE.Color(selectedCountertop.color);

    baseModules.forEach((item) => {
      const modDef = AVAILABLE_MODULE_TYPES.find((m) => m.id === item.typeId);
      const modWidth = item.customWidth || modDef.width;
      const modHeight = item.customHeight || modDef.height;
      const modDepth = item.customDepth || modDef.depth;

      let slabCutout = null;
      if (isSinkModule(item.typeId)) {
        const layout = getSinkLayout(modWidth, modDepth);
        slabCutout = { w: layout.cutW, d: layout.cutD, z: layout.centerZ };
      }

      const slabGeo = createSlabGeometry(modWidth + 0.06, modDepth + 0.06, 0.06, slabCutout);
      const slabMat = new THREE.MeshStandardMaterial({
        color: countertopColor,
        roughness: 0.2,
        metalness: 0.1
      });
      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.position.set(item.position[0], modHeight + 0.06, item.position[2]);
      slabMesh.rotation.y = item.rotationY;
      slabMesh.castShadow = true;
      countertopGroupRef.current.add(slabMesh);
    });
  }, [placedModules, selectedCountertop, autoCountertopEnabled]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(lightingMode === 'day' ? 0xF0F4F8 : 0x121820);
    }
  }, [lightingMode]);

  return (
    <div className="relative w-full h-full min-h-[480px] md:min-h-[620px] overflow-hidden rounded-3xl cursor-grab active:cursor-grabbing select-none">
      <div ref={mountRef} className="w-full h-full touch-none" />

      {/* TOP FLOATING OVERLAY HUD - SELECTED MODULE DIMENSIONS IN CM */}
      {selectedModObj && (
        <div className="absolute top-4 left-4 z-10 bg-[#121212]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl text-white text-xs font-bold border border-white/20 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2 text-[#FAD02C]">
            <Box className="w-4 h-4" />
            <span className="font-extrabold">{selectedModDef?.name || 'Seçili Modül'}</span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Width, Height, Depth Badges in CM */}
          <div className="flex items-center gap-2">
            <span className="bg-white/10 px-2 py-1 rounded-xl text-gray-200">
              Genişlik (G): <strong className="text-[#FAD02C]">{selWidthCm} cm</strong>
            </span>
            <span className="bg-white/10 px-2 py-1 rounded-xl text-gray-200">
              Yükseklik (Y): <strong className="text-[#FAD02C]">{selHeightCm} cm</strong>
            </span>
            <span className="bg-white/10 px-2 py-1 rounded-xl text-gray-200">
              Derinlik (D): <strong className="text-[#FAD02C]">{selDepthCm} cm</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
