#!/usr/bin/env bash

# Dependências: wf-recorder, slurp
OUTPUT="slime_rush_trailer.mp4"

echo "🎯 Selecione a área do jogo com o mouse..."
GEOM=$(slurp)

if [ -z "$GEOM" ]; then
    echo "❌ Seleção cancelada."
    exit 1
fi

echo "🎬 Gravando por 20 segundos... Vá ao jogo e aperte 'T'!"
# Grava a região selecionada por 20 segundos
wf-recorder -g "$GEOM" -f "$OUTPUT" -t 20

echo "✅ Vídeo salvo em $OUTPUT"
