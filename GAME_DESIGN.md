# 🎯 BuscaÓptimos — Game Design Document

## 1. Contexto: ¿Qué es Dxter?

**Dxter** es un software de **optimización bayesiana mono y multiobjetivo** diseñado para investigadores. Su flujo de trabajo es el siguiente:

1. El investigador sube su **dataset** a la plataforma.
2. Define qué columnas son **entradas** (variables de diseño) y cuáles son **salidas** (respuestas/objetivos).
3. Establece **constraints** (restricciones) sobre las variables.
4. Indica qué objetivos quiere **maximizar** o **minimizar**.
5. Dxter, mediante optimización bayesiana, **propone los siguientes experimentos** que el investigador debe realizar con dos propósitos:
   - **Reducir la incertidumbre** del modelo subyacente (exploración).
   - **Encontrar el óptimo** de la función objetivo (explotación).

Este ciclo iterativo permite al investigador llegar al óptimo de su proceso con el **menor número de experimentos posible**, ahorrando tiempo, recursos y costes.

---

## 2. Objetivo del juego

**BuscaÓptimos** es un juego interactivo cuyo propósito es **demostrar de forma visual e intuitiva** la capacidad de Dxter. El jugador experimenta de primera mano cómo la **optimización bayesiana guiada por Dxter** le ayuda a encontrar el mínimo global de una función oculta con un número muy limitado de intentos.

La idea central es que el jugador comprenda, jugando, por qué la optimización bayesiana es una herramienta poderosa para la investigación experimental. El jugador siempre cuenta con las sugerencias de Dxter, pero puede elegir libremente cualquier celda del mapa.

---

## 3. Mecánica del juego

### 3.1. La cuadrícula

- El tablero es una **cuadrícula de N×N celdas** (variable según dificultad: 20×20, 30×30 o 40×40).
- Cada celda corresponde a un punto **(x, y)** en un espacio bidimensional.
- Por debajo de la cuadrícula existe una **función matemática oculta** `f(x, y)` que asigna un valor a cada celda.
- El valor de cada celda está representado mediante un **gradiente de color** (de azul/frío para valores bajos a rojo/caliente para valores altos). Los valores más bajos (mejores) se muestran como colores "calientes" en el mapa de calor.
- Al inicio, **todas las celdas están ocultas** (tapadas). El jugador no conoce el paisaje de la función.

### 3.2. La función oculta

La función `f(x, y)` se selecciona **aleatoriamente** al inicio de cada partida entre las funciones disponibles:

- **Funciones clásicas de benchmark** de optimización (Rastrigin, Ackley, Rosenbrock, Himmelblau, Schwefel).
- **Funciones generadas proceduralmente** (Mezcla Gaussiana, Sinusoidal).
- La función puede tener **un único óptimo global** o **múltiples óptimos locales**, lo que aumenta la dificultad y evidencia la utilidad de Dxter.

> **Nota:** Si el jugador activa las **Opciones avanzadas** durante la selección de dificultad, puede elegir la función manualmente en lugar de que sea aleatoria.

### 3.3. Revelar celdas

- Cuando el jugador **hace clic en una celda**, esta se revela mostrando:
  - Su **color** dentro del gradiente (indicando visualmente si el valor es alto o bajo).
  - Su **valor numérico** (opcionalmente).
- Las celdas reveladas permanecen visibles el resto de la partida.
- Cada celda revelada equivale a un **experimento realizado** en el mundo real.

### 3.4. El objetivo

- El jugador debe **encontrar la celda con el valor mínimo** de la función oculta. **El objetivo siempre es minimizar.**
- Dispone de un **número muy limitado de intentos** según la dificultad:
  - 🟢 **Fácil**: 5 intentos (cuadrícula 20×20)
  - 🟡 **Medio**: 10 intentos (cuadrícula 30×30)
  - 🔴 **Difícil**: 20 intentos (cuadrícula 40×40)
- Al final de la partida, se revela toda la cuadrícula y se muestra **dónde estaba realmente el mínimo** y cuán cerca estuvo el jugador.

---

## 4. Modo de juego: 🤖 Guiado por Dxter

El juego funciona siempre en **modo guiado por Dxter**. No existe selección de modo: Dxter siempre está activo sugiriendo las mejores celdas a explorar. Sin embargo, el jugador **puede elegir libremente cualquier celda** del mapa, no está obligado a seguir las sugerencias.

| Aspecto | Detalle |
|---|---|
| **Descripción** | Dxter sugiere al jugador las mejores celdas a revelar, pero el jugador puede explorar cualquier celda. |
| **Intentos** | Fácil: 5, Medio: 10, Difícil: 20. |
| **Estrategia** | Dxter analiza los datos revelados y **sugiere las siguientes celdas** óptimas a explorar (destacándolas visualmente). El jugador puede seguir las sugerencias o explorar libremente. |
| **Resultado** | Al agotar los intentos, se muestra su mejor valor encontrado vs. el mínimo real. |
| **Propósito** | Demostrar el poder de la optimización bayesiana para encontrar mínimos con muy pocos experimentos. |

**Flujo del juego:**

```
┌───────────────────────────────────────────────────────┐
│  1. Se selecciona la función oculta (aleatoria o      │
│     manual si opciones avanzadas están activadas)     │
│  2. Dxter sugiere las primeras celdas candidatas      │
│  3. El jugador elige una celda (sugerida o libre)     │
│  4. Dxter analiza los datos revelados                 │
│  5. Dxter sugiere N celdas candidatas (resaltadas)    │
│  6. Se repite el ciclo 3-5 hasta agotar intentos      │
│  7. Se revela el tablero completo                     │
│  8. Se muestra puntuación y estadísticas              │
└───────────────────────────────────────────────────────┘
```

**¿Cómo sugiere Dxter?**

Dxter utiliza internamente un modelo de **Proceso Gaussiano (Gaussian Process)** que:

1. Se ajusta a los puntos ya revelados.
2. Calcula una **función de adquisición** (Expected Improvement, UCB, etc.) sobre las celdas no reveladas.
3. Selecciona las celdas con mayor valor de adquisición, balanceando:
   - **Exploración**: zonas con alta incertidumbre (poco exploradas).
   - **Explotación**: zonas cercanas a los mejores valores encontrados (más bajos, ya que el objetivo es minimizar).

---

## 5. Sistema de puntuación

| Métrica | Descripción |
|---|---|
| **Mejor valor encontrado** | El valor más bajo (mínimo) que el jugador logró revelar. |
| **Distancia al mínimo** | Diferencia entre el mejor valor encontrado y el mínimo real de la función. |
| **Eficiencia** | Porcentaje de cercanía al mínimo en relación con los intentos usados. |

### Puntuación final

```
Puntuación = ((peor_valor - mejor_encontrado) / (peor_valor - mínimo_real)) × 100
```

Donde 100 significa que el jugador encontró exactamente el mínimo global.

---

## 6. Elementos visuales

### 6.1. Cuadrícula

- **Celdas ocultas**: Color neutro uniforme (blanco) con un ligero efecto hover.
- **Celdas reveladas**: Color según el gradiente de la función (escala de calor). Los valores bajos (mejores) se muestran como colores calientes.
- **Celda sugerida por Dxter**: Icono de bombilla y borde punteado para distinguirlas.
- **Mejor celda encontrada**: Barra inferior verde.
- **Mínimo real** (al final): Marcador de diamante (💎) al revelar el tablero.

### 6.2. Panel lateral

- **Contador de intentos restantes**: Número prominente y barra de progreso.
- **Créditos Dxter restantes**: Para pedir sugerencias adicionales.
- **Mejor valor encontrado hasta ahora**: Tarjeta destacada en verde.
- **Objetivo**: Recordatorio de que el objetivo es minimizar.
- **Acciones Dxter**: Botón para pedir sugerencias y explicación de las mismas.

### 6.3. Pantalla de resultados

- Revelación del tablero completo con mapa de calor.
- Puntuación animada con anillo circular de progreso.
- Comparativa visual entre la posición del mejor valor del jugador y el mínimo real.
- Gráfico de evolución del mejor valor a lo largo de los intentos.
- Detalles completos de la partida (función, distancia al mínimo, eficiencia, etc.).

---

## 7. Analogía con el mundo real

| Concepto en el juego | Equivalente en investigación |
|---|---|
| Cuadrícula N×N | Espacio de diseño del experimento |
| Celda (x, y) | Combinación de variables de entrada |
| Valor de la celda | Resultado del experimento (KPI, rendimiento, etc.) |
| Clic = revelar celda | Realizar un experimento en el laboratorio |
| Intentos limitados (5/10/20) | Presupuesto limitado de experimentos |
| Encontrar el mínimo | Objetivo del investigador |
| Sugerencias de Dxter | Investigación guiada por optimización bayesiana |

---

## 8. Stack técnico

| Componente | Tecnología |
|---|---|
| **Framework** | Astro |
| **Interactividad (UI)** | Astro Islands con componentes React o Svelte |
| **Estilos** | Tailwind CSS |
| **Motor de optimización** | Implementación en JavaScript/TypeScript de Gaussian Process + función de adquisición (cliente-side) |
| **Funciones de benchmark** | Librería propia con funciones matemáticas 2D |
| **Animaciones** | CSS Transitions + requestAnimationFrame |
| **Estado del juego** | Store reactivo (nanostores o similar) |

---

## 9. Flujo general de la aplicación

```
┌──────────────┐
│  PANTALLA    │──────────────────────────┐
│  DE INICIO   │                          │
│  (Landing)   │                          │
└──────┬───────┘                          │
       │                                  │
       ▼                                  │
┌──────────────┐     ┌──────────────┐     │
│  SELECCIONAR │     │  SELECCIONAR │     │
│  DIFICULTAD  │────▶│  FUNCIÓN     │     │
│  + Opciones  │     │  (solo si    │     │
│  avanzadas   │     │  avanzado)   │     │
└──────────────┘     └──────┬───────┘     │
       │                    │             │
       ▼ (si no avanzado)   │             │
       │◄───────────────────┘             │
       ▼                                  │
┌──────────────┐                          │
│  RESUMEN     │                          │
│  (Config +   │                          │
│   Comenzar)  │                          │
└──────┬───────┘                          │
       │                                  │
       ▼                                  │
┌──────────────┐                          │
│   PARTIDA    │                          │
│  (Cuadrícula │                          │
│   + Dxter)   │                          │
└──────┬───────┘                          │
       │                                  │
       ▼                                  │
┌──────────────┐                          │
│  RESULTADOS  │──────────────────────────┘
│  (Tablero    │  (Jugar de nuevo)
│   revelado)  │
└──────────────┘
```

**Notas sobre el flujo:**
- La función oculta se selecciona **aleatoriamente** por defecto.
- Solo si el jugador activa **Opciones avanzadas** en la pantalla de dificultad puede elegir la función manualmente.
- El objetivo siempre es **minimizar**.
- Dxter siempre está activo sugiriendo celdas.

---

## 10. Posibles extensiones futuras

- **Modo competitivo**: Dos jugadores compiten por encontrar el mínimo con los mismos intentos.
- **Leaderboard**: Ranking global de eficiencia.
- **Funciones 3D**: Visualización tridimensional del paisaje de la función al final de la partida.
- **Multiobjetivo**: Dos funciones simultáneas donde el jugador debe encontrar el frente de Pareto.
- **Tutorial interactivo**: Explicación paso a paso de cómo funciona la optimización bayesiana mientras se juega.
- **Exportar resultados**: Descargar los datos de la partida como CSV, simulando el flujo real de Dxter.