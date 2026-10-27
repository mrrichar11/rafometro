/**
 * El Rafómetro - Analizador de Comentarios de Haters de Instagram
 * Incluye reconocimiento óptico de imágenes (OCR) para leer capturas de pantalla pegadas (Ctrl+V) o subidas.
 * Lore: @soyjennia, Kakarotta, Corchito Canelón y Ralph Gorgory
 */

class Rafometro {
    constructor() {
        this.inputEl = document.getElementById('commentInput');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.resultCard = document.getElementById('scouterResult');
        this.scanningHud = document.getElementById('scouterHud');
        this.powerMeter = document.getElementById('powerMeter');
        this.powerValue = document.getElementById('powerValue');
        this.powerTitle = document.getElementById('powerTitle');
        this.rafaPercentage = document.getElementById('rafaPercentage');
        this.verdictDiagnosis = document.getElementById('verdictDiagnosis');
        this.verdictAdvice = document.getElementById('verdictAdvice');
        this.corchitoVerdict = document.getElementById('corchitoVerdict');
        this.revertBtn = document.getElementById('revertCommentBtn');
        this.revertedBox = document.getElementById('revertedMessageBox');
        this.revertedText = document.getElementById('revertedText');
        this.copyVerdictBtn = document.getElementById('copyVerdictBtn');
        this.shareCardBtn = document.getElementById('shareScouterCardBtn');
        this.haterRouletteBtn = document.getElementById('haterRouletteBtn');
        this.antirafaResponsesList = document.getElementById('antirafaResponsesList');
        this.antirafaContainer = document.getElementById('antirafaResponsesContainer');

        // Elementos de Carga y Lectura OCR de Imágenes
        this.imageDropZone = document.getElementById('imageDropZone');
        this.imageFileInput = document.getElementById('imageFileInput');
        this.dropZonePrompt = document.getElementById('dropZonePrompt');
        this.imageOcrStatus = document.getElementById('imageOcrStatus');
        this.imagePreview = document.getElementById('imagePreview');
        this.ocrStatusTitle = document.getElementById('ocrStatusTitle');
        this.ocrStatusDetail = document.getElementById('ocrStatusDetail');
        this.ocrProgressBar = document.getElementById('ocrProgressBar');
        this.removeImageBtn = document.getElementById('removeImageBtn');

        this.isScanning = false;
        this.isOcrProcessing = false;
        this.currentSource = 'Texto';
        this.init();
    }

    init() {
        if (!this.analyzeBtn) return;

        this.analyzeBtn.addEventListener('click', () => this.analyze());

        // Botón Ruleta de Haters
        if (this.haterRouletteBtn) {
            this.haterRouletteBtn.addEventListener('click', () => this.triggerRoulette());
        }

        // Botón Compartir Tarjeta en Stories
        if (this.shareCardBtn) {
            this.shareCardBtn.addEventListener('click', () => {
                if (window.storyCardGenerator && this.currentComment && this.currentMetrics) {
                    window.storyCardGenerator.generateScouterCard(this.currentComment, this.currentMetrics);
                }
            });
        }

        // Botones de presets rápidos
        const presetChips = document.querySelectorAll('.preset-chip');
        presetChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const comment = e.currentTarget.getAttribute('data-comment');
                if (comment && this.inputEl) {
                    this.inputEl.value = comment;
                    if (window.soundSystem) window.soundSystem.playClick();
                    this.analyze();
                }
            });
        });

        // Botón revertir comentario
        if (this.revertBtn) {
            this.revertBtn.addEventListener('click', () => this.revertCurrentComment());
        }

        // Botón copiar veredicto
        if (this.copyVerdictBtn) {
            this.copyVerdictBtn.addEventListener('click', () => this.copyVerdict());
        }

        // Inicializar soporte OCR para imágenes (Subir, Arrastrar y Pegar Ctrl+V)
        this.initImageOcr();
    }

    initImageOcr() {
        if (!this.imageDropZone) return;

        // Clic en zona activa el selector de archivos
        this.imageDropZone.addEventListener('click', (e) => {
            if (e.target !== this.removeImageBtn && !this.removeImageBtn?.contains(e.target)) {
                if (this.imageFileInput && !this.isOcrProcessing) {
                    this.imageFileInput.click();
                }
            }
        });

        // Cambio de archivo en input
        if (this.imageFileInput) {
            this.imageFileInput.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                    this.processImageFile(file);
                }
            });
        }

        // Arrastrar y Soltar (Drag & Drop)
        this.imageDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.imageDropZone.classList.add('bg-yellow-100', 'border-yellow-500');
        });

        this.imageDropZone.addEventListener('dragleave', () => {
            this.imageDropZone.classList.remove('bg-yellow-100', 'border-yellow-500');
        });

        this.imageDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.imageDropZone.classList.remove('bg-yellow-100', 'border-yellow-500');
            const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.processImageFile(file);
            }
        });

        // Pegar Imagen desde el Portapapeles (Ctrl + V) en cualquier parte de la ventana
        window.addEventListener('paste', (e) => {
            const clipboardData = e.clipboardData || window.clipboardData;
            if (!clipboardData) return;

            const items = clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        e.preventDefault();
                        // Si no estamos en la pestaña del Rafómetro, cambiar a ella
                        const scouterTabBtn = document.querySelector('[data-tab="tab-scouter"]');
                        if (scouterTabBtn && !scouterTabBtn.classList.contains('active')) {
                            scouterTabBtn.click();
                        }
                        this.processImageFile(blob);
                        break;
                    }
                }
            }
        });

        // Botón para quitar la imagen
        if (this.removeImageBtn) {
            this.removeImageBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.resetImageOcrState();
            });
        }
    }

    resetImageOcrState() {
        this.isOcrProcessing = false;
        if (this.imageFileInput) this.imageFileInput.value = '';
        if (this.imagePreview) this.imagePreview.src = '';
        if (this.dropZonePrompt) this.dropZonePrompt.classList.remove('hidden');
        if (this.imageOcrStatus) this.imageOcrStatus.classList.add('hidden');
        if (this.ocrProgressBar) this.ocrProgressBar.style.width = '0%';
    }

    async processImageFile(file) {
        if (!file || this.isOcrProcessing) return;
        this.isOcrProcessing = true;

        if (window.soundSystem) window.soundSystem.playClick();

        // Mostrar Preview de la imagen
        const reader = new FileReader();
        reader.onload = (e) => {
            if (this.imagePreview) this.imagePreview.src = e.target.result;
            if (this.dropZonePrompt) this.dropZonePrompt.classList.add('hidden');
            if (this.imageOcrStatus) this.imageOcrStatus.classList.remove('hidden');
        };
        reader.readAsDataURL(file);

        // Actualizar UI de estado
        if (this.ocrStatusTitle) this.ocrStatusTitle.textContent = "🔍 LEYENDO TEXTO DE LA CAPTURA...";
        if (this.ocrStatusDetail) this.ocrStatusDetail.textContent = "Cargando motor de reconocimiento óptico...";
        if (this.ocrProgressBar) this.ocrProgressBar.style.width = '15%';

        // Ejecutar OCR con Tesseract.js
        try {
            if (typeof Tesseract === 'undefined') {
                throw new Error("Tesseract no disponible");
            }

            const result = await Tesseract.recognize(
                file,
                'spa', // Idioma español
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            const pct = Math.round(m.progress * 100);
                            if (this.ocrProgressBar) this.ocrProgressBar.style.width = `${Math.max(15, pct)}%`;
                            if (this.ocrStatusDetail) this.ocrStatusDetail.textContent = `Analizando caracteres: ${pct}%`;
                            if (window.soundSystem && pct % 25 === 0) window.soundSystem.playScouterBeep(600 + pct * 3);
                        }
                    }
                }
            );

            const rawText = result.data.text;
            const cleanedText = this.cleanOcrText(rawText);

            if (cleanedText && cleanedText.length > 2) {
                if (this.inputEl) {
                    this.inputEl.value = cleanedText;
                    this.inputEl.classList.add('bg-yellow-50');
                    setTimeout(() => this.inputEl.classList.remove('bg-yellow-50'), 1500);
                }

                if (this.ocrStatusTitle) this.ocrStatusTitle.textContent = "✅ ¡COMENTARIO EXTRAÍDO CON ÉXITO!";
                if (this.ocrStatusDetail) this.ocrStatusDetail.textContent = `Texto detectado: "${cleanedText.slice(0, 45)}..."`;
                if (this.ocrProgressBar) this.ocrProgressBar.style.width = '100%';

                if (window.soundSystem) window.soundSystem.playRevertSuccess();

                // Analizar automáticamente el texto leído desde la captura
                this.currentSource = 'Captura OCR';
                setTimeout(() => {
                    this.analyze();
                }, 400);

            } else {
                if (this.ocrStatusTitle) this.ocrStatusTitle.textContent = "⚠️ NO SE DETECTÓ TEXTO LEGIBLE";
                if (this.ocrStatusDetail) this.ocrStatusDetail.textContent = "Intenta con una captura más nítida o escribe el texto.";
            }

        } catch (err) {
            console.warn("OCR fallback:", err);
            // Si falla la red o Tesseract
            if (this.ocrStatusTitle) this.ocrStatusTitle.textContent = "ℹ️ IMAGEN RECIBIDA";
            if (this.ocrStatusDetail) this.ocrStatusDetail.textContent = "Transcribe el comentario en el recuadro para escanearlo.";
        } finally {
            this.isOcrProcessing = false;
        }
    }

    cleanOcrText(text) {
        if (!text) return '';
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => {
                // Filtrar horas o timestamps comunes de Instagram (ej: "hace 2 h", "Responder", "Ver traducción")
                const lower = line.toLowerCase();
                if (lower.includes('responder') || lower.includes('ver traducción') || lower.includes('traducción')) return false;
                if (/^\d+\s*(h|m|d|sem|likes?|me gusta)$/i.test(line)) return false;
                return line.length > 0;
            })
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    analyze() {
        const text = this.inputEl.value.trim();
        if (!text) {
            this.inputEl.focus();
            this.inputEl.classList.add('border-red-500');
            setTimeout(() => this.inputEl.classList.remove('border-red-500'), 1200);
            return;
        }

        if (this.isScanning) return;
        this.isScanning = true;

        // Ocultar resultados previos
        this.resultCard.classList.add('hidden');
        this.revertedBox.classList.add('hidden');
        this.scanningHud.classList.remove('hidden');

        // Efectos de sonido y animación retro de scouter calculando
        let count = 0;
        const totalPings = 10;
        const scanDisplay = document.getElementById('scouterCalcNumber');

        const scanInterval = setInterval(() => {
            count++;
            const randomKi = Math.floor(Math.random() * 9800);
            if (scanDisplay) scanDisplay.textContent = randomKi;
            if (window.soundSystem) {
                window.soundSystem.playScouterBeep(450 + count * 70);
            }

            if (count >= totalPings) {
                clearInterval(scanInterval);
                this.finalizeAnalysis(text);
            }
        }, 110);
    }

    finalizeAnalysis(comment) {
        this.isScanning = false;
        this.scanningHud.classList.add('hidden');
        this.resultCard.classList.remove('hidden');

        const metrics = this.calculateRafaMetrics(comment);

        // Mostrar datos en UI
        this.powerMeter.style.width = '0%';
        this.powerMeter.style.backgroundColor = metrics.color;

        setTimeout(() => {
            this.powerMeter.style.width = `${Math.min(metrics.percentage, 100)}%`;
        }, 100);

        this.rafaPercentage.textContent = metrics.isOver9000 ? '¡OVER 9000%!' : `${metrics.percentage}%`;
        this.powerValue.textContent = metrics.kiNumber.toLocaleString('es-AR') + ' KI';
        this.powerTitle.textContent = metrics.title;
        this.powerTitle.style.color = metrics.textColor || '#0f172a';

        this.verdictDiagnosis.innerHTML = `<strong>Diagnóstico del Scouter:</strong> ${metrics.diagnosis}`;
        this.verdictAdvice.innerHTML = `<strong>Tratamiento Antirafador:</strong> ${metrics.advice}`;
        if (this.corchitoVerdict) {
            this.corchitoVerdict.innerHTML = `🐾 <strong>Veredicto de Corchito Canelón:</strong> ${metrics.corchito}`;
        }

        // Audio retro
        if (window.soundSystem) {
            if (metrics.isOver9000) {
                window.soundSystem.playScouterExplosion();
            } else if (metrics.percentage >= 60) {
                window.soundSystem.playAlert();
            } else {
                window.soundSystem.playRevertSuccess();
            }
        }

        // Guardar para reversión y copiado
        this.currentMetrics = metrics;
        this.currentComment = comment;

        // Renderizar sugerencias de respuestas Antirafas
        this.renderAntirafaResponses(comment, metrics);

        // Desbloquear logro en el sistema de trofeos
        if (window.rayoGame && window.rayoGame.unlockAchievement) {
            window.rayoGame.unlockAchievement('cazador_haters');
        } else {
            localStorage.setItem('rafometro_ach_cazador_haters', 'true');
        }

        // Registrar en el historial privado de Jenny (Cloud)
        this.logScanToHistory(comment, metrics);

        // Resetear fuente a texto para el próximo análisis
        this.currentSource = 'Texto';

        this.resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    triggerRoulette() {
        const roulettePhrases = [
            "Falsa humildad 🙄 se nota que te armás el personaje para la cámara",
            "Vivís de los demás, andá a laburar de verdad y dejá de quejarte",
            "Sos re cheta e infumable, mostrás todo armado en tus historias",
            "Sin ofender pero antes eras más humilde, se te subieron los humos",
            "Nadie te preguntó tu opinión, dejá de figurar en todos lados",
            "Seguro el perro salchicha ni te quiere y lo usás para vistas 🐶",
            "Todo canje, todo plástico, andá a pagar tus cosas como cualquiera",
            "¿Por qué habla con ese tono? Demasiado actuada para los reels",
            "Con la mejor onda pero aflojale a los vlogs de Buenos Aires que aburrís",
            "Antes me caías bien, ahora estás insoportable con los streams de Kick"
        ];
        const randomPhrase = roulettePhrases[Math.floor(Math.random() * roulettePhrases.length)];
        if (this.inputEl) {
            this.inputEl.value = randomPhrase;
            if (window.soundSystem) window.soundSystem.playClick();
            this.analyze();
        }
    }

    renderAntirafaResponses(comment, metrics) {
        if (!this.antirafaResponsesList) return;
        this.antirafaResponsesList.innerHTML = '';

        const responses = [
            {
                mode: "🧉 MODO ZEN / PAZ INTERIOR",
                badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-400",
                text: `«Te mando un abrazo enorme. Ojalá hoy te tomes un mate calentito en paz y te pase algo lindo que te saque esa amargura ✨»`
            },
            {
                mode: "💅 MODO SARCASMO FINO",
                badgeColor: "bg-purple-100 text-purple-800 border-purple-400",
                text: `«Anotadísimo en mi libreta de opiniones no solicitadas que van directo a la papelera de reciclaje ✍️🗑️»`
            },
            {
                mode: "🐶 MODO CORCHITO CANELÓN",
                badgeColor: "bg-amber-100 text-amber-800 border-amber-400",
                text: `«Corchito Canelón olió tu comentario, me miró con cara de salchicha juzgador y te mandó un ladrido para que vayas a acariciar pasto 🐾🦴»`
            }
        ];

        responses.forEach(resp => {
            const card = document.createElement('div');
            card.className = "antirafa-card bg-white border-2 border-slate-900 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-[2px_2px_0px_#0f172a]";
            card.innerHTML = `
                <div class="flex-1">
                    <span class="inline-block text-[9px] font-pixel px-1.5 py-0.5 rounded border ${resp.badgeColor} mb-1">
                        ${resp.mode}
                    </span>
                    <p class="text-xs text-slate-800 font-semibold italic">${resp.text}</p>
                </div>
                <button type="button" class="copy-resp-btn retro-btn bg-yellow-300 hover:bg-yellow-200 text-slate-900 font-pixel text-[9px] px-2.5 py-1.5 rounded-lg flex items-center space-x-1 flex-shrink-0 self-end sm:self-center">
                    <span>📋 COPIAR</span>
                </button>
            `;

            const copyBtn = card.querySelector('.copy-resp-btn');
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(resp.text).then(() => {
                    if (window.soundSystem) window.soundSystem.playClick();
                    copyBtn.innerHTML = '<span>✅ ¡COPIADO!</span>';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<span>📋 COPIAR</span>';
                    }, 2000);
                });
            });

            this.antirafaResponsesList.appendChild(card);
        });
    }

    async logScanToHistory(comment, metrics) {
        try {
            fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comment,
                    percentage: metrics.percentage,
                    kiNumber: metrics.kiNumber,
                    title: metrics.title,
                    source: this.currentSource || 'Texto'
                })
            }).catch(() => {});
        } catch (e) {}
    }

    calculateRafaMetrics(comment) {
        const lower = comment.toLowerCase();

        const highHateWords = [
            'falsa humildad', 'vivis de', 'vivís de', 'laburar', 'andá a laburar', 'anda a laburar',
            'cheta', 'careta', 'insoportable', 'infumable', 'privilegiada', 'arruinaste', 'fantasma',
            'dejá de llamar la atención', 'deja de figurar', 'antes eras humilde', 'se te subieron los humos',
            'ridícula', 'ridicula', 'patética', 'patetica', 'tarada', 'quién te conoce', 'quien te conoce',
            'nadie te preguntó', 'a nadie le importa', 'hater', 'odio', 'tóxica', 'toxica', 'gila'
        ];

        const mediumHateWords = [
            'no es por tirar hate', 'con la mejor onda pero', 'sin ofender pero', 'te sigo pero',
            'deberías aflojarle', 'deberias aflojarle', 'no te creo nada', 'demasiado armada',
            'se nota que fingís', 'se nota que fingis', 'aburrida', 'antes me caías bien',
            'para qué subís esto', 'para que subis esto', 'plata', 'guita', 'canje', 'todo canje'
        ];

        const loveWords = [
            'te amo', 'genia', 'reina', 'idola', 'ídola', 'me encanta', 'hermosa', 'capa',
            'la mejor', 'te banco', 'graciosa', 'autentica', 'auténtica', 'diosa', 'jajaja',
            'buena onda', 'felicitaciones', 'crack', 'orgullo', 'excelente', 'corchito', 'canelon'
        ];

        let hateScore = 0;
        let loveScore = 0;

        highHateWords.forEach(w => {
            if (lower.includes(w)) hateScore += 45;
        });

        mediumHateWords.forEach(w => {
            if (lower.includes(w)) hateScore += 25;
        });

        loveWords.forEach(w => {
            if (lower.includes(w)) loveScore += 35;
        });

        if (comment.length > 5 && comment === comment.toUpperCase()) {
            hateScore += 20;
        }

        // Si es puro amor
        if (loveScore > 0 && hateScore === 0) {
            return {
                percentage: 0,
                kiNumber: 20,
                isOver9000: false,
                color: '#22c55e',
                textColor: '#15803d',
                title: 'NIVEL: ÁNGEL DE LUZ DE LA COMUNIDAD',
                diagnosis: 'Cero toxicidad detectada. Este seguidor mira los streams de Kakarotta en Kick, te banca en YouTube y comparte las fotos de Corchito Canelón.',
                advice: 'Inmune al Rayo Antirafador. Proteger con medalla de oro y bizcochitos.',
                corchito: '¡Corchito Canelón movió la colita feliz! Te aprueba al 100% como amigo de la casa.'
            };
        }

        let totalPercentage = Math.min(Math.max(hateScore - (loveScore * 0.5), 10), 100);

        if (hateScore === 0 && loveScore === 0) {
            totalPercentage = Math.floor(Math.random() * 30) + 15;
        }

        // Over 9000
        if (lower.includes('falsa humildad') || lower.includes('andá a laburar') || totalPercentage >= 85) {
            return {
                percentage: 100,
                kiNumber: 9001 + Math.floor(Math.random() * 1999),
                isOver9000: true,
                color: '#ef4444',
                textColor: '#b91c1c',
                title: '🔥 ¡IT\'S OVER 9000! RAFA SUPREMO NIVEL DIOS 🔥',
                diagnosis: '¡ALERTA MÁXIMA EN CIUDAD GÓTICA! El Scouter se sobrecalentó. Este hater tiene el ceño fruncido y le molesta hasta que el cielo sea celeste. Se indigna con cada historia de @soyjennia.',
                advice: 'Disparar el Rayo Antirafador inmediatamente a máxima potencia y mandarle a Corchito Canelón para que le baje los humos con un lengüetazo.',
                corchito: 'Corchito olió este comentario a 5 kilómetros, ladró dos veces y se escondió abajo de la cama por el olor a veneno.'
            };
        }

        if (totalPercentage >= 60) {
            return {
                percentage: Math.round(totalPercentage),
                kiNumber: Math.floor(totalPercentage * 75),
                isOver9000: false,
                color: '#f97316',
                textColor: '#c2410c',
                title: 'SUPER RAFA FASE 2: HATER SERIAL',
                diagnosis: 'Rafa con título habilitante. Comenta con \'no es por criticar pero...\' y no se pierde ni un reel. Vive pendiente de lo que hace Jennia.',
                advice: 'Dosis doble de mate dulce y recordarle que ver streams de Kick o videos de YouTube de Jennia es voluntario.',
                corchito: 'Corchito lo miró de reojo con cara de perro salchicha juzgador.'
            };
        }

        if (totalPercentage >= 35) {
            return {
                percentage: Math.round(totalPercentage),
                kiNumber: Math.floor(totalPercentage * 50),
                isOver9000: false,
                color: '#facc15',
                textColor: '#a16207',
                title: 'RAFA PASIVO-AGRESIVO DE GUARDIA',
                diagnosis: 'Tiene una molestia leve. Probablemente vio que alguien comía una medialuna caliente y se le antojó.',
                advice: 'Un rayo antirafador suave y un meme de Ralph Gorgory con las orejas de Batman.',
                corchito: 'Corchito bosteza: este hater es inofensivo pero necesita una siesta.'
            };
        }

        return {
            percentage: Math.round(totalPercentage),
            kiNumber: Math.floor(totalPercentage * 35),
            isOver9000: false,
            color: '#3b82f6',
            textColor: '#1d4ed8',
            title: 'RAFA EN NEGACIÓN / DUDOSO',
            diagnosis: 'Comentario ambiguo. Tuvo un día largo pero en el fondo le encantan las historias de Buenos Aires.',
            advice: 'Un saludo buena onda y suscripción al canal de YouTube de Jenny.',
            corchito: 'Corchito Canelón le da una olfateada amistosa: tiene salvación.'
        };
    }

    revertCurrentComment() {
        if (!this.currentComment) return;

        if (window.soundSystem) {
            window.soundSystem.playLaser();
            setTimeout(() => {
                window.soundSystem.playCorchitoBark();
                window.soundSystem.playRevertSuccess();
            }, 200);
        }

        const reversedMessages = [
            "✨ «Che, posta que admiro lo auténtica que sos y cómo bancás a tu comunidad. Y Corchito Canelón es el salchicha más lindo del mundo. ¡Abrazo!»",
            "✨ «Perdón por la mala onda de antes, me había quedado sin yerba y con frío. Te mando un saludo enorme y aguante Kakarotta en Kick!»",
            "✨ «¡Rayo Antirafador asimilado! Dejé de quejarme en internet y ahora estoy viendo tus vlogs de Buenos Aires con unos mates.»",
            "✨ «La vida es más linda sin tirar hate. Seguí rompiéndola Jennia, dale una caricia en la orejita a Corchito de mi parte.»"
        ];

        const randomReverted = reversedMessages[Math.floor(Math.random() * reversedMessages.length)];
        this.revertedText.textContent = randomReverted;
        this.revertedBox.classList.remove('hidden');
        this.revertedBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    copyVerdict() {
        if (!this.currentMetrics) return;

        const textToCopy = `🔬 *EL RAFÓMETRO OFICIAL DE @soyjennia*\n` +
            `📝 Comentario: "${this.currentComment}"\n` +
            `📊 Nivel Rafa: ${this.rafaPercentage.textContent}\n` +
            `⚡ Scouter Ki: ${this.powerTitle.textContent} (${this.powerValue.textContent})\n` +
            `🐶 Veredicto de Corchito Canelón: ${this.currentMetrics.corchito}\n\n` +
            `¡Escaneá a tus propios haters en El Rafómetro! ⚡🦇`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            if (window.soundSystem) window.soundSystem.playClick();
            const originalText = this.copyVerdictBtn.innerHTML;
            this.copyVerdictBtn.innerHTML = `<span>✅ ¡Copiado con Éxito!</span>`;
            setTimeout(() => {
                this.copyVerdictBtn.innerHTML = originalText;
            }, 2000);
        }).catch(() => {
            alert('Copiado no soportado por tu navegador.');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.rafometro = new Rafometro();
});
