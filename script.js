// ⚡ Mets ton identifiant et ton access token Twitch ici
const clientId = "bxnw3quw14zii7a99fujyba9jbasza";
const accessToken = "s5sfzf83vdpht2fekl2n0x54485715";
const channelName = "Zelabe_"; // ⚡ ton pseudo Twitch

const clipDuration = 15000; // 15 secondes par clip
let clips = [];
let currentIndex = 0;

const player = document.getElementById("clip-player");
const titleEl = document.getElementById("title");
const creatorEl = document.getElementById("creator");
const dateEl = document.getElementById("date");
const viewsEl = document.getElementById("views");

// ✅ Récupère l’ID du broadcaster (ta chaîne) grâce au login
async function getBroadcasterId() {
  const res = await fetch(`https://api.twitch.tv/helix/users?login=${channelName}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Client-Id": clientId
    }
  });
  const data = await res.json();
  return data.data[0]?.id;
}

// ✅ Récupère les clips depuis l’API Twitch
async function fetchClips() {
  try {
    const broadcasterId = await getBroadcasterId();
    const res = await fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}&first=20`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Client-Id": clientId
      }
    });
    const data = await res.json();

    clips = data.data.map(c => ({
      slug: c.id,
      title: c.title,
      creator: c.creator_name,
      date: new Date(c.created_at).toLocaleDateString("fr-FR"),
      views: c.view_count
    }));

    if (clips.length > 0) {
      currentIndex = 0;
      startZapping();
    }
  } catch (err) {
    console.error("Erreur API Twitch :", err);
  }
}

// ✅ Affiche un clip dans l’iframe et met à jour les infos
function showClip(index) {
  const clip = clips[index];

  const parents = [
    "streamelements.com",
    "widgets.streamelements.com",
    "obs.streamelements.com",
    "localhost",
    window.location.hostname
  ];
  const parentParams = parents.map(p => `parent=${p}`).join("&");

  // Version clips
  const iframeSrc = `https://clips.twitch.tv/embed?clip=${clip.slug}&${parentParams}&autoplay=true&muted=true`;

  player.setAttribute("src", iframeSrc);
  player.setAttribute("allow", "autoplay; fullscreen");
  player.setAttribute("allowfullscreen", "true");

  titleEl.textContent = clip.title;
  creatorEl.textContent = "Créateur : " + clip.creator;
  dateEl.textContent = "Date : " + clip.date;
  viewsEl.textContent = "Vues : " + clip.views;
}


// ✅ Lance le zapping
function startZapping() {
  showClip(currentIndex);
  setInterval(() => {
    currentIndex = (currentIndex + 1) % clips.length;
    showClip(currentIndex);
  }, clipDuration);
}

// 🔁 Rafraîchit toutes les 5 minutes
setInterval(fetchClips, 300000);

// ⚡ Démarre
fetchClips();
