import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  FLOOR_MATERIALS,
  CABINET_DOOR_FINISHES,
  COUNTERTOP_MATERIALS,
  AVAILABLE_MODULE_TYPES,
  calculateDataDrivenPricing
} from '../utils/pricingEngine';
import { MODULE_ROOMS, getDefaultY } from '../utils/moduleCatalog';

const Studio3DContext = createContext();

// Katalog v2 ile modül id'leri değişti; eski kayıtlı sahneler artık geçersiz.
const LOCAL_STORAGE_KEY = 'dekorx_3d_design_state_v2';

export const DOOR_MODEL_STYLES = [
  { id: 'shaker_raised', name: 'Klasik Göbekli Lake (Resim 1)', icon: '🖼️' },
  { id: 'arched_glass', name: 'Kemerli Camlı Çıtalı (Resim 2)', icon: '🏛️' },
  { id: 'grid_glass', name: 'Düz 6 Bölmeli Camlı (Resim 3)', icon: '🪟' },
  { id: 'arched_solid', name: 'Kemerli Klasik Göbekli (Resim 4)', icon: '👑' }
];

// Sahne açılışındaki örnek mutfak kurgusu, katalog tanımlarından türetilir.
const buildDefaultModule = (id, typeId, x, z, overrides = {}) => {
  const def = AVAILABLE_MODULE_TYPES.find((m) => m.id === typeId);
  return {
    id,
    typeId,
    position: [x, getDefaultY(def), z],
    rotationY: 0,
    hasGlassDoor: !!def?.hasGlassDoor,
    customWidth: def?.width ?? 0.6,
    customHeight: def?.height ?? 0.85,
    customDepth: def?.depth ?? 0.6,
    customDoorFinishId: null,
    handlePosition: 'right',
    doorStyle: def?.hasGlassDoor ? 'grid_glass' : 'shaker_raised',
    ...overrides
  };
};

const DEFAULT_PLACED_MODULES = [
  buildDefaultModule('m1', 'mut_alt_3cek', -1.35, -1.15),
  buildDefaultModule('m2', 'mut_alt_evye', -0.6, -1.15, { handlePosition: 'left' }),
  buildDefaultModule('m3', 'mut_alt_firin_ocak', 0.15, -1.15),
  buildDefaultModule('m4', 'mut_boy_firin_mikro', 0.75, -1.15),
  buildDefaultModule('m5', 'mut_ust_camli', -0.6, -1.325, { position: [-0.6, 1.45, -1.325] }),
  buildDefaultModule('m6', 'mut_ust_davlumbaz', 0.15, -1.325, { position: [0.15, 1.55, -1.325] }),
  buildDefaultModule('m7', 'mut_ada_cekmeceli', 0, 0.6, { handlePosition: 'center' })
];

export const Studio3DProvider = ({ children }) => {
  // Load initial saved design state from browser storage
  const getSavedState = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Local storage parse error:', e);
    }
    return null;
  };

  const savedState = getSavedState();

  // 1. Room Dimensions State (meters)
  const [roomDimensions, setRoomDimensions] = useState(
    savedState?.roomDimensions || { width: 4.5, length: 3.5, height: 2.7 }
  );

  // 2. Materials Selection
  const [selectedFloorMaterial, setSelectedFloorMaterial] = useState(
    savedState?.selectedFloorMaterial
      ? FLOOR_MATERIALS.find((f) => f.id === savedState.selectedFloorMaterial.id) || FLOOR_MATERIALS[0]
      : FLOOR_MATERIALS[0]
  );
  const [selectedDoorFinish, setSelectedDoorFinish] = useState(
    savedState?.selectedDoorFinish
      ? CABINET_DOOR_FINISHES.find((d) => d.id === savedState.selectedDoorFinish.id) || CABINET_DOOR_FINISHES[0]
      : CABINET_DOOR_FINISHES[0]
  );
  const [selectedCountertop, setSelectedCountertop] = useState(
    savedState?.selectedCountertop
      ? COUNTERTOP_MATERIALS.find((c) => c.id === savedState.selectedCountertop.id) || COUNTERTOP_MATERIALS[0]
      : COUNTERTOP_MATERIALS[0]
  );
  const [autoCountertopEnabled, setAutoCountertopEnabled] = useState(
    savedState?.autoCountertopEnabled !== undefined ? savedState.autoCountertopEnabled : true
  );

  // 3. Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState(null);

  // 4. Placed 3D Modules State
  const [placedModules, setPlacedModules] = useState(
    savedState?.placedModules || DEFAULT_PLACED_MODULES
  );

  const [selectedModuleId, setSelectedModuleId] = useState(
    savedState?.placedModules && savedState.placedModules.length > 0
      ? savedState.placedModules[0].id
      : 'm1'
  );

  // 5. Aktif Modül Kategorisi (Mutfak / Gardırop / Banyo ...)
  const [activeRoomId, setActiveRoomId] = useState(MODULE_ROOMS[0].id);

  const [lightingMode, setLightingMode] = useState('day');
  const [isRenderModalOpen, setIsRenderModalOpen] = useState(false);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // AUTO-SAVE DESIGN STATE TO LOCAL BROWSER STORAGE ON EVERY CHANGE
  useEffect(() => {
    const stateToSave = {
      roomDimensions,
      selectedFloorMaterial,
      selectedDoorFinish,
      selectedCountertop,
      autoCountertopEnabled,
      placedModules
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to auto-save design state:', e);
    }
  }, [roomDimensions, selectedFloorMaterial, selectedDoorFinish, selectedCountertop, autoCountertopEnabled, placedModules]);

  // RESET PROJECT TO FRESH SETUP
  const resetDesignState = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setRoomDimensions({ width: 4.5, length: 3.5, height: 2.7 });
    setSelectedFloorMaterial(FLOOR_MATERIALS[0]);
    setSelectedDoorFinish(CABINET_DOOR_FINISHES[0]);
    setSelectedCountertop(COUNTERTOP_MATERIALS[0]);
    setAutoCountertopEnabled(true);
    setPlacedModules(DEFAULT_PLACED_MODULES);
    setSelectedModuleId('m1');
  };

  // Module Actions
  const addModule = (typeId) => {
    const modDef = AVAILABLE_MODULE_TYPES.find((m) => m.id === typeId);
    if (!modDef) return;

    const newId = `m_${Date.now()}`;
    const initialY = getDefaultY(modDef);

    setPlacedModules((prev) => [
      ...prev,
      {
        id: newId,
        typeId,
        position: [0, initialY, 0],
        rotationY: 0,
        hasGlassDoor: modDef.hasGlassDoor,
        customWidth: modDef.width,
        customHeight: modDef.height,
        customDepth: modDef.depth,
        customDoorFinishId: null,
        handlePosition: 'right',
        doorStyle: modDef.hasGlassDoor ? 'grid_glass' : 'shaker_raised'
      }
    ]);
    setSelectedModuleId(newId);
  };

  const removeModule = (id) => {
    setPlacedModules((prev) => prev.filter((m) => m.id !== id));
    if (selectedModuleId === id) setSelectedModuleId(null);
  };

  const rotateModule = (id) => {
    setPlacedModules((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, rotationY: (m.rotationY + Math.PI / 2) % (Math.PI * 2) } : m
      )
    );
  };

  const changeModuleType = (id, newTypeId) => {
    const newDef = AVAILABLE_MODULE_TYPES.find((m) => m.id === newTypeId);
    if (!newDef) return;

    setPlacedModules((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const newY = getDefaultY(newDef);
          return {
            ...m,
            typeId: newTypeId,
            customWidth: newDef.width,
            customHeight: newDef.height,
            customDepth: newDef.depth,
            hasGlassDoor: newDef.hasGlassDoor,
            position: [m.position[0], newY, m.position[2]]
          };
        }
        return m;
      })
    );
  };

  const changeModuleDimensions = (id, newWidth, newHeight, newDepth) => {
    setPlacedModules((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            customWidth: newWidth !== undefined ? newWidth : m.customWidth,
            customHeight: newHeight !== undefined ? newHeight : m.customHeight,
            customDepth: newDepth !== undefined ? newDepth : m.customDepth
          };
        }
        return m;
      })
    );
  };

  const setIndividualDoorFinish = (id, finishId) => {
    setPlacedModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, customDoorFinishId: finishId } : m))
    );
  };

  const setModuleHandlePosition = (id, handlePosition) => {
    setPlacedModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, handlePosition } : m))
    );
  };

  const setModuleDoorStyle = (id, doorStyle) => {
    setPlacedModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, doorStyle } : m))
    );
  };

  const applyFinishToAll = (finishId) => {
    const targetFinish = CABINET_DOOR_FINISHES.find((f) => f.id === finishId);
    if (targetFinish) setSelectedDoorFinish(targetFinish);
    setPlacedModules((prev) =>
      prev.map((m) => ({ ...m, customDoorFinishId: finishId }))
    );
  };

  const duplicateModule = (id) => {
    const target = placedModules.find((m) => m.id === id);
    if (!target) return;

    const newId = `m_${Date.now()}`;
    const newPos = [target.position[0] + 0.3, target.position[1], target.position[2] + 0.3];

    setPlacedModules((prev) => [
      ...prev,
      {
        ...target,
        id: newId,
        position: newPos
      }
    ]);
    setSelectedModuleId(newId);
  };

  const toggleGlassDoor = (id) => {
    setPlacedModules((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextGlass = !m.hasGlassDoor;
          const nextStyle = nextGlass ? 'arched_glass' : 'shaker_raised';
          return { ...m, hasGlassDoor: nextGlass, doorStyle: nextStyle };
        }
        return m;
      })
    );
  };

  const elevateModule = (id) => {
    setPlacedModules((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const newY = m.position[1] > 0.5 ? 0 : 1.4;
          return { ...m, position: [m.position[0], newY, m.position[2]] };
        }
        return m;
      })
    );
  };

  const updateModuleWorldPosition = (id, worldX, worldZ) => {
    setPlacedModules((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return { ...m, position: [worldX, m.position[1], worldZ] };
        }
        return m;
      })
    );
  };

  // Pricing Calculation
  const pricingBreakdown = useMemo(() => {
    return calculateDataDrivenPricing({
      roomWidth: roomDimensions.width,
      roomLength: roomDimensions.length,
      selectedFloorId: selectedFloorMaterial.id,
      selectedDoorFinishId: selectedDoorFinish.id,
      selectedCountertopId: selectedCountertop.id,
      placedModules,
      autoCountertopEnabled,
      includeLedLighting: true,
      includeAssembly: true
    });
  }, [roomDimensions, selectedFloorMaterial, selectedDoorFinish, selectedCountertop, placedModules, autoCountertopEnabled]);

  // The 3D canvas registers its snapshot function here so the render modal can
  // grab the actual WebGL frame instead of showing a placeholder image.
  const renderCaptureRef = useRef(null);
  const registerRenderCapture = useCallback((fn) => {
    renderCaptureRef.current = fn;
  }, []);
  const captureSceneImage = useCallback((scale = 2, options = {}) => {
    if (typeof renderCaptureRef.current !== 'function') return null;
    try {
      return renderCaptureRef.current(scale, options);
    } catch (e) {
      console.error('Scene capture failed:', e);
      return null;
    }
  }, []);

  const triggerRender = () => setIsRenderModalOpen(true);
  const triggerBOMModal = () => setIsBOMModalOpen(true);

  // Sahnenin tüm ölçülebilir verisini AI render endpoint'i için paketler
  const buildSceneManifest = useCallback(() => ({
    room: roomDimensions,
    lighting: lightingMode,
    materials: {
      doorFinish: selectedDoorFinish.name,
      countertop: selectedCountertop.name,
      floor: selectedFloorMaterial.name,
      autoCountertop: autoCountertopEnabled
    },
    modules: placedModules.map((m) => {
      const def = AVAILABLE_MODULE_TYPES.find((d) => d.id === m.typeId);
      const finish = m.customDoorFinishId
        ? CABINET_DOOR_FINISHES.find((f) => f.id === m.customDoorFinishId)
        : null;
      return {
        id: m.id,
        typeId: m.typeId,
        name: def?.name || m.typeId,
        roomName: def?.roomName,
        sectionName: def?.sectionName,
        category: def?.category || 'alt',
        width: m.customWidth || def?.width || 0.6,
        height: m.customHeight || def?.height || 0.85,
        depth: m.customDepth || def?.depth || 0.6,
        position: m.position,
        rotationY: m.rotationY || 0,
        hasGlassDoor: !!m.hasGlassDoor,
        doorStyle: m.doorStyle,
        handlePosition: m.handlePosition,
        finishName: finish?.name || null
      };
    })
  }), [
    roomDimensions, lightingMode, selectedDoorFinish, selectedCountertop,
    selectedFloorMaterial, autoCountertopEnabled, placedModules
  ]);

  // Gemini yalnızca belirli en-boy oranlarını kabul eder; kadrajı bozmamak için
  // yakalanan karenin oranına en yakın olanı seçeriz.
  const pickAspectRatio = (w, h) => {
    const options = [['1:1', 1], ['4:3', 4 / 3], ['3:4', 3 / 4], ['16:9', 16 / 9], ['9:16', 9 / 16], ['3:2', 1.5], ['2:3', 2 / 3]];
    const target = w / h;
    return options.reduce((best, o) => (Math.abs(o[1] - target) < Math.abs(best[1] - target) ? o : best))[0];
  };

  // ── AI ile Çiz: blockout kareyi + sahne verisini backend'e gönderir
  const [aiRender, setAiRender] = useState({ status: 'idle' });
  const [isAiRenderModalOpen, setIsAiRenderModalOpen] = useState(false);

  const triggerAiGeneration = useCallback(async () => {
    const shot = captureSceneImage(2, { clean: true });
    if (!shot?.dataUrl) {
      setAiRender({ status: 'error', error: 'Sahne görüntüsü alınamadı. 3D alanı görünür durumdayken tekrar deneyin.' });
      setIsAiRenderModalOpen(true);
      return;
    }

    const scene = buildSceneManifest();
    setAiRender({ status: 'loading', sourceImage: shot.dataUrl });
    setIsAiRenderModalOpen(true);
    setIsAiGenerating(true);

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: shot.dataUrl,
          scene,
          aspectRatio: pickAspectRatio(shot.width, shot.height),
          imageSize: '2K'
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.image) {
        setAiRender({
          status: 'error',
          sourceImage: shot.dataUrl,
          code: data.code,
          error: data.error || `Sunucu ${res.status} döndü.`,
          attempts: data.attempts
        });
        return;
      }

      setAiRender({
        status: 'done',
        sourceImage: shot.dataUrl,
        resultImage: data.image,
        model: data.model,
        provider: data.provider,
        usage: data.usage
      });
    } catch (e) {
      setAiRender({
        status: 'error',
        sourceImage: shot.dataUrl,
        error: `İstek gönderilemedi: ${e.message}`
      });
    } finally {
      setIsAiGenerating(false);
    }
  }, [captureSceneImage, buildSceneManifest]);

  return (
    <Studio3DContext.Provider
      value={{
        roomDimensions,
        setRoomDimensions,
        selectedFloorMaterial,
        setSelectedFloorMaterial,
        selectedDoorFinish,
        setSelectedDoorFinish,
        selectedCountertop,
        setSelectedCountertop,
        autoCountertopEnabled,
        setAutoCountertopEnabled,
        contextMenu,
        setContextMenu,
        activeRoomId,
        setActiveRoomId,
        placedModules,
        addModule,
        removeModule,
        rotateModule,
        changeModuleType,
        changeModuleDimensions,
        setIndividualDoorFinish,
        setModuleHandlePosition,
        setModuleDoorStyle,
        applyFinishToAll,
        duplicateModule,
        toggleGlassDoor,
        elevateModule,
        updateModuleWorldPosition,
        resetDesignState,
        selectedModuleId,
        setSelectedModuleId,
        lightingMode,
        setLightingMode,
        isRenderModalOpen,
        setIsRenderModalOpen,
        isBOMModalOpen,
        setIsBOMModalOpen,
        isAiGenerating,
        triggerAiGeneration,
        aiRender,
        isAiRenderModalOpen,
        setIsAiRenderModalOpen,
        buildSceneManifest,
        triggerRender,
        triggerBOMModal,
        registerRenderCapture,
        captureSceneImage,
        pricingBreakdown
      }}
    >
      {children}
    </Studio3DContext.Provider>
  );
};

export const useStudio3D = () => useContext(Studio3DContext);
