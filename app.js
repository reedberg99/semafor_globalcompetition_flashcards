(function () {
  const PLACEHOLDER_PHOTO = "assets/photo-placeholder.svg";
  const participants = Array.isArray(window.PARTICIPANTS) ? window.PARTICIPANTS : [];
  const questions = window.QUESTIONS && typeof window.QUESTIONS === "object" ? window.QUESTIONS : {};

  const state = {
    index: 0,
    filteredIds: participants.map((participant) => participant.id),
    flipped: false,
  };

  const elements = {
    counter: document.querySelector("#cardCounter"),
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
  };

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

  function setFlipped(flipped) {
    state.flipped = flipped;
    elements.card.classList.toggle("is-flipped", flipped);
    elements.card.setAttribute("aria-pressed", String(flipped));
  }

  function renderCard() {
    const visible = getVisibleParticipants();
    const participant = getActiveParticipant();

    if (!participant) {
      elements.counter.textContent = "0 of 0";
      elements.name.textContent = "Participant data needed";
      elements.title.textContent = "Add names, titles, bios, and photos in data/participants.js.";
      elements.bio.textContent = "Once the deck is shared or exported, these cards can be filled in from it.";
      elements.question.textContent = "Questions will live in data/questions.js.";
      elements.summary.textContent = "Participant data needed.";
      elements.photo.src = PLACEHOLDER_PHOTO;
      elements.photo.alt = "";
      elements.prev.disabled = true;
      elements.next.disabled = true;
      elements.flip.disabled = true;
      elements.shuffle.disabled = true;
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
    renderList();
  }

  function renderList() {
    const active = getActiveParticipant();
    const visibleIds = new Set(state.filteredIds);
    const matches = participants.filter((participant) => visibleIds.has(participant.id));

    if (!participants.length) {
      elements.list.innerHTML = '<div class="empty-state">Add participant records in data/participants.js.</div>';
      return;
    }

    if (!matches.length) {
      elements.list.innerHTML = '<div class="empty-state">No matching participants.</div>';
      return;
    }

    elements.list.innerHTML = "";
    matches.forEach((participant, visibleIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `participant-option${active && active.id === participant.id ? " is-active" : ""}`;
      button.innerHTML = `<span>${escapeHtml(participant.name || "Name needed")}</span><small>${escapeHtml(participant.title || "Title needed")}</small>`;
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
