/* Worker d'exécution du modèle local (WebLLM) : le calcul se fait hors du fil principal, l'interface reste fluide. */
import { WebWorkerMLCEngineHandler } from "./web-llm.js";
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => { handler.onmessage(msg); };
