#!/bin/bash

if [ -z "$1" ]; then
  echo 'Defina quantos produtos'
  exit 1
fi

# Create cartelas video
rm base*
rm mylist.txt

NUMERO_PRODUTOS=$1

echo "file 'partes/cartela_inicio.mp4'" >> mylist.txt

for ((i=2;i<=$NUMERO_PRODUTOS;++i))
do
  echo "file 'partes/cartela.mp4'" >> mylist.txt
done

ffmpeg -f concat -safe 0 -i mylist.txt -c copy cartelas.mp4
ffmpeg -i cartelas.mp4 -i partes/trilha.mp3 -shortest -c copy -map 0:v:0 -map 1:a:0 -c:a aac -b:a 192k output.mp4

# Concat all parts
rm mylist.txt

echo "file 'partes/cabeca.mp4'" >> mylist.txt
echo "file 'output.mp4'" >> mylist.txt
echo "file 'partes/rabicho.mp4'" >> mylist.txt

if [ -n "$2" ]; then
  echo "file 'partes/aprecie.mp4'" >> mylist.txt
fi

ffmpeg -f concat -safe 0 -i mylist.txt -c copy base.mp4

# Clean up
rm output*
rm cartelas*


#### NOT USED
#DURACAO_CABECA=$(sh obter_duracao.sh cabeca)
#DURACAO_CARTELA_INICIAL=$(sh obter_duracao.sh cartela_inicio)
#DURACAO_CARTELA=$(sh obter_duracao.sh cartela)

#DURACAO_PRODUTOS=$(echo "$DURACAO_CARTELA_INICIAL + ($DURACAO_CARTELA*$NUMERO_PRODUTOS-$DURACAO_CARTELA)" | bc)

#echo "Start products sound: $DURACAO_CABECA | Products sound duration: $DURACAO_PRODUTOS"
