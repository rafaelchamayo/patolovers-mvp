# Quantum Traffic Lab

A dependency-free, offline browser MVP for a 5.5-hour quantum hackathon.

## Run

Open `../Quantum-Traffic-Lab.html` in a modern browser. This single file includes the complete interface and computation, and works without a server or internet.

For the editable source version, open `index.html` in this folder. Alternatively, serve this folder using Python 3:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then visit http://127.0.0.1:8765. No packages or installation are required. All computation stays in the browser.

## Use

1. Adjust axis arrival rates (vehicles/minute) and independent objective weights.
2. Compare all four costs. The exact classical optimizer enumerates the four feasible candidates; ties are shown.
3. Choose a plan in the playback selector, pause, scrub time, or change playback speed. Metrics under playback summarize the **whole 600 seconds**, while animation counters show the current second. Cars are schematic; long queues extend beyond the viewport.
4. Run quantum optimization. Watch best-so-far expected cost, exact probabilities, optimal-plan probability and optimality gap. QAOA does not automatically replace the selected playback plan.
5. Switch between one and two QAOA layers. Input changes cancel any running training and reset its results.
6. Expand the model/circuit panel for definitions, constraints, qubit ordering and Hamiltonian coefficients. Export JSON for reproducibility. A mid-training export records its current progress, not a converged result.

## Scientific model

Each bitstring chooses a complete fixed timing plan, rather than directly representing an individual signal. States 00, 01, 10, 11 respectively select NS/EW greens of 20/40, 30/30, 40/20 and 50/10 seconds. Each green is followed by 4 seconds of all-red clearance. All candidates have a 68-second cycle, minimum 10-second greens, and no conflicting greens.

There is one aggregate inbound lane per axis. Uniform arrivals are deterministic, identical across plans, and generated with fractional accumulators. Initial queues are empty. Every one-second step admits arrivals, applies service at 0.5 vehicles/s on green, then counts the remaining queue toward delay. No service occurs on all-red. Fractional service credit resets on red or an empty queue. FIFO service, nonnegative queues and vehicle conservation are enforced by construction. The 600-second horizon includes partial cycles and residual queues; initial phase and finite horizon can affect rankings.

D is queued vehicle-seconds divided by total arrivals, including unfinished waits; it is not the completed-trip travel time. Qmax is the maximum **single-axis** queue just before service. R is total residual queue. The objective is C = wD D/60 + wP Qmax/30 + wR R/30. These fixed scales make the weighted cost dimensionless. They are demonstrative policy choices, not empirically calibrated values. Zero arrivals give D=0. All-zero weights tie every plan.

Classical enumeration minimizes exactly these four C values. QAOA starts in |++>, applies the diagonal cost phase and the product X mixer for p=1 or 2, and maintains all four complex amplitudes. Phase evolution uses the affinely normalized cost (C-Cmin)/(Cmax-Cmin), or zero for a constant cost. The displayed Hamiltonian coefficients and expected costs use **original** cost units. No probabilities are manufactured from softmax or an optimizer ranking.

The classical parameter search is a standard unconstrained Nelder–Mead implementation (reflection, expansion, outside/inside contraction, shrink), equivalent in role to scipy.optimize.minimize(method='Nelder-Mead'). It uses six reproducible starting simplexes and 100 iterations per start. It operates in short asynchronous batches to keep the interface responsive. No global optimality guarantee is claimed. The displayed best state can be intermediate or final; measurement probabilities are exact statevector probabilities, without sampling noise.

## Test

Node.js is needed only to run tests:

```sh
node test.js
```

Tests cover feasible phases, uniform arrival counts, FIFO queue conservation, green-only service, a hand-calculated queue prefix, deterministic replay, diagonal Ising reconstruction, statevector normalization, analytic single-qubit interference, and optimizer expectation bounds across asymmetric, saturated and empty scenarios.

Browser smoke checks exercised training completion, plan switching, pause, and changing an arrival rate/reset. The single-file interface uses the same tested source.

Reference default (NS=18, EW=12, weights 1/0.6/1, p=2): exact minimum ~3.0127, QAOA expectation ~3.2676, optimal-plan probability ~71.3%. This deliberately illustrates a finite-training gap; it does not promise quantum superiority.

## Files

- index.html: interface and model documentation
- style.css: responsive visual design
- core.js: deterministic traffic simulation, costs, statevector and optimizer
- app.js: interaction, playback, charts, export
- test.js: numerical regression and invariant checks
- ../Quantum-Traffic-Lab.html: bundled offline application

## Hackathon demo (3 minutes)

Start with the default asymmetric traffic. Show how changing NS demand changes the exact preferred plan. Run QAOA and explain that each measurement chooses one of four already feasible plans. Compare expected cost with the exact minimum, then show the success probability and circuit. End by explaining the limits: no real hardware, no speedup, a deliberately small educational optimization model. Further hackathon time can go to presentation and sensitivity experiments rather than installation.
