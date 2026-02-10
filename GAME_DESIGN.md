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

**BuscaÓptimos** es un juego interactivo cuyo propósito es **demostrar de forma visual e intuitiva** la capacidad de Dxter. El jugador experimenta de primera mano la diferencia entre:

- Buscar un óptimo **a ciegas** (modo manual).
- Buscar un óptimo **guiado por Dxter** (modo asistido).

La idea central es que el jugador comprenda, jugando, por qué la optimización bayesiana es superior a la exploración manual o aleatoria.

---

## 3. Mecánica del juego

### 3.1. La cuadrícula

- El tablero es una **cuadrícula de 40×40 celdas** (1.600 celdas en total).
- Cada celda corresponde a un punto **(x, y)** en un espacio bidimensional.
- Por debajo de la cuadrícula existe una **función matemática oculta** `f(x, y)` que asigna un valor a cada celda.
- El valor de cada celda está representado mediante un **gradiente de color** (por ejemplo, de azul/frío para valores bajos a rojo/caliente para valores altos).
- Al inicio, **todas las celdas están ocultas** (tapadas). El jugador no conoce el paisaje de la función.

### 3.2. La función oculta

La función `f(x, y)` se genera o se selecciona al inicio de cada partida. Puede ser:

- **Funciones clásicas de benchmark** de optimización (Rastrigin, Ackley, Rosenbrock, Himmelblau, etc.).
- **Funciones generadas proceduralmente** (combinaciones de gaussianas, ondas sinusoidales superpuestas, etc.).
- La función puede tener **un único óptimo global** o **múltiples óptimos locales**, lo que aumenta la dificultad y evidencia la utilidad de Dxter.

### 3.3. Revelar celdas

- Cuando el jugador **hace clic en una celda**, esta se revela mostrando:
  - Su **color** dentro del gradiente (indicando visualmente si el valor es alto o bajo).
  - Su **valor numérico** (opcionalmente).
- Las celdas reveladas permanecen visibles el resto de la partida.
- Cada celda revelada equivale a un **experimento realizado** en el mundo real.

### 3.4. El objetivo

- El jugador debe **encontrar la celda con el valor óptimo** (máximo o mínimo, según la configuración de la partida).
- Dispone de un **número limitado de intentos** (por ejemplo, 30-50 clics), lo que simula el presupuesto limitado de experimentos que tiene un investigador real.
- Al final de la partida, se revela toda la cuadrícula y se muestra **dónde estaba realmente el óptimo** y cuán cerca estuvo el jugador.

---

## 4. Modos de juego

### 4.1. 🖐️ Modo Manual

| Aspecto | Detalle |
|---|---|
| **Descripción** | El jugador explora la cuadrícula por su cuenta, sin asistencia. |
| **Intentos** | Número fijo de clics (ej. 40 intentos). |
| **Estrategia** | El jugador debe decidir por sí mismo dónde hacer clic: explorar zonas nuevas o profundizar en zonas prometedoras. |
| **Resultado** | Al agotar los intentos, se le muestra su mejor valor encontrado vs. el óptimo real. |
| **Propósito** | Demostrar lo difícil que es encontrar un óptimo sin una estrategia sistemática. |

**Flujo del Modo Manual:**

```
┌─────────────────────────────────────────────┐
│  1. Se genera la función oculta             │
│  2. El jugador ve la cuadrícula vacía       │
│  3. Hace clic en una celda → se revela      │
│  4. Repite hasta agotar intentos            │
│  5. Se revela el tablero completo           │
│  6. Se muestra puntuación y estadísticas    │
└─────────────────────────────────────────────┘
```

### 4.2. 🤖 Modo Guiado por Dxter

| Aspecto | Detalle |
|---|---|
| **Descripción** | Dxter sugiere al jugador las siguientes celdas a revelar. |
| **Intentos** | Mismo número fijo de clics que en modo manual. |
| **Estrategia** | El jugador hace su primer clic libremente. A partir de ahí, Dxter analiza los datos revelados y **sugiere las siguientes celdas** óptimas a explorar (destacándolas visualmente en el tablero). |
| **Resultado** | Al agotar los intentos, se compara el rendimiento con el modo manual. |
| **Propósito** | Demostrar que Dxter encuentra el óptimo con menos intentos y de forma más eficiente. |

**Flujo del Modo Guiado:**

```
┌───────────────────────────────────────────────────────┐
│  1. Se genera la función oculta (misma que en manual) │
│  2. El jugador hace su primer clic libre              │
│  3. Dxter analiza los datos revelados                 │
│  4. Dxter sugiere N celdas candidatas (resaltadas)    │
│  5. El jugador elige una de las sugeridas             │
│  6. Se repite el ciclo 3-5 hasta agotar intentos      │
│  7. Se revela el tablero completo                     │
│  8. Se muestra puntuación y comparativa               │
└───────────────────────────────────────────────────────┘
```

**¿Cómo sugiere Dxter?**

Dxter utiliza internamente un modelo de **Proceso Gaussiano (Gaussian Process)** que:

1. Se ajusta a los puntos ya revelados.
2. Calcula una **función de adquisición** (Expected Improvement, UCB, etc.) sobre las celdas no reveladas.
3. Selecciona las celdas con mayor valor de adquisición, balanceando:
   - **Exploración**: zonas con alta incertidumbre (poco exploradas).
   - **Explotación**: zonas cercanas a los mejores valores encontrados.

---

## 5. Sistema de puntuación

| Métrica | Descripción |
|---|---|
| **Mejor valor encontrado** | El valor más alto (o más bajo) que el jugador logró revelar. |
| **Distancia al óptimo** | Diferencia entre el mejor valor encontrado y el óptimo real de la función. |
| **Eficiencia** | Porcentaje de cercanía al óptimo en relación con los intentos usados. |
| **Comparativa Manual vs. Dxter** | Si el jugador juega ambos modos con la misma función, se muestra una comparativa directa. |

### Puntuación final sugerida

```
Puntuación = (Valor encontrado / Valor óptimo) × 100
```

Donde 100 significa que el jugador encontró exactamente el óptimo.

---

## 6. Elementos visuales

### 6.1. Cuadrícula

- **Celdas ocultas**: Color neutro uniforme (gris oscuro) con un ligero efecto hover.
- **Celdas reveladas**: Color según el gradiente de la función (escala de calor).
- **Celda sugerida por Dxter** (modo guiado): Borde pulsante/brillante para distinguirlas.
- **Mejor celda encontrada**: Marcador especial (estrella, corona, etc.).
- **Óptimo real** (al final): Marcador destacado al revelar el tablero.

### 6.2. Panel lateral / superior

- **Contador de intentos restantes**: Barra de progreso o número.
- **Mejor valor encontrado hasta ahora**.
- **Modo actual**: Manual / Guiado por Dxter.
- **Minimapa de calor** (opcional): Un mini-mapa que va mostrando los puntos revelados.
- **Gráfico de progreso**: Evolución del mejor valor encontrado a lo largo de los intentos.

### 6.3. Pantalla de resultados

- Revelación animada del tablero completo.
- Comparativa visual entre la posición del mejor valor del jugador y el óptimo real.
- Si se jugaron ambos modos: gráfico comparativo de eficiencia.

---

## 7. Analogía con el mundo real

| Concepto en el juego | Equivalente en investigación |
|---|---|
| Cuadrícula 40×40 | Espacio de diseño del experimento |
| Celda (x, y) | Combinación de variables de entrada |
| Valor de la celda | Resultado del experimento (KPI, rendimiento, etc.) |
| Clic = revelar celda | Realizar un experimento en el laboratorio |
| Intentos limitados | Presupuesto limitado de experimentos |
| Encontrar el óptimo | Objetivo del investigador |
| Modo manual | Investigación por ensayo y error |
| Modo Dxter | Investigación guiada por optimización bayesiana |

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
│  PANTALLA    │
│  DE INICIO   │──────────────────────────┐
│  (Landing)   │                          │
└──────┬───────┘                          │
       │                                  │
       ▼                                  │
┌──────────────┐     ┌──────────────┐     │
│  SELECCIONAR │     │  SELECCIONAR │     │
│  MODO        │────▶│  DIFICULTAD  │     │
│  (Manual /   │     │  (Función)   │     │
│   Guiado)    │     └──────┬───────┘     │
└──────────────┘            │             │
                            ▼             │
                    ┌──────────────┐      │
                    │   PARTIDA    │      │
                    │  (Cuadrícula │      │
                    │   activa)    │      │
                    └──────┬───────┘      │
                           │              │
                           ▼              │
                    ┌──────────────┐      │
                    │  RESULTADOS  │      │
                    │  (Tablero    │──────┘
                    │   revelado)  │  (Jugar de nuevo)
                    └──────────────┘
```

---

## 10. Posibles extensiones futuras

- **Modo competitivo**: Dos jugadores (o jugador vs. Dxter) compiten por encontrar el óptimo con los mismos intentos.
- **Leaderboard**: Ranking global de eficiencia.
- **Funciones 3D**: Visualización tridimensional del paisaje de la función al final de la partida.
- **Multiobjetivo**: Dos funciones simultáneas donde el jugador debe encontrar el frente de Pareto.
- **Tutorial interactivo**: Explicación paso a paso de cómo funciona la optimización bayesiana mientras se juega.
- **Tamaños de cuadrícula variables**: Desde 10×10 (fácil) hasta 100×100 (extremo).
- **Exportar resultados**: Descargar los datos de la partida como CSV, simulando el flujo real de Dxter.