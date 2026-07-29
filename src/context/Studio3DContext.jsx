import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  FLOOR_MATERIALS,
  CABINET_DOOR_FINISHES,
  COUNTERTOP_MATERIALS,
  AVAILABLE_MODULE_TYPES,
  calculateDataDrivenPricing
} from '../utils/pricingEngine';

const Studio3DContext = createContext();

const LOCAL_STORAGE_KEY = 'dekorx_3d_design_state_v1';

export const DOOR_MODEL_STYLES = [
  { id: 'shaker_raised', name: 'Klasik Göbekli Lake (Resim 1)', icon: '🖼️' },
  { id: 'arched_glass', name: 'Kemerli Camlı Çıtalı (Resim 2)', icon: '🏛️' },
  { id: 'grid_glass', name: 'Düz 6 Bölmeli Camlı (Resim 3)', icon: '🪟' },
  { id: 'arched_solid', name: 'Kemerli Klasik Göbekli (Resim 4)', icon: '👑' }
];

const DEFAULT_PLACED_MODULES = [
  {
    id: 'm1',
    typeId: 'base_cabinet_90',
    position: [-1.2, 0, -1.15],
    rotationY: 0,
    hasGlassDoor: false,
    customWidth: 0.9,
    customHeight: 0.85,
    customDepth: 0.6,
    customDoorFinishId: null,
    handlePosition: 'right',
    doorStyle: 'shaker_raised'
  },
  {
    id: 'm2',
    typeId: 'sink_unit_90',
    position: [-0.3, 0, -1.15],
    rotationY: 0,
    hasGlassDoor: false,
    customWidth: 0.9,
    customHeight: 0.85,
    customDepth: 0.6,
    customDoorFinishId: null,
    handlePosition: 'left',
    doorStyle: 'arched_solid'
  },
  {
    id: 'm3',
    typeId: 'tall_pantry_60',
    position: [0.6, 0, -1.15],
    rotationY: 0,
    hasGlassDoor: false,
    customWidth: 0.6,
    customHeight: 2.1,
    customDepth: 0.6,
    customDoorFinishId: null,
    handlePosition: 'left',
    doorStyle: 'shaker_raised'
  },
  {
    id: 'm4',
    typeId: 'wall_cabinet_60_glass',
    position: [-0.3, 1.4, -1.15],
    rotationY: 0,
    hasGlassDoor: true,
    customWidth: 0.6,
    customHeight: 0.72,
    customDepth: 0.35,
    customDoorFinishId: null,
    handlePosition: 'right',
    doorStyle: 'arched_glass'
  },
  {
    id: 'm5',
    typeId: 'kitchen_island_180',
    position: [0, 0, 0.6],
    rotationY: 0,
    hasGlassDoor: false,
    customWidth: 1.8,
    customHeight: 0.9,
    customDepth: 0.9,
    customDoorFinishId: null,
    handlePosition: 'center',
    doorStyle: 'shaker_raised'
  }
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
    const initialY = modDef.category === 'ust' ? 1.4 : 0;

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
          const newY = newDef.category === 'ust' ? 1.4 : 0;
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
  const captureSceneImage = useCallback((scale = 2) => {
    if (typeof renderCaptureRef.current !== 'function') return null;
    try {
      return renderCaptureRef.current(scale);
    } catch (e) {
      console.error('Scene capture failed:', e);
      return null;
    }
  }, []);

  const triggerRender = () => setIsRenderModalOpen(true);
  const triggerBOMModal = () => setIsBOMModalOpen(true);

  const triggerAiGeneration = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setIsAiGenerating(false);
      const randomFinish = CABINET_DOOR_FINISHES[Math.floor(Math.random() * CABINET_DOOR_FINISHES.length)];
      setSelectedDoorFinish(randomFinish);
    }, 1800);
  };

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
