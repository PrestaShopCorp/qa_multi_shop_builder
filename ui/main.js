const LOCALE_STORAGE_KEY = "qa-shop-builder-locale";
const MYTUN_PREFIX = "prestashop";
const AUTO_SAVE_DELAY = 700;
const BUILD_POLL_INTERVAL = 2000;
const DEFAULT_SHOP_ID = 0;

const defaultCredentials = {
  mytun: {
    ACCOUNT_TAG: "",
    TUNNEL_SECRET: "",
    TUNNEL_ID: "",
    DOMAIN: "",
    PREFIX: MYTUN_PREFIX,
  },
  ngrok: {
    NGROK_AUTHTOKEN: "",
    PS_DOMAIN: "",
  },
};

const imageVersionOptions = Object.freeze({
  official: ["9.0.2-apache", "8.2.0-8.1", "1.7.8.8-7.4"],
  flashlight: [
    "nightly-nginx",
    "8.2.0-8.1-fpm-alpine",
    "1.7.8.8-7.4-fpm-alpine",
    "1.6.1.24-7.1-fpm-alpine",
  ],
  multistore: ["9.0.2-apache", "8.2.0-8.1", "1.7.8.8-7.4"],
});

const defaultImageSelections = {
  official: {
    preset: imageVersionOptions.official[0],
    custom: "",
  },
  flashlight: {
    preset: imageVersionOptions.flashlight[0],
    custom: "",
  },
  multistore: {
    shop1: {
      preset: imageVersionOptions.multistore[0],
      custom: "",
    },
    shop2: {
      preset: imageVersionOptions.multistore[1],
      custom: "",
    },
  },
};

const state = {
  locale: localStorage.getItem(LOCALE_STORAGE_KEY) || "fr",
  provider: "mytun",
  source: "image",
  imageType: "official",
  zipInstallMode: "auto",
  imageSelections: cloneImageSelections(defaultImageSelections),
  zipFile: null,
  zipFileName: "",
  credentials: cloneCredentials(defaultCredentials),
  feedback: null,
  build: null,
  builds: [],
};

let autoSaveTimer = null;
let lastSavedSignature = "";
let buildPollTimer = null;

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
    credentialsHelperText:
      "Les valeurs enregistrees seront reutilisees et les fichiers .env seront mis a jour automatiquement. La sauvegarde se fait automatiquement des que les champs obligatoires sont complets.",
    mytunAccountTagLabel: "Account tag",
    mytunTunnelSecretLabel: "Tunnel secret",
    mytunTunnelIdLabel: "Tunnel ID",
    mytunDomainLabel: "Domaine",
    mytunDerivedDomainNote: (domain) =>
      domain
        ? `Le domaine standard MyTun sera genere comme ${MYTUN_PREFIX}.${domain}.`
        : `Saisissez uniquement le domaine MyTun de base. Le prefixe ${MYTUN_PREFIX} est fixe automatiquement.`,
    ngrokAuthtokenLabel: "Authtoken",
    ngrokDomainLabel: "Domaine public",
    stepTwoTitle: "Installation",
    stepTwoText: "Souhaitez-vous installer la boutique via image Docker ou via ZIP ?",
    sourceImageLabel: "Image Docker",
    sourceImageDesc: "Utiliser les images et profils deja presents dans le projet.",
    sourceZipLabel: "ZIP",
    sourceZipDesc: "Utiliser un fichier prestashop.zip glisse dans l'interface.",
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
    zipInstallTitle: "Mode d'installation",
    zipInstallText:
      "Pour une installation ZIP, souhaitez-vous lancer le script automatiquement ou terminer l'installation a la main dans le navigateur ?",
    zipInstallModes: {
      auto: {
        label: "Installation automatique",
        desc: "La boutique s'installe et prepare le BO automatiquement.",
      },
      manual: {
        label: "Installation manuelle",
        desc: "Les fichiers sont prepares, puis vous terminez l'installation depuis l'assistant PrestaShop dans le navigateur.",
      },
    },
    zipInstallNotes: {
      auto: "L'installation se fera automatiquement pendant le lancement du conteneur.",
      manual: "La boutique s'ouvrira sur l'assistant d'installation PrestaShop. Le BO ne sera pas encore disponible a ce stade.",
    },
    imageTypes: {
      official: {
        label: "Shop officiel",
        desc: "Flux standard base sur l'image prestashop/prestashop.",
      },
      flashlight: {
        label: "Flashlight",
        desc: "Flux base sur l'image prestashop/prestashop-flashlight.",
      },
      multistore: {
        label: "Multistore multi-instance",
        desc: "Deux shops et un reverse proxy pour les cas multi-instance.",
      },
    },
    stepFourTitle: "Version de l'image",
    stepFourTexts: {
      official: "Choisissez la version de PrestaShop a utiliser pour l'image officielle.",
      flashlight: "Choisissez la version de PrestaShop a utiliser pour flashlight.",
      multistore: "Choisissez la version de chaque shop pour le mode multi-instance.",
    },
    imageVersionLabels: {
      official: "Image officielle",
      flashlight: "Image flashlight",
      multistore: "Versions des deux shops",
      multistoreShop1: "Shop 1",
      multistoreShop2: "Shop 2",
    },
    imageManualLabels: {
      official: "Version manuelle",
      flashlight: "Version manuelle",
      multistoreShop1: "Version manuelle shop 1",
      multistoreShop2: "Version manuelle shop 2",
    },
    imageManualNotes: {
      default: "Si vous remplissez ce champ, il remplace la selection ci-dessus.",
      multistore: "Chaque champ manuel remplace la selection de preset du shop correspondant.",
    },
    zipDropIdleTitle: "Glisser votre prestashop.zip ici",
    zipDropIdleText: "ou cliquer pour choisir un fichier",
    zipDropReadyText: "Fichier pret pour la prochaine etape",
    zipNoteEmpty: "Aucun fichier selectionne pour le moment.",
    zipNoteSelected: (fileName, selectedAt) =>
      selectedAt ? `Fichier selectionne : ${fileName} • ${selectedAt}` : `Fichier selectionne : ${fileName}`,
    zipExecutionNotes: {
      auto: "Pour l'instant, le lancement ZIP utilise le prestashop.zip deja present dans le dossier du flow.",
      manual: "Pour l'instant, le lancement ZIP utilise le prestashop.zip deja present dans le dossier du flow et vous laissera terminer l'installation a la main.",
    },
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
    summaryLineZip: (providerLabel, installModeLabel) =>
      `Vous allez utiliser ${providerLabel} avec une installation depuis ZIP en mode ${installModeLabel.toLowerCase()}.`,
    primaryAction: "Creer la boutique",
    tertiaryAction: "Arreter la boutique",
    secondaryAction: "Enregistrer les credentials",
    additionalShopAction: "Creer un autre shop",
    footnote:
      "Les credentials et le lancement des scripts sont maintenant disponibles depuis cette interface.",
    validationErrors: {
      mytun: "Veuillez renseigner tous les champs MyTun avant d'enregistrer.",
      ngrok: "Veuillez renseigner tous les champs Ngrok avant d'enregistrer.",
      officialImage: "Veuillez choisir une version pour l'image officielle.",
      flashlightImage: "Veuillez choisir une version pour flashlight.",
      multistoreImages: "Veuillez choisir une version pour les deux shops du multi-instance.",
    },
    saveSuccess: (count) =>
      `Credentials sauvegardes. ${count} fichier(s) .env ont ete mis a jour automatiquement.`,
    autoSaveSuccess: (count) =>
      `Credentials sauvegardes automatiquement. ${count} fichier(s) .env ont ete mis a jour.`,
    saveError:
      "Impossible d enregistrer les credentials. Verifiez que le serveur UI est bien lance avec npm start dans le dossier ui.",
    loadError:
      "Impossible de charger les credentials locaux. Lancez npm start dans le dossier ui puis rechargez la page.",
    buildPending: (count) =>
      `Credentials sauvegardes. ${count} fichier(s) .env ont ete mis a jour. Le lancement du build sera branche a l'etape suivante.`,
    primaryActionRunning: "Lancement en cours...",
    tertiaryActionRunning: "Arret en cours...",
    buildPanelTitle: "Execution",
    buildPanelTitleForShop: (shopId) => `Execution • Shop ${shopId}`,
    stopSpecificShopAction: "Arreter cette shop",
    buildStatusLabels: {
      idle: "Pret",
      running: "En cours",
      succeeded: "Termine",
      failed: "Erreur",
    },
    buildMetaIdle: "Aucun lancement en cours pour le moment.",
    buildMeta: (command, workdir) => `Commande: ${command} • Dossier: ${workdir}`,
    buildLogEmpty: "Les logs apparaitront ici des que le script demarre.",
    accessPanelTitle: "Acces",
    accessPanelEmpty:
      "Les liens d'acces apparaitront ici une fois la boutique lancee.",
    accessLinkLabels: {
      fo: "FO",
      bo: "BO",
      install: "Installation",
      shop1Fo: "Shop 1 FO",
      shop1Bo: "Shop 1 BO",
      shop2Fo: "Shop 2 FO",
      shop2Bo: "Shop 2 BO",
    },
    buildStartSuccess: (command) => `Lancement demarre: ${command}`,
    stopStartSuccess: (command) => `Arret demarre: ${command}`,
    buildStartError:
      "Impossible de lancer la boutique depuis l'interface.",
    stopStartError:
      "Impossible d'arreter la boutique depuis l'interface.",
    buildAlreadyRunning:
      "Un lancement est deja en cours. Consultez les logs ci-dessous.",
    buildMissingZip:
      "Aucun prestashop.zip n'a ete trouve pour ce flow ZIP.",
    zipUploadError:
      "Impossible d'envoyer le ZIP selectionne vers le flow cible.",
    buildLoadError:
      "Impossible de recuperer l'etat du lancement en cours.",
    buildCompletedSuccess: "La commande s'est terminee avec succes.",
    stopCompletedSuccess: "La commande d'arret s'est terminee avec succes.",
    buildCompletedError: (code) =>
      code || code === 0
        ? `La commande a echoue avec le code ${code}.`
        : "La commande a echoue.",
    stopCompletedError: (code) =>
      code || code === 0
        ? `La commande d'arret a echoue avec le code ${code}.`
        : "La commande d'arret a echoue.",
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
    providerMytunDesc: "Use the MyTun credentials already saved.",
    providerNgrokDesc: "Use the Ngrok credentials already saved.",
    providerNotes: {
      mytun: "The saved MyTun credentials on this machine will be reused.",
      ngrok: "The saved Ngrok credentials on this machine will be reused.",
    },
    credentialsHelperText:
      "Saved values will be reused and the .env files will be updated automatically. Auto-save starts as soon as the required fields are complete.",
    mytunAccountTagLabel: "Account tag",
    mytunTunnelSecretLabel: "Tunnel secret",
    mytunTunnelIdLabel: "Tunnel ID",
    mytunDomainLabel: "Domain",
    mytunDerivedDomainNote: (domain) =>
      domain
        ? `The standard MyTun domain will be generated as ${MYTUN_PREFIX}.${domain}.`
        : `Enter only the base MyTun domain. The ${MYTUN_PREFIX} prefix is fixed automatically.`,
    ngrokAuthtokenLabel: "Authtoken",
    ngrokDomainLabel: "Public domain",
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
    zipInstallTitle: "Installation mode",
    zipInstallText:
      "For a ZIP installation, do you want to run the script automatically or complete the installation manually in the browser?",
    zipInstallModes: {
      auto: {
        label: "Automatic installation",
        desc: "The shop installs itself and prepares the back office automatically.",
      },
      manual: {
        label: "Manual installation",
        desc: "The files are prepared first, then you finish the installation from the PrestaShop installer in the browser.",
      },
    },
    zipInstallNotes: {
      auto: "The installation will run automatically during container startup.",
      manual: "The shop will open on the PrestaShop installer. The back office will not be available yet at this stage.",
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
    stepFourTitle: "Image version",
    stepFourTexts: {
      official: "Choose the PrestaShop version to use for the official image.",
      flashlight: "Choose the PrestaShop version to use for flashlight.",
      multistore: "Choose the version of each shop for the multi-instance mode.",
    },
    imageVersionLabels: {
      official: "Official image",
      flashlight: "Flashlight image",
      multistore: "Both shop versions",
      multistoreShop1: "Shop 1",
      multistoreShop2: "Shop 2",
    },
    imageManualLabels: {
      official: "Manual version",
      flashlight: "Manual version",
      multistoreShop1: "Manual version for shop 1",
      multistoreShop2: "Manual version for shop 2",
    },
    imageManualNotes: {
      default: "If you fill this field, it overrides the preset selected above.",
      multistore: "Each manual field overrides the preset selected for the related shop.",
    },
    zipDropIdleTitle: "Drop your prestashop.zip here",
    zipDropIdleText: "or click to choose a file",
    zipDropReadyText: "File ready for the next step",
    zipNoteEmpty: "No file selected yet.",
    zipNoteSelected: (fileName, selectedAt) =>
      selectedAt ? `Selected file: ${fileName} • ${selectedAt}` : `Selected file: ${fileName}`,
    zipExecutionNotes: {
      auto: "For now, ZIP launch uses the prestashop.zip already present in the target flow folder.",
      manual: "For now, ZIP launch uses the prestashop.zip already present in the target flow folder and lets you finish the installation manually.",
    },
    summaryTitle: "Summary",
    summaryProviderLabel: "Credentials",
    summarySourceLabel: "Installation",
    summaryChoiceLabel: "Choice",
    summarySources: {
      image: "Docker image",
      zip: "ZIP",
    },
    summaryLineImage: (providerLabel, imageLabel) =>
      `You are about to use ${providerLabel} with the ${imageLabel} Docker image flow.`,
    summaryLineZip: (providerLabel, installModeLabel) =>
      `You are about to use ${providerLabel} with a ZIP installation flow in ${installModeLabel.toLowerCase()} mode.`,
    primaryAction: "Create the shop",
    tertiaryAction: "Stop the shop",
    secondaryAction: "Save credentials",
    additionalShopAction: "Create another shop",
    footnote:
      "Credentials saving and script launch are now available from this interface.",
    validationErrors: {
      mytun: "Please fill in all MyTun fields before saving.",
      ngrok: "Please fill in all Ngrok fields before saving.",
      officialImage: "Please choose a version for the official image.",
      flashlightImage: "Please choose a version for flashlight.",
      multistoreImages: "Please choose a version for both multi-instance shops.",
    },
    saveSuccess: (count) =>
      `Credentials saved. ${count} .env file(s) were updated automatically.`,
    autoSaveSuccess: (count) =>
      `Credentials saved automatically. ${count} .env file(s) were updated.`,
    saveError:
      "Unable to save credentials. Make sure the UI server is running with npm start inside the ui folder.",
    loadError:
      "Unable to load local credentials. Start npm start inside the ui folder and reload the page.",
    buildPending: (count) =>
      `Credentials saved. ${count} .env file(s) were updated. The build launch will be wired in the next step.`,
    primaryActionRunning: "Launching...",
    tertiaryActionRunning: "Stopping...",
    buildPanelTitle: "Execution",
    buildPanelTitleForShop: (shopId) => `Execution • Shop ${shopId}`,
    stopSpecificShopAction: "Stop this shop",
    buildStatusLabels: {
      idle: "Ready",
      running: "Running",
      succeeded: "Done",
      failed: "Error",
    },
    buildMetaIdle: "No launch is running right now.",
    buildMeta: (command, workdir) => `Command: ${command} • Folder: ${workdir}`,
    buildLogEmpty: "Logs will appear here as soon as the script starts.",
    accessPanelTitle: "Access",
    accessPanelEmpty:
      "Access links will appear here once the shop has been launched.",
    accessLinkLabels: {
      fo: "FO",
      bo: "BO",
      install: "Install",
      shop1Fo: "Shop 1 FO",
      shop1Bo: "Shop 1 BO",
      shop2Fo: "Shop 2 FO",
      shop2Bo: "Shop 2 BO",
    },
    buildStartSuccess: (command) => `Launch started: ${command}`,
    stopStartSuccess: (command) => `Stop started: ${command}`,
    buildStartError:
      "Unable to launch the shop from the interface.",
    stopStartError:
      "Unable to stop the shop from the interface.",
    buildAlreadyRunning:
      "A build is already running. Check the logs below.",
    buildMissingZip:
      "No prestashop.zip was found for this ZIP flow.",
    zipUploadError:
      "Unable to upload the selected ZIP to the target flow.",
    buildLoadError:
      "Unable to retrieve the current build status.",
    buildCompletedSuccess: "The command finished successfully.",
    stopCompletedSuccess: "The stop command finished successfully.",
    buildCompletedError: (code) =>
      code || code === 0
        ? `The command failed with exit code ${code}.`
        : "The command failed.",
    stopCompletedError: (code) =>
      code || code === 0
        ? `The stop command failed with exit code ${code}.`
        : "The stop command failed.",
  },
};

const providerButtons = [...document.querySelectorAll("[data-provider]")];
const sourceButtons = [...document.querySelectorAll("[data-source]")];
const imageTypeButtons = [...document.querySelectorAll("[data-image-type]")];
const zipInstallButtons = [...document.querySelectorAll("[data-zip-install-mode]")];
const versionButtons = [...document.querySelectorAll("[data-version-scope]")];
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
  mytunCredentialsForm: document.getElementById("mytunCredentialsForm"),
  ngrokCredentialsForm: document.getElementById("ngrokCredentialsForm"),
  credentialsHelperText: document.getElementById("credentialsHelperText"),
  mytunAccountTagLabel: document.getElementById("mytunAccountTagLabel"),
  mytunTunnelSecretLabel: document.getElementById("mytunTunnelSecretLabel"),
  mytunTunnelIdLabel: document.getElementById("mytunTunnelIdLabel"),
  mytunDomainLabel: document.getElementById("mytunDomainLabel"),
  mytunDerivedDomainNote: document.getElementById("mytunDerivedDomainNote"),
  mytunAccountTagInput: document.getElementById("mytunAccountTagInput"),
  mytunTunnelSecretInput: document.getElementById("mytunTunnelSecretInput"),
  mytunTunnelIdInput: document.getElementById("mytunTunnelIdInput"),
  mytunDomainInput: document.getElementById("mytunDomainInput"),
  ngrokAuthtokenLabel: document.getElementById("ngrokAuthtokenLabel"),
  ngrokDomainLabel: document.getElementById("ngrokDomainLabel"),
  ngrokAuthtokenInput: document.getElementById("ngrokAuthtokenInput"),
  ngrokDomainInput: document.getElementById("ngrokDomainInput"),
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
  zipInstallStep: document.getElementById("zipInstallStep"),
  zipInstallTitle: document.getElementById("zipInstallTitle"),
  zipInstallText: document.getElementById("zipInstallText"),
  zipInstallAutoLabel: document.getElementById("zipInstallAutoLabel"),
  zipInstallAutoDesc: document.getElementById("zipInstallAutoDesc"),
  zipInstallManualLabel: document.getElementById("zipInstallManualLabel"),
  zipInstallManualDesc: document.getElementById("zipInstallManualDesc"),
  zipInstallNote: document.getElementById("zipInstallNote"),
  imageVersionStep: document.getElementById("imageVersionStep"),
  stepFourTitle: document.getElementById("stepFourTitle"),
  stepFourText: document.getElementById("stepFourText"),
  officialVersionPanel: document.getElementById("officialVersionPanel"),
  officialVersionHeading: document.getElementById("officialVersionHeading"),
  officialCustomLabel: document.getElementById("officialCustomLabel"),
  officialCustomInput: document.getElementById("officialCustomInput"),
  officialManualNote: document.getElementById("officialManualNote"),
  flashlightVersionPanel: document.getElementById("flashlightVersionPanel"),
  flashlightVersionHeading: document.getElementById("flashlightVersionHeading"),
  flashlightCustomLabel: document.getElementById("flashlightCustomLabel"),
  flashlightCustomInput: document.getElementById("flashlightCustomInput"),
  flashlightManualNote: document.getElementById("flashlightManualNote"),
  multistoreVersionPanel: document.getElementById("multistoreVersionPanel"),
  multistoreVersionHeading: document.getElementById("multistoreVersionHeading"),
  multistoreShop1Heading: document.getElementById("multistoreShop1Heading"),
  multistoreShop2Heading: document.getElementById("multistoreShop2Heading"),
  multistoreShop1CustomLabel: document.getElementById("multistoreShop1CustomLabel"),
  multistoreShop1CustomInput: document.getElementById("multistoreShop1CustomInput"),
  multistoreShop2CustomLabel: document.getElementById("multistoreShop2CustomLabel"),
  multistoreShop2CustomInput: document.getElementById("multistoreShop2CustomInput"),
  multistoreManualNote: document.getElementById("multistoreManualNote"),
  zipPanel: document.getElementById("zipPanel"),
  zipInput: document.getElementById("zipInput"),
  dropzone: document.getElementById("dropzone"),
  dropzoneTitle: document.getElementById("dropzoneTitle"),
  dropzoneText: document.getElementById("dropzoneText"),
  zipNote: document.getElementById("zipNote"),
  zipExecutionNote: document.getElementById("zipExecutionNote"),
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
  tertiaryAction: document.getElementById("tertiaryAction"),
  additionalShopAction: document.getElementById("additionalShopAction"),
  feedbackBanner: document.getElementById("feedbackBanner"),
  buildPanels: document.getElementById("buildPanels"),
  footnoteText: document.getElementById("footnoteText"),
};

function cloneCredentials(source) {
  return JSON.parse(JSON.stringify(source));
}

function cloneImageSelections(source) {
  return JSON.parse(JSON.stringify(source));
}

function getSelectedImageTag(selection) {
  return selection.custom.trim() || selection.preset.trim();
}

function getResolvedImageSelections() {
  return {
    official: getSelectedImageTag(state.imageSelections.official),
    flashlight: getSelectedImageTag(state.imageSelections.flashlight),
    multistoreShop1: getSelectedImageTag(state.imageSelections.multistore.shop1),
    multistoreShop2: getSelectedImageTag(state.imageSelections.multistore.shop2),
  };
}

function getCurrentImageVersionLabel() {
  const selected = getResolvedImageSelections();

  if (state.imageType === "official") {
    return selected.official;
  }

  if (state.imageType === "flashlight") {
    return selected.flashlight;
  }

  return `Shop 1: ${selected.multistoreShop1} • Shop 2: ${selected.multistoreShop2}`;
}

function setImagePreset(scope, value) {
  if (scope === "official") {
    state.imageSelections.official.preset = value;
    state.imageSelections.official.custom = "";
    return;
  }

  if (scope === "flashlight") {
    state.imageSelections.flashlight.preset = value;
    state.imageSelections.flashlight.custom = "";
    return;
  }

  if (scope === "multistore-shop1") {
    state.imageSelections.multistore.shop1.preset = value;
    state.imageSelections.multistore.shop1.custom = "";
    return;
  }

  state.imageSelections.multistore.shop2.preset = value;
  state.imageSelections.multistore.shop2.custom = "";
}

function setImageCustomValue(scope, value) {
  if (scope === "official") {
    state.imageSelections.official.custom = value.trim();
    return;
  }

  if (scope === "flashlight") {
    state.imageSelections.flashlight.custom = value.trim();
    return;
  }

  if (scope === "multistore-shop1") {
    state.imageSelections.multistore.shop1.custom = value.trim();
    return;
  }

  state.imageSelections.multistore.shop2.custom = value.trim();
}

function getTranslation() {
  return translations[state.locale];
}

function formatZipSelectionDate(file) {
  if (!file?.lastModified) {
    return "";
  }

  return new Intl.DateTimeFormat(state.locale, {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(file.lastModified));
}

function getProviderLabel(copy, providerKey) {
  return providerKey === "mytun" ? copy.mytunLabel : copy.ngrokLabel;
}

function getZipInstallModeLabel(copy, mode) {
  return copy.zipInstallModes[mode]?.label || copy.zipInstallModes.auto.label;
}

function isMytunZipFlow() {
  return state.provider === "mytun" && state.source === "zip";
}

function isMytunZipBuild(build) {
  return build?.provider === "mytun" && build?.source === "zip";
}

function getNextAdditionalShopId() {
  const mytunZipBuilds = state.builds.filter(isMytunZipBuild);

  if (!mytunZipBuilds.length) {
    return 1;
  }

  return (
    mytunZipBuilds.reduce((maxShopId, build) => Math.max(maxShopId, build.shopId), DEFAULT_SHOP_ID) + 1
  );
}

function hasPrimaryMytunZipShop() {
  return state.builds.some(
    (build) => isMytunZipBuild(build) && build.shopId === DEFAULT_SHOP_ID && build.status === "succeeded"
  );
}

function mergeCredentials(credentials = {}) {
  return {
    mytun: {
      ACCOUNT_TAG: `${credentials.mytun?.ACCOUNT_TAG ?? ""}`,
      TUNNEL_SECRET: `${credentials.mytun?.TUNNEL_SECRET ?? ""}`,
      TUNNEL_ID: `${credentials.mytun?.TUNNEL_ID ?? ""}`,
      DOMAIN: `${credentials.mytun?.DOMAIN ?? ""}`,
      PREFIX: MYTUN_PREFIX,
    },
    ngrok: {
      NGROK_AUTHTOKEN: `${credentials.ngrok?.NGROK_AUTHTOKEN ?? ""}`,
      PS_DOMAIN: `${credentials.ngrok?.PS_DOMAIN ?? ""}`,
    },
  };
}

function getCredentialsSignature() {
  return JSON.stringify(state.credentials);
}

function normalizeBuild(build) {
  if (!build) {
    return null;
  }

  return {
    slotKey: build.slotKey || "",
    id: build.id,
    status: build.status || "idle",
    action: build.action === "down" ? "down" : "up",
    provider: build.provider || state.provider,
    source: build.source || state.source,
    imageType: build.imageType || state.imageType,
    installMode: build.installMode === "manual" ? "manual" : "auto",
    images: build.images || null,
    shopId: Number.isInteger(build.shopId) ? build.shopId : DEFAULT_SHOP_ID,
    command: build.command || "",
    workdir: build.workdir || "",
    logs: build.logs || "",
    exitCode: build.exitCode,
    errorMessage: build.errorMessage || "",
    startedAt: build.startedAt || "",
    endedAt: build.endedAt || "",
    updatedAt: build.updatedAt || "",
  };
}

function normalizeBuilds(builds = []) {
  return Array.isArray(builds) ? builds.map((build) => normalizeBuild(build)).filter(Boolean) : [];
}

function stopBuildPolling() {
  if (buildPollTimer) {
    window.clearTimeout(buildPollTimer);
    buildPollTimer = null;
  }
}

function scheduleBuildPolling() {
  stopBuildPolling();
  buildPollTimer = window.setTimeout(() => {
    loadBuildStatus({ silent: true });
  }, BUILD_POLL_INTERVAL);
}

function getBuildStatusLabel(copy, status) {
  return copy.buildStatusLabels[status] || copy.buildStatusLabels.idle;
}

function getBuildMeta(copy, build) {
  if (!build || !build.command) {
    return copy.buildMetaIdle;
  }

  return copy.buildMeta(build.command, build.workdir);
}

function getAccessBaseDomain(build) {
  if (build.provider === "ngrok") {
    return state.credentials.ngrok.PS_DOMAIN.trim();
  }

  const domain = state.credentials.mytun.DOMAIN.trim();
  if (!domain) {
    return "";
  }

  if (build.source === "zip") {
    return `${MYTUN_PREFIX}${build.shopId}.${domain}`;
  }

  return `${MYTUN_PREFIX}.${domain}`;
}

function getAccessEntries(copy, build) {
  if (!build || build.action !== "up" || build.status !== "succeeded") {
    return [];
  }

  const domain = getAccessBaseDomain(build);

  if (!domain) {
    return [];
  }

  const root = `https://${domain}`;

  if (build.source === "zip" && build.installMode === "manual") {
    return [{ label: copy.accessLinkLabels.install, href: `${root}/` }];
  }

  if (build.source === "image" && build.imageType === "multistore") {
    return [
      { label: copy.accessLinkLabels.shop1Fo, href: `${root}/shop1` },
      { label: copy.accessLinkLabels.shop1Bo, href: `${root}/shop1/admin-dev` },
      { label: copy.accessLinkLabels.shop2Fo, href: `${root}/shop2` },
      { label: copy.accessLinkLabels.shop2Bo, href: `${root}/shop2/admin-dev` },
    ];
  }

  return [
    { label: copy.accessLinkLabels.fo, href: `${root}/` },
    { label: copy.accessLinkLabels.bo, href: `${root}/admin-dev` },
  ];
}

function getBuildPanelTitle(copy, build) {
  if (isMytunZipBuild(build)) {
    return copy.buildPanelTitleForShop(build.shopId);
  }

  return copy.buildPanelTitle;
}

function isBuildVisibleForCurrentSelection(build) {
  if (!build) {
    return false;
  }

  if (isMytunZipFlow()) {
    return isMytunZipBuild(build);
  }

  if (build.provider !== state.provider || build.source !== state.source) {
    return false;
  }

  if (state.source === "image") {
    return build.imageType === state.imageType;
  }

  return true;
}

function getVisibleBuilds() {
  const visibleBuilds = state.builds.filter(isBuildVisibleForCurrentSelection);

  if (state.build?.status === "running" && state.build && !visibleBuilds.some((build) => build.id === state.build.id)) {
    visibleBuilds.push(state.build);
  }

  if (isMytunZipFlow()) {
    return visibleBuilds.sort((left, right) => left.shopId - right.shopId);
  }

  return visibleBuilds.length ? [visibleBuilds[visibleBuilds.length - 1]] : [];
}

function scrollBuildLogToBottom(logElement) {
  if (!logElement) {
    return;
  }

  window.requestAnimationFrame(() => {
    logElement.scrollTop = logElement.scrollHeight;
  });
}

function renderBuildPanels() {
  const copy = getTranslation();
  const visibleBuilds = getVisibleBuilds();
  const builds = visibleBuilds.length ? visibleBuilds : [null];

  elements.buildPanels.replaceChildren();

  builds.forEach((build) => {
    const status = build?.status || "idle";
    const logs = build?.logs?.trim() ? build.logs : copy.buildLogEmpty;
    const panel = document.createElement("section");
    panel.className = "build-panel";

    const head = document.createElement("div");
    head.className = "build-panel-head";

    const title = document.createElement("h2");
    title.textContent = build ? getBuildPanelTitle(copy, build) : copy.buildPanelTitle;

    const headActions = document.createElement("div");
    headActions.className = "build-panel-head-actions";

    if (build && isMytunZipBuild(build) && build.action === "up" && build.status === "succeeded") {
      const stopButton = document.createElement("button");
      stopButton.type = "button";
      stopButton.className = "build-panel-action-button";
      stopButton.textContent = copy.stopSpecificShopAction;
      stopButton.disabled = state.build?.status === "running";
      stopButton.addEventListener("click", async () => {
        await launchBuild("down", {
          provider: build.provider,
          source: build.source,
          imageType: build.imageType,
          installMode: build.installMode,
          shopId: build.shopId,
        });
      });
      headActions.append(stopButton);
    }

    const badge = document.createElement("span");
    badge.className = `build-status-badge is-${status}`;
    badge.textContent = getBuildStatusLabel(copy, status);
    headActions.append(badge);

    head.append(title, headActions);

    const meta = document.createElement("p");
    meta.className = "build-panel-meta";
    meta.textContent = getBuildMeta(copy, build);

    const log = document.createElement("pre");
    log.className = "build-log";
    log.textContent = logs;

    const accessPanel = document.createElement("div");
    accessPanel.className = "access-panel";

    const accessPanelHead = document.createElement("div");
    accessPanelHead.className = "access-panel-head";

    const accessTitle = document.createElement("h3");
    accessTitle.textContent = copy.accessPanelTitle;
    accessPanelHead.append(accessTitle);

    const accessNote = document.createElement("p");
    accessNote.className = "access-panel-note";

    const accessLinks = document.createElement("div");
    accessLinks.className = "access-links";

    const entries = getAccessEntries(copy, build);
    accessNote.textContent = copy.accessPanelEmpty;
    accessNote.classList.toggle("is-hidden", entries.length > 0);

    entries.forEach((entry) => {
      const link = document.createElement("a");
      link.className = "access-link-card";
      link.href = entry.href;
      link.target = "_blank";
      link.rel = "noreferrer";

      const label = document.createElement("span");
      label.textContent = entry.label;

      const value = document.createElement("strong");
      value.textContent = entry.href;

      link.append(label, value);
      accessLinks.append(link);
    });

    accessPanel.append(accessPanelHead, accessNote, accessLinks);
    panel.append(head, meta, log, accessPanel);
    elements.buildPanels.append(panel);
    scrollBuildLogToBottom(log);
  });
}

function applyBuildState(build, builds = [], options = {}) {
  const previousStatus = state.build?.status || "idle";
  state.build = normalizeBuild(build);
  state.builds = normalizeBuilds(builds);

  if (state.build?.status === "running") {
    scheduleBuildPolling();
  } else {
    stopBuildPolling();
  }

  if (!options.silent && previousStatus === "running" && state.build?.status === "succeeded") {
    setFeedback(
      "success",
      state.build?.action === "down"
        ? getTranslation().stopCompletedSuccess
        : getTranslation().buildCompletedSuccess
    );
  }

  if (!options.silent && previousStatus === "running" && state.build?.status === "failed") {
    setFeedback(
      "error",
      state.build?.action === "down"
        ? getTranslation().stopCompletedError(state.build.exitCode)
        : getTranslation().buildCompletedError(state.build.exitCode)
    );
  }
}

function setFeedback(type, message) {
  state.feedback = { type, message };
  renderFeedback();
}

function clearFeedback() {
  state.feedback = null;
  renderFeedback();
}

function renderFeedback() {
  if (!state.feedback) {
    elements.feedbackBanner.classList.add("is-hidden");
    elements.feedbackBanner.classList.remove("is-success", "is-error");
    elements.feedbackBanner.textContent = "";
    return;
  }

  elements.feedbackBanner.classList.remove("is-hidden");
  elements.feedbackBanner.classList.toggle("is-success", state.feedback.type === "success");
  elements.feedbackBanner.classList.toggle("is-error", state.feedback.type === "error");
  elements.feedbackBanner.textContent = state.feedback.message;
}

function updateCredentialsFromInputs() {
  state.credentials.mytun.ACCOUNT_TAG = elements.mytunAccountTagInput.value.trim();
  state.credentials.mytun.TUNNEL_SECRET = elements.mytunTunnelSecretInput.value.trim();
  state.credentials.mytun.TUNNEL_ID = elements.mytunTunnelIdInput.value.trim();
  state.credentials.mytun.DOMAIN = elements.mytunDomainInput.value.trim();
  state.credentials.mytun.PREFIX = MYTUN_PREFIX;
  state.credentials.ngrok.NGROK_AUTHTOKEN = elements.ngrokAuthtokenInput.value.trim();
  state.credentials.ngrok.PS_DOMAIN = elements.ngrokDomainInput.value.trim();
}

function applyCredentialsToInputs() {
  elements.mytunAccountTagInput.value = state.credentials.mytun.ACCOUNT_TAG;
  elements.mytunTunnelSecretInput.value = state.credentials.mytun.TUNNEL_SECRET;
  elements.mytunTunnelIdInput.value = state.credentials.mytun.TUNNEL_ID;
  elements.mytunDomainInput.value = state.credentials.mytun.DOMAIN;
  elements.ngrokAuthtokenInput.value = state.credentials.ngrok.NGROK_AUTHTOKEN;
  elements.ngrokDomainInput.value = state.credentials.ngrok.PS_DOMAIN;
}

function validateActiveProvider() {
  updateCredentialsFromInputs();
  const copy = getTranslation();

  if (state.provider === "mytun") {
    const values = state.credentials.mytun;
    if (!values.ACCOUNT_TAG || !values.TUNNEL_SECRET || !values.TUNNEL_ID || !values.DOMAIN) {
      return copy.validationErrors.mytun;
    }
  }

  if (state.provider === "ngrok") {
    const values = state.credentials.ngrok;
    if (!values.NGROK_AUTHTOKEN || !values.PS_DOMAIN) {
      return copy.validationErrors.ngrok;
    }
  }

  return "";
}

function validateImageSelection() {
  const copy = getTranslation();
  const selected = getResolvedImageSelections();

  if (state.source !== "image") {
    return "";
  }

  if (state.imageType === "official" && !selected.official) {
    return copy.validationErrors.officialImage;
  }

  if (state.imageType === "flashlight" && !selected.flashlight) {
    return copy.validationErrors.flashlightImage;
  }

  if (state.imageType === "multistore" && (!selected.multistoreShop1 || !selected.multistoreShop2)) {
    return copy.validationErrors.multistoreImages;
  }

  return "";
}

function scheduleAutoSave() {
  if (autoSaveTimer) {
    window.clearTimeout(autoSaveTimer);
  }

  if (validateActiveProvider()) {
    return;
  }

  if (getCredentialsSignature() === lastSavedSignature) {
    return;
  }

  autoSaveTimer = window.setTimeout(() => {
    autoSaveTimer = null;
    saveCredentials({ auto: true });
  }, AUTO_SAVE_DELAY);
}

function render() {
  const copy = getTranslation();
  const providerLabel = getProviderLabel(copy, state.provider);
  const sourceLabel = copy.summarySources[state.source];
  const imageTypeLabel = copy.imageTypes[state.imageType].label;
  const zipInstallModeLabel = getZipInstallModeLabel(copy, state.zipInstallMode);
  const isZip = state.source === "zip";
  const isImageSource = state.source === "image";
  const isMytun = state.provider === "mytun";
  const isMytunZip = isMytunZipFlow();
  const isBuildRunning = state.build?.status === "running";
  const canCreateAdditionalShop = isMytunZip && hasPrimaryMytunZipShop() && !isBuildRunning;
  const summaryChoice = isZip
    ? `${state.zipFileName || "prestashop.zip"} • ${zipInstallModeLabel}`
    : `${imageTypeLabel} • ${getCurrentImageVersionLabel()}`;

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
  elements.credentialsHelperText.textContent = copy.credentialsHelperText;
  elements.mytunAccountTagLabel.textContent = copy.mytunAccountTagLabel;
  elements.mytunTunnelSecretLabel.textContent = copy.mytunTunnelSecretLabel;
  elements.mytunTunnelIdLabel.textContent = copy.mytunTunnelIdLabel;
  elements.mytunDomainLabel.textContent = copy.mytunDomainLabel;
  elements.ngrokAuthtokenLabel.textContent = copy.ngrokAuthtokenLabel;
  elements.ngrokDomainLabel.textContent = copy.ngrokDomainLabel;
  elements.mytunDerivedDomainNote.textContent = copy.mytunDerivedDomainNote(state.credentials.mytun.DOMAIN);

  elements.mytunCredentialsForm.classList.toggle("is-hidden", !isMytun);
  elements.ngrokCredentialsForm.classList.toggle("is-hidden", isMytun);

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
  elements.zipInstallTitle.textContent = copy.zipInstallTitle;
  elements.zipInstallText.textContent = copy.zipInstallText;
  elements.zipInstallAutoLabel.textContent = copy.zipInstallModes.auto.label;
  elements.zipInstallAutoDesc.textContent = copy.zipInstallModes.auto.desc;
  elements.zipInstallManualLabel.textContent = copy.zipInstallModes.manual.label;
  elements.zipInstallManualDesc.textContent = copy.zipInstallModes.manual.desc;
  elements.zipInstallNote.textContent = copy.zipInstallNotes[state.zipInstallMode];
  elements.stepFourTitle.textContent = copy.stepFourTitle;
  elements.stepFourText.textContent = copy.stepFourTexts[state.imageType];
  elements.officialVersionHeading.textContent = copy.imageVersionLabels.official;
  elements.officialCustomLabel.textContent = copy.imageManualLabels.official;
  elements.officialManualNote.textContent = copy.imageManualNotes.default;
  elements.flashlightVersionHeading.textContent = copy.imageVersionLabels.flashlight;
  elements.flashlightCustomLabel.textContent = copy.imageManualLabels.flashlight;
  elements.flashlightManualNote.textContent = copy.imageManualNotes.default;
  elements.multistoreVersionHeading.textContent = copy.imageVersionLabels.multistore;
  elements.multistoreShop1Heading.textContent = copy.imageVersionLabels.multistoreShop1;
  elements.multistoreShop2Heading.textContent = copy.imageVersionLabels.multistoreShop2;
  elements.multistoreShop1CustomLabel.textContent = copy.imageManualLabels.multistoreShop1;
  elements.multistoreShop2CustomLabel.textContent = copy.imageManualLabels.multistoreShop2;
  elements.multistoreManualNote.textContent = copy.imageManualNotes.multistore;
  elements.officialCustomInput.value = state.imageSelections.official.custom;
  elements.flashlightCustomInput.value = state.imageSelections.flashlight.custom;
  elements.multistoreShop1CustomInput.value = state.imageSelections.multistore.shop1.custom;
  elements.multistoreShop2CustomInput.value = state.imageSelections.multistore.shop2.custom;

  elements.imageOptions.classList.toggle("is-hidden", isZip);
  elements.zipPanel.classList.toggle("is-hidden", !isZip);
  elements.zipInstallStep.classList.toggle("is-hidden", !isZip);
  elements.imageVersionStep.classList.toggle("is-hidden", !isImageSource);
  elements.officialVersionPanel.classList.toggle("is-hidden", !isImageSource || state.imageType !== "official");
  elements.flashlightVersionPanel.classList.toggle("is-hidden", !isImageSource || state.imageType !== "flashlight");
  elements.multistoreVersionPanel.classList.toggle("is-hidden", !isImageSource || state.imageType !== "multistore");

  if (isZip) {
    elements.dropzoneTitle.textContent = state.zipFileName || copy.zipDropIdleTitle;
    elements.dropzoneText.textContent = state.zipFileName ? copy.zipDropReadyText : copy.zipDropIdleText;
    elements.zipNote.textContent = state.zipFileName
      ? copy.zipNoteSelected(state.zipFileName, formatZipSelectionDate(state.zipFile))
      : copy.zipNoteEmpty;
    elements.zipExecutionNote.textContent = copy.zipExecutionNotes[state.zipInstallMode];
  }

  elements.summaryTitleHeading.textContent = copy.summaryTitle;
  elements.summaryProviderLabel.textContent = copy.summaryProviderLabel;
  elements.summaryProvider.textContent = providerLabel;
  elements.summarySourceLabel.textContent = copy.summarySourceLabel;
  elements.summarySource.textContent = sourceLabel;
  elements.summaryChoiceLabel.textContent = copy.summaryChoiceLabel;
  elements.summaryChoice.textContent = summaryChoice;
  elements.summaryLine.textContent = isZip
    ? copy.summaryLineZip(providerLabel, zipInstallModeLabel)
    : copy.summaryLineImage(providerLabel, imageTypeLabel);
  elements.primaryAction.textContent =
    isBuildRunning && state.build?.action !== "down" ? copy.primaryActionRunning : copy.primaryAction;
  elements.primaryAction.disabled = isBuildRunning;
  elements.secondaryAction.textContent = copy.secondaryAction;
  elements.tertiaryAction.textContent =
    isBuildRunning && state.build?.action === "down" ? copy.tertiaryActionRunning : copy.tertiaryAction;
  elements.tertiaryAction.disabled = isBuildRunning;
  elements.additionalShopAction.textContent = copy.additionalShopAction;
  elements.additionalShopAction.classList.toggle("is-hidden", !isMytunZip);
  elements.additionalShopAction.disabled = !canCreateAdditionalShop;
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

  zipInstallButtons.forEach((button) => {
    const isActive = button.dataset.zipInstallMode === state.zipInstallMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  versionButtons.forEach((button) => {
    const scope = button.dataset.versionScope;
    const value = button.dataset.versionValue;
    let isActive = false;

    if (scope === "official") {
      isActive = !state.imageSelections.official.custom && state.imageSelections.official.preset === value;
    } else if (scope === "flashlight") {
      isActive = !state.imageSelections.flashlight.custom && state.imageSelections.flashlight.preset === value;
    } else if (scope === "multistore-shop1") {
      isActive =
        !state.imageSelections.multistore.shop1.custom &&
        state.imageSelections.multistore.shop1.preset === value;
    } else if (scope === "multistore-shop2") {
      isActive =
        !state.imageSelections.multistore.shop2.custom &&
        state.imageSelections.multistore.shop2.preset === value;
    }

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  renderFeedback();
  renderBuildPanels();
}

async function loadCredentials() {
  try {
    const response = await fetch("/api/credentials");
    if (!response.ok) {
      throw new Error("Unable to load credentials");
    }

    const payload = await response.json();
    state.credentials = mergeCredentials(payload.credentials);
    applyCredentialsToInputs();
    lastSavedSignature = getCredentialsSignature();
    render();
  } catch (error) {
    setFeedback("error", getTranslation().loadError);
  }
}

async function loadBuildStatus(options = {}) {
  try {
    const response = await fetch("/api/build");
    if (!response.ok) {
      throw new Error("Unable to load build status");
    }

    const payload = await response.json();
    applyBuildState(payload.build, payload.builds, { silent: options.silent !== false });
    render();
  } catch (error) {
    stopBuildPolling();
    if (!options.silent) {
      setFeedback("error", getTranslation().buildLoadError);
    }
  }
}

async function uploadSelectedZipIfNeeded() {
  if (state.source !== "zip" || !state.zipFile) {
    return true;
  }

  try {
    const response = await fetch("/api/zip", {
      method: "POST",
      headers: {
        "X-Provider": state.provider,
        "Content-Type": state.zipFile.type || "application/octet-stream",
      },
      body: state.zipFile,
    });

    if (!response.ok) {
      throw new Error("Unable to upload selected ZIP");
    }

    return true;
  } catch (error) {
    setFeedback("error", getTranslation().zipUploadError);
    return false;
  }
}

function getBuildRequestPayload(action = "up", overrides = {}) {
  updateCredentialsFromInputs();
  const shopId = overrides.shopId ?? DEFAULT_SHOP_ID;

  return {
    credentials: state.credentials,
    build: {
      action,
      provider: overrides.provider ?? state.provider,
      source: overrides.source ?? state.source,
      imageType: overrides.imageType ?? state.imageType,
      installMode: overrides.installMode ?? state.zipInstallMode,
      images: getResolvedImageSelections(),
      shopId,
    },
  };
}

function getBuildErrorMessage(payload, statusCode, action = "up") {
  const copy = getTranslation();

  if (statusCode === 409) {
    return copy.buildAlreadyRunning;
  }

  if (payload?.error === "prestashop.zip is missing for the selected ZIP flow.") {
    return copy.buildMissingZip;
  }

  if (payload?.error === "MyTun credentials are incomplete for this build.") {
    return copy.validationErrors.mytun;
  }

  if (payload?.error === "Ngrok credentials are incomplete for this build.") {
    return copy.validationErrors.ngrok;
  }

  if (payload?.error === "Official image tag is missing for this build.") {
    return copy.validationErrors.officialImage;
  }

  if (payload?.error === "Flashlight image tag is missing for this build.") {
    return copy.validationErrors.flashlightImage;
  }

  if (payload?.error === "Multistore image tags are missing for this build.") {
    return copy.validationErrors.multistoreImages;
  }

  return payload?.error || (action === "down" ? copy.stopStartError : copy.buildStartError);
}

async function launchBuild(action = "up", overrides = {}) {
  const validationError =
    action === "up"
      ? validateActiveProvider() || validateImageSelection()
      : "";
  if (validationError) {
    setFeedback("error", validationError);
    return false;
  }

  if (action === "up") {
    const uploadSucceeded = await uploadSelectedZipIfNeeded();
    if (!uploadSucceeded) {
      return false;
    }
  }

  try {
    const response = await fetch("/api/build", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(getBuildRequestPayload(action, overrides)),
    });

    const payload = await response.json();

    if (!response.ok) {
      applyBuildState(payload.build, payload.builds, { silent: true });
      render();
      setFeedback("error", getBuildErrorMessage(payload, response.status, action));
      return false;
    }

    if (payload.credentials) {
      state.credentials = mergeCredentials(payload.credentials);
      applyCredentialsToInputs();
      lastSavedSignature = getCredentialsSignature();
    }

    applyBuildState(payload.build, payload.builds, { silent: true });
    render();
    setFeedback(
      "success",
      action === "down"
        ? getTranslation().stopStartSuccess(payload.build.command)
        : getTranslation().buildStartSuccess(payload.build.command)
    );
    return true;
  } catch (error) {
    setFeedback("error", action === "down" ? getTranslation().stopStartError : getTranslation().buildStartError);
    return false;
  }
}

async function saveCredentials(options = {}) {
  const validationError = validateActiveProvider();
  if (validationError) {
    if (!options.auto) {
      setFeedback("error", validationError);
    }
    return false;
  }

  const signatureBeforeSave = getCredentialsSignature();
  if (options.auto && signatureBeforeSave === lastSavedSignature) {
    return true;
  }

  try {
    const response = await fetch("/api/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credentials: state.credentials }),
    });

    if (!response.ok) {
      throw new Error("Unable to save credentials");
    }

    const payload = await response.json();
    state.credentials = mergeCredentials(payload.credentials);
    applyCredentialsToInputs();
    lastSavedSignature = getCredentialsSignature();

    const count = payload.updatedEnvFiles.length;
    setFeedback(
      "success",
      options.forBuild
        ? getTranslation().buildPending(count)
        : options.auto
          ? getTranslation().autoSaveSuccess(count)
          : getTranslation().saveSuccess(count)
    );
    render();
    return true;
  } catch (error) {
    setFeedback("error", getTranslation().saveError);
    return false;
  }
}

function applyZipFile(file) {
  if (!file) {
    return;
  }

  state.zipFile = file;
  state.zipFileName = file.name;
  render();
}

providerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.provider = button.dataset.provider;
    clearFeedback();
    render();
  });
});

sourceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.source = button.dataset.source;
    clearFeedback();
    render();
  });
});

imageTypeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.imageType = button.dataset.imageType;
    clearFeedback();
    render();
  });
});

zipInstallButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.zipInstallMode = button.dataset.zipInstallMode === "manual" ? "manual" : "auto";
    clearFeedback();
    render();
  });
});

versionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setImagePreset(button.dataset.versionScope, button.dataset.versionValue);
    clearFeedback();
    render();
  });
});

localeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.locale = button.dataset.locale;
    localStorage.setItem(LOCALE_STORAGE_KEY, state.locale);
    clearFeedback();
    render();
  });
});

[
  elements.mytunAccountTagInput,
  elements.mytunTunnelSecretInput,
  elements.mytunTunnelIdInput,
  elements.mytunDomainInput,
  elements.ngrokAuthtokenInput,
  elements.ngrokDomainInput,
].forEach((input) => {
  input.addEventListener("input", () => {
    updateCredentialsFromInputs();
    if (state.feedback?.type === "success") {
      clearFeedback();
    }
    render();
    scheduleAutoSave();
  });
});

[
  ["official", elements.officialCustomInput],
  ["flashlight", elements.flashlightCustomInput],
  ["multistore-shop1", elements.multistoreShop1CustomInput],
  ["multistore-shop2", elements.multistoreShop2CustomInput],
].forEach(([scope, input]) => {
  input.addEventListener("input", () => {
    setImageCustomValue(scope, input.value);
    clearFeedback();
    render();
  });
});

elements.secondaryAction.addEventListener("click", async () => {
  await saveCredentials();
});

elements.primaryAction.addEventListener("click", async () => {
  await launchBuild("up");
});

elements.tertiaryAction.addEventListener("click", async () => {
  await launchBuild("down");
});

elements.additionalShopAction.addEventListener("click", async () => {
  await launchBuild("up", { shopId: getNextAdditionalShopId() });
});

elements.dropzone.addEventListener("click", () => {
  elements.zipInput.value = "";
  elements.zipInput.click();
});

elements.dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    elements.zipInput.value = "";
    elements.zipInput.click();
  }
});

elements.zipInput.addEventListener("change", (event) => {
  applyZipFile(event.target.files[0]);
  event.target.value = "";
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

applyCredentialsToInputs();
render();
loadCredentials();
loadBuildStatus({ silent: true });
