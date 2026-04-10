# Participant Cards

Open `index.html` in a browser to use the flash-card site.

Participant records live in `data/participants.js`. Each record has:

```js
{
  id: "participant-slug",
  name: "Participant Name",
  title: "Participant title",
  bio: "Short bio.",
  photo: "assets/participant-slug.jpg"
}
```

Questions live in `data/questions.js`, keyed by participant `id`:

```js
window.QUESTIONS = {
  "participant-slug": "Your question for this person?"
};
```

When you send the questions later, send them as:

```text
Participant Name: Question text
Participant Name: Question text
```

The Google Slides deck was not publicly readable from this workspace. Share the deck with link access, export it as a PPTX into this folder, or send the participant list and photos, and the cards can be filled from the source material.
