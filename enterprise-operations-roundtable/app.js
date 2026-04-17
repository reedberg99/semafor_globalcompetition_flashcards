(function () {
  const PLACEHOLDER_PHOTO = "assets/photo-placeholder.svg";
  const STORAGE_KEY = "enterprise-operations-roundtable-spoken";
  const participants = Array.isArray(window.PARTICIPANTS) ? window.PARTICIPANTS : [];
  const questions = window.QUESTIONS && typeof window.QUESTIONS === "object" ? window.QUESTIONS : {};

  const state = {
    index: 0,
    filteredIds: participants.map((participant) => participant.id),
    flipped: false,
    spokenIds: loadSpokenIds(),
  };

  const elements = {
    counter: document.querySelector("#cardCounter"),
    spokenCounter: document.querySelector("#spokenCounter"),
    card: document.querySelector("#flashCard"),
    photo: document.querySelector("#participantPhoto"),
    name: document.querySelector("#participantName"),
    title: document.querySelector("#participantTitle"),
    bio: document.querySelector("#participantBio"),
    question: document.querySelector("#participantQuestion"),
    summary: document.querySelector("#screenReaderSummary"),
    list: document.querySelector("#participantList"),
    search: document.querySelector("#participantSearch"),
    prev: document.querySelector("#prevCard"),
    next: document.querySelector("#nextCard"),
    flip: document.querySelector("#flipButton"),
    shuffle: document.querySelector("#shuffleButton"),
    spoken: document.querySelector("#spokenButton"),
    reset: document.querySelector("#resetChecksButton"),
    frontSpokenBadge: document.querySelector("#frontSpokenBadge"),
  };

  function loadSpokenIds() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      return new Set();
    }
  }

  function persistSpokenIds() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(state.spokenIds)));
    } catch (error) {
      // Ignore storage issues and keep the UI working.
    }
  }

  function getVisibleParticipants() {
    const ids = new Set(state.filteredIds);
    return participants.filter((participant) => ids.has(participant.id));
  }

  function getActiveParticipant() {
    const visible = getVisibleParticipants();
    return visible[state.index] || visible[0] || null;
  }

  function getQuestion(participant) {
    return questions[participant.id] || participant.question || "Question to add.";
  }

  function isSpoken(participant) {
    return Boolean(participant && state.spokenIds.has(participant.id));
  }

  function setFlipped(flipped) {
    state.flipped = flipped;
    elements.card.classList.toggle("is-flipped", flipped);
    elements.card.setAttribute("aria-pressed", String(flipped));
  }

  function updateSpokenUi(participant) {
    const spokenCount = participants.filter((item) => state.spokenIds.has(item.id)).length;
    elements.spokenCounter.textContent = `${spokenCount} called on`;

    if (!participant) {
      elements.spoken.textContent = "Mark Called On";
      elements.frontSpokenBadge.hidden = true;
      return;
    }

    const spoken = isSpoken(participant);
    elements.spoken.textContent = spoken ? "Unmark Called On" : "Mark Called On";
    elements.frontSpokenBadge.hidden = !spoken;
  }

  function renderCard() {
    const visible = getVisibleParticipants();
    const participant = getActiveParticipant();

    if (!participant) {
      elements.counter.textContent = "0 of 0";
      elements.name.textContent = "Guest data needed";
      elements.title.textContent = "Add names, titles, bios, and photos in data/participants.js.";
      elements.bio.textContent = "Once the roundtable briefing is parsed, these cards can be filled in from it.";
      elements.question.textContent = "Questions will live in data/questions.js.";
      elements.summary.textContent = "Guest data needed.";
      elements.photo.src = PLACEHOLDER_PHOTO;
      elements.photo.alt = "";
      elements.prev.disabled = true;
      elements.next.disabled = true;
      elements.flip.disabled = true;
      elements.shuffle.disabled = true;
      elements.spoken.disabled = true;
      elements.reset.disabled = true;
      updateSpokenUi(null);
      renderList();
      return;
    }

    const question = getQuestion(participant);
    elements.counter.textContent = `${state.index + 1} of ${visible.length}`;
    elements.photo.src = participant.photo || PLACEHOLDER_PHOTO;
    elements.photo.alt = participant.name ? `${participant.name} photo` : "";
    elements.name.textContent = participant.name || "Name needed";
    elements.title.textContent = participant.title || "Title needed";
    elements.bio.textContent = participant.bio || "Short bio needed.";
    elements.question.textContent = question;
    elements.summary.textContent = `${participant.name || "Name needed"}. ${participant.title || "Title needed"}. ${participant.bio || "Short bio needed."} Question: ${question}`;
    elements.prev.disabled = visible.length <= 1;
    elements.next.disabled = visible.length <= 1;
    elements.flip.disabled = false;
    elements.shuffle.disabled = visible.length <= 1;
    elements.spoken.disabled = false;
    elements.reset.disabled = state.spokenIds.size === 0;
    updateSpokenUi(participant);
    renderList();
  }

  function renderList() {
    const active = getActiveParticipant();
    const visibleIds = new Set(state.filteredIds);
    const matches = participants.filter((participant) => visibleIds.has(participant.id));

    if (!participants.length) {
      elements.list.innerHTML = '<div class="empty-state">Add guest records in data/participants.js.</div>';
      return;
    }

    if (!matches.length) {
      elements.list.innerHTML = '<div class="empty-state">No matching guests.</div>';
      return;
    }

    elements.list.innerHTML = "";
    matches.forEach((participant, visibleIndex) => {
      const button = document.createElement("button");
      const spoken = isSpoken(participant);
      button.type = "button";
      button.className = `participant-option${active && active.id === participant.id ? " is-active" : ""}${spoken ? " is-spoken" : ""}`;
      button.setAttribute("aria-label", `${participant.name || "Guest"}${spoken ? ", already called on" : ""}`);
      button.title = `${participant.name || "Guest"}${participant.title ? ` - ${participant.title}` : ""}`;
      button.innerHTML = `<img src="${escapeHtml(participant.photo || PLACEHOLDER_PHOTO)}" alt="">`;
      button.addEventListener("click", () => {
        state.index = visibleIndex;
        setFlipped(false);
        renderCard();
      });
      elements.list.appendChild(button);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function move(direction) {
    const visible = getVisibleParticipants();
    if (!visible.length) {
      return;
    }
    state.index = (state.index + direction + visible.length) % visible.length;
    setFlipped(false);
    renderCard();
  }

  function searchParticipants(query) {
    const normalizedQuery = query.trim().toLowerCase();
    state.filteredIds = participants
      .filter((participant) => {
        const haystack = [
          participant.name,
          participant.title,
          participant.bio,
          getQuestion(participant),
        ].join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .map((participant) => participant.id);
    state.index = 0;
    setFlipped(false);
    renderCard();
  }

  function toggleSpoken() {
    const participant = getActiveParticipant();
    if (!participant) {
      return;
    }
    if (state.spokenIds.has(participant.id)) {
      state.spokenIds.delete(participant.id);
    } else {
      state.spokenIds.add(participant.id);
    }
    persistSpokenIds();
    renderCard();
  }

  elements.card.addEventListener("click", () => {
    if (!participants.length) {
      return;
    }
    setFlipped(!state.flipped);
  });

  elements.flip.addEventListener("click", () => {
    if (getActiveParticipant()) {
      setFlipped(!state.flipped);
    }
  });
  elements.prev.addEventListener("click", () => move(-1));
  elements.next.addEventListener("click", () => move(1));
  elements.search.addEventListener("input", (event) => searchParticipants(event.target.value));
  elements.spoken.addEventListener("click", toggleSpoken);
  elements.reset.addEventListener("click", () => {
    state.spokenIds.clear();
    persistSpokenIds();
    renderCard();
  });
  elements.photo.addEventListener("error", () => {
    if (elements.photo.src.includes(PLACEHOLDER_PHOTO)) {
      return;
    }
    elements.photo.src = PLACEHOLDER_PHOTO;
  });
  elements.shuffle.addEventListener("click", () => {
    const visible = getVisibleParticipants();
    if (visible.length <= 1) {
      return;
    }

    let nextIndex = state.index;
    while (nextIndex === state.index) {
      nextIndex = Math.floor(Math.random() * visible.length);
    }
    state.index = nextIndex;
    setFlipped(false);
    renderCard();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      move(-1);
    }
    if (event.key === "ArrowRight") {
      move(1);
    }
    if (event.key === " " && document.activeElement !== elements.search) {
      event.preventDefault();
      setFlipped(!state.flipped);
    }
  });

  renderCard();
})();
