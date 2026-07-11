import { create } from "zustand";
import type { FiltrosEncuesta, Rol, Sede } from "@/types/encuesta";

interface FiltrosState extends FiltrosEncuesta {
  toggleRol: (rol: Rol) => void;
  toggleSede: (sede: Sede) => void;
  toggleFacultad: (facultad: string) => void;
  setRangoFechas: (desde?: string, hasta?: string) => void;
  limpiar: () => void;
  hayFiltrosActivos: () => boolean;
}

export const useFiltrosStore = create<FiltrosState>((set, get) => ({
  rol: [],
  sede: [],
  facultad: [],
  programaOArea: [],
  fechaDesde: undefined,
  fechaHasta: undefined,

  toggleRol: (rol) =>
    set((state) => ({
      rol: state.rol?.includes(rol) ? state.rol.filter((r) => r !== rol) : [...(state.rol ?? []), rol],
    })),

  toggleSede: (sede) =>
    set((state) => ({
      sede: state.sede?.includes(sede) ? state.sede.filter((s) => s !== sede) : [...(state.sede ?? []), sede],
    })),

  toggleFacultad: (facultad) =>
    set((state) => ({
      facultad: state.facultad?.includes(facultad)
        ? state.facultad.filter((f) => f !== facultad)
        : [...(state.facultad ?? []), facultad],
    })),

  setRangoFechas: (desde, hasta) => set({ fechaDesde: desde, fechaHasta: hasta }),

  limpiar: () =>
    set({ rol: [], sede: [], facultad: [], programaOArea: [], fechaDesde: undefined, fechaHasta: undefined }),

  hayFiltrosActivos: () => {
    const s = get();
    return Boolean(
      s.rol?.length || s.sede?.length || s.facultad?.length || s.programaOArea?.length || s.fechaDesde || s.fechaHasta
    );
  },
}));
