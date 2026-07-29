import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useStudio3D } from '../../context/Studio3DContext';
import { AVAILABLE_MODULE_TYPES, CABINET_DOOR_FINISHES } from '../../utils/pricingEngine';
import { Maximize2, Box } from 'lucide-react';

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
    lightingMode
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

  // Camera Zoom In / Zoom Out / Reset Custom Event Listeners
  useEffect(() => {
    const handleZoomIn = () => {
      if (cameraRef.current) {
        cameraRef.current.position.multiplyScalar(0.85);
      }
    };

    const handleZoomOut = () => {
      if (cameraRef.current) {
        cameraRef.current.position.multiplyScalar(1.18);
      }
    };

    const handleResetCam = () => {
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 7.5, 9.5);
        cameraRef.current.lookAt(0, 1, 0);
      }
    };

    const canvas = mountRef.current;
    if (canvas) {
      canvas.addEventListener('studio-camera-zoom-in', handleZoomIn);
      canvas.addEventListener('studio-camera-zoom-out', handleZoomOut);
      canvas.addEventListener('studio-camera-reset', handleResetCam);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('studio-camera-zoom-in', handleZoomIn);
        canvas.removeEventListener('studio-camera-zoom-out', handleZoomOut);
        canvas.removeEventListener('studio-camera-reset', handleResetCam);
      }
    };
  }, []);

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

            const sameHeightCategory = Math.abs((other.position[1] || 0) - (targetMod.position[1] || 0)) < 0.6;

            if (sameHeightCategory) {
              const distX = Math.abs(rawX - other.position[0]);
              const distZ = Math.abs(rawZ - other.position[2]);
              const minDistX = halfModW + otherHalfW;
              const minDistZ = halfModD + otherHalfD;

              if (Math.abs(distX - minDistX) < SNAP_DIST && distZ < minDistZ * 0.95) {
                rawX = rawX > other.position[0] ? other.position[0] + minDistX : other.position[0] - minDistX;
              }
              if (Math.abs(distZ - minDistZ) < SNAP_DIST && distX < minDistX * 0.95) {
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
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
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

  // Render 3D Cabinets
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
      const isSinkUnit = item.typeId === 'sink_unit_90' || item.typeId.includes('sink');
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
        const bodyGeo = new THREE.BoxGeometry(modWidth, modHeight, modDepth);
        const bodyMat = new THREE.MeshStandardMaterial({ color: activeDoorColor, roughness: 0.4 });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = modHeight / 2;
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        bodyMesh.userData = { moduleId: item.id };
        modGroup.add(bodyMesh);

        const doorZ = modDepth / 2 + 0.015;
        const doorMat = new THREE.MeshStandardMaterial({ color: activeDoorColor, roughness: 0.3 });
        const frameDarkMat = new THREE.MeshStandardMaterial({ color: 0x2D3748, metalness: 0.8, roughness: 0.2 });

        if (doorStyle === 'shaker_raised') {
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

          const mullionMat = new THREE.MeshStandardMaterial({ color: 0x1A202C, roughness: 0.5 });
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

          const mullionMat = new THREE.MeshStandardMaterial({ color: 0x2D3748 });
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
          const innerW = modWidth * 0.7;
          const innerH = modHeight * 0.7;

          const centerGeo = new THREE.BoxGeometry(innerW, innerH, 0.025);
          const centerMesh = new THREE.Mesh(centerGeo, doorMat);
          centerMesh.position.set(0, modHeight / 2, doorZ + 0.01);
          modGroup.add(centerMesh);

          const archGeo = new THREE.CylinderGeometry(innerW / 2, innerW / 2, 0.025, 16, 1, false, 0, Math.PI);
          const archMesh = new THREE.Mesh(archGeo, doorMat);
          archMesh.rotation.z = Math.PI / 2;
          archMesh.rotation.x = Math.PI / 2;
          archMesh.position.set(0, modHeight / 2 + innerH / 2, doorZ + 0.01);
          modGroup.add(archMesh);
        }

        const handleMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.85, roughness: 0.15 });
        const handleGeo = new THREE.BoxGeometry(0.025, 0.14, 0.035);

        const handleY = modHeight * 0.55;

        if (handlePos === 'right') {
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

      if (isSinkUnit) {
        const sinkGroup = new THREE.Group();
        const sinkY = modHeight + 0.031;

        const sinkW = modWidth * 0.78;
        const sinkD = modDepth * 0.68;
        const metallicMat = new THREE.MeshStandardMaterial({ color: 0x1A202C, metalness: 0.9, roughness: 0.2 });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.95, roughness: 0.1 });
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.85, roughness: 0.2 });

        const rimGeo = new THREE.BoxGeometry(sinkW, 0.015, sinkD);
        const rimMesh = new THREE.Mesh(rimGeo, metallicMat);
        rimMesh.position.set(0, sinkY + 0.007, 0);
        sinkGroup.add(rimMesh);

        const basinGeo = new THREE.BoxGeometry(sinkW * 0.9, 0.01, sinkD * 0.85);
        const basinMesh = new THREE.Mesh(basinGeo, chromeMat);
        basinMesh.position.set(0, sinkY + 0.002, 0);
        sinkGroup.add(basinMesh);

        const dividerGeo = new THREE.BoxGeometry(0.02, 0.012, sinkD * 0.85);
        const dividerMesh = new THREE.Mesh(dividerGeo, metallicMat);
        dividerMesh.position.set(-sinkW * 0.1, sinkY + 0.008, 0);
        sinkGroup.add(dividerMesh);

        const drainGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.015, 24);
        const drainMesh = new THREE.Mesh(drainGeo, brassMat);
        drainMesh.position.set(-sinkW * 0.28, sinkY + 0.008, 0);
        sinkGroup.add(drainMesh);

        const faucetGroup = new THREE.Group();
        faucetGroup.position.set(sinkW * 0.15, sinkY + 0.01, -sinkD * 0.35);

        const stemGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.16, 24);
        const stemMesh = new THREE.Mesh(stemGeo, metallicMat);
        stemMesh.position.y = 0.08;
        faucetGroup.add(stemMesh);

        const leverGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.06, 16);
        const leverMesh = new THREE.Mesh(leverGeo, brassMat);
        leverMesh.rotation.z = Math.PI / 3;
        leverMesh.position.set(0.025, 0.09, 0);
        faucetGroup.add(leverMesh);

        const arcGeo = new THREE.TorusGeometry(0.12, 0.014, 16, 32, Math.PI * 0.85);
        const arcMesh = new THREE.Mesh(arcGeo, metallicMat);
        arcMesh.rotation.y = -Math.PI / 2;
        arcMesh.rotation.z = Math.PI / 2;
        arcMesh.position.set(0, 0.28, -0.05);
        faucetGroup.add(arcMesh);

        const nozzleGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.05, 16);
        const nozzleMesh = new THREE.Mesh(nozzleGeo, metallicMat);
        nozzleMesh.position.set(0, 0.22, 0.12);
        faucetGroup.add(nozzleMesh);

        modGroup.add(sinkGroup);
        modGroup.add(faucetGroup);
      }

      if (!autoCountertopEnabled && (modDef.category === 'alt' || modDef.category === 'ada')) {
        const counterGeo = new THREE.BoxGeometry(modWidth + 0.04, 0.06, modDepth + 0.04);
        const counterMat = new THREE.MeshStandardMaterial({ color: countertopColor, roughness: 0.2 });
        const counterMesh = new THREE.Mesh(counterGeo, counterMat);
        counterMesh.position.y = modHeight + 0.03;
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

      const slabGeo = new THREE.BoxGeometry(modWidth + 0.06, 0.06, modDepth + 0.06);
      const slabMat = new THREE.MeshStandardMaterial({
        color: countertopColor,
        roughness: 0.2,
        metalness: 0.1
      });
      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.position.set(item.position[0], modHeight + 0.03, item.position[2]);
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
