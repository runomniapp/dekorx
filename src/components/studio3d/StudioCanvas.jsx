import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useStudio3D } from '../../context/Studio3DContext';
import { AVAILABLE_MODULE_TYPES, CABINET_DOOR_FINISHES } from '../../utils/pricingEngine';
import {
  buildModuleGroup,
  createModuleMaterials,
  createSlabGeometry,
  getModuleSinkCutout,
  moduleTakesCountertop
} from '../../utils/moduleBuilders';
import { Box, Maximize, Minimize, Plus, Minus, Crosshair, X } from 'lucide-react';

// ── Kamera yörünge sabitleri ────────────────────────────────────────────────
const CAM_TARGET = new THREE.Vector3(0, 1, 0);
const CAM_OFFSET = new THREE.Vector3(0, 6.5, 9.5);
const CAM_BASE_DIST = CAM_OFFSET.length();
const CAM_DIR = CAM_OFFSET.clone().normalize();
const CAM_MIN_DIST = 2.6;
const CAM_MAX_DIST = 26;

const LONG_PRESS_MS = 460;
const TAP_SLOP_PX = 8;

export const StudioCanvas = () => {
  const mountRef = useRef(null);
  const wrapperRef = useRef(null);

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
  const camDistRef = useRef(CAM_BASE_DIST);

  const isDraggingRoomRef = useRef(false);
  const isDraggingModuleRef = useRef(false);
  const activeDraggedModuleIdRef = useRef(null);
  const dragOffsetRef = useRef(new THREE.Vector3());
  const previousTouchRef = useRef({ x: 0, y: 0 });

  // Boşluğa dokunma / basılı tutma takibi
  const gestureRef = useRef({ startX: 0, startY: 0, moved: 0, hitModuleId: null, longPressFired: false });
  const longPressTimerRef = useRef(null);
  const pinchStartRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const placedModulesRef = useRef(placedModules);
  const roomDimensionsRef = useRef(roomDimensions);
  const selectedModuleIdRef = useRef(selectedModuleId);

  useEffect(() => { placedModulesRef.current = placedModules; }, [placedModules]);
  useEffect(() => { roomDimensionsRef.current = roomDimensions; }, [roomDimensions]);
  useEffect(() => { selectedModuleIdRef.current = selectedModuleId; }, [selectedModuleId]);

  // ── Kamera mesafesini uygula ───────────────────────────────────────────────
  const applyCameraDistance = useCallback(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    cam.position.copy(CAM_TARGET).addScaledVector(CAM_DIR, camDistRef.current);
    cam.lookAt(CAM_TARGET);
  }, []);

  const zoomBy = useCallback((factor) => {
    camDistRef.current = THREE.MathUtils.clamp(camDistRef.current * factor, CAM_MIN_DIST, CAM_MAX_DIST);
    applyCameraDistance();
  }, [applyCameraDistance]);

  const resetView = useCallback(() => {
    camDistRef.current = CAM_BASE_DIST;
    applyCameraDistance();
    if (roomGroupRef.current) {
      roomGroupRef.current.rotation.set(0, 0, 0);
    }
  }, [applyCameraDistance]);

  const toggleFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ── Render modalı için yüksek çözünürlüklü kare yakalama ──────────────────
  useEffect(() => {
    if (!registerRenderCapture) return undefined;

    registerRenderCapture((scale = 2, options = {}) => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (!renderer || !scene || !camera) return null;

      const size = renderer.getSize(new THREE.Vector2());
      if (size.x < 1 || size.y < 1) return null;

      // AI render'a giden karede ızgara ve seçim çerçevesi olmamalı;
      // yoksa model bu yardımcı çizgileri de "gerçek" sanıp boyar.
      const hidden = [];
      if (options.clean) {
        scene.traverse((obj) => {
          if (obj.visible && obj.userData?.isViewportHelper) {
            obj.visible = false;
            hidden.push(obj);
          }
        });
      }

      const originalRatio = renderer.getPixelRatio();
      const hiRatio = Math.min(originalRatio * scale, 4);
      renderer.setPixelRatio(hiRatio);
      renderer.setSize(size.x, size.y, false);
      renderer.render(scene, camera);

      const dataUrl = renderer.domElement.toDataURL('image/png');

      renderer.setPixelRatio(originalRatio);
      renderer.setSize(size.x, size.y, false);
      hidden.forEach((obj) => { obj.visible = true; });
      renderer.render(scene, camera);

      if (!dataUrl || !dataUrl.startsWith('data:image/png')) return null;

      return { dataUrl, width: Math.round(size.x * hiRatio), height: Math.round(size.y * hiRatio) };
    });

    return () => registerRenderCapture(null);
  }, [registerRenderCapture]);

  // ── Seçili modül bilgileri (üst HUD) ──────────────────────────────────────
  const selectedModObj = placedModules.find((m) => m.id === selectedModuleId);
  const selectedModDef = selectedModObj
    ? AVAILABLE_MODULE_TYPES.find((d) => d.id === selectedModObj.typeId)
    : null;

  const toCm = (val, fallback) => Math.round((val || fallback || 0) * 100);
  const selWidthCm = selectedModObj ? toCm(selectedModObj.customWidth, selectedModDef?.width) : 0;
  const selHeightCm = selectedModObj ? toCm(selectedModObj.customHeight, selectedModDef?.height) : 0;
  const selDepthCm = selectedModObj ? toCm(selectedModObj.customDepth, selectedModDef?.depth) : 0;

  // ── Delete / Backspace ile silme ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedModuleIdRef.current) {
        e.preventDefault();
        removeModule(selectedModuleIdRef.current);
      }
      if (e.key === 'Escape' && selectedModuleIdRef.current) setSelectedModuleId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [removeModule, setSelectedModuleId]);

  // ── Sahne kurulumu & etkileşim ────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(lightingMode === 'day' ? 0xF0F4F8 : 0x121820);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    applyCameraDistance();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

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

    const roomGroup = new THREE.Group();
    roomGroupRef.current = roomGroup;
    scene.add(roomGroup);

    const modulesGroup = new THREE.Group();
    modulesGroupRef.current = modulesGroup;
    roomGroup.add(modulesGroup);

    const countertopGroup = new THREE.Group();
    countertopGroupRef.current = countertopGroup;
    roomGroup.add(countertopGroup);

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

    // İsabet eden mesh'ten yukarı çıkarak modül id'sini bulur
    const findHitModuleId = (clientX, clientY) => {
      const intersects = getRaycastIntersects(clientX, clientY);
      if (intersects.length === 0) return null;
      let obj = intersects[0].object;
      while (obj && !obj.userData?.moduleId && obj.parent) obj = obj.parent;
      return obj?.userData?.moduleId || null;
    };

    const getGroundPlaneIntersection = (clientX, clientY) => {
      if (!cameraRef.current) return null;
      getMouseVector(clientX, clientY);
      raycaster.setFromCamera(mouse, cameraRef.current);
      if (raycaster.ray.intersectPlane(groundPlane, planeIntersectionPoint)) return planeIntersectionPoint;
      return null;
    };

    const openContextMenuFor = (moduleId, clientX, clientY) => {
      setSelectedModuleId(moduleId);
      setContextMenu({ x: clientX, y: clientY, moduleId });
    };

    const clearLongPress = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    // Sağ tık menüsü (masaüstü)
    const onContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modId = findHitModuleId(e.clientX, e.clientY);
      if (modId) openContextMenuFor(modId, e.clientX, e.clientY);
      else setContextMenu(null);
    };

    const beginModuleDrag = (moduleId, clientX, clientY) => {
      const targetModuleData = placedModulesRef.current.find((m) => m.id === moduleId);
      if (!targetModuleData) return false;

      isDraggingModuleRef.current = true;
      activeDraggedModuleIdRef.current = moduleId;
      setSelectedModuleId(moduleId);

      const hitGround = getGroundPlaneIntersection(clientX, clientY);
      if (hitGround) {
        dragOffsetRef.current.set(
          targetModuleData.position[0] - hitGround.x,
          0,
          targetModuleData.position[2] - hitGround.z
        );
      }
      previousTouchRef.current = { x: clientX, y: clientY };
      return true;
    };

    const handleStart = (clientX, clientY, button, isTouch) => {
      if (button === 2) return;

      gestureRef.current = { startX: clientX, startY: clientY, moved: 0, hitModuleId: null, longPressFired: false };

      const modId = findHitModuleId(clientX, clientY);
      gestureRef.current.hitModuleId = modId;

      if (modId) {
        // Mobilde basılı tutmak sağ tuş yerine geçer
        if (isTouch) {
          clearLongPress();
          longPressTimerRef.current = setTimeout(() => {
            longPressTimerRef.current = null;
            gestureRef.current.longPressFired = true;
            isDraggingModuleRef.current = false;
            activeDraggedModuleIdRef.current = null;
            if (navigator.vibrate) navigator.vibrate(18);
            openContextMenuFor(modId, clientX, clientY);
          }, LONG_PRESS_MS);
        }
        if (beginModuleDrag(modId, clientX, clientY)) return;
      }

      isDraggingRoomRef.current = true;
      previousTouchRef.current = { x: clientX, y: clientY };
    };

    const handleMove = (clientX, clientY) => {
      const g = gestureRef.current;
      g.moved = Math.max(g.moved, Math.hypot(clientX - g.startX, clientY - g.startY));
      if (g.moved > TAP_SLOP_PX) clearLongPress();
      if (g.longPressFired) return;

      if (isDraggingModuleRef.current && activeDraggedModuleIdRef.current) {
        const hitGround = getGroundPlaneIntersection(clientX, clientY);
        if (!hitGround) return;

        let rawX = hitGround.x + dragOffsetRef.current.x;
        let rawZ = hitGround.z + dragOffsetRef.current.z;

        const targetMod = placedModulesRef.current.find((m) => m.id === activeDraggedModuleIdRef.current);
        const modDef = targetMod ? AVAILABLE_MODULE_TYPES.find((d) => d.id === targetMod.typeId) : null;
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

        // Duvara yapışma
        const backWallZ = -halfRoomL + halfModD;
        if (Math.abs(rawZ - backWallZ) < SNAP_DIST) rawZ = backWallZ;
        const frontWallZ = halfRoomL - halfModD;
        if (Math.abs(rawZ - frontWallZ) < SNAP_DIST) rawZ = frontWallZ;
        const leftWallX = -halfRoomW + halfModW;
        if (Math.abs(rawX - leftWallX) < SNAP_DIST) rawX = leftWallX;
        const rightWallX = halfRoomW - halfModW;
        if (Math.abs(rawX - rightWallX) < SNAP_DIST) rawX = rightWallX;

        // Modülden modüle yapışma
        const targetBottom = targetMod?.position[1] || 0;
        const targetTop = targetBottom + (targetMod?.customHeight || modDef?.height || 0.85);

        placedModulesRef.current.forEach((other) => {
          if (other.id === activeDraggedModuleIdRef.current) return;

          const otherDef = AVAILABLE_MODULE_TYPES.find((d) => d.id === other.typeId);
          const otherW = other.customWidth || otherDef?.width || 0.6;
          const otherD = other.customDepth || otherDef?.depth || 0.6;
          const isOtherRotated = (other.rotationY || 0) % Math.PI !== 0;
          const otherHalfW = (isOtherRotated ? otherD : otherW) / 2;
          const otherHalfD = (isOtherRotated ? otherW : otherD) / 2;

          // İki modül ancak dikeyde kesişiyorsa birbirine dayanır
          const otherBottom = other.position[1] || 0;
          const otherTop = otherBottom + (other.customHeight || otherDef?.height || 0.85);
          const verticalOverlap = Math.min(targetTop, otherTop) - Math.max(targetBottom, otherBottom);
          if (verticalOverlap <= 0.05) return;

          const distX = Math.abs(rawX - other.position[0]);
          const distZ = Math.abs(rawZ - other.position[2]);
          const minDistX = halfModW + otherHalfW;
          const minDistZ = halfModD + otherHalfD;

          let snappedX = false;
          if (Math.abs(distX - minDistX) < SNAP_DIST && distZ < minDistZ * 0.95) {
            rawX = rawX > other.position[0] ? other.position[0] + minDistX : other.position[0] - minDistX;
            snappedX = true;
          }
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
        });

        rawX = Math.max(-halfRoomW + halfModW, Math.min(halfRoomW - halfModW, rawX));
        rawZ = Math.max(-halfRoomL + halfModD, Math.min(halfRoomL - halfModD, rawZ));

        updateModuleWorldPosition(activeDraggedModuleIdRef.current, rawX, rawZ);
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
      clearLongPress();
      const g = gestureRef.current;

      // Odanın boş bir yerine dokunmak seçimi kaldırır
      if (!g.longPressFired && !g.hitModuleId && g.moved <= TAP_SLOP_PX) {
        setSelectedModuleId(null);
        setContextMenu(null);
      }

      isDraggingRoomRef.current = false;
      isDraggingModuleRef.current = false;
      activeDraggedModuleIdRef.current = null;
    };

    const dom = container;
    const onMouseDown = (e) => handleStart(e.clientX, e.clientY, e.button, false);
    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();

    // Tekerlek ile yakınlaştırma
    const onWheel = (e) => {
      e.preventDefault();
      zoomBy(e.deltaY > 0 ? 1.09 : 0.917);
    };

    const touchDistance = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        clearLongPress();
        isDraggingRoomRef.current = false;
        isDraggingModuleRef.current = false;
        pinchStartRef.current = { dist: touchDistance(e.touches), camDist: camDistRef.current };
        return;
      }
      if (e.touches.length === 1) handleStart(e.touches[0].clientX, e.touches[0].clientY, 0, true);
    };

    const onTouchMove = (e) => {
      // İki parmakla sıkıştırarak yakınlaştırma
      if (e.touches.length === 2 && pinchStartRef.current) {
        const dist = touchDistance(e.touches);
        if (dist > 0) {
          camDistRef.current = THREE.MathUtils.clamp(
            pinchStartRef.current.camDist * (pinchStartRef.current.dist / dist),
            CAM_MIN_DIST,
            CAM_MAX_DIST
          );
          applyCameraDistance();
        }
        return;
      }
      if (e.touches.length === 1) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onTouchEnd = (e) => {
      if (pinchStartRef.current && e.touches.length < 2) {
        pinchStartRef.current = null;
        gestureRef.current.hitModuleId = 'pinch'; // seçim kaldırmayı tetiklemesin
      }
      if (e.touches.length === 0) handleEnd();
    };

    dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.addEventListener('touchend', onTouchEnd);
    dom.addEventListener('touchcancel', onTouchEnd);

    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      // İlk boyamada kap sıfır olabilir; o boyuta küçültmek snapshot'ı bozar
      if (w < 1 || h < 1) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

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
      clearLongPress();
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('contextmenu', onContextMenu);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('touchcancel', onTouchEnd);
      if (rendererRef.current?.domElement) {
        container.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // ── Oda kabuğu & zemin ────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomGroupRef.current) return;

    const childrenToRemove = roomGroupRef.current.children.filter(
      (child) => child !== modulesGroupRef.current && child !== countertopGroupRef.current
    );
    childrenToRemove.forEach((child) => roomGroupRef.current.remove(child));

    const w = roomDimensions.width;
    const l = roomDimensions.length;
    const h = roomDimensions.height;

    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, l),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(selectedFloorMaterial.color),
        roughness: 0.3,
        metalness: 0.1
      })
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    roomGroupRef.current.add(floorMesh);

    const gridHelper = new THREE.GridHelper(Math.max(w, l), Math.round(Math.max(w, l) * 2), 0x121212, 0xCBD5E0);
    gridHelper.position.y = 0.01;
    gridHelper.userData.isViewportHelper = true;
    roomGroupRef.current.add(gridHelper);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xF8F9FA, roughness: 0.8 });

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    backWall.position.set(0, h / 2, -l / 2);
    backWall.receiveShadow = true;
    roomGroupRef.current.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(l, h), wallMat);
    leftWall.position.set(-w / 2, h / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    roomGroupRef.current.add(leftWall);
  }, [roomDimensions, selectedFloorMaterial]);

  // ── Modülleri parametrik olarak üret ──────────────────────────────────────
  useEffect(() => {
    if (!modulesGroupRef.current) return;

    while (modulesGroupRef.current.children.length > 0) {
      modulesGroupRef.current.remove(modulesGroupRef.current.children[0]);
    }

    // Aynı kapak rengini kullanan modüller malzeme setini paylaşır
    const matsCache = new Map();
    const getMats = (doorColor) => {
      const key = `${doorColor}|${selectedCountertop.color}`;
      if (!matsCache.has(key)) matsCache.set(key, createModuleMaterials(doorColor, selectedCountertop.color));
      return matsCache.get(key);
    };

    placedModules.forEach((item) => {
      const modDef = AVAILABLE_MODULE_TYPES.find((m) => m.id === item.typeId);
      if (!modDef) return;

      const customFinish = item.customDoorFinishId
        ? CABINET_DOOR_FINISHES.find((d) => d.id === item.customDoorFinishId)
        : null;
      const mats = getMats((customFinish || selectedDoorFinish).color);

      const modGroup = new THREE.Group();
      modGroup.userData = { moduleId: item.id };
      modGroup.position.set(item.position[0], item.position[1], item.position[2]);
      modGroup.rotation.y = item.rotationY;

      modGroup.add(buildModuleGroup({ def: modDef, item, mats }));

      const modWidth = item.customWidth || modDef.width;
      const modHeight = item.customHeight || modDef.height;
      const modDepth = item.customDepth || modDef.depth;

      // Otomatik tezgah kapalıysa her modül kendi tezgahını taşır
      if (!autoCountertopEnabled && moduleTakesCountertop(modDef)) {
        const cutout = getModuleSinkCutout(modDef, modWidth, modDepth);
        const counterMesh = new THREE.Mesh(
          createSlabGeometry(modWidth + 0.04, modDepth + 0.04, 0.06, cutout),
          new THREE.MeshStandardMaterial({ color: new THREE.Color(selectedCountertop.color), roughness: 0.2 })
        );
        counterMesh.position.y = modHeight + 0.06;
        modGroup.add(counterMesh);
      }

      if (item.id === selectedModuleId) {
        const boxHelper = new THREE.Mesh(
          new THREE.BoxGeometry(modWidth + 0.08, modHeight + 0.08, modDepth + 0.08),
          new THREE.MeshBasicMaterial({ color: 0xFAD02C, wireframe: true })
        );
        boxHelper.position.y = modHeight / 2;
        boxHelper.userData.isViewportHelper = true;
        modGroup.add(boxHelper);
      }

      modulesGroupRef.current.add(modGroup);
    });
  }, [placedModules, selectedModuleId, selectedDoorFinish, selectedCountertop, autoCountertopEnabled]);

  // ── Otomatik tezgah üretici ───────────────────────────────────────────────
  useEffect(() => {
    if (!countertopGroupRef.current) return;

    while (countertopGroupRef.current.children.length > 0) {
      countertopGroupRef.current.remove(countertopGroupRef.current.children[0]);
    }

    if (!autoCountertopEnabled) return;

    const baseModules = placedModules.filter((m) =>
      moduleTakesCountertop(AVAILABLE_MODULE_TYPES.find((d) => d.id === m.typeId))
    );
    if (baseModules.length === 0) return;

    const slabMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(selectedCountertop.color),
      roughness: 0.2,
      metalness: 0.1
    });

    baseModules.forEach((item) => {
      const modDef = AVAILABLE_MODULE_TYPES.find((m) => m.id === item.typeId);
      const modWidth = item.customWidth || modDef.width;
      const modHeight = item.customHeight || modDef.height;
      const modDepth = item.customDepth || modDef.depth;

      const slabMesh = new THREE.Mesh(
        createSlabGeometry(modWidth + 0.06, modDepth + 0.06, 0.06, getModuleSinkCutout(modDef, modWidth, modDepth)),
        slabMat
      );
      // Taban yüksekliği dahil edilmeli; yoksa yükseltilen modülün tezgahı
      // aşağıda yalnız bir plaka olarak kalır.
      slabMesh.position.set(item.position[0], (item.position[1] || 0) + modHeight + 0.06, item.position[2]);
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

  const camButtonClass =
    'w-10 h-10 rounded-2xl bg-[#121212]/85 hover:bg-[#FAD02C] text-white hover:text-black ' +
    'border border-white/15 backdrop-blur-md shadow-lg flex items-center justify-center ' +
    'transition-all active:scale-90';

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full min-h-[480px] md:min-h-[620px] overflow-hidden rounded-3xl bg-[#F0F4F8] cursor-grab active:cursor-grabbing select-none"
    >
      <div ref={mountRef} className="w-full h-full touch-none" />

      {/* ÜST HUD — SEÇİLİ MODÜL ADI & ÖLÇÜLERİ (COMPACT) */}
      {selectedModObj && (
        <div className="absolute top-3 left-3 right-3 z-10 flex justify-start pointer-events-none">
          <div className="pointer-events-auto max-w-full flex items-center gap-1.5 bg-[#121212]/88 backdrop-blur-md pl-2.5 pr-1.5 py-1.5 rounded-2xl border border-white/15 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <Box className="w-3.5 h-3.5 text-[#FAD02C] shrink-0" />
            <span className="text-[11px] font-extrabold text-white truncate max-w-[96px] sm:max-w-[190px] leading-none">
              {selectedModDef?.name || 'Seçili Modül'}
            </span>

            <span className="w-px h-4 bg-white/15 shrink-0" />

            <div className="flex items-center gap-1 shrink-0">
              {[['G', selWidthCm], ['Y', selHeightCm], ['D', selDepthCm]].map(([label, val]) => (
                <span
                  key={label}
                  className="px-1.5 py-1 rounded-lg bg-white/10 text-[10px] font-bold text-gray-300 leading-none tabular-nums"
                >
                  {label}<strong className="text-[#FAD02C] ml-0.5">{val}</strong>
                </span>
              ))}
              <span className="text-[9px] font-bold text-gray-500 pl-0.5">cm</span>
            </div>

            <button
              onClick={() => setSelectedModuleId(null)}
              title="Seçimi kaldır"
              className="w-6 h-6 rounded-lg hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center shrink-0 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* KAMERA KONTROLLERİ — YAKINLAŞTIR / UZAKLAŞTIR / SIFIRLA / TAM EKRAN */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-center gap-1.5">
        <div className="flex flex-col gap-1 p-1 rounded-3xl bg-white/70 backdrop-blur-md border border-black/5 shadow-lg">
          <button onClick={() => zoomBy(0.82)} title="Yakınlaştır" className={camButtonClass}>
            <Plus className="w-4 h-4" strokeWidth={3} />
          </button>
          <button onClick={() => zoomBy(1.22)} title="Uzaklaştır" className={camButtonClass}>
            <Minus className="w-4 h-4" strokeWidth={3} />
          </button>
          <button onClick={resetView} title="Görünümü Sıfırla" className={camButtonClass}>
            <Crosshair className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
          className={`${camButtonClass} ${isFullscreen ? 'bg-[#FAD02C] text-black' : ''}`}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
