'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type RolUsuario = 'estudiante' | 'tutor' | 'coordinador_dept' | 'coordinador_inst';

interface UsuarioPit {
  id: string;
  correo: string;
  nombre: string;
  rol: RolUsuario;
  carrera: string;
  grupo: string | null;
}

interface PlanPat {
  id: string;
  tutor_correo: string;
  tutor_nombre: string;
  carrera: string;
  grupo: string;
  eje_academico: string;
  eje_personal: string;
  eje_profesional: string;
  estatus: 'Borrador' | 'En Revisión' | 'Observado' | 'Aprobado';
  observaciones: string;
  actualizado_en: string;
}

interface FichaDiagnostica {
  id: string;
  estudiante_correo: string;
  estudiante_nombre: string;
  grupo: string;
  promedio_previo: number;
  situacion_economica: 'Estable' | 'Moderada' | 'Critica';
  estado_salud: 'Optimo' | 'Requiere Atencion';
  materias_reprobadas: number;
  nivel_riesgo: 'Verde' | 'Amarillo' | 'Rojo';
  canalizacion_sugerida: string;
  creado_en: string;
}

const PERFILES_RESPALDO: UsuarioPit[] = [
  {
    id: 'demo-est-1',
    correo: 'l24660901@matehuala.tecnm.mx',
    nombre: 'Ana Sofía Méndez',
    rol: 'estudiante',
    carrera: 'Ing. en Sistemas Computacionales',
    grupo: 'ISC-1A',
  },
  {
    id: 'demo-tutor-1',
    correo: 'tutor.isc@matehuala.tecnm.mx',
    nombre: 'M.C. Roberto Hernández',
    rol: 'tutor',
    carrera: 'Ing. en Sistemas Computacionales',
    grupo: 'ISC-1A',
  },
  {
    id: 'demo-coord-dept',
    correo: 'coord.isc@matehuala.tecnm.mx',
    nombre: 'Ing. Laura Patricia Vega',
    rol: 'coordinador_dept',
    carrera: 'Ing. en Sistemas Computacionales',
    grupo: null,
  },
  {
    id: 'demo-coord-inst',
    correo: 'pit.institucional@matehuala.tecnm.mx',
    nombre: 'Lic. Marcos Domínguez',
    rol: 'coordinador_inst',
    carrera: 'Desarrollo Académico',
    grupo: null,
  },
];

const ETIQUETA_ROL: Record<RolUsuario, string> = {
  estudiante: 'Estudiante Tutorado',
  tutor: 'Docente Tutor',
  coordinador_dept: 'Coordinación Departamental',
  coordinador_inst: 'Coordinación Institucional PIT',
};

export default function SistemaPitItmhPage() {
  const [usuarios, setUsuarios] = useState<UsuarioPit[]>(PERFILES_RESPALDO);
  const [usuarioActivo, setUsuarioActivo] = useState<UsuarioPit | null>(null);
  const [correoLogin, setCorreoLogin] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [mensajeSistema, setMensajeSistema] = useState('');
  const [modoSinConexionBd, setModoSinConexionBd] = useState(false);

  const [planes, setPlanes] = useState<PlanPat[]>([]);
  const [fichas, setFichas] = useState<FichaDiagnostica[]>([]);
  const [cargando, setCargando] = useState(true);

  // Formulario Ficha Diagnóstica (F-DA-01)
  const [promedio, setPromedio] = useState('85');
  const [economia, setEconomia] = useState<'Estable' | 'Moderada' | 'Critica'>('Estable');
  const [salud, setSalud] = useState<'Optimo' | 'Requiere Atencion'>('Optimo');
  const [reprobadas, setReprobadas] = useState('0');
  const [acuseGenerado, setAcuseGenerado] = useState<string | null>(null);

  // Formulario PAT
  const [grupoPat, setGrupoPat] = useState('ISC-1A');
  const [ejeAcademico, setEjeAcademico] = useState('');
  const [ejePersonal, setEjePersonal] = useState('');
  const [ejeProfesional, setEjeProfesional] = useState('');

  // Asignación de grupo / tutor
  const [estudianteAsignar, setEstudianteAsignar] = useState('demo-est-1');
  const [nuevoGrupo, setNuevoGrupo] = useState('ISC-1A');

  // Filtro de cobertura institucional
  const [filtroCarrera, setFiltroCarrera] = useState('TODAS');

  async function cargarDatos() {
    setCargando(true);
    try {
      const [{ data: users, error: errUsers }, { data: pats }, { data: diag }] =
        await Promise.all([
          supabase.from('usuarios_pit').select('*').order('nombre'),
          supabase.from('planes_pat').select('*').order('actualizado_en', { ascending: false }),
          supabase.from('fichas_diagnosticas').select('*').order('creado_en', { ascending: false }),
        ]);

      if (!errUsers && users && users.length > 0) {
        setUsuarios(users as UsuarioPit[]);
        setModoSinConexionBd(false);
        const primerEst = (users as UsuarioPit[]).find((u) => u.rol === 'estudiante');
        if (primerEst) setEstudianteAsignar(primerEst.id);
      } else {
        setUsuarios(PERFILES_RESPALDO);
        setModoSinConexionBd(true);
      }

      if (pats) setPlanes(pats as PlanPat[]);
      if (diag) setFichas(diag as FichaDiagnostica[]);
    } catch {
      setUsuarios(PERFILES_RESPALDO);
      setModoSinConexionBd(true);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();
    setErrorLogin('');
    const encontrado = usuarios.find(
      (u) => u.correo.trim().toLowerCase() === correoLogin.trim().toLowerCase()
    );
    if (!encontrado) {
      setErrorLogin(
        'Correo no encontrado en los registros institucionales de prueba. Usa alguno de los perfiles listados abajo.'
      );
      return;
    }
    setUsuarioActivo(encontrado);
    setMensajeSistema(`Sesión activa: ${encontrado.nombre} — ${ETIQUETA_ROL[encontrado.rol]}.`);
  }

  function calcularRiesgo(
    prom: number,
    eco: 'Estable' | 'Moderada' | 'Critica',
    sal: 'Optimo' | 'Requiere Atencion',
    reprob: number
  ): { nivel: 'Verde' | 'Amarillo' | 'Rojo'; canalizacion: string } {
    if (reprob >= 2 || prom < 70 || sal === 'Requiere Atencion') {
      return {
        nivel: 'Rojo',
        canalizacion:
          'Alerta Preventiva: Canalización prioritaria a Desarrollo Académico / Orientación Psicológica y Seguimiento Intensivo.',
      };
    }
    if (reprob === 1 || prom < 80 || eco === 'Critica' || eco === 'Moderada') {
      return {
        nivel: 'Amarillo',
        canalizacion:
          'Alerta Preventiva: Sugerir asesoría tutorial, orientación de becas o refuerzo en asignaturas.',
      };
    }
    return {
      nivel: 'Verde',
      canalizacion: 'Sin alerta crítica: Seguimiento tutorial ordinario.',
    };
  }

  async function guardarFicha(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioActivo) return;

    const promNum = Number(promedio);
    const reprobNum = Number(reprobadas);
    if (Number.isNaN(promNum) || promNum < 0 || promNum > 100) {
      setMensajeSistema('Ingresa un promedio válido entre 0 y 100.');
      return;
    }

    const { nivel, canalizacion } = calcularRiesgo(promNum, economia, salud, reprobNum);
    const folio = `ITMH-FDA01-${Date.now().toString().slice(-6)}`;

    const nuevaFicha: FichaDiagnostica = {
      id: `local-${Date.now()}`,
      estudiante_correo: usuarioActivo.correo,
      estudiante_nombre: usuarioActivo.nombre,
      grupo: usuarioActivo.grupo || 'ISC-1A',
      promedio_previo: promNum,
      situacion_economica: economia,
      estado_salud: salud,
      materias_reprobadas: reprobNum,
      nivel_riesgo: nivel,
      canalizacion_sugerida: canalizacion,
      creado_en: new Date().toISOString(),
    };

    const { error } = await supabase.from('fichas_diagnosticas').insert({
      estudiante_correo: nuevaFicha.estudiante_correo,
      estudiante_nombre: nuevaFicha.estudiante_nombre,
      grupo: nuevaFicha.grupo,
      promedio_previo: nuevaFicha.promedio_previo,
      situacion_economica: nuevaFicha.situacion_economica,
      estado_salud: nuevaFicha.estado_salud,
      materias_reprobadas: nuevaFicha.materias_reprobadas,
      nivel_riesgo: nuevaFicha.nivel_riesgo,
      canalizacion_sugerida: nuevaFicha.canalizacion_sugerida,
    });

    if (error) {
      setFichas((prev) => [nuevaFicha, ...prev]);
    } else {
      await cargarDatos();
    }

    setAcuseGenerado(
      `${folio} | Fecha: ${new Date().toLocaleString('es-MX')} | Dictamen automático: Riesgo ${nivel}`
    );
    setMensajeSistema('Ficha Diagnóstica F-DA-01 registrada y evaluada automáticamente.');
  }

  async function crearPat(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioActivo) return;

    if (!ejeAcademico.trim() || !ejePersonal.trim() || !ejeProfesional.trim()) {
      setMensajeSistema(
        'Debes registrar actividades en los tres ejes formativos: Académico, Personal y Profesional.'
      );
      return;
    }

    const nuevoPlan: PlanPat = {
      id: `pat-${Date.now()}`,
      tutor_correo: usuarioActivo.correo,
      tutor_nombre: usuarioActivo.nombre,
      carrera: usuarioActivo.carrera,
      grupo: grupoPat,
      eje_academico: ejeAcademico.trim(),
      eje_personal: ejePersonal.trim(),
      eje_profesional: ejeProfesional.trim(),
      estatus: 'En Revisión',
      observaciones: 'Enviado automáticamente a Coordinación Departamental.',
      actualizado_en: new Date().toISOString(),
    };

    const { error } = await supabase.from('planes_pat').insert({
      tutor_correo: nuevoPlan.tutor_correo,
      tutor_nombre: nuevoPlan.tutor_nombre,
      carrera: nuevoPlan.carrera,
      grupo: nuevoPlan.grupo,
      eje_academico: nuevoPlan.eje_academico,
      eje_personal: nuevoPlan.eje_personal,
      eje_profesional: nuevoPlan.eje_profesional,
      estatus: nuevoPlan.estatus,
      observaciones: nuevoPlan.observaciones,
      actualizado_en: nuevoPlan.actualizado_en,
    });

    if (error) {
      setPlanes((prev) => [nuevoPlan, ...prev]);
    } else {
      await cargarDatos();
    }

    setEjeAcademico('');
    setEjePersonal('');
    setEjeProfesional('');
    setMensajeSistema('Plan de Acción Tutorial (PAT) enviado a revisión departamental.');
  }

  async function dictaminarPat(id: string, nuevoEstatus: 'Aprobado' | 'Observado') {
    const obs =
      nuevoEstatus === 'Aprobado'
        ? 'Dictamen favorable emitido por Coordinación Departamental (ITMH).'
        : 'Observado: Ajustar acciones o evidencias conforme al lineamiento del PIT.';

    const { error } = await supabase
      .from('planes_pat')
      .update({
        estatus: nuevoEstatus,
        observaciones: obs,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      setPlanes((prev) =>
        prev.map((p) => (p.id === id ? { ...p, estatus: nuevoEstatus, observaciones: obs } : p))
      );
    } else {
      await cargarDatos();
    }

    setMensajeSistema(`Dictamen registrado: PAT en estatus "${nuevoEstatus}".`);
  }

  async function asignarGrupoEstudiante(e: React.FormEvent) {
    e.preventDefault();
    if (!estudianteAsignar) return;

    const { error } = await supabase
      .from('usuarios_pit')
      .update({ grupo: nuevoGrupo })
      .eq('id', estudianteAsignar);

    if (error) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === estudianteAsignar ? { ...u, grupo: nuevoGrupo } : u))
      );
    } else {
      await cargarDatos();
    }

    setMensajeSistema(`Grupo "${nuevoGrupo}" asignado correctamente.`);
  }

  const carrerasDisponibles = ['TODAS', ...Array.from(new Set(usuarios.map((u) => u.carrera)))];
  const fichasFiltradas =
    filtroCarrera === 'TODAS'
      ? fichas
      : fichas.filter((f) => {
          const est = usuarios.find((u) => u.correo === f.estudiante_correo);
          return est?.carrera === filtroCarrera;
        });

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col">
      {/* Pleca Superior Institucional TecNM */}
      <div className="bg-[#0F213E] text-slate-200 text-[11px] tracking-wide border-b border-white/15">
        <div className="max-w-6xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold uppercase">
            Tecnológico Nacional de México • Secretaría de Educación Pública
          </span>
          <span className="text-sky-200 font-semibold">Instituto Tecnológico de Matehuala</span>
        </div>
      </div>

      {/* Encabezado Principal del Portal Académico */}
      <header className="bg-[#1B396A] text-white shadow-sm border-b-4 border-[#2B547E]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded-md border border-slate-200 shadow-xs shrink-0">
              <img
                src="/logo-itmh.png"
                alt="Escudo Instituto Tecnológico de Matehuala"
                className="h-14 w-14 object-contain"
              />
            </div>
            <div className="border-l border-white/25 pl-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-200">
                Subdirección Académica • Departamento de Desarrollo Académico
              </p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Programa Institucional de Tutorías (PIT)
              </h1>
              <p className="text-xs text-slate-200 mt-0.5">
                Automatización de Diagnósticos F-DA-01, Planes PAT y Seguimiento Tutorial
              </p>
            </div>
          </div>

          {usuarioActivo && (
            <div className="flex items-center gap-3 bg-[#0F213E] px-4 py-2.5 rounded-md border border-white/20">
              <div className="text-right text-xs">
                <p className="font-bold text-white">{usuarioActivo.nombre}</p>
                <p className="text-sky-200 font-semibold">{ETIQUETA_ROL[usuarioActivo.rol]}</p>
              </div>
              <button
                onClick={() => {
                  setUsuarioActivo(null);
                  setAcuseGenerado(null);
                  setMensajeSistema('');
                }}
                className="bg-white hover:bg-slate-100 text-[#1B396A] text-xs font-bold px-3 py-1.5 rounded cursor-pointer transition"
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Barra de Estado Institucional */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span>
            Sede: <strong className="text-[#1B396A]">Campus Matehuala, S.L.P.</strong>
            {modoSinConexionBd && (
              <span className="ml-2 text-slate-500">
                (Modo demostración local activo — verifica tu clave en .env.local si deseas
                persistencia en nube)
              </span>
            )}
          </span>
          <div className="flex items-center gap-4">
            <span>
              Fichas F-DA-01: <strong className="text-[#1B396A]">{fichas.length}</strong>
            </span>
            <span>
              Planes PAT: <strong className="text-[#1B396A]">{planes.length}</strong>
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-7 space-y-6">
        {mensajeSistema && (
          <div className="bg-white border-l-4 border-[#1B396A] border border-slate-200 text-[#1B396A] px-4 py-3 rounded-r-md text-sm font-medium shadow-xs">
            {mensajeSistema}
          </div>
        )}

        {cargando ? (
          <div className="bg-white p-10 rounded-md border border-slate-200 text-center text-slate-600 text-sm">
            Cargando información institucional del Programa de Tutorías...
          </div>
        ) : !usuarioActivo ? (
          /* Acceso Institucional TecNM */
          <section className="max-w-3xl mx-auto bg-white rounded-md border border-slate-200 border-t-4 border-t-[#1B396A] shadow-xs overflow-hidden">
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3.5">
                  <img
                    src="/logo-itmh.png"
                    alt="Escudo ITMH"
                    className="h-12 w-12 object-contain shrink-0"
                  />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#2B547E]">
                      Portal de Servicios Tutoriales • ITMH
                    </p>
                    <h2 className="text-xl font-bold text-[#1B396A]">
                      Acceso al Sistema PIT Automatizado
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cargarDatos}
                  className="text-xs font-semibold text-[#1B396A] hover:underline cursor-pointer"
                >
                  Actualizar catálogo
                </button>
              </div>

              <form onSubmit={iniciarSesion} className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                  Correo Institucional (@matehuala.tecnm.mx)
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    required
                    value={correoLogin}
                    onChange={(e) => setCorreoLogin(e.target.value)}
                    placeholder="l24660901@matehuala.tecnm.mx"
                    className="flex-1 border border-slate-300 rounded-md px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B396A]"
                  />
                  <button
                    type="submit"
                    className="bg-[#1B396A] hover:bg-[#13294d] text-white font-semibold px-6 py-2.5 rounded-md text-sm cursor-pointer transition"
                  >
                    Iniciar Sesión
                  </button>
                </div>
                {errorLogin && <p className="text-sm text-red-700 font-medium">{errorLogin}</p>}
              </form>

              <div className="pt-4 border-t border-slate-200 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Perfiles precargados para prueba de roles:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {usuarios.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setCorreoLogin(u.correo);
                        setUsuarioActivo(u);
                        setErrorLogin('');
                        setMensajeSistema(
                          `Sesión activa: ${u.nombre} — ${ETIQUETA_ROL[u.rol]}.`
                        );
                      }}
                      className="text-left p-3.5 rounded-md border border-slate-200 border-l-4 border-l-[#1B396A] hover:bg-[#F4F6F9] transition cursor-pointer"
                    >
                      <p className="text-sm font-bold text-[#1B396A]">{u.nombre}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{u.correo}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-[#2B547E]">{ETIQUETA_ROL[u.rol]}</span>
                        {u.grupo && <span className="text-slate-500">Grupo {u.grupo}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Vistas Operativas por Perfil */
          <div className="space-y-6">
            <section className="bg-white rounded-md border border-slate-200 border-l-4 border-l-[#1B396A] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#2B547E]">
                  Datos de Adscripción Académica
                </p>
                <h2 className="text-lg font-bold text-[#1B396A] mt-0.5">
                  {usuarioActivo.carrera}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Grupo asignado: <strong>{usuarioActivo.grupo || 'Cobertura General'}</strong> •
                  Cuenta: <strong>{usuarioActivo.correo}</strong>
                </p>
              </div>
              <span className="bg-[#1B396A] text-white text-xs font-semibold px-3.5 py-1.5 rounded-md">
                {ETIQUETA_ROL[usuarioActivo.rol]}
              </span>
            </section>

            {/* Estudiante: Ficha Diagnóstica F-DA-01 */}
            {usuarioActivo.rol === 'estudiante' && (
              <section className="bg-white rounded-md border border-slate-200 border-t-4 border-t-[#1B396A] p-6 space-y-4 shadow-xs">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2B547E]">
                    Formato Institucional F-DA-01 (Anexo 8)
                  </p>
                  <h3 className="text-xl font-bold text-[#1B396A]">
                    Ficha Diagnóstica Inicial del Tutorado
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Al enviar este formato, el sistema clasifica automáticamente tu nivel de riesgo
                    y genera tu comprobante de registro.
                  </p>
                </div>

                <form onSubmit={guardarFicha} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Promedio general previo (0 - 100) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      value={promedio}
                      onChange={(e) => setPromedio(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Asignaturas reprobadas previas *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      required
                      value={reprobadas}
                      onChange={(e) => setReprobadas(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Situación socioeconómica *
                    </label>
                    <select
                      value={economia}
                      onChange={(e) =>
                        setEconomia(e.target.value as 'Estable' | 'Moderada' | 'Critica')
                      }
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-50 focus:bg-white"
                    >
                      <option value="Estable">Estable</option>
                      <option value="Moderada">Moderada</option>
                      <option value="Critica">Critica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Estado de salud *
                    </label>
                    <select
                      value={salud}
                      onChange={(e) =>
                        setSalud(e.target.value as 'Optimo' | 'Requiere Atencion')
                      }
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-50 focus:bg-white"
                    >
                      <option value="Optimo">Optimo</option>
                      <option value="Requiere Atencion">Requiere Atencion</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 pt-1">
                    <button
                      type="submit"
                      className="bg-[#1B396A] hover:bg-[#13294d] text-white font-semibold px-6 py-2.5 rounded-md text-sm cursor-pointer transition"
                    >
                      Enviar Ficha Diagnóstica y Generar Acuse
                    </button>
                  </div>
                </form>

                {acuseGenerado && (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-md text-sm font-semibold">
                    Acuse Digital de Recepción: {acuseGenerado}
                  </div>
                )}
              </section>
            )}

            {/* Tutor: Elaborar PAT + Semáforo de Riesgo */}
            {usuarioActivo.rol === 'tutor' && (
              <>
                <section className="bg-white rounded-md border border-slate-200 border-t-4 border-t-[#1B396A] p-6 space-y-4 shadow-xs">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#2B547E]">
                      Plan de Acción Tutorial (PAT)
                    </p>
                    <h3 className="text-xl font-bold text-[#1B396A]">
                      Registro y Envío de PAT a Revisión Departamental
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Completa los tres ejes formativos institucionales para remitir el plan a
                      dictamen.
                    </p>
                  </div>

                  <form onSubmit={crearPat} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Grupo tutorial
                      </label>
                      <input
                        type="text"
                        value={grupoPat}
                        onChange={(e) => setGrupoPat(e.target.value)}
                        className="w-full sm:w-64 border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        1. Eje Académico *
                      </label>
                      <textarea
                        rows={2}
                        value={ejeAcademico}
                        onChange={(e) => setEjeAcademico(e.target.value)}
                        placeholder="Asesorías académicas, hábitos de estudio, regularización..."
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        2. Eje Personal *
                      </label>
                      <textarea
                        rows={2}
                        value={ejePersonal}
                        onChange={(e) => setEjePersonal(e.target.value)}
                        placeholder="Acompañamiento socioemocional, integración universitaria..."
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        3. Eje Profesional *
                      </label>
                      <textarea
                        rows={2}
                        value={ejeProfesional}
                        onChange={(e) => setEjeProfesional(e.target.value)}
                        placeholder="Orientación al perfil de egreso, trayectoria profesional..."
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-[#1B396A] hover:bg-[#13294d] text-white font-semibold px-5 py-2.5 rounded-md text-sm cursor-pointer transition"
                    >
                      Enviar PAT a Revisión Departamental
                    </button>
                  </form>
                </section>

                <section className="bg-white rounded-md border border-slate-200 border-t-4 border-t-[#2B547E] p-6 space-y-3 shadow-xs">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#2B547E]">
                      Detección Temprana y Canalización
                    </p>
                    <h3 className="text-xl font-bold text-[#1B396A]">
                      Semáforo de Riesgo del Grupo
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-[#F4F6F9] text-[#1B396A] text-xs uppercase">
                          <th className="p-3">Estudiante</th>
                          <th className="p-3">Grupo</th>
                          <th className="p-3">Promedio</th>
                          <th className="p-3">Riesgo</th>
                          <th className="p-3">Sugerencia de Canalización</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fichas.map((f) => (
                          <tr key={f.id} className="border-b border-slate-100">
                            <td className="p-3 font-medium">{f.estudiante_nombre}</td>
                            <td className="p-3">{f.grupo}</td>
                            <td className="p-3">{f.promedio_previo}</td>
                            <td className="p-3">
                              <span
                                className={`px-2.5 py-1 rounded text-xs font-bold ${
                                  f.nivel_riesgo === 'Rojo'
                                    ? 'bg-red-100 text-red-800'
                                    : f.nivel_riesgo === 'Amarillo'
                                    ? 'bg-slate-200 text-slate-900'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {f.nivel_riesgo}
                              </span>
                            </td>
                            <td className="p-3 text-slate-700">{f.canalizacion_sugerida}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {/* Coordinación Departamental: Asignar Grupos + Dictaminar PAT */}
            {usuarioActivo.rol === 'coordinador_dept' && (
              <>
                <section className="bg-white rounded-md border border-slate-200 border-t-4 border-t-[#1B396A] p-6 space-y-4 shadow-xs">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#2B547E]">
                      Administración de Grupos Tutoriales
                    </p>
                    <h3 className="text-xl font-bold text-[#1B396A]">
                      Asignar Grupo a Estudiante
                    </h3>
                  </div>

                  <form onSubmit={asignarGrupoEstudiante} className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Estudiante
                      </label>
                      <select
                        value={estudianteAsignar}
                        onChange={(e) => setEstudianteAsignar(e.target.value)}
                        className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-50"
                      >
                        {usuarios
                          .filter((u) => u.rol === 'estudiante')
                          .map((est) => (
                            <option key={est.id} value={est.id}>
                              {est.nombre} (Actual: {est.grupo || 'N/A'})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Nuevo grupo
                      </label>
                      <input
                        type="text"
                        value={nuevoGrupo}
                        onChange={(e) => setNuevoGrupo(e.target.value)}
                        className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-50"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-[#1B396A] hover:bg-[#13294d] text-white font-semibold px-4 py-2 rounded-md text-sm cursor-pointer transition"
                    >
                      Confirmar Asignación
                    </button>
                  </form>
                </section>

                <section className="bg-white rounded-md border border-slate-200 border-t-4 border-t-[#2B547E] p-6 space-y-4 shadow-xs">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#2B547E]">
                      Dictamen Departamental del PAT
                    </p>
                    <h3 className="text-xl font-bold text-[#1B396A]">
                      Revisión y Aprobación de Planes PAT
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {planes.map((pat) => (
                      <div
                        key={pat.id}
                        className="border border-slate-200 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAFBFD]"
                      >
                        <div className="space-y-1 text-sm">
                          <p className="font-bold text-[#1B396A]">
                            {pat.tutor_nombre} • Grupo {pat.grupo} ({pat.carrera})
                          </p>
                          <p className="text-slate-700">
                            <strong>Académico:</strong> {pat.eje_academico}
                          </p>
                          <p className="text-slate-700">
                            <strong>Personal:</strong> {pat.eje_personal}
                          </p>
                          <p className="text-slate-700">
                            <strong>Profesional:</strong> {pat.eje_profesional}
                          </p>
                          <p className="text-xs text-slate-500 pt-1">
                            Estatus: <strong>{pat.estatus}</strong> • {pat.observaciones}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => dictaminarPat(pat.id, 'Aprobado')}
                            className="bg-[#1B396A] hover:bg-[#13294d] text-white text-xs font-bold px-3.5 py-2 rounded cursor-pointer"
                          >
                            Aprobar PAT
                          </button>
                          <button
                            onClick={() => dictaminarPat(pat.id, 'Observado')}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-bold px-3.5 py-2 rounded cursor-pointer"
                          >
                            Observar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Coordinación Institucional: Tablero Concentrado */}
            {usuarioActivo.rol === 'coordinador_inst' && (
              <section className="bg-white rounded-md border border-slate-200 border-t-4 border-t-[#1B396A] p-6 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#2B547E]">
                      Coordinación Institucional de Tutorías
                    </p>
                    <h3 className="text-xl font-bold text-[#1B396A]">
                      Tablero Concentrado de Cobertura PIT
                    </h3>
                  </div>
                  <select
                    value={filtroCarrera}
                    onChange={(e) => setFiltroCarrera(e.target.value)}
                    className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-50"
                  >
                    {carrerasDisponibles.map((c) => (
                      <option key={c} value={c}>
                        Programa: {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-md bg-[#F4F6F9] border border-slate-200 border-l-4 border-l-[#1B396A]">
                    <p className="text-xs font-semibold text-slate-600">
                      Fichas Diagnósticas F-DA-01
                    </p>
                    <p className="text-2xl font-bold text-[#1B396A] mt-1">
                      {fichasFiltradas.length}
                    </p>
                  </div>
                  <div className="p-4 rounded-md bg-[#F4F6F9] border border-slate-200 border-l-4 border-l-[#2B547E]">
                    <p className="text-xs font-semibold text-slate-600">Planes PAT Registrados</p>
                    <p className="text-2xl font-bold text-[#2B547E] mt-1">{planes.length}</p>
                  </div>
                  <div className="p-4 rounded-md bg-[#F4F6F9] border border-slate-200 border-l-4 border-l-emerald-700">
                    <p className="text-xs font-semibold text-slate-600">Planes PAT Aprobados</p>
                    <p className="text-2xl font-bold text-emerald-800 mt-1">
                      {planes.filter((p) => p.estatus === 'Aprobado').length}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <footer className="bg-[#1B396A] text-slate-200 border-t-4 border-[#2B547E] py-3.5 px-4 text-center text-xs">
        Tecnológico Nacional de México • Instituto Tecnológico de Matehuala — Sistema del Programa
        Institucional de Tutorías
      </footer>
    </div>
  );
}