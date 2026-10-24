/* Man's Last Stand: interface translations (UI text only: tabs, buttons, labels, areas, difficulty). */
(function(){
const ROWS=[
// [English, Spanish, German, French]
["Forge","Forja","Schmiede","Forge"],
["Undead","No-muertos","Untote","Morts-vivants"],
["Expeditions","Expediciones","Expeditionen","Expéditions"],
["Storage","Almacén","Lager","Stockage"],
["Morgue","Morgue","Leichenhalle","Morgue"],
["Memoriam","Memorial","Gedenkstätte","Mémorial"],
["The Market","El Mercado","Der Markt","Le Marché"],
["Onslaught","Embestida","Ansturm","Assaut"],
["Settings","Ajustes","Einstellungen","Paramètres"],
["💾 Save / Load","💾 Guardar / Cargar","💾 Speichern / Laden","💾 Sauvegarder / Charger"],
["Save & Load","Guardar y cargar","Speichern & Laden","Sauvegarder et charger"],
["Export save","Exportar partida","Spielstand exportieren","Exporter la sauvegarde"],
["Import from file","Importar desde archivo","Aus Datei importieren","Importer depuis un fichier"],
["Copy code","Copiar código","Code kopieren","Copier le code"],
["Import pasted code","Importar código pegado","Eingefügten Code importieren","Importer le code collé"],
["The last laboratory. Raise the dead, send them out, and decide what is left of the world.","El último laboratorio. Levanta a los muertos, envíalos a la batalla y decide qué queda del mundo.","Das letzte Labor. Erwecke die Toten, schicke sie hinaus und entscheide, was von der Welt übrig bleibt.","Le dernier laboratoire. Relève les morts, envoie-les au combat et décide de ce qu'il reste du monde."],
["The last laboratory","El último laboratorio","Das letzte Labor","Le dernier laboratoire"],
["Will you survive the apocalypse, or join it?","¿Sobrevivirás al apocalipsis o te unirás a él?","Wirst du die Apokalypse überleben oder dich ihr anschließen?","Survivras-tu à l'apocalypse ou la rejoindras-tu ?"],
["📖 Read the opening","📖 Leer la introducción","📖 Einleitung lesen","📖 Lire l'introduction"],
["Name your undead","Nombra a tu no-muerto","Benenne deinen Untoten","Nomme ton mort-vivant"],
["Gender:","Género:","Geschlecht:","Genre :"],
["Male","Masculino","Männlich","Masculin"],
["Female","Femenino","Weiblich","Féminin"],
["Nonbinary","No binario","Nichtbinär","Non binaire"],
["Profession","Profesión","Beruf","Profession"],
["Professions","Profesiones","Berufe","Professions"],
["Body type","Tipo de cuerpo","Körpertyp","Type de corps"],
["Body types","Tipos de cuerpo","Körpertypen","Types de corps"],
["Forge Undead","Forjar no-muerto","Untoten schmieden","Forger un mort-vivant"],
["Your Undead","Tus no-muertos","Deine Untoten","Tes morts-vivants"],
["Skills","Habilidades","Fähigkeiten","Compétences"],
["Traits","Rasgos","Eigenschaften","Traits"],
["Stray","Callejero","Streuner","Errant"],
["Nobody","Nadie","Niemand","Personne"],
["Human Cadaver","Cadáver humano","Menschlicher Leichnam","Cadavre humain"],
["🐾 Animal professions","🐾 Profesiones animales","🐾 Tierberufe","🐾 Professions animales"],
["⚙ Auto equip","⚙ Equipar auto.","⚙ Auto-Ausrüsten","⚙ Équiper auto"],
["⬆ Auto upgrade","⬆ Mejorar auto.","⬆ Auto-Aufwerten","⬆ Amélioration auto"],
["Forge an undead first.","Forja primero un no-muerto.","Schmiede zuerst einen Untoten.","Forge d'abord un mort-vivant."],
["No undead yet.","Aún no hay no-muertos.","Noch keine Untoten.","Aucun mort-vivant pour l'instant."],
["Expedition location","Lugar de la expedición","Ort der Expedition","Lieu de l'expédition"],
["Expedition setup","Preparar expedición","Expedition vorbereiten","Préparation de l'expédition"],
["Choose party (up to 3)","Elige grupo (hasta 3)","Gruppe wählen (bis zu 3)","Choisis le groupe (jusqu'à 3)"],
["Clear party","Vaciar grupo","Gruppe leeren","Vider le groupe"],
["Your party","Tu grupo","Deine Gruppe","Ton groupe"],
["Enemies","Enemigos","Gegner","Ennemis"],
["Difficulty:","Dificultad:","Schwierigkeit:","Difficulté :"],
["Safe","Seguro","Sicher","Sûr"],
["Threatening","Amenazante","Bedrohlich","Menaçant"],
["Deadly","Mortal","Tödlich","Mortel"],
["Easy","Fácil","Leicht","Facile"],
["Normal","Normal","Normal","Normal"],
["Hard","Difícil","Schwer","Difficile"],
["Extreme","Extremo","Extrem","Extrême"],
["Length","Duración","Länge","Durée"],
["Area","Zona","Gebiet","Zone"],
["Squad","Escuadrón","Trupp","Escouade"],
["Select first 20","Elegir los primeros 20","Die ersten 20 wählen","Choisir les 20 premiers"],
["Clear squad","Vaciar escuadrón","Trupp leeren","Vider l'escouade"],
["⚔ Start Onslaught","⚔ Iniciar Embestida","⚔ Ansturm starten","⚔ Lancer l'Assaut"],
["⚔ Set off","⚔ Partir","⚔ Aufbrechen","⚔ Partir"],
["Begin","Comenzar","Beginnen","Commencer"],
["Retreat","Retirarse","Rückzug","Battre en retraite"],
["End turn","Terminar turno","Zug beenden","Fin du tour"],
["Auto: OFF","Auto: NO","Auto: AUS","Auto : NON"],
["Auto: ON","Auto: SÍ","Auto: AN","Auto : OUI"],
["Combat","Combate","Kampf","Combat"],
["Head","Cabeza","Kopf","Tête"],
["Chest","Pecho","Brust","Torse"],
["Arms","Brazos","Arme","Bras"],
["Legs","Piernas","Beine","Jambes"],
["Left arm","Brazo izquierdo","Linker Arm","Bras gauche"],
["Right arm","Brazo derecho","Rechter Arm","Bras droit"],
["Waves","Oleadas","Wellen","Vagues"],
["Endless (retreat to end)","Infinito (retírate para terminar)","Endlos (Rückzug zum Beenden)","Sans fin (retraite pour terminer)"],
["Enemies:","Enemigos:","Gegner:","Ennemis :"],
["Loot","Botín","Beute","Butin"],
["Wasteland","Yermo","Ödland","Terres désolées"],
["Mall","Centro comercial","Einkaufszentrum","Centre commercial"],
["Shelter","Refugio","Schutzbunker","Abri"],
["Military Base","Base militar","Militärbasis","Base militaire"],
["Base","Base","Basis","Base"],
["Lab","Laboratorio","Labor","Laboratoire"],
["Ghetto","Gueto","Ghetto","Ghetto"],
["Museum","Museo","Museum","Musée"],
["Police Station","Comisaría","Polizeirevier","Commissariat"],
["The Carnival","El Carnaval","Der Jahrmarkt","Le Carnaval"],
["Carnival","Carnaval","Jahrmarkt","Carnaval"],
["Hospital","Hospital","Krankenhaus","Hôpital"],
["Docks","Muelles","Hafen","Docks"],
["Mansion","Mansión","Villa","Manoir"],
["Casino","Casino","Casino","Casino"],
["Sewers","Alcantarillas","Kanalisation","Égouts"],
["Train Station","Estación de tren","Bahnhof","Gare"],
["Swamp","Pantano","Sumpf","Marais"],
["Buy","Comprar","Kaufen","Acheter"],
["Cancel","Cancelar","Abbrechen","Annuler"],
["How it works","Cómo funciona","So funktioniert es","Comment ça marche"],
["Morgue (specimen storage)","Morgue (almacén de especímenes)","Leichenhalle (Probenlager)","Morgue (stockage de spécimens)"],
["Morgue:","Morgue:","Leichenhalle:","Morgue :"],
["Storage:","Almacén:","Lager:","Stockage :"],
["Undead:","No-muertos:","Untote:","Morts-vivants :"],
["Expeditions:","Expediciones:","Expeditionen:","Expéditions :"],
["Forge:","Forja:","Schmiede:","Forge :"],
["Storage is empty. Win battles to find loot.","El almacén está vacío. Gana batallas para encontrar botín.","Das Lager ist leer. Gewinne Kämpfe, um Beute zu finden.","Le stockage est vide. Gagne des combats pour trouver du butin."],
["Nobody has died yet. The collection is complete, for now.","Nadie ha muerto todavía. La colección está completa, por ahora.","Noch ist niemand gestorben. Die Sammlung ist vorerst vollständig.","Personne n'est encore mort. La collection est complète, pour l'instant."],
["Undead lost on Threatening and Deadly expeditions end up here for good.","Los no-muertos perdidos en expediciones Amenazantes y Mortales terminan aquí para siempre.","Untote, die auf bedrohlichen und tödlichen Expeditionen verloren gehen, landen für immer hier.","Les morts-vivants perdus lors d'expéditions Menaçantes et Mortelles finissent ici pour de bon."],
["Undiscovered. Win fights to find specimens.","Sin descubrir. Gana combates para encontrar especímenes.","Unentdeckt. Gewinne Kämpfe, um Proben zu finden.","Non découvert. Gagne des combats pour trouver des spécimens."],
["check their stats, body, equipment and backstory.","consulta sus estadísticas, cuerpo, equipo e historia.","sieh dir Werte, Körper, Ausrüstung und Hintergrundgeschichte an.","consulte leurs statistiques, leur corps, leur équipement et leur histoire."],
["choose a profession and a body type, and raise an undead.","elige una profesión y un tipo de cuerpo, y levanta a un no-muerto.","wähle einen Beruf und einen Körpertyp und erwecke einen Untoten.","choisis une profession et un type de corps, et relève un mort-vivant."],
["equip, upgrade, scrap or gamble what you find.","equipa, mejora, desguaza o apuesta lo que encuentres.","rüste aus, werte auf, verschrotte oder verspiele, was du findest.","équipe, améliore, recycle ou mise ce que tu trouves."],
["send a party of up to 3 into the ruins for loot and specimens.","envía un grupo de hasta 3 a las ruinas en busca de botín y especímenes.","schicke eine Gruppe von bis zu 3 in die Ruinen, um Beute und Proben zu finden.","envoie un groupe de 3 au maximum dans les ruines pour le butin et les spécimens."],
["your cadaver and profession stock.","tus reservas de cadáveres y profesiones.","dein Vorrat an Leichnamen und Berufen.","ton stock de cadavres et de professions."],
["▶ acting","▶ actuando","▶ am Zug","▶ en action"],
["Your junk (that rarity or better):","Tu chatarra (esa rareza o mejor):","Dein Schrott (diese Seltenheit oder besser):","Ta ferraille (cette rareté ou mieux) :"],
["Stat bonus:","Bonificación:","Wertebonus:","Bonus de stats :"],
["No party chosen: the undead selected in the Undead tab fights alone.","Sin grupo: el no-muerto elegido en la pestaña No-muertos lucha solo.","Keine Gruppe gewählt: Der im Untoten-Tab gewählte Untote kämpft allein.","Aucun groupe : le mort-vivant choisi dans l'onglet Morts-vivants combat seul."],
["Man's Last Stand","La última resistencia del hombre","Des Menschen letzte Bastion","Le dernier rempart de l'homme"],
// Settings screen
["Sound","Sonido","Ton","Son"],
["Sound effects","Efectos de sonido","Soundeffekte","Effets sonores"],
["Sound effects on","Efectos de sonido activados","Soundeffekte an","Effets sonores activés"],
["Location ambient sound","Sonido ambiente del lugar","Umgebungsgeräusche des Ortes","Ambiance sonore du lieu"],
["Tab music","Música por pestaña","Musik je Tab","Musique par onglet"],
["Zombie sounds","Sonidos de zombis","Zombiegeräusche","Sons de zombies"],
["Not added yet","Aún no disponible","Noch nicht verfügbar","Pas encore disponible"],
["Test sound","Probar sonido","Ton testen","Tester le son"],
["Language","Idioma","Sprache","Langue"],
["Choose the interface language. Game text such as lore, skills, items and battle logs stays in English for now.","Elige el idioma de la interfaz. Los textos del juego, como la historia, habilidades, objetos y registros de combate, siguen en inglés por ahora.","Wähle die Sprache der Oberfläche. Spieltexte wie Hintergrundgeschichten, Fähigkeiten, Gegenstände und Kampfprotokolle bleiben vorerst auf Englisch.","Choisis la langue de l'interface. Les textes du jeu (histoire, compétences, objets, journaux de combat) restent en anglais pour l'instant."],
["Volume","Volumen","Lautstärke","Volume"],
["Close","Cerrar","Schließen","Fermer"],
["View enemy card","Ver carta del enemigo","Gegnerkarte ansehen","Voir la carte de l'ennemi"],
];
const L={es:{},de:{},fr:{}};
ROWS.forEach(r=>{L.es[r[0]]=r[1];L.de[r[0]]=r[2];L.fr[r[0]]=r[3]});
const LN={es:{waves:"oleadas",wave:"Oleada",short:"Corta",standard:"Estándar",long:"Larga",none:"ninguno",squad:"Escuadrón",party:"Grupo",beat:"Derrota a un jefe en",unlock:"para desbloquear",alive:"Unidades vivas",ready:"listas",left:"enemigos restantes",kills:"bajas",loot:"botín"},
de:{waves:"Wellen",wave:"Welle",short:"Kurz",standard:"Standard",long:"Lang",none:"keine gewählt",squad:"Trupp",party:"Gruppe",beat:"Besiege einen Boss auf",unlock:"zum Freischalten",alive:"Einheiten am Leben",ready:"bereit",left:"Gegner übrig",kills:"Abschüsse",loot:"Beute"},
fr:{waves:"vagues",wave:"Vague",short:"Courte",standard:"Standard",long:"Longue",none:"aucun",squad:"Escouade",party:"Groupe",beat:"Bats un boss en",unlock:"pour débloquer",alive:"Unités en vie",ready:"prêtes",left:"ennemis restants",kills:"éliminations",loot:"butin"}};
let lang="en";
function ex(s,l){return L[l]&&L[l][s]}
function tr(en,l){
 const e=ex(en,l);if(e)return e;
 const n=LN[l];if(!n)return null;let m;
 if(m=en.match(/^(\d+) waves$/))return m[1]+" "+n.waves;
 if(m=en.match(/^(Short|Standard|Long): (\d+) waves$/))return n[m[1].toLowerCase()]+": "+m[2]+" "+n.waves;
 if(m=en.match(/^Wave (\d+)\/(\d+)$/))return n.wave+" "+m[1]+"/"+m[2];
 if(m=en.match(/^(🔒 )?(.+?)( \((Easy|Normal|Hard|Extreme)\))?$/)){
   const nm=ex(m[2],l);
   if(nm&&(m[1]||m[3]))return (m[1]||"")+nm+(m[3]?" ("+ex(m[4],l)+")":"");
 }
 if(m=en.match(/^Beat a boss on (Easy|Normal|Hard|Extreme) to unlock$/))return n.beat+" "+ex(m[1],l)+" "+n.unlock;
 if(m=en.match(/^Squad \((\d+)\/(\d+)\): (.*)$/))return n.squad+" ("+m[1]+"/"+m[2]+"): "+(m[3]=="none selected"?n.none:m[3]);
 if(m=en.match(/^Party \((\d+)\/(\d+)\): (.*)$/))return n.party+" ("+m[1]+"/"+m[2]+"): "+m[3];
 if(m=en.match(/^(.+) · turn (\d+)$/)){const a=ex(m[1],l);if(a)return a+" · "+({es:"turno",de:"Zug",fr:"tour"})[l]+" "+m[2]}
 if(m=en.match(/^Units alive (\d+)\/(\d+) · ready (\d+) · enemies left (\d+) · kills (\d+) · loot (\d+)$/))return n.alive+" "+m[1]+"/"+m[2]+" · "+n.ready+" "+m[3]+" · "+n.left+" "+m[4]+" · "+n.kills+" "+m[5]+" · "+n.loot+" "+m[6];
 return null}
function node(t){
 const cur=t.data;
 if(t.__tr!==undefined&&cur===t.__tr){ // our own text: refresh for current language
   const en=t.__en;const w=lang==="en"?null:tr(en.trim(),lang);
   const out=w?en.replace(en.trim(),w):en;if(out!==cur){t.__tr=out;t.data=out}
   if(lang==="en"){delete t.__tr;delete t.__en}
   return}
 delete t.__tr;delete t.__en;
 if(lang==="en")return;
 const s=cur.trim();if(!s||s.length>200)return;
 const w=tr(s,lang);if(!w)return;
 const out=cur.replace(s,w);t.__en=cur;t.__tr=out;t.data=out}
function attrs(root){
 root.querySelectorAll&&root.querySelectorAll("[placeholder],[title]").forEach(e=>{
  ["placeholder","title"].forEach(a=>{const v=e.getAttribute(a);if(!v)return;const k="__en_"+a;
   if(e[k]!==undefined&&e[k][1]===v){const w=lang==="en"?e[k][0]:(tr(e[k][0],lang)||e[k][0]);if(w!==v){e.setAttribute(a,w);e[k]=[e[k][0],w]}return}
   delete e[k];if(lang==="en")return;const w=tr(v,lang);if(w){e[k]=[v,w];e.setAttribute(a,w)}})})}
function walk(root){
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;const list=[];
 while(n=w.nextNode()){const p=n.parentElement;if(p&&(p.tagName==="SCRIPT"||p.tagName==="STYLE"))continue;list.push(n)}
 list.forEach(node);attrs(root.nodeType===1?root:document.body)}
let busy=false;
const obs=new MutationObserver(ms=>{
 if(busy||lang==="en")return;busy=true;obs.disconnect();
 try{ms.forEach(m=>{if(m.type==="characterData")node(m.target);else m.addedNodes.forEach(a=>{if(a.nodeType===3)node(a);else if(a.nodeType===1)walk(a)})})}finally{busy=false;obs.observe(document.body,{childList:true,characterData:true,subtree:true})}});
function set(l){
 lang=["es","de","fr"].includes(l)?l:"en";
 try{const s=JSON.parse(localStorage.getItem("ufset")||"{}");s.lang=lang;localStorage.setItem("ufset",JSON.stringify(s))}catch(e){}
 document.documentElement.lang=lang;
 obs.disconnect();walk(document.body);
 if(lang!=="en")obs.observe(document.body,{childList:true,characterData:true,subtree:true})}
let init="en";try{init=(JSON.parse(localStorage.getItem("ufset")||"{}").lang)||"en"}catch(e){}
window.UFI18N={set,get:()=>lang,langs:[["en","English (American)"],["es","Español"],["de","Deutsch"],["fr","Français"]]};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>set(init));else set(init);
})();
