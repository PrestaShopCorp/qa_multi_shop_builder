const LOCALE_STORAGE_KEY = "qa-shop-builder-locale";

const state = {
  locale: localStorage.getItem(LOCALE_STORAGE_KEY) || "fr",
  provider: "mytun",
  source: "image",
  imageType: "official",
  zipFileName: "",
};

const translations = {
  fr: {
    languageLabel: "Langue",
    pageTitle: "Creer une boutique",
    intro:
      "Un parcours simple, etape par etape, pour les personnes qui ne veulent pas passer par le terminal.",
    stepOneTitle: "Credentials",
    stepOneText: "Souhaitez-vous utiliser des credentials MyTun ou Ngrok ?",
    mytunLabel: "MyTun",
    ngrokLabel: "Ngrok",
    providerMytunDesc: "Utiliser les credentials MyTun deja sauvegardes.",
    providerNgrokDesc: "Utiliser les credentials Ngrok deja sauvegardes.",
    providerNotes: {
      mytun: "Les credentials MyTun sauvegardes sur cette machine seront reutilises.",
      ngrok: "Les credentials Ngrok sauvegardes sur cette machine seront reutilises.",
    },
    stepTwoTitle: "Installation",
    stepTwoText: "Souhaitez-vous installer la boutique via image Docker ou via ZIP ?",
    sourceImageLabel: "Image Docker",
    sourceImageDesc: "Utiliser les images et profils deja presents dans le projet.",
    sourceZipLabel: "ZIP",
    sourceZipDesc: "Utiliser un fichier prestashop.zip glisse dans l interface.",
    sourceNotes: {
      image: "Vous partez sur un lancement depuis image Docker.",
      zip: "Vous partez sur une installation depuis fichier ZIP.",
    },
    stepThreeTitles: {
      image: "Type de shop",
      zip: "Ajouter le ZIP",
    },
    stepThreeTexts: {
      image: "Si vous choisissez une image, selectionnez le type de shop a lancer.",
      zip: "Glissez un fichier prestashop.zip dans la zone ci-dessous.",
    },
    imageTypes: {
      official: {
        label: "Shop officiel",
        desc: "Flux standard base sur l image prestashop/prestashop.",
      },
      flashlight: {
        label: "Flashlight",
        desc: "Flux base sur l image prestashop/prestashop-flashlight.",
      },
      multistore: {
        label: "Multistore multi-instance",
        desc: "Deux shops et un reverse proxy pour les cas multi-instance.",
      },
    },
    zipDropIdleTitle: "Glisser votre prestashop.zip ici",
    zipDropIdleText: "ou cliquer pour choisir un fichier",
    zipDropReadyText: "Fichier pret pour la prochaine etape",
    zipNoteEmpty: "Aucun fichier selectionne pour le moment.",
    zipNoteSelected: (fileName) => `Fichier selectionne : ${fileName}`,
    summaryTitle: "Resume",
    summaryProviderLabel: "Credentials",
    summarySourceLabel: "Installation",
    summaryChoiceLabel: "Choix",
    summarySources: {
      image: "Image Docker",
      zip: "ZIP",
    },
    summaryLineImage: (providerLabel, imageLabel) =>
      `Vous allez utiliser ${providerLabel} avec une image Docker de type ${imageLabel}.`,
    summaryLineZip: (providerLabel) =>
      `Vous allez utiliser ${providerLabel} avec une installation depuis ZIP.`,
    primaryAction: "Creer la boutique",
    secondaryAction: "Enregistrer les credentials",
    footnote:
      "Prototype visuel uniquement. Aucun script n'est encore execute depuis cette interface.",
  },
  en: {
    languageLabel: "Language",
    pageTitle: "Create a shop",
    intro:
      "A simple step-by-step flow for people who do not want to use the terminal.",
    stepOneTitle: "Credentials",
    stepOneText: "Do you want to use MyTun or Ngrok credentials?",
    mytunLabel: "MyTun",
    ngrokLabel: "Ngrok",
    providerMytunDesc: "Use the MyTun credentials already saved on this machine.",
    providerNgrokDesc: "Use the Ngrok credentials already saved on this machine.",
    providerNotes: {
      mytun: "The saved MyTun credentials on this machine will be reused.",
      ngrok: "The saved Ngrok credentials on this machine will be reused.",
    },
    stepTwoTitle: "Installation",
    stepTwoText: "Do you want to install the shop from a Docker image or from a ZIP file?",
    sourceImageLabel: "Docker image",
    sourceImageDesc: "Use the images and profiles already available in the project.",
    sourceZipLabel: "ZIP",
    sourceZipDesc: "Use a prestashop.zip file dropped into the interface.",
    sourceNotes: {
      image: "You are starting from a Docker image.",
      zip: "You are starting from a ZIP file installation.",
    },
    stepThreeTitles: {
      image: "Shop type",
      zip: "Add the ZIP file",
    },
    stepThreeTexts: {
      image: "If you choose an image, select the type of shop to launch.",
      zip: "Drop a prestashop.zip file in the area below.",
    },
    imageTypes: {
      official: {
        label: "Official shop",
        desc: "Standard flow based on the prestashop/prestashop image.",
      },
      flashlight: {
        label: "Flashlight",
        desc: "Flow based on the prestashop/prestashop-flashlight image.",
      },
      multistore: {
        label: "Multi-store multi-instance",
        desc: "Two shops and a reverse proxy for multi-instance cases.",
      },
    },
    zipDropIdleTitle: "Drop your prestashop.zip here",
    zipDropIdleText: "or click to choose a file",
    zipDropReadyText: "File ready for the next step",
    zipNoteEmpty: "No file selected yet.",
    zipNoteSelected: (fileName) => `Selected file: ${fileName}`,
    summaryTitle: "Summary",
    summaryProviderLabel: "Credentials",
    summarySourceLabel: "Installation",
    summaryChoiceLabel: "Choice",
    summarySources: {
      image: "Docker image",
      zip: "ZIP",
    },
    summaryLineImage: (providerLabel, imageLabel) =>
      `You are about to use ${providerLabel} with a ${imageLabel} Docker image flow.`,
    summaryLineZip: (providerLabel) =>
      `You are about to use ${providerLabel} with a ZIP installation flow.`,
    primaryAction: "Create the shop",
    secondaryAction: "Save credentials",
    footnote:
      "Visual prototype only. No scripts are executed from this interface yet.",
  },
};

const providerButtons = [...document.querySelectorAll("[data-provider]")];
const sourceButtons = [...document.querySelectorAll("[data-source]")];
const imageTypeButtons = [...document.querySelectorAll("[data-image-type]")];
const localeButtons = [...document.querySelectorAll("[data-locale]")];

const elements = {
  languageLabel: document.getElementById("languageLabel"),
  pageTitle: document.getElementById("pageTitle"),
  introText: document.getElementById("introText"),
  stepOneTitle: document.getElementById("stepOneTitle"),
  stepOneText: document.getElementById("stepOneText"),
  providerMytunLabel: document.getElementById("providerMytunLabel"),
  providerMytunDesc: document.getElementById("providerMytunDesc"),
  providerNgrokLabel: document.getElementById("providerNgrokLabel"),
  providerNgrokDesc: document.getElementById("providerNgrokDesc"),
  providerNote: document.getElementById("providerNote"),
  stepTwoTitle: document.getElementById("stepTwoTitle"),
  stepTwoText: document.getElementById("stepTwoText"),
  sourceImageLabel: document.getElementById("sourceImageLabel"),
  sourceImageDesc: document.getElementById("sourceImageDesc"),
  sourceZipLabel: document.getElementById("sourceZipLabel"),
  sourceZipDesc: document.getElementById("sourceZipDesc"),
  sourceNote: document.getElementById("sourceNote"),
  stepThreeTitle: document.getElementById("stepThreeTitle"),
  stepThreeText: document.getElementById("stepThreeText"),
  imageOfficialLabel: document.getElementById("imageOfficialLabel"),
  imageOfficialDesc: document.getElementById("imageOfficialDesc"),
  imageFlashlightLabel: document.getElementById("imageFlashlightLabel"),
  imageFlashlightDesc: document.getElementById("imageFlashlightDesc"),
  imageMultistoreLabel: document.getElementById("imageMultistoreLabel"),
  imageMultistoreDesc: document.getElementById("imageMultistoreDesc"),
  imageOptions: document.getElementById("imageOptions"),
  zipPanel: document.getElementById("zipPanel"),
  zipInput: document.getElementById("zipInput"),
  dropzone: document.getElementById("dropzone"),
  dropzoneTitle: document.getElementById("dropzoneTitle"),
  dropzoneText: document.getElementById("dropzoneText"),
  zipNote: document.getElementById("zipNote"),
  summaryTitleHeading: document.getElementById("summaryTitleHeading"),
  summaryProviderLabel: document.getElementById("summaryProviderLabel"),
  summaryProvider: document.getElementById("summaryProvider"),
  summarySourceLabel: document.getElementById("summarySourceLabel"),
  summarySource: document.getElementById("summarySource"),
  summaryChoiceLabel: document.getElementById("summaryChoiceLabel"),
  summaryChoice: document.getElementById("summaryChoice"),
  summaryLine: document.getElementById("summaryLine"),
  primaryAction: document.getElementById("primaryAction"),
  secondaryAction: document.getElementById("secondaryAction"),
  footnoteText: document.getElementById("footnoteText"),
};

function getTranslation() {
  return translations[state.locale];
}

function getProviderLabel(localeCopy, providerKey) {
  return providerKey === "mytun" ? localeCopy.mytunLabel : localeCopy.ngrokLabel;
}

function render() {
  const copy = getTranslation();
  const providerLabel = getProviderLabel(copy, state.provider);
  const sourceLabel = copy.summarySources[state.source];
  const imageTypeLabel = copy.imageTypes[state.imageType].label;
  const isZip = state.source === "zip";
  const summaryChoice = isZip ? state.zipFileName || "prestashop.zip" : imageTypeLabel;

  document.documentElement.lang = state.locale;

  elements.languageLabel.textContent = copy.languageLabel;
  elements.pageTitle.textContent = copy.pageTitle;
  elements.introText.textContent = copy.intro;
  elements.stepOneTitle.textContent = copy.stepOneTitle;
  elements.stepOneText.textContent = copy.stepOneText;
  elements.providerMytunLabel.textContent = copy.mytunLabel;
  elements.providerMytunDesc.textContent = copy.providerMytunDesc;
  elements.providerNgrokLabel.textContent = copy.ngrokLabel;
  elements.providerNgrokDesc.textContent = copy.providerNgrokDesc;
  elements.providerNote.textContent = copy.providerNotes[state.provider];
  elements.stepTwoTitle.textContent = copy.stepTwoTitle;
  elements.stepTwoText.textContent = copy.stepTwoText;
  elements.sourceImageLabel.textContent = copy.sourceImageLabel;
  elements.sourceImageDesc.textContent = copy.sourceImageDesc;
  elements.sourceZipLabel.textContent = copy.sourceZipLabel;
  elements.sourceZipDesc.textContent = copy.sourceZipDesc;
  elements.sourceNote.textContent = copy.sourceNotes[state.source];
  elements.stepThreeTitle.textContent = copy.stepThreeTitles[state.source];
  elements.stepThreeText.textContent = copy.stepThreeTexts[state.source];
  elements.imageOfficialLabel.textContent = copy.imageTypes.official.label;
  elements.imageOfficialDesc.textContent = copy.imageTypes.official.desc;
  elements.imageFlashlightLabel.textContent = copy.imageTypes.flashlight.label;
  elements.imageFlashlightDesc.textContent = copy.imageTypes.flashlight.desc;
  elements.imageMultistoreLabel.textContent = copy.imageTypes.multistore.label;
  elements.imageMultistoreDesc.textContent = copy.imageTypes.multistore.desc;

  elements.imageOptions.classList.toggle("is-hidden", isZip);
  elements.zipPanel.classList.toggle("is-hidden", !isZip);

  if (isZip) {
    elements.dropzoneTitle.textContent = state.zipFileName || copy.zipDropIdleTitle;
    elements.dropzoneText.textContent = state.zipFileName ? copy.zipDropReadyText : copy.zipDropIdleText;
    elements.zipNote.textContent = state.zipFileName
      ? copy.zipNoteSelected(state.zipFileName)
      : copy.zipNoteEmpty;
  }

  elements.summaryTitleHeading.textContent = copy.summaryTitle;
  elements.summaryProviderLabel.textContent = copy.summaryProviderLabel;
  elements.summaryProvider.textContent = providerLabel;
  elements.summarySourceLabel.textContent = copy.summarySourceLabel;
  elements.summarySource.textContent = sourceLabel;
  elements.summaryChoiceLabel.textContent = copy.summaryChoiceLabel;
  elements.summaryChoice.textContent = summaryChoice;
  elements.summaryLine.textContent = isZip
    ? copy.summaryLineZip(providerLabel)
    : copy.summaryLineImage(providerLabel, imageTypeLabel);
  elements.primaryAction.textContent = copy.primaryAction;
  elements.secondaryAction.textContent = copy.secondaryAction;
  elements.footnoteText.textContent = copy.footnote;

  localeButtons.forEach((button) => {
    const isActive = button.dataset.locale === state.locale;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  providerButtons.forEach((button) => {
    const isActive = button.dataset.provider === state.provider;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  sourceButtons.forEach((button) => {
    const isActive = button.dataset.source === state.source;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  imageTypeButtons.forEach((button) => {
    const isActive = button.dataset.imageType === state.imageType;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

providerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.provider = button.dataset.provider;
    render();
  });
});

sourceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.source = button.dataset.source;
    render();
  });
});

imageTypeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.imageType = button.dataset.imageType;
    render();
  });
});

localeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.locale = button.dataset.locale;
    localStorage.setItem(LOCALE_STORAGE_KEY, state.locale);
    render();
  });
});

function applyZipFile(file) {
  if (!file) {
    return;
  }

  state.zipFileName = file.name;
  render();
}

elements.dropzone.addEventListener("click", () => {
  elements.zipInput.click();
});

elements.dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    elements.zipInput.click();
  }
});

elements.zipInput.addEventListener("change", (event) => {
  applyZipFile(event.target.files[0]);
});

elements.dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  elements.dropzone.classList.add("is-dragover");
});

elements.dropzone.addEventListener("dragleave", () => {
  elements.dropzone.classList.remove("is-dragover");
});

elements.dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  elements.dropzone.classList.remove("is-dragover");
  applyZipFile(event.dataTransfer.files[0]);
});

render();
