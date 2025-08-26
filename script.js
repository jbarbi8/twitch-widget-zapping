// ⚡ RENSEIGNE TES IDENTIFIANTS TWITCH
const clientId = "bxnw3quw14zii7a99fujyba9jbasza";
const accessToken = "s5sfzf83vdpht2fekl2n0x54485715";
const channelName = "Zelabe_";

let clips = [];
let currentIndex = 0;
let fallbackTimer = null;

const player   = document.getElementById("clip-player");
const titleEl  = document.getElementById("title");
const creatorEl= document.getElementById("creator");
const dateEl   = document.getElementById("date");
const viewsEl  = document.getElementById("views");

// Transforme un thumbnail Twitch en URL .mp4 robuste
function getClipMp4Url(thumbnailUrl) {
  if (!thumbnailUrl) return null;
  // remplace "-preview-...jpg" (avec ou sans query) par ".mp4"
  return thumbnailUrl.replace(/-preview-.*\.jpg(\?.*)?$/i, ".mp4");
}

// ID de la chaîne
async function getBroadcasterId() {
  const res = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(channelName)}`, {
    headers: { "Authorization": `Bearer ${accessToken}`, "Client-Id": clientId }
  });
  const data = await res.json();
  return data.data?.[0]?.id;
}

// Récupère les clips avec pagination
async function fetchClips(limit = 100) {
  try {
    const broadcasterId = await getBroadcasterId();
    let cursor = null;
    const all = [];

    do {
      const url = new URL("https://api.twitch.tv/helix/clips");
      url.searchParams.set("broadcaster_id", broadcasterId);
      url.searchParams.set("first", "20");
      if (cursor) url.searchParams.set("after", cursor);

      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${accessToken}`, "Client-Id": clientId }
      });
      const data = await res.json();
      all.push(...(data.data || []));
      cursor = data.pagination?.cursor || null;
    } while (cursor && all.length < limit);

    clips = all
      .map(c => ({
        slug: c.id,
        title: c.title,
        creator: c.creator_name,
        date: new Date(c.created_at).toLocaleDateString("fr-FR"),
        views: c.view_count,
        duration: Math.max(1000, (c.duration || 0) * 1000), // ms
        video_url: getClipMp4Url(c.thumbnail_url)
      }))
      .filter(c => !!c.video_url); // élimine les clips sans URL mp4

    if (clips.length) {
      currentIndex = 0;
      startZapping();
    } else {
      console.warn("Aucun clip exploitable trouvé.");
    }
  } catch (err) {
    console.error("Erreur API Twitch :", err);
  }
}

// Tente de jouer AVEC le son, sinon fallback muet + clic pour réactiver
async function playWithSoundOrFallback() {
  try {
    player.muted = false;
    await player.play(); // peut être bloqué par la politique autoplay
  } catch (e) {
    try {
      player.muted = true;
      await player.play();
      // premier clic n'importe où -> réactiver le son
      const unmute = () => {
        player.muted = false;
        player.volume = 1;
        player.play().catch(()=>{});
        window.removeEventListener("click", unmute);
      };
      window.addEventListener("click", unmute, { once: true });
    } catch (err) {
      console.warn("Impossible de lancer la lecture automatiquement :", err);
    }
  }
}

// Affiche un clip
function showClip(i) {
  const clip = clips[i];
  if (!clip) return;

  clearTimeout(fallbackTimer);
  player.onended = null;

  player.src = clip.video_url;
  player.currentTime = 0;

  titleEl.textContent   = clip.title;
  creatorEl.textContent = "Créateur : " + clip.creator;
  dateEl.textContent    = "Date : " + clip.date;
  viewsEl.textContent   = "Vues : " + clip.views;

  // Quand la vidéo se termine, on passe à la suivantee
  player.onended = () => {
    clearTimeout(fallbackTimer);
    currentIndex = (i + 1) % clips.length;
    showClip(currentIndex);
  };

  // Fallback au cas où 'ended' ne se déclenche pas
  fallbackTimer = setTimeout(() => {
    currentIndex = (i + 1) % clips.length;
    showClip(currentIndex);
  }, (clip.duration || 15000) + 1000);

  playWithSoundOrFallback();
}

// Lance le zapping
function startZapping() {
  showClip(currentIndex);
}

// GO
fetchClips(100);
