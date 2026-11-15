#!/usr/bin/env bash
# fire-w1.sh: renders wave-1 film shots as motion-designed clips from one painting each (no new images).
#
#   fire-w1.sh [--out DIR] [--only N,N] w1-<door>-<day> ...
#
# Without --out it writes in place to art/sacred/<id>/clips/, backing the old clip up once as <name>.slow.mp4
# and remaking the .webp poster. Runway clips (a <name>.kb.mp4 beside them, or listed in films/wave1/runway-log.json)
# are never touched. Shots whose png isn't in $PAINT_IN (default ~/Downloads) yet are skipped.
# Temp renders go to $FIRE_TMP (default ${TMPDIR:-/tmp}/ih-fire-tmp).
#
# Treatments (picked per shot from the spec's move and its place in the film; never the same twice in a row):
#   crash    speed-ramped crash zoom (slam in, ease), flash cut-in, impact shake + chromatic pulse, light leak
#   whip     whip-pan entry from a mirrored frame with directional blur, overshoot settle, chromatic pulse
#   pull     speed-ramped pull-back reveal from tight, flash cut-in
#   rise     speed-ramped tilt-up with a light leak spilling from above
#   parallax 2.5D parallax: a smooth depth map (ground near, detail near) drives a displacement so near and far move apart
#   dolly    dolly-zoom (vertigo): camera zooms out while the far plane swells; flash, chromatic pulse, shake
#   drift    slow cinematic push with an anamorphic flare sweep
#   hand     handheld push (organic shake, roll) for today scenes and dramatic beats
# Every shot: per-style grade + halation glow, gate weave, film grain, breathing vignette, a cut-in pop.
# Flashes: at most two per shot, never closer than 0.25 s (well under 3 a second).
set -u
TOOLS=$(cd "$(dirname "$0")" && pwd); GB=$(dirname "$TOOLS")
DL=${PAINT_IN:-$HOME/Downloads}
OUT=""; ONLY=""
while [ $# -gt 0 ]; do case $1 in --out) OUT=$2; shift 2;; --only) ONLY=",$2,"; shift 2;; *) break;; esac; done
TMP=${FIRE_TMP:-${TMPDIR:-/tmp}/ih-fire-tmp}; mkdir -p "$TMP"
RLOG=$GB/films/wave1/runway-log.json

# plan: one line per shot -> name treatment dir duration family
plan() {
  node -e '
  const j=require(process.argv[1]);const N=j.shots.length;
  const fam={impasto:"warm",miniature:"warm",kalighat:"warm",mural:"warm",retablo:"warm",fresco:"warm",phulkari:"warm",mosaic:"warm",popcinema:"warm",
    neon:"cool",chrome:"cool",vhs:"cool",afrofuture:"cool",anime:"cool",film35:"film",editorial:"film",clay:"film",
    riso:"graphic",comic:"graphic",cutout:"graphic",woodblock:"graphic",inkwash:"graphic",glass:"glass"}[j.style]||"film";
  let turn=j.shots.findIndex((s,i)=>i>0&&i<N-1&&s.move==="whip"); if(turn<0) turn=Math.max(1,Math.min(N-2,Math.ceil(N*0.6)-1));
  const base={push:"parallax",pull:"pull","pan-left":"parallax","pan-right":"parallax","tilt-up":"rise",drift:"drift",parallax:"parallax",whip:"whip"};
  let prev="",out=[];
  j.shots.forEach((s,i)=>{const m=s.move||"push";let t;
    if(i===0) t=(m==="whip"||m.startsWith("pan"))?"whip":"crash";
    else if(i===turn) t=(m==="whip"||m.startsWith("pan"))?"whip":"dolly";
    else if(i===N-1&&s.kind==="today") t="hand";
    else t=base[m]||"parallax";
    if(t===prev){for(const a of ["parallax","hand","drift","rise","pull"]) if(a!==prev){t=a;break;}}
    const dir=m==="pan-left"?"L":m==="pan-right"?"R":(i%2?"R":"L"); const pd=m==="push"||m==="drift"?"P":dir;
    const w=s.caption.split(/\s+/).length; const dur=Math.min(8,Math.max(6,2.2+w*0.26+0.5));
    out.push([j.id?("w1-"+j.id+"-"+s.n):"",t,t==="parallax"?pd:dir,(Math.round(dur*30)/30).toFixed(3),fam].join(" "));prev=t;});
  console.log(out.join("\n"));' "$1"
}

is_runway() { # dir name
  [ -e "$1/$2.kb.mp4" ] && return 0
  [ -s "$RLOG" ] && grep -q "\"$2\"\|/$2\.mp4\|$2\.mp4" "$RLOG" && return 0
  return 1
}

# sendcmd pulse: filter@inst opts strength at -> decaying commands
ca_cmds() { # time strength
  awk -v t0=$1 -v s=$2 'BEGIN{for(k=0;k<10;k++){t=t0+k*0.035;v=int(s*exp(-k*0.42)+0.5);printf "%.3f rgbashift@ca rh %d, rgbashift@ca bh %d, rgbashift@ca rv %d;",t,v,-v,int(v/3)} printf "%.3f rgbashift@ca rh 0, rgbashift@ca bh 0, rgbashift@ca rv 0;",t0+0.4}'
}
blur_cmds() { # whip blur: sigma 42 held 0.13 s, then down to 0 by 0.43 s
  awk 'BEGIN{for(k=0;k<=13;k++){t=k*0.033;v=(k<4)?42:42*(1-(k-4)/9)^1.6;printf "%.3f gblur@wb sigma %.2f;",t,v}}'
}

render() { # src out treat dir dur fam
  local src=$1 out=$2 tr=$3 dir=$4 D=$5 fam=$6
  local NF=$(awk -v d=$D 'BEGIN{printf "%d", d*30+0.5}')
  local FR=30 BIG=768x1366 DISP="" zp rot="0" fl1=0.14 fl2=0 ti=0 ca="" wb="" leak="" flare=""
  local EO='(1-pow(2,-10*clip(P,0,1)))'
  local WEAVE='(0.7*sin(T*2.3)+0.45*sin(T*5.1+1.3))'
  local u='(iw/zoom/768)'   # one output pixel, in input pixels
  local cx="iw/2-iw/zoom/2" cy="ih/2-ih/zoom/2"
  case $tr in
    crash)
      FR=90; local ZE=${EO//P/T/0.6}
      zp="z='1+0.4*$ZE+0.05*T/$D':x='clip($cx+$u*($WEAVE+11*exp(-max(0,T-0.3)*4.5)*gte(T,0.3)*sin((T-0.3)*38)),0,iw-iw/zoom)':y='clip($cy+$u*(0.6*$WEAVE+8*exp(-max(0,T-0.3)*4.5)*gte(T,0.3)*cos((T-0.3)*33)),0,ih-ih/zoom)'"
      rot="0.006*exp(-max(0,t-0.3)*4)*gte(t,0.3)*sin((t-0.3)*29)"
      fl1=0.55; fl2=0.22; ti=0.40; ca="$(ca_cmds 0.32 11)"; leak="0.0 1.9 L"; flare="2.2 1.6";;
    whip)
      FR=90; zp="z='1.08+0.08*T/$D':x='clip($cx+$u*$WEAVE,0,iw-iw/zoom)':y='clip($cy+$u*0.6*$WEAVE,0,ih-ih/zoom)'"
      fl1=0.3; ca="$(ca_cmds 0.30 10)"; wb="$(blur_cmds)"; leak="0.1 1.6 $dir";;
    pull)
      FR=90; local ZE=${EO//P/T/0.95}
      zp="z='1.46-0.36*$ZE-0.05*T/$D':x='clip($cx+$u*(1.6*$WEAVE),0,iw-iw/zoom)':y='clip($cy+$u*(1.2*$WEAVE),0,ih-ih/zoom)'"
      fl1=0.4; ca="$(ca_cmds 0.0 8)"; flare="1.4 1.8";;
    rise)
      FR=60; local P2="clip(T/2.4,0,1)"
      local EIO="if(lt($P2,0.5),16*pow($P2,5),1-pow(-2*$P2+2,5)/2)"
      zp="z='1.2+0.04*T/$D':x='clip($cx+$u*$WEAVE,0,iw-iw/zoom)':y='clip((ih-ih/zoom)*(1-0.86*($EIO)-0.12*T/$D)+$u*0.5*$WEAVE,0,ih-ih/zoom)'"
      fl1=0.18; leak="0.6 3.2 T";;
    parallax)
      local ease="(0.5-0.5*cos(PI*T/$D))"
      if [ $dir = P ]; then
        zp="z='1.1+0.07*$ease':x='clip($cx+$u*$WEAVE,0,iw-iw/zoom)':y='clip($cy+$u*0.6*$WEAVE,0,ih-ih/zoom)'"
        DISP="radial-near:-0.85*(0.5-0.5*cos(PI*t/$D))"
      else
        local sg=1; [ $dir = L ] && sg=-1
        zp="z='1.14':x='clip($cx+$sg*$u*36*(2*$ease-1)+$u*$WEAVE,0,iw-iw/zoom)':y='clip($cy+$u*0.6*$WEAVE,0,ih-ih/zoom)'"
        DISP="lateral:$sg*1.0*(1-2*(0.5-0.5*cos(PI*t/$D)))"
      fi
      fl1=0.12; flare="1.8 2.2";;
    dolly)
      local P3="clip(T/($D*0.9),0,1)"; local E="(1-pow(1-$P3,3))"
      zp="z='1.26-0.16*$E':x='clip($cx+$u*($WEAVE+2.5*sin(T*1.9)+1.2*sin(T*4.7)),0,iw-iw/zoom)':y='clip($cy+$u*(0.6*$WEAVE+2*cos(T*1.6)),0,ih-ih/zoom)'"
      DISP="radial-far:-0.95*(1-pow(1-clip(t/($D*0.9),0,1),3))"
      rot="0.003*sin(t*1.3)+0.0015*sin(t*3.9)"
      fl1=0.45; ca="$(ca_cmds 0.15 9)"; leak="0.0 2.4 R";;
    drift)
      local ease="(0.5-0.5*cos(PI*T/$D))"
      zp="z='1.06+0.11*$ease':x='clip($cx+$u*(18*(2*$ease-1)+$WEAVE),0,iw-iw/zoom)':y='clip($cy+$u*(-10*(2*$ease-1)+0.6*$WEAVE),0,ih-ih/zoom)'"
      fl1=0.1; flare="0.9 2.6";;
    hand)
      zp="z='1.08+0.13*(1-pow(1-T/$D,2))':x='clip($cx+$u*(4.5*(sin(T*1.9)+0.6*sin(T*4.7+0.8)+0.35*sin(T*9.3+2.1))/1.95),0,iw-iw/zoom)':y='clip($cy+$u*(3.5*(sin(T*1.5+2)+0.6*sin(T*3.9+0.4)+0.35*sin(T*8.1+1.1))/1.95),0,ih-ih/zoom)'"
      rot="0.004*sin(t*1.3)+0.002*sin(t*3.7+1)"
      fl1=0.2; leak="0.0 2.0 L";;
  esac
  zp=${zp//T/(on/$FR)}
  [ -n "$DISP" ] && BIG=1536x2732
  # grade per family: s-curve, colour balance, saturation, glow amount, grain, light colours (leak r g b ; flare r g b)
  local curve="0/0 0.25/0.2 0.5/0.5 0.75/0.81 1/1" cb="" sat=1.15 glow=0.3 grain=9 LC="1 0.55 0.18" FC="1 0.85 0.6"
  case $fam in
    warm)    cb="colorbalance=rh=0.035:bh=-0.03:bs=0.02,"; sat=1.16;;
    cool)    cb="colorbalance=rs=-0.04:bs=0.08:rh=0.05:bh=0.04,"; sat=1.22; glow=0.35; LC="0.95 0.2 0.75"; FC="0.55 0.85 1";;
    film)    curve="0/0.035 0.25/0.21 0.5/0.5 0.75/0.8 1/0.98"; cb="colorbalance=bs=0.05:gs=0.01:rh=0.05:bh=-0.04,"; sat=1.06; grain=11; LC="1 0.42 0.15";;
    graphic) curve="0/0 0.25/0.17 0.5/0.5 0.75/0.85 1/1"; sat=1.12; glow=0.2; grain=11; LC="1 0.75 0.25";;
    glass)   curve="0/0 0.25/0.17 0.5/0.5 0.75/0.83 1/1"; sat=1.28; glow=0.4; grain=6; LC="1 0.7 0.3"; FC="1 0.95 0.8";;
  esac
  # light layer (leak blob + anamorphic flare) drawn small, scaled up
  local LX="0" FXp="0"
  if [ -n "$leak" ]; then set -- $leak; local la=$1 ld=$2 side=$3 lx ly
    case $side in L) lx="-30+90*clip((T-$la)/$ld,0,1)"; ly="90+60*clip((T-$la)/$ld,0,1)";; R) lx="210-90*clip((T-$la)/$ld,0,1)"; ly="70+80*clip((T-$la)/$ld,0,1)";; T) lx="60+70*clip((T-$la)/$ld,0,1)"; ly="-40+60*clip((T-$la)/$ld,0,1)";; esac
    LX="0.85*sin(PI*clip((T-$la)/$ld,0,1))*exp(-(pow(X-($lx),2)+pow(Y-($ly),2))/(2*4900))"
  fi
  if [ -n "$flare" ]; then set -- $flare; local fa=$1 fd=$2
    local fx="-60+300*clip((T-$fa)/$fd,0,1)"
    FXp="sin(PI*clip((T-$fa)/$fd,0,1))*(0.8*exp(-pow((Y-70)/1.8,2))*exp(-abs(X-($fx))/70)+0.9*exp(-(pow(X-($fx),2)+pow(Y-70,2))/60)+0.25*exp(-(pow(X-($fx),2)+pow(Y-70,2))/900))"
  fi
  set -- $LC; local lr=$1 lg=$2 lb=$3; set -- $FC; local fr=$1 fg=$2 fb=$3
  local light="color=c=black:s=180x320:r=30:d=$D,format=gbrp,geq=r='min(255,255*(($LX)*$lr+($FXp)*$fr))':g='min(255,255*(($LX)*$lg+($FXp)*$fg))':b='min(255,255*(($LX)*$lb+($FXp)*$fb))',scale=720:1280:flags=bicubic,format=gbrp"

  local G="[0]crop=min(iw\,ih*9/16):min(ih\,iw*16/9),scale=2160:3840:flags=lanczos,setsar=1,format=gbrp,zoompan=$zp:d=$((NF*FR/30)):s=$BIG:fps=$FR"
  local extra=() mapin=""
  if [ -n "$DISP" ]; then
    local kind=${DISP%%:*} K=${DISP#*:}
    local mp=${out%.mp4}; depthmaps "$src" "$mp" || return 1
    extra=(-loop 1 -framerate 30 -t $D -i "$mp-$kind-x.png" -loop 1 -framerate 30 -t $D -i "$mp-$kind-y.png")
    G="$G[zz];[1]format=gray,eq=contrast='$K':eval=frame,format=gbrp[xm];[2]format=gray,eq=contrast='$K':eval=frame,format=gbrp[ym];[zz][xm][ym]displace=edge=smear,scale=768:1366:flags=bicubic"
  fi
  [ $FR -gt 30 ] && G="$G,tmix=frames=$((FR/30)),fps=30"
  if [ $tr = whip ]; then
    # three-panel canvas: mirror | frame | mirror; the window whips in from one mirror and settles with a slight overshoot
    local p="clip(t/0.42,0,1)" sx="0" ex="768"; [ $dir = L ] && sx=1536
    local eb="(1+1.9*pow($p-1,3)+0.9*pow($p-1,2))"
    G="$G,split[w1][w2];[w2]split[w3][w4];[w3]hflip[m1];[w4]hflip[m2];[m1][w1][m2]hstack=3,crop=768:1366:x='clip($sx+($ex-$sx)*$eb,0,1536)':y=0,sendcmd=c='$wb',gblur@wb=sigma=34:sigmaV=0"
  fi
  G="$G,rotate=a='$rot':c=black:bilinear=1,crop=720:1280,format=gbrp"
  G="$G,curves=all='$curve',${cb}eq=saturation=$sat,format=gbrp,split[g1][g2];[g2]scale=180:320,curves=all='0/0 0.7/0 1/1',gblur=sigma=5,scale=720:1280,format=gbrp[gl];[g1][gl]blend=all_mode=screen:all_opacity=$glow"
  [ -n "$ca" ] && G="$G,sendcmd=c='$ca',rgbashift@ca=rh=0:bh=0:edge=smear"
  G="$G,format=gbrp[v];$light[lt];[v][lt]blend=all_mode=screen,format=yuv420p"
  local flash="$fl1*exp(-t/0.07)"; [ "$fl2" != 0 ] && flash="$flash+$fl2*exp(-max(0,t-$ti)/0.06)*gte(t,$ti)"
  G="$G,eq=brightness='$flash':eval=frame,vignette=angle='0.6+0.07*sin(2*PI*t/3.2)':eval=frame,noise=c0s=$grain:c0f=t+u"
  ffmpeg -nostdin -v error -y -i "$src" "${extra[@]}" -filter_complex "$G" -frames:v $NF -r 30 -an -c:v libx264 -crf 22 -preset slow -pix_fmt yuv420p -movflags +faststart "$out"
}

depthmaps() { # builds the four displacement maps for one picture (smooth depth: lower and more detailed = nearer)
  local src=$1 M=$2
  ffmpeg -nostdin -v error -y -i "$src" -vf "crop=min(iw\,ih*9/16):min(ih\,iw*16/9),scale=192:342,format=gray,edgedetect=low=0.06:high=0.18,gblur=sigma=16,format=rgb24,normalize=smoothing=0,format=gray,geq=lum='255*clip(0.62*pow(Y/H,1.15)+0.38*p(X,Y)/255,0,1)',gblur=sigma=10,scale=1536:2732:flags=bicubic" -frames:v 1 "$M-depth.png" || return 1
  ffmpeg -nostdin -v error -y -i "$M-depth.png" -filter_complex "[0]format=gray,split=4[a][b][c][d];[a]geq=lum='128+120*(X-W/2)/(H/2)*p(X,Y)/255'[o1];[b]geq=lum='128+120*(Y-H/2)/(H/2)*p(X,Y)/255'[o2];[c]geq=lum='128+120*(X-W/2)/(H/2)*(1-p(X,Y)/255)'[o3];[d]geq=lum='128+120*(Y-H/2)/(H/2)*(1-p(X,Y)/255)'[o4]" \
    -map "[o1]" -frames:v 1 "$M-radial-near-x.png" -map "[o2]" -frames:v 1 "$M-radial-near-y.png" -map "[o3]" -frames:v 1 "$M-radial-far-x.png" -map "[o4]" -frames:v 1 "$M-radial-far-y.png" || return 1
  ffmpeg -nostdin -v error -y -i "$M-depth.png" -filter_complex "[0]format=gray,split[a][b];[a]geq=lum='128+70*(2*p(X,Y)/255-1)'[o1];[b]geq=lum='128'[o2]" -map "[o1]" -frames:v 1 "$M-lateral-x.png" -map "[o2]" -frames:v 1 "$M-lateral-y.png"
}

for id in "$@"; do
  spec=$GB/films/wave1/specs/${id#w1-}.json
  [ -s "$spec" ] || { echo "no spec $id"; continue; }
  O=${OUT:-$GB/art/sacred/$id/clips}; mkdir -p "$O"
  plan "$(cygpath -w "$spec")" | while read name tr dir dur fam; do
    n=${name##*-}
    [ -n "$ONLY" ] && [[ "$ONLY" != *",$n,"* ]] && continue
    src=$DL/$name.png
    [ -s "$src" ] || { echo "skip $name (no picture yet)"; continue; }
    C=$GB/art/sacred/$id/clips
    if is_runway "$C" "$name"; then echo "skip $name (runway)"; continue; fi
    if [ -z "$OUT" ]; then
      [ -s "$C/$name.mp4" ] && [ ! -e "$C/$name.slow.mp4" ] && cp -p "$C/$name.mp4" "$C/$name.slow.mp4"
    fi
    tmp=$TMP/$name.mp4
    if render "$src" "$tmp" $tr $dir $dur $fam; then
      if [ -z "$OUT" ] && is_runway "$C" "$name"; then echo "skip $name (runway arrived mid-render)"; rm -f "$tmp"; continue; fi
      mv -f "$tmp" "$O/$name.mp4" || { echo "FAIL $name (could not swap in)"; continue; }
      ffmpeg -nostdin -v error -y -ss 1.3 -i "$O/$name.mp4" -frames:v 1 -q:v 80 "$O/$name.webp"
      echo "fire $name $tr $dir ${dur}s $fam"
    else echo "FAIL $name $tr"; fi
  done
done
