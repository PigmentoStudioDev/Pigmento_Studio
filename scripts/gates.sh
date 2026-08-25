#!/bin/bash
# Compliance de Pigmento Studio. Un solo entrypoint:
#
#   ./scripts/gates.sh
#
# Cuatro gates: build, estatico, contrato, tests. Exit != 0 si alguno falla.
# El orden no es cosmetico: el build va PRIMERO porque la seccion `budgets` del
# contrato mide sobre .next/, y sin build se salta con una nota en vez de medir.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

fails=0
warns=0
pass()    { echo "  ok  $1"; }
fail()    { echo "FAIL  $1"; fails=$((fails + 1)); }
warn()    { echo "warn  $1"; warns=$((warns + 1)); }
section() { echo; echo "== $1"; }

# ---------------------------------------------------------------- Gate 1: build
section "Gate 1 — build"
out=$(pnpm build 2>&1)
if [ $? -eq 0 ]; then
    pass "pnpm build compila (y deja .next/ para medir budgets)"
else
    fail "pnpm build fallo:"
    echo "$out" | tail -25
fi

# ------------------------------------------------------------- Gate 2: estatico
section "Gate 2 — estatico"

# Secretos: los prefijos de las claves que mas circulan. Se mira tambien scripts/ y
# conformance/, que no los cubre ningun contrato.
if grep -rnE "(sk-[A-Za-z0-9_-]{20,}|sk_[A-Za-z0-9]{20,}|gsk_[A-Za-z0-9]{16,}|xai-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16})" \
        src scripts conformance 2>/dev/null; then
    fail "posible secreto hardcodeado (lineas arriba)"
else
    pass "sin secretos hardcodeados"
fi

# ESLint es quien entiende AST: rules-of-hooks, exhaustive-deps, jsx-key y las
# reglas de core-web-vitals. El contrato de conformance NO las reimplementa a
# base de regex — por eso este gate no es opcional.
out=$(pnpm lint 2>&1)
if [ $? -eq 0 ]; then
    pass "eslint limpio (hooks y core-web-vitals)"
else
    fail "eslint fallo:"
    echo "$out" | tail -25
fi

# --------------------------------------------------------------- Gate 3: contrato
# El contrato es data (conformance/*.json), el runner es tonto. Relajar una regla
# obliga a tocar ese directorio, y eso se ve en el diff.
section "Gate 3 — contrato"
if node scripts/conformance.mjs; then
    pass "contrato completo en verde"
else
    fail "violaciones de contrato (detalle arriba)"
fi

# -------------------------------------------------------------- Gate 4: tests
section "Gate 4 — tests"
out=$(pnpm test 2>&1)
if [ $? -eq 0 ]; then
    pass "vitest verde — $(echo "$out" | grep -oE 'Tests +[0-9]+ passed[^)]*' | tail -1)"
else
    fail "vitest fallo:"
    echo "$out" | tail -25
fi

# ------------------------------------------------------------------- Resumen
echo
echo "$fails fallos, $warns avisos"
exit $((fails > 0 ? 1 : 0))
