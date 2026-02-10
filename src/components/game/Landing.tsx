import { goToSetup } from "@/stores/gameStore";

export default function Landing() {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        {/* Logo / Brand */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dxter-400 to-accent flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-dxter-500/30">
            D
          </div>
          <span className="text-sm font-medium tracking-widest uppercase text-dxter-700">
            Powered by Dxter
          </span>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold mb-4 tracking-tight">
          <span className="text-gradient">BuscaÓptimos</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-3 leading-relaxed">
          ¿Puedes encontrar el óptimo en un paisaje oculto?
        </p>
        <p className="text-base text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Demuestra el poder de la{" "}
          <span className="text-dxter-700 font-medium">optimización bayesiana</span>{" "}
          frente a la exploración manual en un juego interactivo.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button
            onClick={goToSetup}
            className="group relative px-8 py-4 bg-gradient-to-r from-dxter-600 to-dxter-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-dxter-600/30 hover:shadow-dxter-500/50 hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Comenzar a Jugar
            </span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-dxter-500 to-dxter-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>

          <a
            href="#como-funciona"
            className="px-8 py-4 border border-surface-400 text-slate-600 font-medium text-lg rounded-xl hover:bg-slate-50 hover:border-surface-300 transition-all duration-200"
          >
            ¿Cómo funciona?
          </a>
        </div>

        {/* Animated grid preview */}
        <div className="relative w-full max-w-md mx-auto aspect-square mb-8">
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-1 p-2 opacity-60">
            {Array.from({ length: 64 }).map((_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const cx = (col - 3.5) / 3.5;
              const cy = (row - 3.5) / 3.5;
              const value = Math.exp(-2 * (cx * cx + cy * cy)) * 0.7 +
                Math.sin(cx * 3) * Math.cos(cy * 3) * 0.3;
              const normalized = (value + 0.3) / 1.3;
              const hue = (1 - normalized) * 240;
              const isRevealed = [10, 18, 27, 28, 35, 36, 37, 44, 45, 53].includes(i);

              return (
                <div
                  key={i}
                  className="rounded-sm transition-all duration-700"
                  style={{
                    backgroundColor: isRevealed
                      ? `hsl(${hue}, 80%, 50%)`
                      : "var(--color-surface-700)",
                    animationDelay: `${i * 80}ms`,
                    opacity: isRevealed ? 1 : 0.5,
                    boxShadow: isRevealed
                      ? `0 0 8px hsl(${hue}, 80%, 50%, 0.4)`
                      : "none",
                  }}
                />
              );
            })}
          </div>
          {/* Overlay gradient fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f5f7fa] via-transparent to-[#f5f7fa]/60 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#f5f7fa]/80 via-transparent to-[#f5f7fa]/80 pointer-events-none" />
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="como-funciona"
        className="px-4 py-20 max-w-5xl mx-auto w-full"
      >
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-4">
          ¿Cómo funciona?
        </h2>
        <p className="text-slate-500 text-center max-w-2xl mx-auto mb-14">
          BuscaÓptimos simula el proceso de investigación experimental.
          Cada celda que revelas es un experimento; tu presupuesto es limitado.
        </p>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <StepCard
            number={1}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            }
            title="Elige tu terreno"
            description="Selecciona una función de benchmark, la dificultad y el modo de juego: manual o guiado por Dxter."
          />
          <StepCard
            number={2}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
              </svg>
            }
            title="Explora el mapa"
            description="Haz clic en las celdas para revelar sus valores. Cada clic es un experimento con tu presupuesto limitado."
          />
          <StepCard
            number={3}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-2.752 0m0 0a6.726 6.726 0 01-2.749-1.35" />
              </svg>
            }
            title="Encuentra el óptimo"
            description="Compara tus resultados jugando en modo manual vs. guiado por Dxter. ¿Quién llega antes al óptimo?"
          />
        </div>

        {/* Mode comparison cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <ModeCard
            mode="manual"
            emoji="🖐️"
            title="Modo Manual"
            description="Explora el mapa a tu criterio. Tú decides dónde hacer clic basándote en tu intuición y los valores que vayas descubriendo."
            features={[
              "Exploración libre sin asistencia",
              "Desarrolla tu propia estrategia",
              "Simula la investigación por ensayo y error",
            ]}
          />
          <ModeCard
            mode="guided"
            emoji="🤖"
            title="Modo Guiado por Dxter"
            description="Dxter analiza los datos revelados y te sugiere las mejores celdas a explorar usando optimización bayesiana."
            features={[
              "Sugerencias inteligentes en cada paso",
              "Balance automático exploración/explotación",
              "Demuestra el poder de Dxter",
            ]}
          />
        </div>

        {/* Analogy table */}
        <div className="glass p-6 sm:p-8">
          <h3 className="text-xl font-display font-semibold mb-6 text-center">
            🔬 Analogía con el mundo real
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-base">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-dxter-700 font-semibold">
                    En el juego
                  </th>
                  <th className="text-left py-3 px-4 text-dxter-600 font-semibold">
                    En investigación
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {[
                  ["Cuadrícula N×N", "Espacio de diseño del experimento"],
                  ["Celda (x, y)", "Combinación de variables de entrada"],
                  ["Valor de la celda", "Resultado del experimento (KPI)"],
                  ["Clic = revelar celda", "Realizar un experimento"],
                  ["Intentos limitados", "Presupuesto limitado de experimentos"],
                  ["Encontrar el óptimo", "Objetivo del investigador"],
                  ["Modo manual", "Ensayo y error tradicional"],
                  ["Modo Dxter", "Optimización bayesiana con Dxter"],
                ].map(([game, real], i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4">{game}</td>
                    <td className="py-3 px-4">{real}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
          ¿Preparado para el reto?
        </h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Demuestra que Dxter encuentra el óptimo con menos experimentos que tú.
        </p>
        <button
          onClick={goToSetup}
          className="px-10 py-4 bg-gradient-to-r from-dxter-600 to-dxter-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-dxter-600/30 hover:shadow-dxter-500/50 hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          🎯 Jugar ahora
        </button>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center text-sm text-slate-400 border-t border-slate-200">
        <p>
          Hecho con 💙 por el equipo de{" "}
          <span className="text-dxter-600 font-medium">Dxter</span>
          {" · "}
          Optimización bayesiana para investigadores
        </p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass p-6 flex flex-col items-center text-center hover:border-dxter-500/30 transition-colors group">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-dxter-600 group-hover:bg-dxter-500/10 transition-colors">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-dxter-600 flex items-center justify-center text-xs font-bold text-white">
          {number}
        </div>
      </div>
      <h3 className="text-lg font-display font-semibold mb-2 text-slate-800">
        {title}
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function ModeCard({
  mode,
  emoji,
  title,
  description,
  features,
}: {
  mode: "manual" | "guided";
  emoji: string;
  title: string;
  description: string;
  features: string[];
}) {
  const borderColor =
    mode === "manual"
      ? "hover:border-amber-500/40"
      : "hover:border-accent/40";

  const iconColor =
    mode === "manual" ? "text-amber-600" : "text-dxter-600";

  const checkColor =
    mode === "manual" ? "text-amber-600" : "text-dxter-600";

  return (
    <div className={`glass p-6 sm:p-8 transition-colors ${borderColor}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{emoji}</span>
        <h3 className={`text-xl font-display font-semibold ${iconColor}`}>
          {title}
        </h3>
      </div>
      <p className="text-slate-500 text-sm mb-5 leading-relaxed">
        {description}
      </p>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <svg
              className={`w-4 h-4 mt-0.5 shrink-0 ${checkColor}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
