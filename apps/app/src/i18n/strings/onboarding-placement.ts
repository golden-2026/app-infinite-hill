// Spanish for the harder "where are you?" questions (content/placement.ts). Import-free: placement.ts is loaded by the
// unit tests straight from Node. Same order as the English, by door; the right answer is first, as there.
// DRAFT: NOT KEEPER-REVIEWED, and the Spanish is a first draft (neutral Latin American, "tú"). Needs the tradition's
// Keeper and a native speaker before release (docs/CONTENT_RELEASE.md).

export type PlaceQEs = { q: string; o: string[] };

export const PLACEMENT_ES: Record<string, PlaceQEs[]> = {
  HINDUISM: [
    { q: "el mantra Gayatri aparece primero en…", o: ["el Rig Veda (3.62.10)", "el Bhagavad Gita", "el Ramayana"] },
    { q: "muchos lectores dividen los dieciocho capítulos del Gita en tres grupos de seis. los seis del medio tratan sobre todo de…", o: ["bhakti, la devoción", "las reglas de una batalla", "las cuatro etapas de la vida"] },
    { q: "la forma completa de la puja, en dieciséis pasos, se llama…", o: ["shodashopachara", "panchopachara", "saptapadi"] },
    { q: "el samskara del cordón sagrado, donde tradicionalmente se enseña el Gayatri, es…", o: ["upanayana", "annaprashana", "namakarana"] },
    { q: "¿en la luna llena de qué mes cae Holi?", o: ["Phalguna", "Shravana", "Kartika"] },
    { q: "los cuatro fines de la vida son dharma, artha, kama y…", o: ["moksha", "karma", "seva"] },
  ],
  ISLAM: [
    { q: "la primera palabra revelada al Profeta ﷺ, en la sura al-'Alaq, fue…", o: ["iqra': lee, recita", "qul: di", "bismillah"] },
    { q: "las cinco oraciones del día, en orden desde el alba:", o: ["fajr, dhuhr, asr, maghrib, isha", "fajr, asr, dhuhr, isha, maghrib", "dhuhr, fajr, maghrib, asr, isha"] },
    { q: "el zakat sobre ahorros guardados un año lunar, por encima del nisab, suele ser…", o: ["el 2.5 por ciento", "el 10 por ciento", "el 20 por ciento"] },
    { q: "Laylat al-Qadr, la Noche del Destino, se busca en…", o: ["las últimas diez noches de Ramadán", "la primera noche de Muharram", "la noche antes de Eid al-Adha"] },
    { q: "la hégira, de La Meca a Medina, marca…", o: ["el año uno del calendario islámico", "la primera revelación", "el primer Hajj"] },
    { q: "todas las suras empiezan con bismillah menos una:", o: ["al-Tawbah (9)", "al-Baqarah (2)", "al-Ikhlas (112)"] },
  ],
  JUDAISM: [
    { q: "la primera línea del Shemá, \"Escucha, Israel\", viene de…", o: ["Deuteronomio 6:4", "Éxodo 20:2", "Génesis 1:1"] },
    { q: "entre semana, ¿cuántas bendiciones tiene la Amidá?", o: ["diecinueve", "siete", "diez"] },
    { q: "la Havdalá, al terminar el Shabat, usa…", o: ["vino, especias y una vela trenzada", "matzá y hierbas amargas", "un shofar y miel"] },
    { q: "el Shabat termina el sábado por la noche cuando…", o: ["salen tres estrellas", "se apagan las velas", "el rabino dice la oración final"] },
    { q: "en el ciclo anual, ¿en cuántas porciones semanales se lee la Torá?", o: ["cincuenta y cuatro", "doce", "ciento cincuenta"] },
    { q: "¿el 25 de qué mes empieza Janucá?", o: ["Kislev", "Nisán", "Tishrei"] },
  ],
  BUDDHISM: [
    { q: "la primera enseñanza del Buda, el giro de la rueda del Dhamma, fue en…", o: ["el Parque de los Ciervos, en Sarnath", "Bodh Gaya, bajo el árbol", "Kushinagar"] },
    { q: "las tres marcas de la existencia son anicca, anatta y…", o: ["dukkha", "metta", "sila"] },
    { q: "el óctuple sendero suele agruparse en tres entrenamientos:", o: ["ética, concentración, sabiduría", "bondad, compasión, alegría", "Buda, Dhamma, Sangha"] },
    { q: "los cuatro brahmaviharas son metta, karuna, mudita y…", o: ["upekkha", "sati", "dana"] },
    { q: "las \"tres canastas\" del canon pali son el Vinaya, los Suttas y…", o: ["el Abhidhamma", "los Jataka", "el Dhammapada"] },
    { q: "en el sur y el sudeste de Asia, Vesak recuerda…", o: ["el nacimiento, el despertar y la muerte del Buda", "solo su primera enseñanza", "la ordenación de los primeros monjes"] },
  ],
  SIKHISM: [
    { q: "el Japji Sahib, la oración de la mañana que abre el Gurú Granth Sahib, lo compuso…", o: ["el Gurú Nanak", "el Gurú Gobind Singh", "el Gurú Arjan"] },
    { q: "el Adi Granth se compiló por primera vez, en 1604, por…", o: ["el Gurú Arjan", "el Gurú Nanak", "el Gurú Har Rai"] },
    { q: "el Gurú Gobind Singh fundó la Khalsa en Anandpur en…", o: ["Vaisakhi, 1699", "Diwali, 1604", "el cumpleaños del Gurú Nanak, 1469"] },
    { q: "después de las oraciones iniciales, los himnos del Gurú Granth Sahib se ordenan por…", o: ["raga, el modo musical", "el orden en que se escribieron", "el Gurú que los escribió"] },
    { q: "las cinco K son kesh, kara, kanga, kachera y…", o: ["kirpan", "karah parshad", "kirtan"] },
    { q: "Bandi Chhor Divas recuerda…", o: ["al Gurú Hargobind liberando a 52 príncipes del fuerte de Gwalior", "el nacimiento del Gurú Nanak", "la fundación de la Khalsa"] },
  ],
  CATHOLIC: [
    { q: "las dos partes principales de la misa son la liturgia de la Palabra y…", o: ["la liturgia eucarística", "la bendición con el Santísimo", "el viacrucis"] },
    { q: "¿cuántos sacramentos reconoce la Iglesia católica?", o: ["siete", "tres", "doce"] },
    { q: "los misterios luminosos del rosario los añadió…", o: ["Juan Pablo II, en 2002", "Pío X, en 1910", "el Concilio de Trento"] },
    { q: "el año litúrgico de la Iglesia empieza con…", o: ["el Adviento", "la Cuaresma", "la Pascua"] },
    { q: "el Magníficat, el canto de María, está en…", o: ["Lucas 1", "Mateo 5", "Juan 1"] },
    { q: "las cuatro partes del Catecismo son el credo, los sacramentos, la vida en Cristo y…", o: ["la oración", "los santos", "la historia de la Iglesia"] },
  ],
  CHRISTIANITY: [
    { q: "el padrenuestro está en Mateo 6 y en…", o: ["Lucas 11", "Marcos 4", "Juan 3"] },
    { q: "¿en qué evangelio está el Sermón del Monte?", o: ["Mateo", "Marcos", "Juan"] },
    { q: "Pentecostés recuerda…", o: ["la venida del Espíritu Santo sobre los discípulos", "el nacimiento de Jesús", "la última cena"] },
    { q: "en el evangelio de Juan, la primera señal de Jesús es…", o: ["el agua convertida en vino en Caná", "la multiplicación para cinco mil", "caminar sobre el agua"] },
    { q: "el Credo niceno se acordó por primera vez en Nicea en el año…", o: ["325", "1517", "70"] },
    { q: "¿cuántos libros tiene el Antiguo Testamento protestante?", o: ["treinta y nueve", "cuarenta y seis", "veintisiete"] },
  ],
};
